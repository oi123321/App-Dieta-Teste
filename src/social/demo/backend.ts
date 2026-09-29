import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { safeStorage } from '../../store/safeStorage';
import type { Comment, FeedFilter, NewPost, Post, ProfileInput, SocialBackend, SocialProfile } from '../types';
import { EXAMPLE_COMMENTS, EXAMPLE_POSTS, EXAMPLE_USERS, type StoredComment, type StoredPost } from './seed';

/** Local-only social data used when no server is configured. */
interface DemoState {
  me: SocialProfile | null;
  posts: StoredPost[];
  comments: StoredComment[];
  likes: string[];
  saves: string[];
  following: string[];
  reported: string[];
}

const INITIAL: DemoState = { me: null, posts: [], comments: [], likes: [], saves: [], following: [], reported: [] };

export const useDemoSocial = create<DemoState>()(
  persist(() => INITIAL, {
    name: 'salsa-social-demo',
    version: 1,
    storage: createJSONStorage(() => safeStorage),
  }),
);

function waitForHydration(): Promise<void> {
  if (useDemoSocial.persist.hasHydrated()) return Promise.resolve();
  return new Promise((resolve) => {
    const unsub = useDemoSocial.persist.onFinishHydration(() => {
      unsub();
      resolve();
    });
  });
}

const set = (patch: Partial<DemoState> | ((s: DemoState) => Partial<DemoState>)) => useDemoSocial.setState(patch);
const get = () => useDemoSocial.getState();

function newId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

function findUser(id: string): SocialProfile | undefined {
  const me = get().me;
  if (me && me.id === id) return me;
  return EXAMPLE_USERS.find((u) => u.id === id);
}

function unknownUser(id: string): SocialProfile {
  return {
    id,
    username: 'usuario',
    name: 'Usuário',
    bio: '',
    city: '',
    avatar: { kind: 'emoji', emoji: 'cook', color: '#EFE8D7' },
    createdAt: new Date(0).toISOString(),
  };
}

function allStoredPosts(): (StoredPost & { baseLikes: number; baseSaves: number; isExample?: boolean })[] {
  const mine = get().posts.map((p) => ({ ...p, baseLikes: 0, baseSaves: 0 }));
  const examples = EXAMPLE_POSTS.map((p) => ({ ...p, isExample: true }));
  return [...mine, ...examples];
}

function hydratePost(p: StoredPost & { baseLikes: number; baseSaves: number; isExample?: boolean }): Post {
  const { likes, saves, comments } = get();
  const liked = likes.includes(p.id);
  const saved = saves.includes(p.id);
  const commentCount =
    EXAMPLE_COMMENTS.filter((c) => c.postId === p.id).length + comments.filter((c) => c.postId === p.id).length;
  return {
    id: p.id,
    author: findUser(p.authorId) ?? unknownUser(p.authorId),
    title: p.title,
    description: p.description,
    photoUrl: p.photoUrl,
    minutes: p.minutes,
    servings: p.servings,
    ingredients: p.ingredients,
    steps: p.steps,
    appliances: p.appliances,
    createdAt: p.createdAt,
    likeCount: p.baseLikes + (liked ? 1 : 0),
    saveCount: p.baseSaves + (saved ? 1 : 0),
    commentCount,
    likedByMe: liked,
    savedByMe: saved,
    isExample: p.isExample,
  };
}

function toComment(c: StoredComment): Comment {
  return {
    id: c.id,
    postId: c.postId,
    author: findUser(c.authorId) ?? unknownUser(c.authorId),
    body: c.body,
    createdAt: c.createdAt,
  };
}

function requireMe(): SocialProfile {
  const me = get().me;
  if (!me) throw new Error('Crie seu perfil para continuar.');
  return me;
}

