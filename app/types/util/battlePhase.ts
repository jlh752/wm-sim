export const BattlePhase = {
    NONE: -1,
    PRE: 0,
    JAM: 1,
    CONTROL: 2,
    SPECIAL: 3,
    MAIN: 4
} as const;
export type BattlePhase = typeof BattlePhase[keyof typeof BattlePhase];
export const PHASE_ORDER: BattlePhase[] = [
  BattlePhase.PRE,
  BattlePhase.JAM,
  BattlePhase.CONTROL,
  BattlePhase.SPECIAL,
  BattlePhase.MAIN
];