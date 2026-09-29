import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '../../components/Button';
import { Camera, ImagePlus, Info, X } from '../../components/icons';
import { Emoji } from '../../components/Emoji';
import { StepLayout } from '../../components/StepLayout';
import { TextField } from '../../components/TextField';
import { Avatar } from '../../components/social/Avatar';
import type { EmojiName } from '../../data/emoji';
import { haptics } from '../../lib/haptics';
import { canUseCamera, choosePhoto } from '../../lib/photos';
import type { RootScreenProps } from '../../navigation/types';
import { isDemo, social } from '../../social/backend';
import { cleanUsername, suggestUsername, USERNAME_RE } from '../../social/convert';
import { qk, useMe, useSaveProfile, useSession } from '../../social/hooks';
import type { Avatar as AvatarData, SocialProfile } from '../../social/types';
import { colors, fonts, radius, shadow } from '../../theme';

const AVATAR_EMOJI: EmojiName[] = [
  'woman-cook',
  'man-cook',
  'woman-cook-medium',
  'man-cook-dark',
  'woman-cook-light',
  'man-cook-medium-dark',
  'woman-cook-medium-dark',
  'cook-medium-light',
  'avocado',
  'tomato',
  'carrot',
  'broccoli',
  'hot-pepper',
  'mushroom',
  'cheese-wedge',
  'banana',
];

const AVATAR_COLORS = ['#FFE3B3', '#E4F1D6', '#F9D7D0', '#DCEBF5', '#ECE5F5', '#FFF0C2', '#D5EFE6', '#F3E3D3'];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Props = RootScreenProps<'CreateProfile' | 'EditProfile'>;

export function ProfileEditorScreen(props: Props) {
  const me = useMe();
  const session = useSession();
  if (me.isPending || session.isPending) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.forest} />
      </View>
    );
  }
  return <ProfileForm {...props} initial={me.data ?? null} />;
}

function message(error: unknown): string {
  return error instanceof Error ? error.message : 'Não foi possível salvar. Tente de novo.';
}

