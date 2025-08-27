import { ISkillHandler } from '../skillhandler/skillHandler';
import { BattleConfig } from './config';
import { BattleResult } from './result';
import { BattleState } from './battleState';

export interface IBattleRunner {
    config?:BattleConfig;
    result?:BattleResult;
    state?:BattleState;
    registerSkillHandlers(skillHandlers:ISkillHandler[]):void;
    run(config: BattleConfig): BattleResult;
}