export const demoBackend: SocialBackend = {
  mode: 'demo',

  async currentUserId() {
    await waitForHydration();
    return get().me?.id ?? null;
  },
  async signUp() {
    return { needsConfirmation: false };
  },
  async signIn() {},
  async signOut() {
    set(INITIAL);
  },

  async getMyProfile() {
    await waitForHydration();
    return get().me;
  },
  async saveMyProfile(input: ProfileInput) {
    await waitForHydration();
    const current = get().me;
    const profile: SocialProfile = {
      id: current?.id ?? newId('me'),
      createdAt: current?.createdAt ?? new Date().toISOString(),
      ...input,
    };
    set({ me: profile });
    return profile;
  },
  async isUsernameAvailable(username: string) {
    const me = get().me;
    return !EXAMPLE_USERS.some((u) => u.username === username) || me?.username === username;
  },
  async getProfile(userId: string) {
    await waitForHydration();
    return findUser(userId) ?? null;
  },
  async getStats(userId: string) {
    await waitForHydration();
    const { following, me } = get();
    const example = EXAMPLE_USERS.find((u) => u.id === userId);
    const posts = allStoredPosts().filter((p) => p.authorId === userId).length;
    if (example) {
      return { posts, followers: example.baseFollowers + (following.includes(userId) ? 1 : 0), following: example.baseFollowing };
    }
    return { posts, followers: 0, following: me?.id === userId ? following.length : 0 };
  },
  async isFollowing(userId: string) {
    await waitForHydration();
    return get().following.includes(userId);
  },
  async setFollowing(userId: string, follow: boolean) {
    requireMe();
    set((s) => ({ following: follow ? [...new Set([...s.following, userId])] : s.following.filter((id) => id !== userId) }));
  },

  async feed(filter: FeedFilter) {
    await waitForHydration();
    const { following, reported } = get();
    let posts = allStoredPosts()
      .filter((p) => !reported.includes(p.id))
      .map(hydratePost);
    if (filter === 'seguindo') posts = posts.filter((p) => following.includes(p.author.id));
    if (filter === 'populares') return posts.sort((a, b) => b.saveCount + b.likeCount - (a.saveCount + a.likeCount));
    return posts.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },
  async postsBy(userId: string) {
    await waitForHydration();
    return allStoredPosts()
      .filter((p) => p.authorId === userId)
      .map(hydratePost)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },
  async savedPosts() {
    await waitForHydration();
    const { saves } = get();
    return allStoredPosts()
      .filter((p) => saves.includes(p.id))
      .map(hydratePost);
  },
  async getPost(postId: string) {
    await waitForHydration();
    const stored = allStoredPosts().find((p) => p.id === postId);
    return stored ? hydratePost(stored) : null;
  },
  async createPost(input: NewPost) {
    const me = requireMe();
    const post: StoredPost = {
      id: newId('p'),
      authorId: me.id,
      title: input.title.trim(),
      description: input.description.trim(),
      photoUrl: input.photoUri,
      minutes: input.minutes,
      servings: input.servings,
      ingredients: input.ingredients,
      steps: input.steps,
      appliances: input.appliances,
      createdAt: new Date().toISOString(),
    };
    set((s) => ({ posts: [post, ...s.posts] }));
    return hydratePost({ ...post, baseLikes: 0, baseSaves: 0 });
  },
  async deletePost(postId: string) {
    set((s) => ({
      posts: s.posts.filter((p) => p.id !== postId),
      comments: s.comments.filter((c) => c.postId !== postId),
      likes: s.likes.filter((id) => id !== postId),
      saves: s.saves.filter((id) => id !== postId),
    }));
  },
  async setLiked(postId: string, liked: boolean) {
    requireMe();
    set((s) => ({ likes: liked ? [...new Set([...s.likes, postId])] : s.likes.filter((id) => id !== postId) }));
  },
  async setSaved(postId: string, saved: boolean) {
    requireMe();
    set((s) => ({ saves: saved ? [...new Set([...s.saves, postId])] : s.saves.filter((id) => id !== postId) }));
  },

  async comments(postId: string) {
    await waitForHydration();
    return [...EXAMPLE_COMMENTS, ...get().comments]
      .filter((c) => c.postId === postId)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
      .map(toComment);
  },
  async addComment(postId: string, body: string) {
    const me = requireMe();
    const comment: StoredComment = {
      id: newId('c'),
      postId,
      authorId: me.id,
      body: body.trim(),
      createdAt: new Date().toISOString(),
    };
    set((s) => ({ comments: [...s.comments, comment] }));
    return toComment(comment);
  },
  async deleteComment(commentId: string) {
    set((s) => ({ comments: s.comments.filter((c) => c.id !== commentId) }));
  },
  async report(postId: string) {
    set((s) => ({ reported: [...new Set([...s.reported, postId])] }));
  },
};
