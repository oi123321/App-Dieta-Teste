import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { safeStorage } from '../store/safeStorage';
import { useAppStore } from '../store/useAppStore';
import { social } from './backend';
import { postToRecipe } from './convert';
import type { Comment, FeedFilter, NewPost, Post, ProfileInput } from './types';

export const qk = {
  session: ['session'] as const,
  me: ['me'] as const,
  feed: (filter: FeedFilter) => ['feed', filter] as const,
  post: (id: string) => ['post', id] as const,
  comments: (id: string) => ['comments', id] as const,
  profile: (id: string) => ['profile', id] as const,
  stats: (id: string) => ['stats', id] as const,
  userPosts: (id: string) => ['userPosts', id] as const,
  saved: ['saved'] as const,
  following: (id: string) => ['following', id] as const,
};

/** Posts the user hid and authors they blocked, kept on this device. */
interface ModerationState {
  hiddenPosts: string[];
  blockedUsers: string[];
  hidePost: (id: string) => void;
  blockUser: (id: string) => void;
  unblockUser: (id: string) => void;
}

export const useModeration = create<ModerationState>()(
  persist(
    (set) => ({
      hiddenPosts: [],
      blockedUsers: [],
      hidePost: (id) => set((s) => ({ hiddenPosts: [...new Set([...s.hiddenPosts, id])] })),
      blockUser: (id) => set((s) => ({ blockedUsers: [...new Set([...s.blockedUsers, id])] })),
      unblockUser: (id) => set((s) => ({ blockedUsers: s.blockedUsers.filter((u) => u !== id) })),
    }),
    { name: 'salsa-moderation', storage: createJSONStorage(() => safeStorage) },
  ),
);

/** Leaves out posts the user hid and posts by authors they blocked. */
export function useVisiblePosts(posts: Post[] | undefined): Post[] {
  const hiddenPosts = useModeration((s) => s.hiddenPosts);
  const blockedUsers = useModeration((s) => s.blockedUsers);
  return useMemo(
    () => (posts ?? []).filter((p) => !hiddenPosts.includes(p.id) && !blockedUsers.includes(p.author.id)),
    [posts, hiddenPosts, blockedUsers],
  );
}

/** Signed-in user id (cloud) or local profile id (demo). */
export function useSession() {
  return useQuery({ queryKey: qk.session, queryFn: () => social.currentUserId() });
}

export function useMe() {
  return useQuery({ queryKey: qk.me, queryFn: () => social.getMyProfile(), staleTime: 60_000 });
}

export function useFeed(filter: FeedFilter) {
  const query = useQuery({ queryKey: qk.feed(filter), queryFn: () => social.feed(filter) });
  return { ...query, posts: useVisiblePosts(query.data) };
}

const LISTS = ['feed', 'userPosts', 'saved'];

export function usePost(id: string) {
  const client = useQueryClient();
  return useQuery({
    queryKey: qk.post(id),
    queryFn: () => social.getPost(id),
    // Opens instantly with the copy already shown in a list.
    initialData: () => {
      for (const [, list] of client.getQueriesData<Post[]>({ predicate: (q) => LISTS.includes(String(q.queryKey[0])) })) {
        const found = list?.find((p) => p.id === id);
        if (found) return found;
      }
      return undefined;
    },
  });
}

export function useComments(postId: string) {
  return useQuery({ queryKey: qk.comments(postId), queryFn: () => social.comments(postId) });
}

export function useProfile(userId: string) {
  return useQuery({ queryKey: qk.profile(userId), queryFn: () => social.getProfile(userId) });
}

export function useStats(userId: string | undefined) {
  return useQuery({ queryKey: qk.stats(userId ?? ''), queryFn: () => social.getStats(userId!), enabled: Boolean(userId) });
}

export function useUserPosts(userId: string | undefined) {
  return useQuery({ queryKey: qk.userPosts(userId ?? ''), queryFn: () => social.postsBy(userId!), enabled: Boolean(userId) });
}

/** Keeps a local copy of saved posts, so they work offline and in the planner (e.g. after signing in on a new phone). */
function keepSavedOffline(posts: Post[]) {
  useAppStore.setState((s) => {
    const known = new Set(s.community.map((r) => r.id));
    const missing = posts.map(postToRecipe).filter((r) => !known.has(r.id));
    return missing.length ? { community: [...s.community, ...missing] } : s;
  });
}

export function useSavedPosts() {
  return useQuery({
    queryKey: qk.saved,
    queryFn: async () => {
      const posts = await social.savedPosts();
      keepSavedOffline(posts);
      return posts;
    },
  });
}

export function useIsFollowing(userId: string) {
  return useQuery({ queryKey: qk.following(userId), queryFn: () => social.isFollowing(userId) });
}

