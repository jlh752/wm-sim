import type {Log} from './log.ts';
import PlayerIndex from './util/playerIndex.js';

export interface PlayerResult {
    power: number;
    baseDamage: number;
    totalDamage: number;
}

export interface BattleResult {
    player1: PlayerResult;
    player2: PlayerResult;
    logs: Log[];
    winner: PlayerIndex | null;
}