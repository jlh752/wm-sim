import type {DataFile} from './datafile';

export type Force = {
    version?: number,
    units: number[],
    reinforcements: number[]
};

export type ReinforcementConstraint = {
    unit: number,
    count: number
};

export interface PlayerConfig {
    force: Force | string;
    power: number;
    level?: number;
    reinforcementConstraints?: ReinforcementConstraint[] | string;
};

export interface BattleConfig {
    player1: PlayerConfig;
    player2: PlayerConfig;
    epicMode: boolean;
    data: DataFile;
};