/** Applies `patch` to every cached copy of a post (feeds, profiles, detail). */
function patchPost(client: QueryClient, postId: string, patch: (post: Post) => Post) {
  client.setQueriesData<Post[] | Post | null>(
    { predicate: (q) => [...LISTS, 'post'].includes(String(q.queryKey[0])) },
    (data) => {
      if (!data) return data;
      if (Array.isArray(data)) return data.map((p) => (p.id === postId ? patch(p) : p));
      return data.id === postId ? patch(data) : data;
    },
  );
}

export function useToggleLike() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (post: Post) => social.setLiked(post.id, !post.likedByMe),
    onMutate: (post) => {
      patchPost(client, post.id, (p) => ({
        ...p,
        likedByMe: !post.likedByMe,
        likeCount: p.likeCount + (post.likedByMe ? -1 : 1),
      }));
    },
    onError: (_e, post) => {
      patchPost(client, post.id, (p) => ({ ...p, likedByMe: post.likedByMe, likeCount: post.likeCount }));
    },
  });
}

export function useToggleSave() {
  const client = useQueryClient();
  const rememberRecipe = useAppStore((s) => s.rememberRecipe);
  const forgetRecipe = useAppStore((s) => s.forgetRecipe);
  return useMutation({
    mutationFn: (post: Post) => social.setSaved(post.id, !post.savedByMe),
    onMutate: (post) => {
      patchPost(client, post.id, (p) => ({
        ...p,
        savedByMe: !post.savedByMe,
        saveCount: p.saveCount + (post.savedByMe ? -1 : 1),
      }));
      const recipe = postToRecipe(post);
      if (post.savedByMe) forgetRecipe(recipe.id);
      else rememberRecipe(recipe);
    },
    onError: (_e, post) => {
      patchPost(client, post.id, (p) => ({ ...p, savedByMe: post.savedByMe, saveCount: post.saveCount }));
    },
    onSettled: () => client.invalidateQueries({ queryKey: qk.saved }),
  });
}

export function useAddComment(postId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (body: string) => social.addComment(postId, body),
    onSuccess: (comment: Comment) => {
      client.setQueryData<Comment[]>(qk.comments(postId), (list) => [...(list ?? []), comment]);
      patchPost(client, postId, (p) => ({ ...p, commentCount: p.commentCount + 1 }));
    },
  });
}

export function useDeleteComment(postId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (commentId: string) => social.deleteComment(commentId),
    onSuccess: (_r, commentId) => {
      client.setQueryData<Comment[]>(qk.comments(postId), (list) => (list ?? []).filter((c) => c.id !== commentId));
      patchPost(client, postId, (p) => ({ ...p, commentCount: Math.max(0, p.commentCount - 1) }));
    },
  });
}

export function useCreatePost() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: NewPost) => social.createPost(input),
    onSuccess: (post) => {
      client.invalidateQueries({ queryKey: ['feed'] });
      client.invalidateQueries({ queryKey: qk.userPosts(post.author.id) });
      client.invalidateQueries({ queryKey: qk.stats(post.author.id) });
    },
  });
}

export function useDeletePost() {
  const client = useQueryClient();
  const forgetRecipe = useAppStore((s) => s.forgetRecipe);
  return useMutation({
    mutationFn: (post: Post) => social.deletePost(post.id),
    onSuccess: (_r, post) => {
      forgetRecipe(postToRecipe(post).id);
      client.invalidateQueries({ queryKey: ['feed'] });
      client.invalidateQueries({ queryKey: qk.userPosts(post.author.id) });
      client.invalidateQueries({ queryKey: qk.stats(post.author.id) });
      client.removeQueries({ queryKey: qk.post(post.id) });
    },
  });
}

export function useFollow(userId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (follow: boolean) => social.setFollowing(userId, follow),
    onMutate: (follow) => client.setQueryData(qk.following(userId), follow),
    onSettled: async () => {
      const me = await social.currentUserId();
      client.invalidateQueries({ queryKey: qk.stats(userId) });
      if (me) client.invalidateQueries({ queryKey: qk.stats(me) });
      client.invalidateQueries({ queryKey: qk.feed('seguindo') });
    },
  });
}

export function useSaveProfile() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: ProfileInput) => social.saveMyProfile(input),
    onSuccess: (profile) => {
      client.setQueryData(qk.me, profile);
      client.setQueryData(qk.session, profile.id);
      client.setQueryData(qk.profile(profile.id), profile);
      client.invalidateQueries({ queryKey: ['feed'] });
      client.invalidateQueries({ queryKey: ['userPosts'] });
      client.invalidateQueries({ queryKey: ['comments'] });
    },
  });
}

export function useReport() {
  const client = useQueryClient();
  const hidePost = useModeration((s) => s.hidePost);
  return useMutation({
    mutationFn: ({ postId, reason }: { postId: string; reason: string }) => social.report(postId, reason),
    onMutate: ({ postId }) => hidePost(postId),
    onSettled: () => client.invalidateQueries({ queryKey: ['feed'] }),
  });
}
