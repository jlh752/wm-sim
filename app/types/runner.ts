import { ISkillHandler } from '../skillhandler/skillHandler';
import { BattleConfig } from './config';
import { BattleResult } from './result';
import { BattleState } from './battleState';

/**
 * Interface for running a battle simulation.
 *
 * @interface IBattleRunner
 * 
 * @property {BattleConfig} [config] - The configuration used for the battle.
 * @property {BattleResult} [result] - The result of the battle after execution.
 * @property {BattleState} [state] - The current state of the battle.
 *
 * @method registerSkillHandlers
 * Registers an array of skill handlers to be used during the battle.
 * If not set, the defaults are auotmatically registered.
 * @param {ISkillHandler[]} skillHandlers - The skill handlers to register.
 * @returns {void}
 *
 * @method run
 * Executes the battle simulation with the provided configuration.
 * @param {BattleConfig} config - The configuration for the battle.
 * @returns {BattleResult} The result of the battle simulation.
 */
export interface IBattleRunner {
    config?:BattleConfig;
    result?:BattleResult;
    state?:BattleState;
    registerSkillHandlers(skillHandlers:ISkillHandler[]):void;
    run(config: BattleConfig): BattleResult;
}