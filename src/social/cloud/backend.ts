import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, processLock, type SupabaseClient } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';

import { EMOJI, type EmojiName } from '../../data/emoji';
import type { ApplianceId } from '../../data/types';
import type {
  Avatar,
  Comment,
  FeedFilter,
  NewPost,
  Post,
  PostIngredient,
  ProfileInput,
  SocialBackend,
  SocialProfile,
} from '../types';

const BUCKET = 'recipe-photos';
const PAGE = 60;

interface ProfileRow {
  id: string;
  username: string;
  name: string;
  bio: string;
  city: string;
  avatar_emoji: string | null;
  avatar_color: string | null;
  avatar_url: string | null;
  created_at: string;
}

interface PostRow {
  id: string;
  author_id: string;
  title: string;
  description: string;
  photo_url: string | null;
  minutes: number;
  servings: number;
  ingredients: PostIngredient[];
  steps: string[];
  appliances: string[];
  like_count: number;
  save_count: number;
  comment_count: number;
  created_at: string;
  author: ProfileRow | null;
}

interface CommentRow {
  id: string;
  post_id: string;
  body: string;
  created_at: string;
  author: ProfileRow | null;
}

const POST_SELECT = '*, author:profiles!posts_author_id_fkey(*)';

function toAvatar(row: ProfileRow): Avatar {
  if (row.avatar_url) return { kind: 'photo', uri: row.avatar_url };
  const emoji = row.avatar_emoji && row.avatar_emoji in EMOJI ? (row.avatar_emoji as EmojiName) : 'cook';
  return { kind: 'emoji', emoji, color: row.avatar_color ?? '#EFE8D7' };
}

function toProfile(row: ProfileRow): SocialProfile {
  return {
    id: row.id,
    username: row.username,
    name: row.name,
    bio: row.bio,
    city: row.city,
    avatar: toAvatar(row),
    createdAt: row.created_at,
  };
}

const MISSING_AUTHOR: ProfileRow = {
  id: '',
  username: 'usuario',
  name: 'Usuário',
  bio: '',
  city: '',
  avatar_emoji: 'cook',
  avatar_color: '#EFE8D7',
  avatar_url: null,
  created_at: new Date(0).toISOString(),
};

function fail(error: { message: string; code?: string } | null): void {
  if (!error) return;
  if (error.code === '23505') throw new Error('Esse nome de usuário já está em uso.');
  throw new Error(error.message);
}

/** Decodes base64 without relying on atob (not available on every JS engine). */
function base64ToBytes(base64: string): Uint8Array {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const clean = base64.replace(/[^A-Za-z0-9+/]/g, '');
  const bytes = new Uint8Array(Math.floor((clean.length * 3) / 4));
  let buffer = 0;
  let bits = 0;
  let index = 0;
  for (const char of clean) {
    buffer = (buffer << 6) | alphabet.indexOf(char);
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      bytes[index++] = (buffer >> bits) & 0xff;
    }
  }
  return bytes.subarray(0, index);
}