function ProfileForm({ navigation, route, initial }: Props & { initial: SocialProfile | null }) {
  const onboarding = route.name === 'CreateProfile';
  const client = useQueryClient();
  const session = useSession();
  const saveProfile = useSaveProfile();
  const signedIn = isDemo || Boolean(session.data);

  const [avatar, setAvatar] = useState<AvatarData>(
    () => initial?.avatar ?? { kind: 'emoji', emoji: AVATAR_EMOJI[Math.floor(Math.random() * 8)], color: AVATAR_COLORS[0] },
  );
  const [lastColor, setLastColor] = useState(initial?.avatar.kind === 'emoji' ? initial.avatar.color : AVATAR_COLORS[0]);
  const [name, setName] = useState(initial?.name ?? '');
  const [username, setUsername] = useState(initial?.username ?? '');
  const [usernameEdited, setUsernameEdited] = useState(Boolean(initial));
  const [city, setCity] = useState(initial?.city ?? '');
  const [bio, setBio] = useState(initial?.bio ?? '');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [account, setAccount] = useState<'signup' | 'signin'>('signup');
  const [checked, setChecked] = useState<{ username: string; available: boolean } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const signingIn = !signedIn && account === 'signin';
  const validUsername = USERNAME_RE.test(username);
  const ownUsername = initial?.username === username;
  const availability = !validUsername
    ? 'invalid'
    : ownUsername
      ? 'available'
      : checked?.username === username
        ? checked.available
          ? 'available'
          : 'taken'
        : 'checking';

  useEffect(() => {
    if (!validUsername || ownUsername) return;
    let alive = true;
    const timer = setTimeout(() => {
      social.isUsernameAvailable(username).then(
        (available) => alive && setChecked({ username, available }),
        () => alive && setChecked({ username, available: true }),
      );
    }, 350);
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [username, validUsername, ownUsername]);

  const pickPhoto = async (source: 'library' | 'camera') => {
    setError(null);
    try {
      const uri = await choosePhoto({ source, aspect: [1, 1], width: 400 });
      if (uri) setAvatar({ kind: 'photo', uri });
    } catch (e) {
      setError(message(e));
    }
  };

  const finish = () => {
    haptics.success();
    if (onboarding) navigation.navigate('Market');
    else navigation.goBack();
  };

  const profileProblem = (): string | null => {
    if (name.trim().length < 2) return 'Diga como você quer ser chamado.';
    if (!validUsername) return 'O @ precisa ter de 3 a 20 caracteres: letras minúsculas, números, ponto ou _.';
    if (availability === 'taken') return 'Esse nome de usuário já está em uso.';
    return null;
  };

  const saveMine = async () => {
    if (!(await social.isUsernameAvailable(username))) throw new Error('Esse nome de usuário já está em uso.');
    await saveProfile.mutateAsync({ username, name: name.trim(), bio: bio.trim(), city: city.trim(), avatar });
    finish();
  };

  const submit = async () => {
    setError(null);
    setNotice(null);
    const needsProfileFields = !signingIn;
    const problem = needsProfileFields ? profileProblem() : null;
    if (problem) return setError(problem);
    if (!signedIn) {
      if (!EMAIL_RE.test(email.trim())) return setError('Digite um e-mail válido.');
      if (password.length < 6) return setError('A senha precisa ter pelo menos 6 caracteres.');
    }
    setBusy(true);
    try {
      if (signingIn) {
        await social.signIn(email, password);
        client.setQueryData(qk.session, await social.currentUserId());
        await client.invalidateQueries();
        const existing = await social.getMyProfile();
        if (existing) return finish();
        if (!profileProblem()) return await saveMine();
        setNotice('Conta conectada! Agora complete seu perfil.');
        return;
      }
      if (!signedIn) {
        const { needsConfirmation } = await social.signUp(email, password);
        if (needsConfirmation) {
          setAccount('signin');
          setPassword('');
          setNotice(`Enviamos um link de confirmação para ${email.trim()}. Confirme pelo e-mail e depois entre com sua senha.`);
          return;
        }
        client.setQueryData(qk.session, await social.currentUserId());
      }
      await saveMine();
    } catch (e) {
      setError(message(e));
    } finally {
      setBusy(false);
    }
  };

  const title = onboarding ? 'crie seu perfil' : signedIn ? 'seu perfil' : 'entre na comunidade';
  const subtitle = onboarding
    ? 'É com ele que você publica receitas, salva as favoritas e segue quem cozinha bem.'
    : signedIn
      ? 'É assim que a comunidade vê você.'
      : 'Crie uma conta ou entre na sua para publicar e salvar receitas.';
  const buttonLabel = signingIn ? 'Entrar' : onboarding ? 'Continuar' : signedIn ? 'Salvar perfil' : 'Criar conta';

  return (
    <StepLayout
      step={onboarding ? 1 : undefined}
      editLabel={signedIn ? 'Editar perfil' : 'Conta'}
      onBack={() => navigation.goBack()}
      title={title}
      subtitle={subtitle}
      footer={<Button label={buttonLabel} onPress={submit} loading={busy} />}
    >
      {!signedIn ? (
        <View style={styles.card}>
          <View style={styles.segment} accessibilityRole="tablist">
            {(['signup', 'signin'] as const).map((mode) => {
              const active = account === mode;
              return (
                <Pressable
                  key={mode}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: active }}
                  onPress={() => {
                    haptics.select();
                    setAccount(mode);
                    setError(null);
                  }}
                  style={[styles.segmentItem, active && styles.segmentItemActive]}
                >
                  <Text style={[styles.segmentText, active && styles.segmentTextActive]}>
                    {mode === 'signup' ? 'Criar conta' : 'Já tenho conta'}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <TextField
            label="E-mail"
            value={email}
            onChangeText={setEmail}
            placeholder="voce@email.com"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            keyboardType="email-address"
            textContentType="emailAddress"
          />
          <TextField
            label="Senha"
            value={password}
            onChangeText={setPassword}
            placeholder="mínimo de 6 caracteres"
            secureTextEntry
            autoCapitalize="none"
            autoComplete={account === 'signup' ? 'new-password' : 'current-password'}
            textContentType={account === 'signup' ? 'newPassword' : 'password'}
            onSubmitEditing={signingIn ? submit : undefined}
          />
        </View>
      ) : null}

      {notice ? (
        <View style={styles.notice}>
          <Info size={18} color={colors.forest} />
          <Text style={styles.noticeText}>{notice}</Text>
        </View>
      ) : null}

      {!signingIn ? (
        <>
          <View style={[styles.card, styles.avatarCard]}>
            <View style={styles.avatarRow}>
              <Avatar avatar={avatar} size={96} />
              <View style={styles.photoButtons}>
                <Pressable style={styles.photoBtn} onPress={() => pickPhoto('library')} accessibilityRole="button">
                  <ImagePlus size={17} color={colors.forest} strokeWidth={2.3} />
                  <Text style={styles.photoBtnText}>{avatar.kind === 'photo' ? 'Trocar foto' : 'Usar uma foto'}</Text>
                </Pressable>
                {canUseCamera ? (
                  <Pressable style={styles.photoBtn} onPress={() => pickPhoto('camera')} accessibilityRole="button">
                    <Camera size={17} color={colors.forest} strokeWidth={2.3} />
                    <Text style={styles.photoBtnText}>Tirar foto</Text>
                  </Pressable>
                ) : null}
                {avatar.kind === 'photo' ? (
                  <Pressable
                    style={styles.photoBtn}
                    onPress={() => setAvatar({ kind: 'emoji', emoji: 'cook', color: lastColor })}
                    accessibilityRole="button"
                  >
                    <X size={17} color={colors.tomato} strokeWidth={2.3} />
                    <Text style={[styles.photoBtnText, { color: colors.tomato }]}>Remover foto</Text>
                  </Pressable>
                ) : null}
              </View>
            </View>
            <Text style={styles.smallTitle}>Ou escolha um avatar</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.emojiRow}>
              {AVATAR_EMOJI.map((emoji, i) => {
                const active = avatar.kind === 'emoji' && avatar.emoji === emoji;
                return (
                  <Pressable
                    key={emoji}
                    onPress={() => {
                      haptics.select();
                      setAvatar({ kind: 'emoji', emoji, color: lastColor });
                    }}
                    style={[styles.emojiChoice, { backgroundColor: lastColor }, active && styles.choiceActive]}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: active }}
                    accessibilityLabel={`Avatar ${i + 1}`}
                  >
                    <Emoji name={emoji} size={30} />
                  </Pressable>
                );
              })}
            </ScrollView>
            <View style={styles.colorRow}>
              {AVATAR_COLORS.map((color) => {
                const active = lastColor === color;
                return (
                  <Pressable
                    key={color}
                    onPress={() => {
                      haptics.select();
                      setLastColor(color);
                      setAvatar((a) => (a.kind === 'emoji' ? { ...a, color } : a));
                    }}
                    style={[styles.swatch, { backgroundColor: color }, active && styles.choiceActive]}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: active }}
                    accessibilityLabel={`Cor de fundo ${AVATAR_COLORS.indexOf(color) + 1}`}
                  />
                );
              })}
            </View>
          </View>

          <TextField
            label="Nome"
            value={name}
            onChangeText={(text) => {
              setName(text);
              if (!usernameEdited) setUsername(suggestUsername(text));
            }}
            placeholder="Como você quer aparecer"
            autoComplete="name"
            textContentType="name"
            maxLength={40}
          />
          <TextField
            label="Nome de usuário"
            prefix="@"
            value={username}
            onChangeText={(text) => {
              setUsernameEdited(true);
              setUsername(cleanUsername(text));
            }}
            placeholder="seu.nome"
            autoCapitalize="none"
            autoCorrect={false}
            maxLength={20}
            error={availability === 'taken' ? 'Esse nome de usuário já está em uso.' : null}
            hint={
              availability === 'available' ? (
                <Text style={styles.available}>✓ @{username} está livre</Text>
              ) : (
                'Letras minúsculas, números, ponto ou _.'
              )
            }
            right={availability === 'checking' ? <ActivityIndicator size="small" color={colors.muted} /> : null}
          />
          <TextField
            label="Cidade (opcional)"
            value={city}
            onChangeText={setCity}
            placeholder="Ex.: Recife"
            autoComplete="off"
            maxLength={40}
          />
          <TextField
            label="Sobre você (opcional)"
            value={bio}
            onChangeText={setBio}
            placeholder="Ex.: Marmitas da semana e receitas rápidas."
            multiline
            maxLength={160}
            hint={`${bio.length}/160`}
          />
        </>
      ) : null}

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {isDemo && onboarding ? (
        <Text style={styles.demoNote}>Modo demonstração: seu perfil fica salvo só neste aparelho.</Text>
      ) : null}
    </StepLayout>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.cream },
  card: { backgroundColor: colors.card, borderRadius: radius.lg, padding: 16, marginBottom: 6, ...shadow(1) },
  avatarCard: { paddingBottom: 14 },
  avatarRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  photoButtons: { flex: 1, gap: 8 },
  photoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.leafMist,
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 9,
    alignSelf: 'flex-start',
  },
  photoBtnText: { fontFamily: fonts.bold, fontSize: 13.5, color: colors.forest },
  smallTitle: { fontFamily: fonts.bold, fontSize: 13, color: colors.inkSoft, marginTop: 16, marginBottom: 10 },
  emojiRow: { gap: 8, paddingRight: 4 },
  emojiChoice: { width: 50, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center' },
  choiceActive: { borderWidth: 3, borderColor: colors.forest },
  colorRow: { flexDirection: 'row', gap: 10, marginTop: 12, flexWrap: 'wrap' },
  swatch: { width: 30, height: 30, borderRadius: 15, borderWidth: 1, borderColor: colors.line },
  segment: { flexDirection: 'row', backgroundColor: colors.cream, borderRadius: radius.pill, padding: 4 },
  segmentItem: { flex: 1, height: 40, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  segmentItemActive: { backgroundColor: colors.forest },
  segmentText: { fontFamily: fonts.bold, fontSize: 14, color: colors.inkSoft },
  segmentTextActive: { color: colors.onDark },
  notice: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
    backgroundColor: colors.leafSoft,
    borderRadius: radius.md,
    padding: 12,
    marginTop: 10,
  },
  noticeText: { flex: 1, fontFamily: fonts.semibold, fontSize: 13.5, lineHeight: 19, color: colors.forest },
  available: { fontFamily: fonts.bold, color: colors.leafDark },
  error: { fontFamily: fonts.semibold, fontSize: 13.5, lineHeight: 19, color: colors.tomato, marginTop: 16 },
  demoNote: { fontFamily: fonts.medium, fontSize: 12, color: colors.muted, textAlign: 'center', marginTop: 18 },
});
