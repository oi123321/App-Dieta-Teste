# salsa — plano de refeições

App mobile (iOS e Android), feito com Expo e React Native, que monta os jantares da semana de acordo com o **mercado** onde você compra, o **orçamento** semanal e os **aparelhos** que você tem em casa. Ele também gera a lista de compras organizada por corredor.

A ideia segue o app Herbi (plano semanal, "deslize para montar a semana", importação de receitas do TikTok/Instagram e lista por corredor), com nome, identidade visual, receitas e preços próprios para o Brasil.

## Telas

**Onboarding**

1. **Boas-vindas**
2. **Onde você faz as compras?** — escolha do mercado (Assaí, Atacadão, Carrefour, Pão de Açúcar, Dia, Guanabara… ou "outro mercado"), com busca e faixa de preço ($, $$, $$$).
3. **Quem janta com você?** — pessoas, jantares por semana, "cozinhar em dobro" e preferências (vegetariano, sem lactose, sem glúten, mais proteína, menos carboidrato).
4. **Quanto você gasta por semana no mercado?** — orçamento com controle deslizante, valores rápidos e um aviso se o valor cabe, fica apertado ou é baixo para o mercado escolhido.
5. **O que tem na sua cozinha?** — cozinha ilustrada: toque em fogão, forno, micro-ondas, air fryer, panela de pressão, liquidificador e grill.
6. **Montando sua semana…**

**App**

- **Semana ("bom apetite!")** — custo aproximado × orçamento, atalho para a lista, jantares por dia com preço, tempo, porções e o aviso "cozinhe 1 vez, jante 2". Ainda tem trocar receita (⇄), gerar outro plano e ajustar ao orçamento.
- **Monte sua semana** — deslize para a direita para adicionar e para a esquerda para pular. Tem desfazer e "completar automaticamente".
- **Lista de compras** — agrupada por corredor, com quantidades já somadas, itens para marcar, total estimado, itens extras e compartilhamento.
- **Receita** — proteína, carboidratos, gorduras, kcal, porções e tempo, botões "Curti" e "Não é pra mim", ingredientes que se ajustam ao número de porções, modo de preparo e o botão "Adicionar ao plano".
- **Importar do TikTok e Instagram** — cole o link. No TikTok, a legenda é lida pelo oEmbed público e os ingredientes são reconhecidos automaticamente. No Instagram, que exige login, você cola ou digita a receita, e o app calcula preço e calorias.
- **Receitas** (busca e filtros) e **Perfil** (trocar mercado, orçamento, casa e cozinha, gerar novo plano, recomeçar).

## Como rodar no celular

Você precisa de um computador com **Node.js 20+** e do app **Expo Go** no celular (App Store ou Play Store).

```bash
npm install
npx expo start
```

Escaneie o QR code que aparece no terminal: no iPhone, com a câmera; no Android, pelo Expo Go. O computador e o celular precisam estar na mesma rede Wi-Fi. Se não estiverem, use `npx expo start --tunnel`.

Para ver no navegador (em uma moldura de celular): `npx expo start --web`.

Para publicar nas lojas, use o EAS: `npx eas-cli@latest build` e `npx eas-cli@latest submit`.

## Como funciona

- **Preços** — `src/data/ingredients.ts` tem ~80 ingredientes com preço médio em R$, corredor e informação nutricional. Cada mercado em `src/data/markets.ts` tem um índice de preço (atacarejos mais baratos, premium mais caros). Os valores são estimativas para planejamento, não preços reais de loja.
- **Plano** — `src/lib/planner.ts` filtra as receitas pelos aparelhos e preferências, evita repetir a mesma proteína, prefere receitas que rendem marmita nos dias "em dobro" e troca as mais caras até caber no orçamento.
- **Lista** — `src/lib/shopping.ts` soma as quantidades de todas as receitas, arredonda para o que se compra (unidades inteiras, gramas em múltiplos de 10/50/100) e agrupa por corredor.
- **Macros** — calculados a partir dos ingredientes de cada receita (por porção).
- **Dados** — ficam salvos no próprio aparelho (AsyncStorage). Não há login.

## Estrutura

```
App.tsx                  fontes, splash, navegação
src/navigation/          pilha raiz, abas e tipos das rotas
src/screens/             telas (onboarding/ e principais)
src/components/          botões, cartões, cozinha ilustrada, cartão deslizante…
src/data/                mercados, ingredientes, receitas, aparelhos
src/lib/                 plano, preços, lista, importação, formatação
src/store/               estado (zustand + AsyncStorage)
scripts/generate-assets.mjs   gera capas, ícones e o ícone do app
```

## Ilustrações

As capas das receitas e os ícones de ingredientes são gerados por `npm run assets` a partir do [Fluent Emoji](https://github.com/microsoft/fluentui-emoji) (Microsoft, licença MIT), com alguns pratos desenhados no mesmo estilo. Para usar fotos reais, preencha `imageUrl` na receita ou troque os arquivos em `assets/recipes/`.

## Próximos passos sugeridos

- Aparecer no menu **Compartilhar** do TikTok/Instagram (share extension). Isso exige um development build, por exemplo com `expo-share-intent`.
- Preços reais por parceria ou API dos mercados.
- Fotos reais das receitas.
- Conta e sincronização entre aparelhos.