export function createCloudBackend(url: string, anonKey: string): SocialBackend {
  const supabase: SupabaseClient = createClient(url, anonKey, {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
      lock: processLock,
    },
  });

  if (Platform.OS !== 'web') {
    AppState.addEventListener('change', (state) => {
      if (state === 'active') supabase.auth.startAutoRefresh();
      else supabase.auth.stopAutoRefresh();
    });
  }

  async function uid(): Promise<string | null> {
    const { data } = await supabase.auth.getSession();
    return data.session?.user.id ?? null;
  }

  async function requireUid(): Promise<string> {
    const id = await uid();
    if (!id) throw new Error('Entre na sua conta para continuar.');
    return id;
  }

  /** Uploads a data URI (from the image picker) and returns its public URL. */
  async function uploadPhoto(dataUri: string, prefix: string): Promise<string> {
    const userId = await requireUid();
    const match = dataUri.match(/^data:(image\/[a-z]+);base64,(.*)$/);
    if (!match) return dataUri;
    const path = `${userId}/${prefix}-${Date.now()}.jpg`;
    const { error } = await supabase.storage.from(BUCKET).upload(path, base64ToBytes(match[2]), {
      contentType: match[1],
      upsert: false,
    });
    fail(error);
    return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
  }

  async function withMine(rows: PostRow[]): Promise<Post[]> {
    const me = await uid();
    const ids = rows.map((r) => r.id);
    let liked = new Set<string>();
    let saved = new Set<string>();
    if (me && ids.length > 0) {
      const [likes, saves] = await Promise.all([
        supabase.from('likes').select('post_id').eq('user_id', me).in('post_id', ids),
        supabase.from('saves').select('post_id').eq('user_id', me).in('post_id', ids),
      ]);
      liked = new Set((likes.data ?? []).map((r: { post_id: string }) => r.post_id));
      saved = new Set((saves.data ?? []).map((r: { post_id: string }) => r.post_id));
    }
    return rows.map((r) => ({
      id: r.id,
      author: toProfile(r.author ?? { ...MISSING_AUTHOR, id: r.author_id }),
      title: r.title,
      description: r.description,
      photoUrl: r.photo_url,
      minutes: r.minutes,
      servings: r.servings,
      ingredients: r.ingredients,
      steps: r.steps,
      appliances: r.appliances as ApplianceId[],
      createdAt: r.created_at,
      likeCount: r.like_count,
      saveCount: r.save_count,
      commentCount: r.comment_count,
      likedByMe: liked.has(r.id),
      savedByMe: saved.has(r.id),
    }));
  }

  return {
    mode: 'cloud',

    currentUserId: uid,

    async signUp(email, password) {
      const { data, error } = await supabase.auth.signUp({ email: email.trim(), password });
      fail(error);
      return { needsConfirmation: !data.session };
    },
    async signIn(email, password) {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) throw new Error(error.message.includes('Invalid login') ? 'E-mail ou senha incorretos.' : error.message);
    },
    async signOut() {
      await supabase.auth.signOut();
    },

    async getMyProfile() {
      const me = await uid();
      if (!me) return null;
      const { data, error } = await supabase.from('profiles').select('*').eq('id', me).maybeSingle();
      fail(error);
      return data ? toProfile(data as ProfileRow) : null;
    },
    async saveMyProfile(input: ProfileInput) {
      const me = await requireUid();
      let avatarUrl: string | null = null;
      let avatarEmoji: string | null = null;
      let avatarColor: string | null = null;
      if (input.avatar.kind === 'photo') avatarUrl = await uploadPhoto(input.avatar.uri, 'avatar');
      else {
        avatarEmoji = input.avatar.emoji;
        avatarColor = input.avatar.color;
      }
      const { data, error } = await supabase
        .from('profiles')
        .upsert({
          id: me,
          username: input.username,
          name: input.name.trim(),
          bio: input.bio.trim(),
          city: input.city.trim(),
          avatar_url: avatarUrl,
          avatar_emoji: avatarEmoji,
          avatar_color: avatarColor,
        })
        .select()
        .single();
      fail(error);
      return toProfile(data as ProfileRow);
    },
    async isUsernameAvailable(username) {
      const me = await uid();
      const { data } = await supabase.from('profiles').select('id').eq('username', username).maybeSingle();
      return !data || data.id === me;
    },
    async getProfile(userId) {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
      fail(error);
      return data ? toProfile(data as ProfileRow) : null;
    },
    async getStats(userId) {
      const { data } = await supabase.from('profile_stats').select('*').eq('id', userId).maybeSingle();
      return { posts: data?.posts ?? 0, followers: data?.followers ?? 0, following: data?.following ?? 0 };
    },
    async isFollowing(userId) {
      const me = await uid();
      if (!me) return false;
      const { data } = await supabase
        .from('follows')
        .select('follower_id')
        .eq('follower_id', me)
        .eq('following_id', userId)
        .maybeSingle();
      return Boolean(data);
    },
    async setFollowing(userId, follow) {
      const me = await requireUid();
      const { error } = follow
        ? await supabase.from('follows').upsert({ follower_id: me, following_id: userId }, { ignoreDuplicates: true })
        : await supabase.from('follows').delete().eq('follower_id', me).eq('following_id', userId);
      fail(error);
    },

    async feed(filter: FeedFilter) {
      let query = supabase.from('posts').select(POST_SELECT).limit(PAGE);
      if (filter === 'seguindo') {
        const me = await uid();
        if (!me) return [];
        const { data: follows } = await supabase.from('follows').select('following_id').eq('follower_id', me);
        const ids = (follows ?? []).map((f: { following_id: string }) => f.following_id);
        if (ids.length === 0) return [];
        query = query.in('author_id', ids);
      }
      query =
        filter === 'populares'
          ? query.order('save_count', { ascending: false }).order('like_count', { ascending: false })
          : query.order('created_at', { ascending: false });
      const { data, error } = await query;
      fail(error);
      return withMine((data ?? []) as PostRow[]);
    },
    async postsBy(userId) {
      const { data, error } = await supabase
        .from('posts')
        .select(POST_SELECT)
        .eq('author_id', userId)
        .order('created_at', { ascending: false })
        .limit(PAGE);
      fail(error);
      return withMine((data ?? []) as PostRow[]);
    },
    async savedPosts() {
      const me = await uid();
      if (!me) return [];
      const { data: saves, error } = await supabase
        .from('saves')
        .select('post_id')
        .eq('user_id', me)
        .order('created_at', { ascending: false })
        .limit(PAGE);
      fail(error);
      const ids = (saves ?? []).map((s: { post_id: string }) => s.post_id);
      if (ids.length === 0) return [];
      const { data } = await supabase.from('posts').select(POST_SELECT).in('id', ids);
      const byId = new Map(((data ?? []) as PostRow[]).map((p) => [p.id, p]));
      return withMine(ids.map((id) => byId.get(id)).filter((p): p is PostRow => Boolean(p)));
    },
    async getPost(postId) {
      const { data, error } = await supabase.from('posts').select(POST_SELECT).eq('id', postId).maybeSingle();
      fail(error);
      if (!data) return null;
      const [post] = await withMine([data as PostRow]);
      return post;
    },
    async createPost(input: NewPost) {
      const me = await requireUid();
      const photoUrl = input.photoUri ? await uploadPhoto(input.photoUri, 'receita') : null;
      const { data, error } = await supabase
        .from('posts')
        .insert({
          author_id: me,
          title: input.title.trim(),
          description: input.description.trim(),
          photo_url: photoUrl,
          minutes: input.minutes,
          servings: input.servings,
          ingredients: input.ingredients,
          steps: input.steps,
          appliances: input.appliances,
        })
        .select(POST_SELECT)
        .single();
      fail(error);
      const [post] = await withMine([data as PostRow]);
      return post;
    },
    async deletePost(postId) {
      const { error } = await supabase.from('posts').delete().eq('id', postId);
      fail(error);
    },
    async setLiked(postId, liked) {
      const me = await requireUid();
      const { error } = liked
        ? await supabase.from('likes').upsert({ post_id: postId, user_id: me }, { ignoreDuplicates: true })
        : await supabase.from('likes').delete().eq('post_id', postId).eq('user_id', me);
      fail(error);
    },
    async setSaved(postId, saved) {
      const me = await requireUid();
      const { error } = saved
        ? await supabase.from('saves').upsert({ post_id: postId, user_id: me }, { ignoreDuplicates: true })
        : await supabase.from('saves').delete().eq('post_id', postId).eq('user_id', me);
      fail(error);
    },

    async comments(postId) {
      const { data, error } = await supabase
        .from('comments')
        .select('id, post_id, body, created_at, author:profiles!comments_author_id_fkey(*)')
        .eq('post_id', postId)
        .order('created_at', { ascending: true })
        .limit(200);
      fail(error);
      return ((data ?? []) as unknown as CommentRow[]).map(
        (c): Comment => ({
          id: c.id,
          postId: c.post_id,
          body: c.body,
          createdAt: c.created_at,
          author: toProfile(c.author ?? MISSING_AUTHOR),
        }),
      );
    },
    async addComment(postId, body) {
      const me = await requireUid();
      const { data, error } = await supabase
        .from('comments')
        .insert({ post_id: postId, author_id: me, body: body.trim() })
        .select('id, post_id, body, created_at, author:profiles!comments_author_id_fkey(*)')
        .single();
      fail(error);
      const c = data as unknown as CommentRow;
      return {
        id: c.id,
        postId: c.post_id,
        body: c.body,
        createdAt: c.created_at,
        author: toProfile(c.author ?? MISSING_AUTHOR),
      };
    },
    async deleteComment(commentId) {
      const { error } = await supabase.from('comments').delete().eq('id', commentId);
      fail(error);
    },
    async report(postId, reason) {
      const me = await requireUid();
      const { error } = await supabase
        .from('reports')
        .upsert({ post_id: postId, reporter_id: me, reason: reason.slice(0, 200) }, { ignoreDuplicates: true });
      fail(error);
    },
  };
}
