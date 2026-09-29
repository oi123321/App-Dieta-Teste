import { useNavigation } from '@react-navigation/native';
import { useState } from 'react';

import { ConfirmDialog } from '../components/ConfirmDialog';
import { DayPickerSheet } from '../components/recipe/DayPickerSheet';
import { PostOptionsSheet } from '../components/social/PostOptionsSheet';
import { Toast, useToast } from '../components/Toast';
import { onDayLabel } from '../lib/format';
import { haptics } from '../lib/haptics';
import { useAppStore } from '../store/useAppStore';
import { postRecipeId, postToRecipe } from './convert';
import { useDeletePost, useMe, useModeration, useReport, useToggleLike, useToggleSave } from './hooks';
import type { Post } from './types';

function errorText(error: unknown): string {
  return error instanceof Error ? error.message : 'Algo deu errado. Tente de novo.';
}

/**
 * Like, save, add-to-plan and moderation for community posts, shared by the
 * feed, the post screen and profiles. Render `overlays` once in the screen.
 */
export function usePostActions(opts: { onDeleted?: (post: Post) => void; toastBottom?: number } = {}) {
  const navigation = useNavigation();
  const me = useMe();
  const like = useToggleLike();
  const save = useToggleSave();
  const report = useReport();
  const remove = useDeletePost();
  const hidePost = useModeration((s) => s.hidePost);
  const blockUser = useModeration((s) => s.blockUser);
  const plan = useAppStore((s) => s.plan);
  const rememberRecipe = useAppStore((s) => s.rememberRecipe);
  const putRecipeOnDay = useAppStore((s) => s.putRecipeOnDay);
  const [planning, setPlanning] = useState<Post | null>(null);
  const [options, setOptions] = useState<Post | null>(null);
  const [deleting, setDeleting] = useState<Post | null>(null);
  const [toast, showToast] = useToast();

  /** Social actions need a profile; people without one are sent to create it. */
  const withProfile = (fn: () => void) => {
    if (me.data) fn();
    else navigation.navigate('EditProfile');
  };

  const onError = (error: unknown) => showToast(errorText(error));

  const pickDay = (day: number) => {
    if (!planning) return;
    const recipe = postToRecipe(planning);
    rememberRecipe(recipe);
    putRecipeOnDay(recipe.id, day);
    haptics.success();
    setPlanning(null);
    showToast(`Adicionada ${onDayLabel(day)}! A lista de compras já foi atualizada.`);
  };

  return {
    me: me.data ?? null,
    withProfile,
    inPlan: (post: Post) => Boolean(plan?.entries.some((e) => e.recipeId === postRecipeId(post.id))),
    like: (post: Post) =>
      withProfile(() => {
        haptics.tap();
        like.mutate(post, { onError });
      }),
    save: (post: Post) =>
      withProfile(() => {
        haptics.tap();
        save.mutate(post, { onError });
        showToast(post.savedByMe ? 'Removida das receitas salvas.' : 'Receita salva! Ela fica em Perfil › Salvas.');
      }),
    addToPlan: (post: Post) => setPlanning(post),
    more: (post: Post) => setOptions(post),
    openAuthor: (post: Post) => navigation.navigate('UserProfile', { userId: post.author.id }),
    showToast,
    overlays: (
      <>
        <DayPickerSheet
          visible={Boolean(planning)}
          title={planning?.title ?? ''}
          onPick={pickDay}
          onClose={() => setPlanning(null)}
        />
        <PostOptionsSheet
          post={options}
          isMine={Boolean(options && me.data && options.author.id === me.data.id)}
          onClose={() => setOptions(null)}
          onProfile={(post) => {
            setOptions(null);
            navigation.navigate('UserProfile', { userId: post.author.id });
          }}
          onHide={(post) => {
            setOptions(null);
            hidePost(post.id);
            showToast('Pronto, essa receita não aparece mais.');
          }}
          onBlock={(post) => {
            setOptions(null);
            blockUser(post.author.id);
            showToast(`@${post.author.username} bloqueado.`);
          }}
          onReport={(post, reason) => {
            setOptions(null);
            withProfile(() => {
              report.mutate({ postId: post.id, reason }, { onError });
              showToast('Obrigado! Vamos analisar a denúncia.');
            });
          }}
          onDelete={(post) => {
            setOptions(null);
            // iOS cannot present a modal while another one is still closing.
            setTimeout(() => setDeleting(post), 350);
          }}
        />
        <ConfirmDialog
          visible={Boolean(deleting)}
          title="Excluir receita?"
          message="Ela sai da comunidade, junto com as curtidas e os comentários."
          confirmLabel="Excluir"
          destructive
          onCancel={() => setDeleting(null)}
          onConfirm={() => {
            const post = deleting;
            setDeleting(null);
            if (!post) return;
            remove.mutate(post, {
              onSuccess: () => {
                showToast('Receita excluída.');
                opts.onDeleted?.(post);
              },
              onError,
            });
          }}
        />
        <Toast message={toast} style={opts.toastBottom !== undefined ? { bottom: opts.toastBottom } : undefined} />
      </>
    ),
  };
}
