import type { Aisle, Ingredient } from './types';

/**
 * Baseline prices in BRL (typical big-city supermarket, 2026). The selected
 * market's index is applied on top. Estimates only — never shown as exact.
 */
// prettier-ignore
export const INGREDIENTS: Ingredient[] = [
  // Hortifrúti
  { id: 'batata', name: 'Batata', icon: 'potato', aisle: 'hortifruti', unit: 'g', price: 6.49, per: 1000, n: [77, 2, 17, 0.1] },
  { id: 'batata_doce', name: 'Batata-doce', icon: 'roasted-sweet-potato', aisle: 'hortifruti', unit: 'g', price: 6.99, per: 1000, n: [86, 1.6, 20, 0.1] },
  { id: 'mandioca', name: 'Mandioca', icon: 'potato', aisle: 'hortifruti', unit: 'g', price: 7.99, per: 1000, n: [160, 1.4, 38, 0.3] },
  { id: 'abobora', name: 'Abóbora cabotiá', icon: 'pumpkin', aisle: 'hortifruti', unit: 'g', price: 5.49, per: 1000, n: [45, 1.5, 10, 0.1] },
  { id: 'cebola', name: 'Cebola', icon: 'onion', aisle: 'hortifruti', unit: 'un', price: 0.9, per: 1, n: [60, 1.6, 14, 0.2] },
  { id: 'alho', name: 'Alho', icon: 'garlic', aisle: 'hortifruti', unit: 'dente', price: 0.25, per: 1, n: [7, 0.3, 1.6, 0] },
  { id: 'tomate', name: 'Tomate', icon: 'tomato', aisle: 'hortifruti', unit: 'un', price: 1.1, per: 1, n: [22, 1, 4.7, 0.2] },
  { id: 'tomate_cereja', name: 'Tomate-cereja', icon: 'tomato', aisle: 'hortifruti', unit: 'g', price: 18, per: 1000, n: [18, 0.9, 3.9, 0.2] },
  { id: 'cenoura', name: 'Cenoura', icon: 'carrot', aisle: 'hortifruti', unit: 'un', price: 0.7, per: 1, n: [41, 0.9, 10, 0.2] },
  { id: 'pimentao', name: 'Pimentão', icon: 'bell-pepper', aisle: 'hortifruti', unit: 'un', price: 2.2, per: 1, n: [39, 1.5, 9, 0.4] },
  { id: 'abobrinha', name: 'Abobrinha', icon: 'cucumber', aisle: 'hortifruti', unit: 'un', price: 2.8, per: 1, n: [43, 3, 8, 0.8] },
  { id: 'brocolis', name: 'Brócolis', icon: 'broccoli', aisle: 'hortifruti', unit: 'g', price: 24, per: 1000, n: [34, 2.8, 7, 0.4] },
  { id: 'espinafre', name: 'Espinafre', icon: 'leafy-green', aisle: 'hortifruti', unit: 'maco', price: 4.5, per: 1, n: [58, 7, 9, 1] },
  { id: 'couve', name: 'Couve', icon: 'leafy-green', aisle: 'hortifruti', unit: 'maco', price: 3.5, per: 1, n: [64, 6, 11, 1] },
  { id: 'alface', name: 'Alface', icon: 'leafy-green', aisle: 'hortifruti', unit: 'un', price: 3.5, per: 1, n: [45, 4, 9, 0.6] },
  { id: 'rucula', name: 'Rúcula', icon: 'leafy-green', aisle: 'hortifruti', unit: 'maco', price: 3.5, per: 1, n: [38, 4, 5, 1] },
  { id: 'repolho', name: 'Repolho', icon: 'leafy-green', aisle: 'hortifruti', unit: 'g', price: 4.99, per: 1000, n: [25, 1.3, 6, 0.1] },
  { id: 'pepino', name: 'Pepino', icon: 'cucumber', aisle: 'hortifruti', unit: 'un', price: 1.8, per: 1, n: [30, 1.3, 7, 0.2] },
  { id: 'limao', name: 'Limão', icon: 'lime', aisle: 'hortifruti', unit: 'un', price: 0.6, per: 1, n: [10, 0.2, 3, 0] },
  { id: 'gengibre', name: 'Gengibre', icon: 'ginger-root', aisle: 'hortifruti', unit: 'g', price: 28, per: 1000, n: [80, 1.8, 18, 0.8] },
  { id: 'cheiro_verde', name: 'Cheiro-verde', icon: 'herb', aisle: 'hortifruti', unit: 'maco', price: 3, per: 1, n: [15, 1.5, 2.5, 0.3] },
  { id: 'coentro', name: 'Coentro', icon: 'herb', aisle: 'hortifruti', unit: 'maco', price: 3, per: 1, n: [12, 1.1, 2, 0.3] },
  { id: 'manjericao', name: 'Manjericão', icon: 'herb', aisle: 'hortifruti', unit: 'maco', price: 4, per: 1, n: [12, 1.6, 1.4, 0.3] },
  { id: 'cogumelo', name: 'Cogumelo paris', icon: 'mushroom', aisle: 'hortifruti', unit: 'g', price: 55, per: 1000, n: [22, 3.1, 3.3, 0.3] },
  { id: 'abacate', name: 'Abacate', icon: 'avocado', aisle: 'hortifruti', unit: 'un', price: 4.5, per: 1, n: [320, 4, 17, 29] },
  { id: 'pimenta_dedo', name: 'Pimenta dedo-de-moça', icon: 'hot-pepper', aisle: 'hortifruti', unit: 'un', price: 0.5, per: 1, n: [4, 0.2, 0.9, 0] },

  // Carnes, aves e peixes
  { id: 'peito_frango', name: 'Peito de frango', icon: 'poultry-leg', aisle: 'acougue', unit: 'g', price: 21.9, per: 1000, n: [120, 23, 0, 2.6], flags: ['carne'] },
  { id: 'carne_moida', name: 'Carne moída (patinho)', icon: 'cut-of-meat', aisle: 'acougue', unit: 'g', price: 42.9, per: 1000, n: [150, 21, 0, 7], flags: ['carne'] },
  { id: 'acem', name: 'Acém em cubos', icon: 'cut-of-meat', aisle: 'acougue', unit: 'g', price: 36.9, per: 1000, n: [180, 20, 0, 11], flags: ['carne'] },
  { id: 'alcatra', name: 'Alcatra', icon: 'cut-of-meat', aisle: 'acougue', unit: 'g', price: 54.9, per: 1000, n: [160, 21, 0, 8], flags: ['carne'] },
  { id: 'calabresa', name: 'Linguiça calabresa', icon: 'hot-dog', aisle: 'acougue', unit: 'g', price: 29.9, per: 1000, n: [300, 15, 2, 26], flags: ['carne'] },
  { id: 'bacon', name: 'Bacon em cubos', icon: 'bacon', aisle: 'acougue', unit: 'g', price: 49.9, per: 1000, n: [450, 14, 1, 43], flags: ['carne'] },
  { id: 'tilapia', name: 'Filé de tilápia', icon: 'fish', aisle: 'acougue', unit: 'g', price: 54.9, per: 1000, n: [96, 20, 0, 1.7], flags: ['peixe'] },
  { id: 'salmao', name: 'Salmão', icon: 'fish', aisle: 'acougue', unit: 'g', price: 89.9, per: 1000, n: [208, 20, 0, 13], flags: ['peixe'] },
  { id: 'camarao', name: 'Camarão limpo', icon: 'shrimp', aisle: 'acougue', unit: 'g', price: 79.9, per: 1000, n: [85, 20, 0, 0.5], flags: ['peixe'] },

  // Frios, laticínios e ovos
  { id: 'ovo', name: 'Ovos', icon: 'egg', aisle: 'frios', unit: 'un', price: 0.75, per: 1, n: [72, 6.3, 0.4, 4.8] },
  { id: 'mucarela', name: 'Muçarela', icon: 'cheese-wedge', aisle: 'frios', unit: 'g', price: 49.9, per: 1000, n: [300, 22, 3, 23], flags: ['lactose'] },
  { id: 'queijo_coalho', name: 'Queijo coalho', icon: 'cheese-wedge', aisle: 'frios', unit: 'g', price: 59.9, per: 1000, n: [330, 26, 3, 24], flags: ['lactose'] },
  { id: 'parmesao', name: 'Parmesão ralado', icon: 'cheese-wedge', aisle: 'frios', unit: 'g', price: 99.9, per: 1000, n: [430, 36, 3, 29], flags: ['lactose'] },
  { id: 'requeijao', name: 'Requeijão', icon: 'jar', aisle: 'frios', unit: 'g', price: 40, per: 1000, n: [260, 9, 3, 24], flags: ['lactose'] },
  { id: 'creme_leite', name: 'Creme de leite', icon: 'glass-of-milk', aisle: 'frios', unit: 'g', price: 20, per: 1000, n: [200, 2.5, 4, 20], flags: ['lactose'] },
  { id: 'leite', name: 'Leite', icon: 'glass-of-milk', aisle: 'frios', unit: 'ml', price: 5.49, per: 1000, n: [60, 3.2, 4.7, 3.2], flags: ['lactose'] },
  { id: 'iogurte', name: 'Iogurte natural', icon: 'jar', aisle: 'frios', unit: 'g', price: 18, per: 1000, n: [60, 4, 5, 3], flags: ['lactose'] },
  { id: 'manteiga', name: 'Manteiga', icon: 'butter', aisle: 'frios', unit: 'g', price: 60, per: 1000, n: [720, 0.9, 0.1, 81], flags: ['lactose'] },

  // Padaria
  { id: 'tortilha', name: 'Tortilha (pão folha)', icon: 'flatbread', aisle: 'padaria', unit: 'un', price: 1.5, per: 1, n: [120, 3.5, 20, 3], flags: ['gluten'] },
  { id: 'pao_hamburguer', name: 'Pão de hambúrguer', icon: 'bread', aisle: 'padaria', unit: 'un', price: 1.5, per: 1, n: [160, 5.5, 29, 2.5], flags: ['gluten'] },

  // Mercearia
  { id: 'arroz', name: 'Arroz', icon: 'cooked-rice', aisle: 'mercearia', unit: 'g', price: 5.99, per: 1000, n: [360, 7, 79, 0.5] },
  { id: 'arroz_arboreo', name: 'Arroz arbóreo', icon: 'cooked-rice', aisle: 'mercearia', unit: 'g', price: 29.9, per: 1000, n: [350, 7, 78, 0.6] },
  { id: 'feijao_carioca', name: 'Feijão carioca', icon: 'beans', aisle: 'mercearia', unit: 'g', price: 7.99, per: 1000, n: [330, 20, 60, 1.3] },
  { id: 'feijao_preto', name: 'Feijão preto', icon: 'beans', aisle: 'mercearia', unit: 'g', price: 8.99, per: 1000, n: [325, 21, 58, 1.4] },
  { id: 'lentilha', name: 'Lentilha', icon: 'beans', aisle: 'mercearia', unit: 'g', price: 13.9, per: 1000, n: [352, 25, 60, 1] },
  { id: 'grao_bico', name: 'Grão-de-bico cozido', icon: 'beans', aisle: 'mercearia', unit: 'g', price: 22, per: 1000, n: [164, 9, 27, 2.6] },
  { id: 'espaguete', name: 'Espaguete', icon: 'spaghetti', aisle: 'mercearia', unit: 'g', price: 11.9, per: 1000, n: [360, 12, 74, 1.5], flags: ['gluten'] },
  { id: 'farinha_trigo', name: 'Farinha de trigo', icon: 'sheaf-of-rice', aisle: 'mercearia', unit: 'g', price: 5.99, per: 1000, n: [360, 10, 75, 1.4], flags: ['gluten'] },
  { id: 'farinha_mandioca', name: 'Farinha de mandioca', icon: 'sheaf-of-rice', aisle: 'mercearia', unit: 'g', price: 9.9, per: 1000, n: [365, 1.4, 89, 0.3] },
  { id: 'fermento', name: 'Fermento em pó', icon: 'jar', aisle: 'mercearia', unit: 'g', price: 60, per: 1000, n: [50, 0, 25, 0] },
  { id: 'molho_tomate', name: 'Molho de tomate', icon: 'canned-food', aisle: 'mercearia', unit: 'g', price: 10, per: 1000, n: [40, 1.4, 7, 0.8] },
  { id: 'extrato_tomate', name: 'Extrato de tomate', icon: 'canned-food', aisle: 'mercearia', unit: 'g', price: 22, per: 1000, n: [80, 4, 16, 0.4] },
  { id: 'milho', name: 'Milho em conserva', icon: 'ear-of-corn', aisle: 'mercearia', unit: 'lata', price: 4.5, per: 1, n: [120, 4, 25, 1.5] },
  { id: 'ervilha', name: 'Ervilha em conserva', icon: 'pea-pod', aisle: 'mercearia', unit: 'lata', price: 4.5, per: 1, n: [120, 8, 20, 0.5] },
  { id: 'atum', name: 'Atum em lata', icon: 'canned-food', aisle: 'mercearia', unit: 'lata', price: 8.9, per: 1, n: [200, 30, 0, 8], flags: ['peixe'] },
  { id: 'leite_coco', name: 'Leite de coco', icon: 'coconut', aisle: 'mercearia', unit: 'ml', price: 35, per: 1000, n: [170, 1.5, 3, 17] },
  { id: 'azeitona', name: 'Azeitona', icon: 'olive', aisle: 'mercearia', unit: 'g', price: 40, per: 1000, n: [140, 1, 4, 14] },
  { id: 'batata_palha', name: 'Batata palha', icon: 'french-fries', aisle: 'mercearia', unit: 'g', price: 50, per: 1000, n: [540, 6, 50, 35] },
  { id: 'mel', name: 'Mel', icon: 'honey-pot', aisle: 'mercearia', unit: 'g', price: 35, per: 1000, n: [300, 0.3, 82, 0] },
  { id: 'gergelim', name: 'Gergelim', icon: 'jar', aisle: 'mercearia', unit: 'g', price: 40, per: 1000, n: [580, 18, 23, 50] },
  { id: 'caldo_legumes', name: 'Caldo de legumes', icon: 'jar', aisle: 'mercearia', unit: 'un', price: 0.8, per: 1, n: [20, 1, 2, 1] },

  // Temperos e molhos
  { id: 'shoyu', name: 'Shoyu', icon: 'soy-bottle', aisle: 'temperos', unit: 'ml', price: 40, per: 1000, n: [60, 6, 6, 0], flags: ['gluten'] },
  { id: 'mostarda', name: 'Mostarda', icon: 'jar', aisle: 'temperos', unit: 'g', price: 30, per: 1000, n: [90, 5, 6, 5] },
  { id: 'dende', name: 'Azeite de dendê', icon: 'dende-bottle', aisle: 'temperos', unit: 'ml', price: 40, per: 1000, n: [880, 0, 0, 100] },
  { id: 'curry', name: 'Curry em pó', icon: 'salt', aisle: 'temperos', unit: 'g', price: 150, per: 1000, n: [325, 13, 56, 14] },
  { id: 'paprica', name: 'Páprica defumada', icon: 'salt', aisle: 'temperos', unit: 'g', price: 150, per: 1000, n: [280, 14, 54, 13] },
  { id: 'cominho', name: 'Cominho', icon: 'salt', aisle: 'temperos', unit: 'g', price: 150, per: 1000, n: [375, 18, 44, 22] },
  { id: 'oregano', name: 'Orégano', icon: 'herb', aisle: 'temperos', unit: 'g', price: 150, per: 1000, n: [265, 9, 69, 4] },
  { id: 'pimenta_calabresa', name: 'Pimenta calabresa', icon: 'hot-pepper', aisle: 'temperos', unit: 'g', price: 150, per: 1000, n: [318, 12, 57, 17] },

  // Básicos da despensa
  { id: 'sal', name: 'Sal', icon: 'salt', aisle: 'despensa', unit: 'g', price: 3, per: 1000, n: [0, 0, 0, 0], pantry: true },
  { id: 'pimenta_reino', name: 'Pimenta-do-reino', icon: 'salt', aisle: 'despensa', unit: 'g', price: 150, per: 1000, n: [250, 10, 64, 3], pantry: true },
  { id: 'azeite', name: 'Azeite de oliva', icon: 'olive', aisle: 'despensa', unit: 'ml', price: 70, per: 1000, n: [884, 0, 0, 100], pantry: true },
  { id: 'oleo', name: 'Óleo', icon: 'oil-bottle', aisle: 'despensa', unit: 'ml', price: 8, per: 1000, n: [884, 0, 0, 100], pantry: true },
];

const BY_ID = new Map(INGREDIENTS.map((i) => [i.id, i]));

export function getIngredient(id: string): Ingredient | undefined {
  return BY_ID.get(id);
}

export const AISLES: { id: Aisle; title: string }[] = [
  { id: 'hortifruti', title: 'Hortifrúti' },
  { id: 'acougue', title: 'Carnes, aves e peixes' },
  { id: 'frios', title: 'Frios, laticínios e ovos' },
  { id: 'padaria', title: 'Padaria' },
  { id: 'mercearia', title: 'Mercearia' },
  { id: 'temperos', title: 'Temperos e molhos' },
  { id: 'congelados', title: 'Congelados' },
  { id: 'outros', title: 'Outros' },
  { id: 'despensa', title: 'Básicos da despensa' },
];
