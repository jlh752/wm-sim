import type { IMultiBattleOrchestrator, } from './types/simulationOrchestrator';
import type {BattleConfig, IBattleRunner, BattleResult} from '../types/runner';
import BattleRunner from '../simulator';
import { MultiBattleResult } from './types/simulationOrchestrator';

export class MultiOrchestrator implements IMultiBattleOrchestrator {
    private runnerInstance?:IBattleRunner = undefined;
    private currentResult?: MultiBattleResult;
    constructor(private config: BattleConfig) {}

    setConfig(config: BattleConfig) {
        this.config = config;
        delete this.runnerInstance;
    }

    private GetRunner(): IBattleRunner {
        if (!this.runnerInstance) {
            this.runnerInstance = new BattleRunner();
        }
        return this.runnerInstance;
    }

    run(repetitions: number) {
        const runner = this.GetRunner();
        this.currentResult = new MultiBattleResult();
        const aggregateResults = (result: BattleResult) => {

        };

        for (let i = 0; i < repetitions; i++) {
            const battleResult = runner.run(this.config);
            aggregateResults(battleResult);
        }
        return this.currentResult;
    }
}