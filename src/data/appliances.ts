import type { ApplianceId, ApplianceNeed } from './types';

export const APPLIANCES: { id: ApplianceId; name: string; short: string }[] = [
  { id: 'fogao', name: 'Fogão (bocas)', short: 'Fogão' },
  { id: 'forno', name: 'Forno', short: 'Forno' },
  { id: 'microondas', name: 'Micro-ondas', short: 'Micro-ondas' },
  { id: 'airfryer', name: 'Air fryer', short: 'Air fryer' },
  { id: 'pressao', name: 'Panela de pressão', short: 'Pressão' },
  { id: 'liquidificador', name: 'Liquidificador', short: 'Liquidificador' },
  { id: 'grill', name: 'Grill / sanduicheira', short: 'Grill' },
];

export function applianceName(id: ApplianceId): string {
  return APPLIANCES.find((a) => a.id === id)?.name ?? id;
}

export function hasAppliances(needs: ApplianceNeed[], owned: ApplianceId[]): boolean {
  return needs.every((need) => (Array.isArray(need) ? need.some((id) => owned.includes(id)) : owned.includes(need)));
}

/** The appliances a recipe will actually use with the user's kitchen. */
export function appliancesUsed(needs: ApplianceNeed[], owned: ApplianceId[]): ApplianceId[] {
  const used: ApplianceId[] = [];
  for (const need of needs) {
    if (Array.isArray(need)) {
      const pick = need.find((id) => owned.includes(id)) ?? need[0];
      if (!used.includes(pick)) used.push(pick);
    } else if (!used.includes(need)) {
      used.push(need);
    }
  }
  return used;
}
