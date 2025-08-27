import type {Log} from './log.ts';

export interface PlayerResult {
    power: number;
    baseDamage: number;
    totalDamage: number;
}

export interface BattleResult {
    player1: PlayerResult;
    player2: PlayerResult;
    logs: Log[];
    startTime: number;
    endTime: number;
}