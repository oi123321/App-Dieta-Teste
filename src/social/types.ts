import type { EmojiName } from '../data/emoji';
import type { ApplianceId } from '../data/types';

export type Avatar = { kind: 'emoji'; emoji: EmojiName; color: string } | { kind: 'photo'; uri: string };

export interface SocialProfile {
  id: string;
  username: string;
  name: string;
  bio: string;
  city: string;
  avatar: Avatar;
  createdAt: string;
  /** Seed accounts shown in demo mode. */
  isExample?: boolean;
}

export interface ProfileInput {
  username: string;
  name: string;
  bio: string;
  city: string;
  avatar: Avatar;
}

export interface ProfileStats {
  posts: number;
  followers: number;
  following: number;
}

/** Units people actually write in recipes. */
export type PostUnit =
  | 'g'
  | 'kg'
  | 'ml'
  | 'l'
  | 'un'
  | 'colher_sopa'
  | 'colher_cha'
  | 'xicara'
  | 'dente'
  | 'maco'
  | 'lata'
  | 'pitada'
  | 'a_gosto';

export interface PostIngredient {
  name: string;
  /** null when the unit is "a gosto". */
  qty: number | null;
  unit: PostUnit;
  /** Matching catalog ingredient, used for prices, icons and macros. */
  catalogId?: string;
}

export interface Post {
  id: string;
  author: SocialProfile;
  title: string;
  description: string;
  photoUrl: string | null;
  minutes: number;
  servings: number;
  ingredients: PostIngredient[];
  steps: string[];
  appliances: ApplianceId[];
  createdAt: string;
  likeCount: number;
  saveCount: number;
  commentCount: number;
  likedByMe: boolean;
  savedByMe: boolean;
  isExample?: boolean;
}

export interface NewPost {
  title: string;
  description: string;
  /** Local file or data URI picked by the user; uploaded by the backend. */
  photoUri: string | null;
  minutes: number;
  servings: number;
  ingredients: PostIngredient[];
  steps: string[];
  appliances: ApplianceId[];
}

export interface Comment {
  id: string;
  postId: string;
  author: SocialProfile;
  body: string;
  createdAt: string;
}

export type FeedFilter = 'recentes' | 'seguindo' | 'populares';

export interface SocialBackend {
  mode: 'demo' | 'cloud';

  /** Id of the signed-in user (cloud) or of the local profile (demo). */
  currentUserId(): Promise<string | null>;
  signUp(email: string, password: string): Promise<{ needsConfirmation: boolean }>;
  signIn(email: string, password: string): Promise<void>;
  signOut(): Promise<void>;

  getMyProfile(): Promise<SocialProfile | null>;
  saveMyProfile(input: ProfileInput): Promise<SocialProfile>;
  isUsernameAvailable(username: string): Promise<boolean>;
  getProfile(userId: string): Promise<SocialProfile | null>;
  getStats(userId: string): Promise<ProfileStats>;
  isFollowing(userId: string): Promise<boolean>;
  setFollowing(userId: string, follow: boolean): Promise<void>;

  feed(filter: FeedFilter): Promise<Post[]>;
  postsBy(userId: string): Promise<Post[]>;
  savedPosts(): Promise<Post[]>;
  getPost(postId: string): Promise<Post | null>;
  createPost(input: NewPost): Promise<Post>;
  deletePost(postId: string): Promise<void>;
  setLiked(postId: string, liked: boolean): Promise<void>;
  setSaved(postId: string, saved: boolean): Promise<void>;

  comments(postId: string): Promise<Comment[]>;
  addComment(postId: string, body: string): Promise<Comment>;
  deleteComment(commentId: string): Promise<void>;
  report(postId: string, reason: string): Promise<void>;
}
