import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import BattleRunner from '../app/simulator';
import type { BattleConfig } from '../app/types/config';
import { DEFAULT_POWER, MAGIC_LEVEL } from '../app/util/magicNumbers';
import { TestBattleBuilder } from './builder';
import T from './constants';

describe('Simulation Functions', function(){
    beforeEach(() => vi.restoreAllMocks());
    afterEach(() => vi.restoreAllMocks());

    describe('initialisation', function(){
        it('defaults are assigned', function(){
			const runner = new BattleRunner();
            const result = runner.run({} as BattleConfig);
			expect(runner.state!.player1.force.length).toEqual(0);
			expect(runner.state!.player2.force.length).toEqual(0);
			expect(runner.state!.player1.baseAttack).toEqual(DEFAULT_POWER);
			expect(runner.state!.player2.baseDefense).toEqual(DEFAULT_POWER);
			expect(Object.keys(runner.state?.player2.reinforcementConstraints!).length).toEqual(0);
		});
        it('epic max base damage is 30', function(){
			const runner = new BattleRunner();
            const cfg = { player2: {level: 1}, epicMode: true};
            const result = runner.run(cfg as BattleConfig);
            expect(runner.state!.maxBase).toEqual(30);
		});
        it('max base can be zerod by magic level', function(){
			const runner = new BattleRunner();
            const cfg = { player2: {level: MAGIC_LEVEL}};
            const result = runner.run(cfg as BattleConfig);
            expect(runner.state!.maxBase).toEqual(0);
		});
        it('units add to force', function(){
			const runner = new BattleRunner();
            const cfg = new TestBattleBuilder()
                .addReinforcementSkill(T.REINFORCE_SKILL,1,{target_type: T.TYPE})
                .addUnit(T.BASIC_UNIT, u => u.withType(T.TYPE))
                .addUnit(T.REINFORCER_UNIT, u => u.withSkill(T.REINFORCE_SKILL))
                .withPlayer(0, [T.REINFORCER_UNIT], [T.BASIC_UNIT])
                .buildConfig();
            const result = runner.run(cfg as BattleConfig);
            expect(runner.state!.player1.force.length).toEqual(2);
		});
    });
});