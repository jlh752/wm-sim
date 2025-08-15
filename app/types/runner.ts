export const BattlePhase = {
    NONE: -1,
    PRE: 0,
    JAM: 1,
    CONTROL: 2,
    SPECIAL: 3,
    MAIN: 4,
    POST: 5
} as const;
export type BattlePhase = typeof BattlePhase[keyof typeof BattlePhase];
export const PHASE_ORDER: BattlePhase[] = [
  BattlePhase.PRE,
  BattlePhase.JAM,
  BattlePhase.CONTROL,
  BattlePhase.SPECIAL,
  BattlePhase.MAIN,
  BattlePhase.POST,
];

export interface BattleState {
    //data
    //prepared: boolean;
    
}

export interface PlayerBattleState {
    battlePower: number;
    totalDamage: number;
    totalHeal: number;
    reinforcementCount: number;
    jamCount: number;
    controlledCount: number;
    logs: ActionLog[];

    forceDamage?: number;
}

export interface ActionLog {
    id: number;
    type: BattlePhase;
    damage?: number;
    heal?: number;
} */