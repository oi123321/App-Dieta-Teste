import { Blend, CookingPot, Fan, Flame, Heater, Microwave, Sandwich, type LucideIcon } from './icons';

import type { ApplianceId } from '../data/types';

export const APPLIANCE_ICONS: Record<ApplianceId, LucideIcon> = {
  fogao: Flame,
  forno: Heater,
  microondas: Microwave,
  airfryer: Fan,
  pressao: CookingPot,
  liquidificador: Blend,
  grill: Sandwich,
};
