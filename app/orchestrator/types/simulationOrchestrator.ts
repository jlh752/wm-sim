import type {BattleConfig} from '../../types/config';

export class IMultiBattleResult {

}

export interface IMultiBattleOrchestrator{
    run(repetitions: number): IMultiBattleResult;
}

export class MultiBattleResult implements IMultiBattleResult {

}
