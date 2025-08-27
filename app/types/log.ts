import type {PlayerIndex, TargetSpecification} from '../types/runner';

export const LogTypes = {
    DAMAGE: 'D',
    HEAL: 'H',
    JAM: 'J',
    CONTROL: 'C',
    PREVENT_JAM: 'PJ',
    PREVENT_CONTROL: 'PC',
    PREVENT_REINFORCEMENT: 'PR',
    PREVENT_HEAL: 'PH',
    ATTACK_POWER: 'AP',
    DEFENSE_POWER: 'DP',
    DAMAGE_BOOST: 'DB',
    REINFORCE: 'R',
    SUMMON: 'S',
    RALLY: 'RA',
    REDUCE: 'RE',
    ANTISHIELD: 'AS',
    UNBOOST_ATTACK: 'UA',
    UNBOOST_DEFENSE: 'UD',
} as const;
export type LogType = typeof LogTypes[keyof typeof LogTypes];

export interface GenericLog {
    type: LogType;
    player_id: PlayerIndex;
    unit_id: number;
    is_reinforced?: boolean;
    skill_id: number;
}
interface ValueLog extends GenericLog {
    amount: number;
}

export interface DamageLog extends GenericLog {
    type: typeof LogTypes.DAMAGE;
    amount: number;
    reduced?: number;
    rally?: number;
    flurry?: number;
}
export interface HealLog extends GenericLog {
    type: typeof LogTypes.HEAL;
    amount: number;
    prevented?: number;
    flurry?: number;
}
export interface JamLog extends GenericLog {
    type: typeof LogTypes.JAM;
    target_unit_id: number;
    success: boolean;
}
export interface ControlLog extends GenericLog {
    type: typeof LogTypes.CONTROL;
    target_unit_id: number;
    success: boolean;
}
export interface PreventJamLog extends ValueLog{ type: typeof LogTypes.PREVENT_JAM; };
export interface PreventControlLog extends ValueLog{ type: typeof LogTypes.PREVENT_CONTROL; }
export interface PreventReinforcementLog extends ValueLog{ type: typeof LogTypes.PREVENT_REINFORCEMENT;}
export interface PreventHealingLog extends ValueLog{ type: typeof LogTypes.PREVENT_HEAL; }

export interface AttackBoostLog extends ValueLog{ type: typeof LogTypes.ATTACK_POWER; }
export interface DefenseBoostLog extends ValueLog{ type: typeof LogTypes.DEFENSE_POWER; }
export interface DamageBoostLog extends TargetSpecification,ValueLog{ type: typeof LogTypes.DAMAGE_BOOST;}

export interface ReinforceLog extends GenericLog {
    type: typeof LogTypes.REINFORCE;
    instances: {success: boolean, amount: number, target_unit_id: number}[];
}
export interface SummonLog extends GenericLog {
    type: typeof LogTypes.SUMMON;
    amount: number;
    target_unit_id: number;
}

export interface RallyLog extends TargetSpecification,ValueLog{ type: typeof LogTypes.RALLY; }
export interface ReduceLog extends ValueLog{ type: typeof LogTypes.REDUCE; }
export interface AntishieldLog extends ValueLog{ type: typeof LogTypes.ANTISHIELD; }
export interface UnboostAttackLog extends ValueLog{ type: typeof LogTypes.UNBOOST_ATTACK; }
export interface UnboostDefenseLog extends ValueLog{ type: typeof LogTypes.UNBOOST_DEFENSE; }

export type Log =
    | DamageLog
    | HealLog| JamLog
    | ControlLog
    | PreventJamLog
    | PreventControlLog
    | PreventReinforcementLog
    | PreventHealingLog
    | AttackBoostLog
    | DefenseBoostLog
    | DamageBoostLog
    | ReinforceLog
    | SummonLog
    | RallyLog
    | ReduceLog
    | AntishieldLog
    | UnboostAttackLog
    | UnboostDefenseLog;