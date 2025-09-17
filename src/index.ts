import BattleRunner from './simulator';
export * from './orchestrator/multiOrchestrator';
export * from './reporter/reporter';
export * from './util/util';
export * from './types/util/battlePhase';

export type * from './types/config';
export type * from './types/datafile';
export type * from './types/log';
export type * from './types/player';
export type * from './types/result';
export type * from './types/runner';
export type * from './types/util/targetSpecification';
export type * from './types/util/playerIndex';
export type * from './types/util/battlePhase';

//todo have each directory export it's own to reduce the need to have them all here
//todo more fine grained exports

export {BattleRunner};