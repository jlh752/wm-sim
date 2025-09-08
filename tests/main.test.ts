import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import BattleRunner from '../app/simulator';
import type { BattleConfig } from '../app/types/config';
import { DEFAULT_POWER, MAGIC_LEVEL, UNIT_MULTIPLIER } from '../app/util/magicNumbers';
import { TestBattleBuilder } from './builder';
import T from './constants';
import { RoundHalfOdd } from '../app/util/util';
import { ISkillHandler } from '../app/skillhandler/skillHandler';
import { BattlePhase } from '../app/types/util/battlePhase';

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
        it('units added to force', function(){
			const runner = new BattleRunner();
            const cfg = new TestBattleBuilder()
                .addUnit(T.BASIC_UNIT, u => u.withType(T.TYPE))
                .withPlayer(0, [T.BASIC_UNIT, T.BASIC_UNIT])
                .buildConfig();
            const result = runner.run(cfg);
            expect(runner.state!.player1.force.length).toEqual(2);
		});
        it('units added to reinforcements', function(){
			const runner = new BattleRunner();
            const cfg = new TestBattleBuilder()
                .addUnit(T.BASIC_UNIT, u => u.withType(T.TYPE))
                .withPlayer(0, [], [T.BASIC_UNIT])
                .buildConfig();
            const result = runner.run(cfg);
            expect(runner.state!.player1.reinforcements.length).toEqual(1);
		});
        it('invalid units not added', function(){
			const runner = new BattleRunner();
            const cfg = new TestBattleBuilder()
                .withPlayer(0, [99999])
                .buildConfig();
            const result = runner.run(cfg);
            expect(runner.state!.player1.force.length).toEqual(0);
		});
        it('units contribute to base stat', function(){
			const runner = new BattleRunner();
            const unitAttack = 1;
            const cfg = new TestBattleBuilder()
                .addUnit(T.BASIC_UNIT, u => u.withAttack(unitAttack))
                .withPlayer(0, [T.BASIC_UNIT], [], DEFAULT_POWER)
                .buildConfig();
            const result = runner.run(cfg);
            expect(runner.state!.player1.baseAttack).toEqual(DEFAULT_POWER + unitAttack*UNIT_MULTIPLIER);
		});
    });

    describe('result', function(){
        it('result damage is made up of player damage - enemy heal', function(){
			const runner = new BattleRunner();
            const heal = 2, dmg = 10;
            const cfg = new TestBattleBuilder()
                .addHealSkill(T.HEAL_SKILL,heal)
                .addDamageSkill(T.DAMAGE_SKILL,dmg)
                .addUnit(T.HEAL_UNIT, u => u.withSkill(T.HEAL_SKILL))
                .addUnit(T.DAMAGE_UNIT, u => u.withSkill(T.DAMAGE_SKILL))
                .withPlayer(0, [T.HEAL_UNIT])
                .withPlayer(1, [T.DAMAGE_UNIT])
                .buildConfig();

            vi.spyOn(Math, 'random').mockReturnValue(0.5);
            const result = runner.run(cfg);
            expect(runner.state!.player1.totalHeal).toEqual(heal);
            expect(runner.state!.player2.totalDamage).toEqual(dmg);
            expect(result.player2.totalDamage).toEqual(dmg - heal);
		});
    });
});

describe('Skill tests', function(){
    beforeEach(() => vi.restoreAllMocks());
    afterEach(() => vi.restoreAllMocks());

    describe('combo abilities', function(){
        it('skill that heals and damages', function(){
			const runner = new BattleRunner();
            const heal = 2, dmg = 10;
            const cfg = new TestBattleBuilder()
                .addHealSkill(T.HEAL_SKILL,heal,1, sk => {sk.damage = dmg; return sk;})
                .addUnit(T.HEAL_UNIT, u => u.withSkill(T.HEAL_SKILL))
                .withPlayer(0, [T.HEAL_UNIT])
                .buildConfig();

            vi.spyOn(Math, 'random').mockReturnValue(0.5);
            runner.run(cfg);
            expect(runner.state!.player1.totalHeal).toEqual(heal);
            expect(runner.state!.player1.totalDamage).toEqual(dmg);
		});

        it('multiple skills on 1 unit', function(){
			const runner = new BattleRunner();
            const heal = 2, dmg = 10;
            const cfg = new TestBattleBuilder()
                .addHealSkill(T.HEAL_SKILL,heal)
                .addDamageSkill(T.DAMAGE_SKILL,dmg)
                .addUnit(T.BASIC_UNIT, u => u.withSkill(T.HEAL_SKILL).withSkill(T.DAMAGE_SKILL))
                .withPlayer(0, [T.BASIC_UNIT])
                .buildConfig();

            vi.spyOn(Math, 'random').mockReturnValue(0.5);
            runner.run(cfg);
            expect(runner.state!.player1.totalHeal).toEqual(heal);
            expect(runner.state!.player1.totalDamage).toEqual(dmg);
		});
    });

    describe('damage', function(){
        it('damage within expected bounds', function(){
			const runner = new BattleRunner();
            const dmg = 2;
            const cfg = new TestBattleBuilder()
                .addDamageSkill(T.DAMAGE_SKILL,dmg)
                .addUnit(T.DAMAGE_UNIT, u => u.withSkill(T.DAMAGE_SKILL))
                .withPlayer(0, [T.DAMAGE_UNIT])
                .buildConfig();

            vi.spyOn(Math, 'random').mockReturnValue(0);
            runner.run(cfg);
            expect(runner.state!.player1.totalDamage).toEqual(dmg*0.5);

            vi.spyOn(Math, 'random').mockReturnValue(1);
            const result = runner.run(cfg);
            expect(runner.state!.player1.totalDamage).toEqual(dmg*1.5);
            
            vi.spyOn(Math, 'random').mockReturnValue(0.5);
            runner.run(cfg);
            expect(runner.state!.player1.totalDamage).toEqual(dmg);
		});

        it('flurry within expected bounds', function(){
			const runner = new BattleRunner();
            const dmg = 2, flurry = 3;
            const cfg = new TestBattleBuilder()
                .addDamageSkill(T.DAMAGE_SKILL,dmg,flurry)
                .addUnit(T.DAMAGE_UNIT, u => u.withSkill(T.DAMAGE_SKILL))
                .withPlayer(0, [T.DAMAGE_UNIT])
                .buildConfig();
                
            vi.spyOn(Math, 'random').mockReturnValue(0);
            runner.run(cfg);
            expect(runner.state!.player1.totalDamage).toEqual(flurry * dmg*0.5);

            vi.spyOn(Math, 'random').mockReturnValue(1);
            const result = runner.run(cfg);
            expect(runner.state!.player1.totalDamage).toEqual(flurry * dmg*1.5);
            
            vi.spyOn(Math, 'random').mockReturnValue(0.5);
            runner.run(cfg);
            expect(runner.state!.player1.totalDamage).toEqual(flurry * dmg);
		});

        it('negative damage counts as heal', function(){
			const runner = new BattleRunner();
            const dmg = -2;
            const cfg = new TestBattleBuilder()
                .addDamageSkill(T.DAMAGE_SKILL,dmg)
                .addUnit(T.DAMAGE_UNIT, u => u.withSkill(T.DAMAGE_SKILL))
                .withPlayer(0, [T.DAMAGE_UNIT])
                .buildConfig();

            runner.run(cfg);
            expect(runner.state!.player1.totalDamage).toBeLessThan(0);
		});
        
        it.each([true,false])(
            'epic damage working correctly when epic mode %o',
            (mode) => {
                const runner = new BattleRunner();
                const dmg = 2;
                const cfg = new TestBattleBuilder()
                    .addEpicDamageSkill(T.EPIC_DAMAGE_SKILL,dmg)
                    .addUnit(T.DAMAGE_UNIT, u => u.withSkill(T.EPIC_DAMAGE_SKILL))
                    .withPlayer(0, [T.DAMAGE_UNIT])
                    .isEpic(mode)
                    .buildConfig();

                vi.spyOn(Math, 'random').mockReturnValue(0.5);
                runner.run(cfg);
                expect(runner.state!.player1.totalDamage).toEqual(mode ? dmg : 0);
            }
        );
    });

    describe('heal', function(){
        it('heal', function(){
			const runner = new BattleRunner();
            const heal = 20;
            const cfg = new TestBattleBuilder()
                .addHealSkill(T.HEAL_SKILL,heal)
                .addUnit(T.HEAL_UNIT, u => u.withSkill(T.HEAL_SKILL))
                .withPlayer(0, [T.HEAL_UNIT])
                .buildConfig();
            runner.run(cfg);
            expect(runner.state!.player1.totalHeal).toEqual(heal);
		});
        it('negative heal conts as self damage', function(){
			const runner = new BattleRunner();
            const heal = -20;
            const cfg = new TestBattleBuilder()
                .addHealSkill(T.HEAL_SKILL,heal)
                .addUnit(T.HEAL_UNIT, u => u.withSkill(T.HEAL_SKILL))
                .withPlayer(0, [T.HEAL_UNIT])
                .buildConfig();
            const result = runner.run(cfg);
            expect(runner.state!.player1.totalHeal).toEqual(heal);
            expect(result.player2.totalDamage).toEqual(-heal);
		});
        it.each([true,false])(
            'epic heal working correctly when epic mode %o',
            (mode) => {
                const runner = new BattleRunner();
                const heal = 2;
                const cfg = new TestBattleBuilder()
                    .addEpicHealSkill(T.EPIC_HEAL_SKILL,heal)
                    .addUnit(T.HEAL_UNIT, u => u.withSkill(T.EPIC_HEAL_SKILL))
                    .withPlayer(0, [T.HEAL_UNIT])
                    .isEpic(mode)
                    .buildConfig();

                runner.run(cfg);
                expect(runner.state!.player1.totalHeal).toEqual(mode ? heal : 0);
            }
        );
    });

    describe('prevent heal', function(){
        it('prevent heal reduces heal', function(){
			const runner = new BattleRunner();
            const heal = 20, preventheal = 10;
            const cfg = new TestBattleBuilder()
                .addPreventHealSkill(T.PREVENT_HEAL_SKILL,preventheal)
                .addHealSkill(T.HEAL_SKILL,heal)
                .addUnit(T.HEAL_UNIT, u => u.withSkill(T.HEAL_SKILL))
                .addUnit(T.PREVENT_HEAL_UNIT, u => u.withSkill(T.PREVENT_HEAL_SKILL))
                .withPlayer(0, [T.HEAL_UNIT])
                .withPlayer(1, [T.PREVENT_HEAL_UNIT])
                .buildConfig();
            const result = runner.run(cfg);
            expect(runner.state!.player1.totalHeal).toEqual(heal - preventheal);
		});
        it.each([true,false])(
            'epic prevent heal working correctly when epic mode %o',
            (mode) => {
                const runner = new BattleRunner();
                const heal = 20, preventheal = 10;
                const cfg = new TestBattleBuilder()
                    .addEpicPreventHealSkill(T.EPIC_PREVENT_HEAL_SKILL,preventheal)
                    .addHealSkill(T.HEAL_SKILL,heal)
                    .addUnit(T.HEAL_UNIT, u => u.withSkill(T.HEAL_SKILL))
                    .addUnit(T.PREVENT_HEAL_UNIT, u => u.withSkill(T.EPIC_PREVENT_HEAL_SKILL))
                    .withPlayer(0, [T.HEAL_UNIT])
                    .withPlayer(1, [T.PREVENT_HEAL_UNIT])
                    .isEpic(mode)
                    .buildConfig();
                runner.run(cfg);
                expect(runner.state!.player1.totalHeal).toEqual(heal - (mode ? preventheal : 0));
            }
        );
    });

    describe('jam', function(){
        it('jam single unit on type', function(){
			const runner = new BattleRunner();
            const cfg = new TestBattleBuilder()
                .addJamSkill(T.JAM_SKILL,1,{target_type: T.TYPE})
                .addUnit(T.BASIC_UNIT)
                .addUnit(T.JAM_UNIT, u => u.withSkill(T.JAM_SKILL))
                .withPlayer(0, [T.JAM_UNIT])
                .withPlayer(1, [T.BASIC_UNIT])
                .buildConfig();
            const result = runner.run(cfg);
            expect(runner.state!.player1.force.length).toEqual(1);
            expect(runner.state!.player2.force.length).toEqual(0);
            expect(runner.state!.player2.jammed).toEqual(1);
		});
        it('jam single unit on subtype', function(){
			const runner = new BattleRunner();
            const cfg = new TestBattleBuilder()
                .addJamSkill(T.JAM_SKILL,1,{target_subtype: T.SUBTYPE})
                .addUnit(T.BASIC_UNIT, u => u.withSubType(T.SUBTYPE))
                .addUnit(T.JAM_UNIT, u => u.withSkill(T.JAM_SKILL))
                .withPlayer(0, [T.JAM_UNIT])
                .withPlayer(1, [T.BASIC_UNIT])
                .buildConfig();
            const result = runner.run(cfg);
            expect(runner.state!.player1.force.length).toEqual(1);
            expect(runner.state!.player2.force.length).toEqual(0);
            expect(runner.state!.player2.jammed).toEqual(1);
		});
        it('jam single unit on subtype2', function(){
			const runner = new BattleRunner();
            const cfg = new TestBattleBuilder()
                .addJamSkill(T.JAM_SKILL,1,{target_subtype: T.SUBTYPE})
                .addUnit(T.BASIC_UNIT, u => u.withSubType2(T.SUBTYPE))
                .addUnit(T.JAM_UNIT, u => u.withSkill(T.JAM_SKILL))
                .withPlayer(0, [T.JAM_UNIT])
                .withPlayer(1, [T.BASIC_UNIT])
                .buildConfig();
            const result = runner.run(cfg);
            expect(runner.state!.player1.force.length).toEqual(1);
            expect(runner.state!.player2.force.length).toEqual(0);
            expect(runner.state!.player2.jammed).toEqual(1);
		});
        it('multi jam units', function(){
			const runner = new BattleRunner();
            const cfg = new TestBattleBuilder()
                .addJamSkill(T.JAM_SKILL,3,{target_type: T.TYPE})
                .addUnit(T.BASIC_UNIT)
                .addUnit(T.JAM_UNIT, u => u.withSkill(T.JAM_SKILL))
                .withPlayer(0, [T.JAM_UNIT])
                .withPlayer(1, [T.BASIC_UNIT,T.BASIC_UNIT,T.BASIC_UNIT,T.BASIC_UNIT])
                .buildConfig();
            const result = runner.run(cfg);
            expect(runner.state!.player2.force.length).toEqual(1);
            expect(runner.state!.player2.jammed).toEqual(3);
		});
        it('no jam target', function(){
			const runner = new BattleRunner();
            const cfg = new TestBattleBuilder()
                .addType(T.TYPE2,"Type 2")
                .addJamSkill(T.JAM_SKILL,1,{target_type: T.TYPE})
                .addUnit(T.BASIC_UNIT, u => u.withType(T.TYPE2))
                .addUnit(T.JAM_UNIT, u => u.withSkill(T.JAM_SKILL))
                .withPlayer(0, [T.JAM_UNIT])
                .withPlayer(1, [T.BASIC_UNIT])
                .buildConfig();
            const result = runner.run(cfg);
            expect(runner.state!.player1.force.length).toEqual(1);
            expect(runner.state!.player2.force.length).toEqual(1);
            expect(runner.state!.player2.jammed).toEqual(0);
		});
        it('jam in order', function(){
			const runner = new BattleRunner();
            const cfg = new TestBattleBuilder()
                .addType(T.TYPE2,"Type 2")
                .addJamSkill(T.JAM_SKILL,1,{target_type: T.TYPE})
                .addUnit(T.BASIC_UNIT)
                .addUnit(T.BASIC_UNIT2)
                .addUnit(T.JAM_UNIT, u => u.withSkill(T.JAM_SKILL))
                .withPlayer(0, [T.JAM_UNIT])
                .withPlayer(1, [T.BASIC_UNIT,T.BASIC_UNIT2])
                .buildConfig();
            const result = runner.run(cfg);
            expect(runner.state!.player2.force.length).toEqual(1);
            expect(runner.state!.player2.force[0].unitId).toEqual(T.BASIC_UNIT2);
            expect(runner.state!.player2.jammed).toEqual(1);
		});
        it('go past invalid target for jam', function(){
			const runner = new BattleRunner();
            const cfg = new TestBattleBuilder()
                .addType(T.TYPE2,"Type 2")
                .addJamSkill(T.JAM_SKILL,1,{target_type: T.TYPE2})
                .addUnit(T.BASIC_UNIT)
                .addUnit(T.BASIC_UNIT2,u => u.withType(T.TYPE2))
                .addUnit(T.JAM_UNIT, u => u.withSkill(T.JAM_SKILL))
                .withPlayer(0, [T.JAM_UNIT])
                .withPlayer(1, [T.BASIC_UNIT,T.BASIC_UNIT2])
                .buildConfig();
            const result = runner.run(cfg);
            expect(runner.state!.player2.force.length).toEqual(1);
            expect(runner.state!.player2.force[0].unitId).toEqual(T.BASIC_UNIT);
            expect(runner.state!.player2.jammed).toEqual(1);
		});
        it('unjammable', function(){
			const runner = new BattleRunner();
            const cfg = new TestBattleBuilder()
                .addJamSkill(T.JAM_SKILL,1,{target_type: T.TYPE})
                .addUnit(T.BASIC_UNIT, u => u.isUnjammable())
                .addUnit(T.BASIC_UNIT2)
                .addUnit(T.JAM_UNIT, u => u.withSkill(T.JAM_SKILL))
                .withPlayer(0, [T.JAM_UNIT])
                .withPlayer(1, [T.BASIC_UNIT,T.BASIC_UNIT2])
                .buildConfig();
            const result = runner.run(cfg);
            expect(runner.state!.player2.force.length).toEqual(1);
            expect(runner.state!.player2.force[0].unitId).toEqual(T.BASIC_UNIT);
            expect(runner.state!.player2.jammed).toEqual(1);
		});
    });

    describe('preventjam', function(){
        it('prevent jam unit', function(){
			const runner = new BattleRunner();
            const cfg = new TestBattleBuilder()
                .addPreventJamSkill(T.PREVENT_JAM_SKILL,1)
                .addJamSkill(T.JAM_SKILL,1,{target_type: T.TYPE})
                .addUnit(T.BASIC_UNIT)
                .addUnit(T.JAM_UNIT, u => u.withSkill(T.JAM_SKILL))
                .addUnit(T.PREVENT_JAM_UNIT, u => u.withSkill(T.PREVENT_JAM_SKILL))
                .withPlayer(0, [T.JAM_UNIT])
                .withPlayer(1, [T.BASIC_UNIT, T.PREVENT_JAM_UNIT])
                .buildConfig();
            const result = runner.run(cfg);
            expect(runner.state!.player1.force.length).toEqual(1);
            expect(runner.state!.player2.force.length).toEqual(2);
            expect(runner.state!.player2.jammed).toEqual(0);
		});
        it('partially block jams', function(){
			const runner = new BattleRunner();
            const cfg = new TestBattleBuilder()
                .addPreventJamSkill(T.PREVENT_JAM_SKILL,1)
                .addJamSkill(T.JAM_SKILL,2,{target_type: T.TYPE})
                .addUnit(T.BASIC_UNIT)
                .addUnit(T.JAM_UNIT, u => u.withSkill(T.JAM_SKILL))
                .addUnit(T.PREVENT_JAM_UNIT, u => u.withSkill(T.PREVENT_JAM_SKILL))
                .withPlayer(0, [T.JAM_UNIT])
                .withPlayer(1, [T.BASIC_UNIT, T.BASIC_UNIT, T.PREVENT_JAM_UNIT])
                .buildConfig();
            const result = runner.run(cfg);
            expect(runner.state!.player2.force.length).toEqual(2);
            expect(runner.state!.player2.jammed).toEqual(1);
		});
        
        it('stacking block jams', function(){
			const runner = new BattleRunner();
            const cfg = new TestBattleBuilder()
                .addPreventJamSkill(T.PREVENT_JAM_SKILL,1)
                .addJamSkill(T.JAM_SKILL,1,{target_type: T.TYPE})
                .addUnit(T.BASIC_UNIT)
                .addUnit(T.JAM_UNIT, u => u.withSkill(T.JAM_SKILL))
                .addUnit(T.PREVENT_JAM_UNIT, u => u.withSkill(T.PREVENT_JAM_SKILL))
                .withPlayer(0, [T.JAM_UNIT, T.JAM_UNIT])
                .withPlayer(1, [T.BASIC_UNIT, T.PREVENT_JAM_UNIT, T.PREVENT_JAM_UNIT])
                .buildConfig();
            const result = runner.run(cfg);
            expect(runner.state!.player2.force.length).toEqual(3);
            expect(runner.state!.player2.jammed).toEqual(0);
		});
    });

    describe('reinforce', function(){
        it('reinforce a unit', function(){
			const runner = new BattleRunner();
            const cfg = new TestBattleBuilder()
                .addReinforcementSkill(T.REINFORCE_SKILL,1,{target_type: T.TYPE})
                .addUnit(T.BASIC_UNIT, u => u.withType(T.TYPE))
                .addUnit(T.REINFORCER_UNIT, u => u.withSkill(T.REINFORCE_SKILL))
                .withPlayer(0, [T.REINFORCER_UNIT], [T.BASIC_UNIT])
                .buildConfig();
            const result = runner.run(cfg);
            expect(runner.state!.player1.force.length).toEqual(2);
            expect(runner.state!.player1.force[1].unitId).toEqual(T.BASIC_UNIT);
		});
        it('reinforce multiple units', function(){
			const runner = new BattleRunner();
            const reinforcements = 2;
            const cfg = new TestBattleBuilder()
                .addReinforcementSkill(T.REINFORCE_SKILL,reinforcements,{target_type: T.TYPE})
                .addUnit(T.BASIC_UNIT, u => u.withType(T.TYPE))
                .addUnit(T.REINFORCER_UNIT, u => u.withSkill(T.REINFORCE_SKILL))
                .withPlayer(0, [T.REINFORCER_UNIT], [T.BASIC_UNIT])
                .buildConfig();
            const result = runner.run(cfg);
            expect(runner.state!.player1.force.length).toEqual(1+reinforcements);
            expect(runner.state!.player1.force[1].unitId).toEqual(T.BASIC_UNIT);
            expect(runner.state!.player1.force[2].unitId).toEqual(T.BASIC_UNIT);
		});
        it('do nothing is no reinforcement available', function(){
			const runner = new BattleRunner();
            const cfg = new TestBattleBuilder()
                .addType(T.TYPE2,"Type 2")
                .addReinforcementSkill(T.REINFORCE_SKILL,1,{target_type: T.TYPE2})
                .addUnit(T.BASIC_UNIT, u => u.withType(T.TYPE))
                .addUnit(T.REINFORCER_UNIT, u => u.withSkill(T.REINFORCE_SKILL))
                .withPlayer(0, [T.REINFORCER_UNIT], [T.BASIC_UNIT])
                .buildConfig();
            const result = runner.run(cfg);
            expect(runner.state!.player1.force.length).toEqual(1);
		});
        it('skip unapplicable reinforcement', function(){
			const runner = new BattleRunner();
            const cfg = new TestBattleBuilder()
                .addType(T.TYPE2,"Type 2")
                .addReinforcementSkill(T.REINFORCE_SKILL,1,{target_type: T.TYPE2})
                .addUnit(T.BASIC_UNIT, u => u.withType(T.TYPE))
                .addUnit(T.BASIC_UNIT2, u => u.withType(T.TYPE2))
                .addUnit(T.REINFORCER_UNIT, u => u.withSkill(T.REINFORCE_SKILL))
                .withPlayer(0, [T.REINFORCER_UNIT], [T.BASIC_UNIT,T.BASIC_UNIT2])
                .buildConfig();
            const result = runner.run(cfg);
            expect(runner.state!.player1.force.length).toEqual(2);
            expect(runner.state!.player1.force[1].unitId).toEqual(T.BASIC_UNIT2);
		});
        it('reinforce unit can proc', function(){
			const runner = new BattleRunner();
            const heal = 10;
            const cfg = new TestBattleBuilder()
                .addHealSkill(T.HEAL_SKILL,heal)
                .addReinforcementSkill(T.REINFORCE_SKILL,1,{target_type: T.TYPE})
                .addUnit(T.HEAL_UNIT, u => u.withType(T.TYPE).withSkill(T.HEAL_SKILL))
                .addUnit(T.REINFORCER_UNIT, u => u.withSkill(T.REINFORCE_SKILL))
                .withPlayer(0, [T.REINFORCER_UNIT], [T.HEAL_UNIT])
                .buildConfig();
            const result = runner.run(cfg);
            expect(runner.state!.player1.totalHeal).toEqual(heal);
            expect(runner.state!.player1.force.length).toEqual(2);
		});
        it('cannot reinforce unique unit already in force', function(){
			const runner = new BattleRunner();
            const cfg = new TestBattleBuilder()
                .addReinforcementSkill(T.REINFORCE_SKILL,1,{target_type: T.TYPE})
                .addUnit(T.UNIQUE_UNIT, u => u.withType(T.TYPE).isUnique())
                .addUnit(T.REINFORCER_UNIT, u => u.withSkill(T.REINFORCE_SKILL))
                .withPlayer(0, [T.REINFORCER_UNIT,T.UNIQUE_UNIT], [T.UNIQUE_UNIT])
                .buildConfig();
            const result = runner.run(cfg);
            expect(runner.state!.player1.force.length).toEqual(2);
		});
        it('cannot reinforce unique unit twice', function(){
			const runner = new BattleRunner();
            const reinforcements = 10;
            const cfg = new TestBattleBuilder()
                .addReinforcementSkill(T.REINFORCE_SKILL,reinforcements,{target_type: T.TYPE})
                .addUnit(T.BASIC_UNIT, u => u.withType(T.TYPE))
                .addUnit(T.UNIQUE_UNIT, u => u.withType(T.TYPE).isUnique())
                .addUnit(T.REINFORCER_UNIT, u => u.withSkill(T.REINFORCE_SKILL))
                .withPlayer(0, [T.REINFORCER_UNIT], [T.UNIQUE_UNIT,T.BASIC_UNIT])
                .buildConfig();
            const result = runner.run(cfg);
            expect(runner.state!.player1.force.length).toEqual(1+reinforcements);
            expect(runner.state!.player1.force[1].unitId).toEqual(T.UNIQUE_UNIT);
            expect(runner.state!.player1.force[2].unitId).toEqual(T.BASIC_UNIT);
		});
        it('reinforced units can reinforce', function(){
			const runner = new BattleRunner();
            const cfg = new TestBattleBuilder()
                .addType(T.TYPE2,"Type 2")
                .addReinforcementSkill(T.REINFORCE_SKILL,1,{target_type: T.TYPE})
                .addReinforcementSkill(T.REINFORCE_SKILL2,1,{target_type: T.TYPE2})
                .addUnit(T.REINFORCER_UNIT, u => u.withSkill(T.REINFORCE_SKILL))
                .addUnit(T.REINFORCER_UNIT2, u => u.withType(T.TYPE).withSkill(T.REINFORCE_SKILL2))
                .addUnit(T.BASIC_UNIT, u => u.withType(T.TYPE2))
                .withPlayer(0, [T.REINFORCER_UNIT], [T.REINFORCER_UNIT2,T.BASIC_UNIT])
                .buildConfig();
            const result = runner.run(cfg);
            expect(runner.state!.player1.force.length).toEqual(3);
            expect(runner.state!.player1.force[1].unitId).toEqual(T.REINFORCER_UNIT2);
            expect(runner.state!.player1.force[2].unitId).toEqual(T.BASIC_UNIT);
		});
    });

    describe('prevent reinforce', function(){
        it('prevent reinforcement', function(){
			const runner = new BattleRunner();
            const cfg = new TestBattleBuilder()
                .addReinforcementSkill(T.REINFORCE_SKILL,1,{target_type: T.TYPE})
                .addPreventReinforcementSkill(T.PREVENT_REINFORCEMENT_SKILL,1)
                .addUnit(T.REINFORCER_UNIT, u => u.withSkill(T.REINFORCE_SKILL))
                .addUnit(T.BASIC_UNIT, u => u.withType(T.TYPE))
                .addUnit(T.PREVENT_REINFORCEMENT_UNIT, u => u.withSkill(T.PREVENT_REINFORCEMENT_SKILL))
                .withPlayer(0, [T.REINFORCER_UNIT],[T.BASIC_UNIT])
                .withPlayer(1, [T.PREVENT_REINFORCEMENT_UNIT])
                .buildConfig();
            const result = runner.run(cfg);
            expect(runner.state!.player1.force.length).toEqual(1);
		});
        it('prevent 1 of several reinforcements', function(){
			const runner = new BattleRunner();
            const reinforcements = 3, blocks = 2;
            const cfg = new TestBattleBuilder()
                .addReinforcementSkill(T.REINFORCE_SKILL,reinforcements,{target_type: T.TYPE})
                .addPreventReinforcementSkill(T.PREVENT_REINFORCEMENT_SKILL,blocks)
                .addUnit(T.REINFORCER_UNIT, u => u.withSkill(T.REINFORCE_SKILL))
                .addUnit(T.BASIC_UNIT, u => u.withType(T.TYPE))
                .addUnit(T.PREVENT_REINFORCEMENT_UNIT, u => u.withSkill(T.PREVENT_REINFORCEMENT_SKILL))
                .withPlayer(0, [T.REINFORCER_UNIT],[T.BASIC_UNIT])
                .withPlayer(1, [T.PREVENT_REINFORCEMENT_UNIT])
                .buildConfig();
            const result = runner.run(cfg);
            expect(runner.state!.player1.force.length).toEqual(1+reinforcements-blocks);
		});
        it('prevent 2 of 3 separate reinforcements', function(){
			const runner = new BattleRunner();
            const blocks = 2;
            const cfg = new TestBattleBuilder()
                .addReinforcementSkill(T.REINFORCE_SKILL,1,{target_type: T.TYPE})
                .addPreventReinforcementSkill(T.PREVENT_REINFORCEMENT_SKILL,blocks)
                .addUnit(T.REINFORCER_UNIT, u => u.withSkill(T.REINFORCE_SKILL))
                .addUnit(T.BASIC_UNIT, u => u.withType(T.TYPE))
                .addUnit(T.PREVENT_REINFORCEMENT_UNIT, u => u.withSkill(T.PREVENT_REINFORCEMENT_SKILL))
                .withPlayer(0, [T.REINFORCER_UNIT,T.REINFORCER_UNIT,T.REINFORCER_UNIT],[T.BASIC_UNIT])
                .withPlayer(1, [T.PREVENT_REINFORCEMENT_UNIT])
                .buildConfig();
            const result = runner.run(cfg);
            expect(runner.state!.player1.force.length).toEqual(3+3-blocks);
		});
        it('multi prevent reinforce in single go can not reinforce skipped unit', function(){
			const runner = new BattleRunner();
            const reinforcements = 3, blocks = 1;
            const cfg = new TestBattleBuilder()
                .addReinforcementSkill(T.REINFORCE_SKILL,reinforcements,{target_type: T.TYPE})
                .addPreventReinforcementSkill(T.PREVENT_REINFORCEMENT_SKILL,blocks)
                .addUnit(T.REINFORCER_UNIT, u => u.withSkill(T.REINFORCE_SKILL))
                .addUnit(T.BASIC_UNIT, u => u.withType(T.TYPE))
                .addUnit(T.UNIQUE_UNIT, u => u.withType(T.TYPE).isUnique())
                .addUnit(T.PREVENT_REINFORCEMENT_UNIT, u => u.withSkill(T.PREVENT_REINFORCEMENT_SKILL))
                .withPlayer(0, [T.REINFORCER_UNIT],[T.UNIQUE_UNIT,T.BASIC_UNIT])
                .withPlayer(1, [T.PREVENT_REINFORCEMENT_UNIT])
                .buildConfig();
            const result = runner.run(cfg);
            expect(runner.state!.player1.force.length).toEqual(1+reinforcements-blocks);
            expect(runner.state!.player1.force[1].unitId).toEqual(T.BASIC_UNIT);
            expect(runner.state!.player1.force[2].unitId).toEqual(T.BASIC_UNIT);
		});
    });

    describe('control', function(){
        it('control unit', function(){
            const runner = new BattleRunner();
            const cfg = new TestBattleBuilder()
                .addControlSkill(T.CONTROL_SKILL,1,{target_type: T.TYPE})
                .addUnit(T.BASIC_UNIT, u => u.withType(T.TYPE))
                .addUnit(T.CONTROL_UNIT, u => u.withSkill(T.CONTROL_SKILL))
                .withPlayer(0, [T.CONTROL_UNIT])
                .withPlayer(1, [T.BASIC_UNIT])
                .buildConfig();
            const result = runner.run(cfg);
            expect(runner.state!.player1.force.length).toEqual(2);
            expect(runner.state!.player2.force.length).toEqual(0);
            expect(runner.state!.player1.force[1].unitId).toEqual(T.BASIC_UNIT);
        });
        it('control priority', function(){
            const runner = new BattleRunner();
            const cfg = new TestBattleBuilder()
                .addControlSkill(T.CONTROL_SKILL,1,{target_type: T.TYPE})
                .addUnit(T.BASIC_UNIT, u => u.withType(T.TYPE).withLevel(100))
                .addUnit(T.BASIC_UNIT2, u => u.withType(T.TYPE).withLevel(99))
                .addUnit(T.CONTROL_UNIT, u => u.withSkill(T.CONTROL_SKILL))
                .withPlayer(0, [T.CONTROL_UNIT])
                .withPlayer(1, [T.BASIC_UNIT2,T.BASIC_UNIT])
                .buildConfig();
            const result = runner.run(cfg);
            expect(runner.state!.player1.force.length).toEqual(2);
            expect(runner.state!.player2.force.length).toEqual(1);
            expect(runner.state!.player1.force[1].unitId).toEqual(T.BASIC_UNIT);
        });
        
        it('controlled unit can do damage', function(){
            const runner = new BattleRunner();
            const dmg = 10;
            const cfg = new TestBattleBuilder()
                .addControlSkill(T.CONTROL_SKILL,1,{target_type: T.TYPE})
                .addDamageSkill(T.DAMAGE_SKILL,dmg)
                .addUnit(T.DAMAGE_UNIT, u => u.withType(T.TYPE).withSkill(T.DAMAGE_SKILL))
                .addUnit(T.CONTROL_UNIT, u => u.withSkill(T.CONTROL_SKILL))
                .withPlayer(0, [T.CONTROL_UNIT])
                .withPlayer(1, [T.DAMAGE_UNIT])
                .buildConfig();
            vi.spyOn(Math, 'random').mockReturnValue(0.5);
            const result = runner.run(cfg);
            expect(runner.state!.player1.totalDamage).toEqual(dmg);
        });
        it('controlled unit can reinforce', function(){
            const runner = new BattleRunner();
            const cfg = new TestBattleBuilder()
                .addControlSkill(T.CONTROL_SKILL,1,{target_type: T.TYPE})
                .addReinforcementSkill(T.REINFORCE_SKILL,1,{target_type: T.TYPE})
                .addUnit(T.REINFORCER_UNIT, u => u.withType(T.TYPE).withSkill(T.REINFORCE_SKILL))
                .addUnit(T.CONTROL_UNIT, u => u.withSkill(T.CONTROL_SKILL))
                .addUnit(T.BASIC_UNIT, u => u.withType(T.TYPE))
                .withPlayer(0, [T.CONTROL_UNIT], [T.BASIC_UNIT])
                .withPlayer(1, [T.REINFORCER_UNIT])
                .buildConfig();
            const result = runner.run(cfg);
            expect(runner.state!.player1.force.length).toEqual(3);
            expect(runner.state!.player1.force[1].unitId).toEqual(T.REINFORCER_UNIT);
            expect(runner.state!.player1.force[2].unitId).toEqual(T.BASIC_UNIT);
        });
        it('controlled unit can control', function(){
            const runner = new BattleRunner();
            const cfg = new TestBattleBuilder()
                .addControlSkill(T.CONTROL_SKILL,1,{target_type: T.TYPE})
                .addUnit(T.CONTROL_UNIT, u => u.withType(T.TYPE).withSkill(T.CONTROL_SKILL).withLevel(100))
                .addUnit(T.BASIC_UNIT, u => u.withType(T.TYPE).withLevel(99))
                .withPlayer(0, [T.CONTROL_UNIT])
                .withPlayer(1, [T.CONTROL_UNIT, T.BASIC_UNIT])
                .buildConfig();
            const result = runner.run(cfg);
            expect(runner.state!.player1.force.length).toEqual(3);
            expect(runner.state!.player1.force[1].unitId).toEqual(T.CONTROL_UNIT);
            expect(runner.state!.player1.force[2].unitId).toEqual(T.BASIC_UNIT);
        });
        it('controlled unit can be controlled back', function(){
            const runner = new BattleRunner();
            const cfg = new TestBattleBuilder()
                .addType(T.TYPE2,"Type 2")
                .addControlSkill(T.CONTROL_SKILL,1,{target_type: T.TYPE})
                .addUnit(T.CONTROL_UNIT, u => u.withType(T.TYPE2).withSkill(T.CONTROL_SKILL).withLevel(99))
                .addUnit(T.BASIC_UNIT, u => u.withType(T.TYPE).withLevel(100))
                .withPlayer(0, [T.CONTROL_UNIT])
                .withPlayer(1, [T.CONTROL_UNIT, T.BASIC_UNIT])
                .buildConfig();
            const result = runner.run(cfg);
            expect(runner.state!.player1.force.length).toEqual(1);
            expect(runner.state!.player2.force.length).toEqual(2);
            expect(runner.state!.player2.force[0].unitId).toEqual(T.CONTROL_UNIT);
            expect(runner.state!.player2.force[1].unitId).toEqual(T.BASIC_UNIT);
        });
    });

    describe('prevent control', function(){
        it('prevent control unit', function(){
			const runner = new BattleRunner();
            const cfg = new TestBattleBuilder()
                .addPreventControlSkill(T.PREVENT_CONTROL_SKILL,1)
                .addControlSkill(T.CONTROL_SKILL,1,{target_type: T.TYPE})
                .addUnit(T.BASIC_UNIT)
                .addUnit(T.CONTROL_UNIT, u => u.withSkill(T.CONTROL_SKILL))
                .addUnit(T.PREVENT_CONTROL_UNIT, u => u.withSkill(T.PREVENT_CONTROL_SKILL))
                .withPlayer(0, [T.CONTROL_UNIT])
                .withPlayer(1, [T.BASIC_UNIT, T.PREVENT_CONTROL_UNIT])
                .buildConfig();
            const result = runner.run(cfg);
            expect(runner.state!.player1.force.length).toEqual(1);
            expect(runner.state!.player2.force.length).toEqual(2);
        });
        it('prevent multi control unit', function(){
			const runner = new BattleRunner();
            const cfg = new TestBattleBuilder()
                .addPreventControlSkill(T.PREVENT_CONTROL_SKILL,2)
                .addControlSkill(T.CONTROL_SKILL,1,{target_type: T.TYPE})
                .addUnit(T.BASIC_UNIT)
                .addUnit(T.CONTROL_UNIT, u => u.withSkill(T.CONTROL_SKILL))
                .addUnit(T.PREVENT_CONTROL_UNIT, u => u.withSkill(T.PREVENT_CONTROL_SKILL))
                .withPlayer(0, [T.CONTROL_UNIT,T.CONTROL_UNIT])
                .withPlayer(1, [T.BASIC_UNIT, T.PREVENT_CONTROL_UNIT])
                .buildConfig();
            const result = runner.run(cfg);
            expect(runner.state!.player1.force.length).toEqual(2);
            expect(runner.state!.player2.force.length).toEqual(2);
        });
        it('prevent one of multiple control unit', function(){
			const runner = new BattleRunner();
            const cfg = new TestBattleBuilder()
                .addPreventControlSkill(T.PREVENT_CONTROL_SKILL,1)
                .addControlSkill(T.CONTROL_SKILL,2,{target_type: T.TYPE})
                .addUnit(T.BASIC_UNIT)
                .addUnit(T.CONTROL_UNIT, u => u.withSkill(T.CONTROL_SKILL))
                .addUnit(T.PREVENT_CONTROL_UNIT, u => u.withSkill(T.PREVENT_CONTROL_SKILL))
                .withPlayer(0, [T.CONTROL_UNIT])
                .withPlayer(1, [T.BASIC_UNIT, T.PREVENT_CONTROL_UNIT])
                .buildConfig();
            const result = runner.run(cfg);
            expect(runner.state!.player1.force.length).toEqual(2);
            expect(runner.state!.player2.force.length).toEqual(1);
        });
    });

    describe('attack power boost', function(){
        it('attack power boost', function(){
            const baseAttack = 1000000;
            const attackBoost = 0.5;
			const runner = new BattleRunner();
            const cfg = new TestBattleBuilder()
                .addAttackBoostSkill(T.ATTACK_BOOST_SKILL,attackBoost)
                .addUnit(T.ATTACK_BOOST_UNIT, u => u.withSkill(T.ATTACK_BOOST_SKILL).withAttack(0))
                .withPlayer(0, [T.ATTACK_BOOST_UNIT], [], baseAttack)
                .buildConfig();
            const result = runner.run(cfg);
            expect(runner.state!.player1.getAttack()).toEqual(baseAttack*(1+attackBoost));
        });
        it('stacks multiplicatively', function(){
            const baseAttack = 1000000;
            const attackBoost = 0.25;
			const runner = new BattleRunner();
            const cfg = new TestBattleBuilder()
                .addAttackBoostSkill(T.ATTACK_BOOST_SKILL,attackBoost)
                .addUnit(T.ATTACK_BOOST_UNIT, u => u.withSkill(T.ATTACK_BOOST_SKILL).withAttack(0))
                .withPlayer(0, [T.ATTACK_BOOST_UNIT,T.ATTACK_BOOST_UNIT], [], baseAttack)
                .buildConfig();
            const result = runner.run(cfg);
            expect(runner.state!.player1.getAttack()).toEqual(baseAttack*(1+attackBoost)*(1+attackBoost));
        });
        it('cannot boost past cap', function(){
            const baseAttack = 1000000;
            const attackBoost = 0.5;
            const baseAttackMaximum = baseAttack * 2;
			const runner = new BattleRunner();
            const cfg = new TestBattleBuilder()
                .addAttackBoostSkill(T.ATTACK_BOOST_SKILL,attackBoost)
                .addUnit(T.ATTACK_BOOST_UNIT, u => u.withSkill(T.ATTACK_BOOST_SKILL).withAttack(0))
                .withPlayer(0, [T.ATTACK_BOOST_UNIT,T.ATTACK_BOOST_UNIT], [], baseAttack)
                .buildConfig();
            const result = runner.run(cfg);
            expect(runner.state!.player1.getAttack()).toEqual(baseAttackMaximum);
        });
    });

    describe('defense power boost', function(){
        it('defense power boost', function(){
            const baseDefense = 1000000;
            const defenseBoost = 0.5;
			const runner = new BattleRunner();
            const cfg = new TestBattleBuilder()
                .addDefenseBoostSkill(T.DEFENSE_BOOST_SKILL,defenseBoost)
                .addUnit(T.DEFENSE_BOOST_UNIT, u => u.withSkill(T.DEFENSE_BOOST_SKILL).withDefense(0))
                .withPlayer(1, [T.DEFENSE_BOOST_UNIT], [], baseDefense)
                .buildConfig();
            const result = runner.run(cfg);
            expect(runner.state!.player2.getDefense()).toEqual(baseDefense*(1+defenseBoost));
        });
        it('stacks multiplicatively', function(){
            const baseDefense = 1000000;
            const defenseBoost = 0.25;
			const runner = new BattleRunner();
            const cfg = new TestBattleBuilder()
                .addDefenseBoostSkill(T.DEFENSE_BOOST_SKILL,defenseBoost)
                .addUnit(T.DEFENSE_BOOST_UNIT, u => u.withSkill(T.DEFENSE_BOOST_SKILL).withDefense(0))
                .withPlayer(1, [T.DEFENSE_BOOST_UNIT,T.DEFENSE_BOOST_UNIT], [], baseDefense)
                .buildConfig();
            const result = runner.run(cfg);
            expect(runner.state!.player2.getDefense()).toEqual(baseDefense*(1+defenseBoost)*(1+defenseBoost));
        });
        it('cannot boost past cap', function(){
            const baseDefense = 1000000;
            const defenseBoost = 0.5;
            const baseDefenseMaximum = baseDefense * 2;
			const runner = new BattleRunner();
            const cfg = new TestBattleBuilder()
                .addDefenseBoostSkill(T.DEFENSE_BOOST_SKILL,defenseBoost)
                .addUnit(T.DEFENSE_BOOST_UNIT, u => u.withSkill(T.DEFENSE_BOOST_SKILL).withDefense(0))
                .withPlayer(1, [T.DEFENSE_BOOST_UNIT,T.DEFENSE_BOOST_UNIT], [], baseDefense)
                .buildConfig();
            const result = runner.run(cfg);
            expect(runner.state!.player2.getDefense()).toEqual(baseDefenseMaximum);
        });
    });

    describe('attack power unboost', function(){
        it('attack power unboost', function(){
            const baseAttack = 1000000;
            const attackBoost = 0.25;
            const attackUnboost = 0.5;
			const runner = new BattleRunner();
            const cfg = new TestBattleBuilder()
                .addAttackBoostSkill(T.ATTACK_BOOST_SKILL,attackBoost)
                .addAttackUnboostSkill(T.ATTACK_UNBOOST_SKILL,attackUnboost)
                .addUnit(T.ATTACK_BOOST_UNIT, u => u.withSkill(T.ATTACK_BOOST_SKILL).withAttack(0))
                .addUnit(T.ATTACK_UNBOOST_UNIT, u => u.withSkill(T.ATTACK_UNBOOST_SKILL))
                .withPlayer(0, [T.ATTACK_BOOST_UNIT], [], baseAttack)
                .withPlayer(1, [T.ATTACK_UNBOOST_UNIT])
                .buildConfig();
            const result = runner.run(cfg);
            expect(runner.state!.player1.getAttack()).toEqual(baseAttack*((1+attackBoost*(1-attackUnboost))));
        });
        it('multi attack power unboost stack multiplicatively', function(){
            const baseAttack = 1000000;
            const attackBoost = 0.25;
            const attackUnboost = 0.5;
			const runner = new BattleRunner();
            const cfg = new TestBattleBuilder()
                .addAttackBoostSkill(T.ATTACK_BOOST_SKILL,attackBoost)
                .addAttackUnboostSkill(T.ATTACK_UNBOOST_SKILL,attackUnboost)
                .addUnit(T.ATTACK_BOOST_UNIT, u => u.withSkill(T.ATTACK_BOOST_SKILL).withAttack(0))
                .addUnit(T.ATTACK_UNBOOST_UNIT, u => u.withSkill(T.ATTACK_UNBOOST_SKILL))
                .withPlayer(0, [T.ATTACK_BOOST_UNIT], [], baseAttack)
                .withPlayer(1, [T.ATTACK_UNBOOST_UNIT,T.ATTACK_UNBOOST_UNIT])
                .buildConfig();
            const result = runner.run(cfg);
            expect(runner.state!.player1.getAttack()).toEqual(baseAttack*((1+attackBoost*(1-attackUnboost)*(1-attackUnboost))));
        });
    });

    describe('defense power unboost', function(){
        it('defense power unboost', function(){
            const baseDefense = 1000000;
            const defenseBoost = 0.25;
            const defenseUnboost = 0.5;
			const runner = new BattleRunner();
            const cfg = new TestBattleBuilder()
                .addDefenseBoostSkill(T.DEFENSE_BOOST_SKILL,defenseBoost)
                .addDefenseUnboostSkill(T.DEFENSE_UNBOOST_SKILL,defenseUnboost)
                .addUnit(T.DEFENSE_BOOST_UNIT, u => u.withSkill(T.DEFENSE_BOOST_SKILL).withDefense(0))
                .addUnit(T.DEFENSE_UNBOOST_UNIT, u => u.withSkill(T.DEFENSE_UNBOOST_SKILL))
                .withPlayer(0, [T.DEFENSE_UNBOOST_UNIT])
                .withPlayer(1, [T.DEFENSE_BOOST_UNIT], [], baseDefense)
                .buildConfig();
            const result = runner.run(cfg);
            expect(runner.state!.player2.getDefense()).toEqual(baseDefense*((1+defenseBoost*(1-defenseUnboost))));
        });
        it('multi defense power unboost stack multiplicatively', function(){
            const baseDefense = 1000000;
            const defenseBoost = 0.25;
            const defenseUnboost = 0.5;
			const runner = new BattleRunner();
            const cfg = new TestBattleBuilder()
                .addDefenseBoostSkill(T.DEFENSE_BOOST_SKILL,defenseBoost)
                .addDefenseUnboostSkill(T.DEFENSE_UNBOOST_SKILL,defenseUnboost)
                .addUnit(T.DEFENSE_BOOST_UNIT, u => u.withSkill(T.DEFENSE_BOOST_SKILL).withDefense(0))
                .addUnit(T.DEFENSE_UNBOOST_UNIT, u => u.withSkill(T.DEFENSE_UNBOOST_SKILL))
                .withPlayer(0, [T.DEFENSE_UNBOOST_UNIT,T.DEFENSE_UNBOOST_UNIT])
                .withPlayer(1, [T.DEFENSE_BOOST_UNIT], [], baseDefense)
                .buildConfig();
            const result = runner.run(cfg);
            expect(runner.state!.player2.getDefense()).toEqual(baseDefense*((1+defenseBoost*(1-defenseUnboost)*(1-defenseUnboost))));
        });
    });

    describe('summon', function(){
        it('summon a unit and is placed in front of force', function(){
            const unitsToSummon = 1;
			const runner = new BattleRunner();
            const cfg = new TestBattleBuilder()
                .addSummonSkill(T.SUMMON_SKILL,unitsToSummon,T.BASIC_UNIT)
                .addUnit(T.SUMMON_UNIT, u => u.withSkill(T.SUMMON_SKILL))
                .addUnit(T.BASIC_UNIT)
                .withPlayer(0, [T.SUMMON_UNIT])
                .buildConfig();
            const result = runner.run(cfg);
            expect(runner.state!.player1.force.length).toEqual(1+unitsToSummon);
            expect(runner.state!.player1.force[0].unitId).toEqual(T.BASIC_UNIT);
        });
        it('summon multiple units', function(){
            const unitsToSummon = 2;
			const runner = new BattleRunner();
            const cfg = new TestBattleBuilder()
                .addSummonSkill(T.SUMMON_SKILL,unitsToSummon,T.BASIC_UNIT)
                .addUnit(T.SUMMON_UNIT, u => u.withSkill(T.SUMMON_SKILL))
                .addUnit(T.BASIC_UNIT)
                .withPlayer(0, [T.SUMMON_UNIT])
                .buildConfig();
            const result = runner.run(cfg);
            expect(runner.state!.player1.force.length).toEqual(1+unitsToSummon);
            expect(runner.state!.player1.force[0].unitId).toEqual(T.BASIC_UNIT);
            expect(runner.state!.player1.force[1].unitId).toEqual(T.BASIC_UNIT);
        });
    });

    describe('rally', function(){
        it('basic rally', function(){
            const rally = 1, damage = 2;
			const runner = new BattleRunner();
            const cfg = new TestBattleBuilder()
                .addType(T.TYPE2,"Type 2")
                .addRallySkill(T.RALLY_SKILL,rally,{target_type:T.TYPE2})
                .addDamageSkill(T.DAMAGE_SKILL,damage)
                .addUnit(T.RALLY_UNIT, u => u.withSkill(T.RALLY_SKILL))
                .addUnit(T.DAMAGE_UNIT, u => u.withSkill(T.DAMAGE_SKILL).withType(T.TYPE2))
                .withPlayer(0, [T.RALLY_UNIT,T.DAMAGE_UNIT])
                .buildConfig();
            vi.spyOn(Math, 'random').mockReturnValue(0.5);
            const result = runner.run(cfg);
            expect(runner.state!.player1.totalDamage).toEqual(damage+rally);
        });
        it('multiple point rally', function(){
            const rally = 2, damage = 2;
			const runner = new BattleRunner();
            const cfg = new TestBattleBuilder()
                .addRallySkill(T.RALLY_SKILL,rally,{target_type:T.TYPE2})
                .addDamageSkill(T.DAMAGE_SKILL,damage)
                .addUnit(T.RALLY_UNIT, u => u.withSkill(T.RALLY_SKILL))
                .addUnit(T.DAMAGE_UNIT, u => u.withSkill(T.DAMAGE_SKILL).withType(T.TYPE2))
                .withPlayer(0, [T.RALLY_UNIT,T.DAMAGE_UNIT])
                .buildConfig();
            vi.spyOn(Math, 'random').mockReturnValue(0.5);
            const result = runner.run(cfg);
            expect(runner.state!.player1.totalDamage).toEqual(damage+rally);
        });
        it('multiple sources of rally', function(){
            const rally = 1, rally2 = 2, damage = 2;
			const runner = new BattleRunner();
            const cfg = new TestBattleBuilder()
                .addType(T.TYPE2,"Type 2")
                .addSubtype(T.SUBTYPE2,"Subtype 2")
                .addRallySkill(T.RALLY_SKILL,rally,{target_type:T.TYPE2})
                .addRallySkill(T.RALLY_SKILL2,rally2,{target_subtype:T.SUBTYPE2})
                .addDamageSkill(T.DAMAGE_SKILL,damage)
                .addUnit(T.RALLY_UNIT, u => u.withSkill(T.RALLY_SKILL))
                .addUnit(T.RALLY_UNIT2, u => u.withSkill(T.RALLY_SKILL2))
                .addUnit(T.DAMAGE_UNIT, u => u.withSkill(T.DAMAGE_SKILL).withType(T.TYPE2).withSubType(T.SUBTYPE2))
                .withPlayer(0, [T.RALLY_UNIT,T.RALLY_UNIT2,T.DAMAGE_UNIT])
                .buildConfig();
            vi.spyOn(Math, 'random').mockReturnValue(0.5);
            const result = runner.run(cfg);
            expect(runner.state!.player1.totalDamage).toEqual(damage+rally+rally2);
        });
        it('flurry rally', function(){
            const rally = 1, flurry = 3, damage = 2;
			const runner = new BattleRunner();
            const cfg = new TestBattleBuilder()
                .addType(T.TYPE2,"Type 2")
                .addRallySkill(T.RALLY_SKILL,rally,{target_type:T.TYPE2})
                .addDamageSkill(T.DAMAGE_SKILL,damage,flurry)
                .addUnit(T.RALLY_UNIT, u => u.withSkill(T.RALLY_SKILL))
                .addUnit(T.DAMAGE_UNIT, u => u.withSkill(T.DAMAGE_SKILL).withType(T.TYPE2))
                .withPlayer(0, [T.RALLY_UNIT,T.DAMAGE_UNIT])
                .buildConfig();
            vi.spyOn(Math, 'random').mockReturnValue(0.5);
            const result = runner.run(cfg);
            expect(runner.state!.player1.totalDamage).toEqual(flurry*(damage+rally));
        });
    });

    describe('shield', function(){
        it('basic shield', function(){
            const shield = 1, damage = 2;
			const runner = new BattleRunner();
            const cfg = new TestBattleBuilder()
                .addShieldSkill(T.SHIELD_SKILL,shield)
                .addDamageSkill(T.DAMAGE_SKILL,damage)
                .addUnit(T.SHIELD_UNIT, u => u.withSkill(T.SHIELD_SKILL))
                .addUnit(T.DAMAGE_UNIT, u => u.withSkill(T.DAMAGE_SKILL))
                .withPlayer(0, [T.DAMAGE_UNIT])
                .withPlayer(1, [T.SHIELD_UNIT])
                .buildConfig();
            vi.spyOn(Math, 'random').mockReturnValue(0.5);
            const result = runner.run(cfg);
            expect(runner.state!.player1.totalDamage).toEqual(damage-shield);
        });
        it('flurry shield', function(){
            const shield = 1, flurry = 3, damage = 2;
			const runner = new BattleRunner();
            const cfg = new TestBattleBuilder()
                .addShieldSkill(T.SHIELD_SKILL,shield)
                .addDamageSkill(T.DAMAGE_SKILL,damage,flurry)
                .addUnit(T.SHIELD_UNIT, u => u.withSkill(T.SHIELD_SKILL))
                .addUnit(T.DAMAGE_UNIT, u => u.withSkill(T.DAMAGE_SKILL))
                .withPlayer(0, [T.DAMAGE_UNIT])
                .withPlayer(1, [T.SHIELD_UNIT])
                .buildConfig();
            vi.spyOn(Math, 'random').mockReturnValue(0.5);
            const result = runner.run(cfg);
            expect(runner.state!.player1.totalDamage).toEqual(flurry*(damage-shield));
        });
        it('can reduce to negatives', function(){
            const shield = 2, damage = 1;
			const runner = new BattleRunner();
            const cfg = new TestBattleBuilder()
                .addShieldSkill(T.SHIELD_SKILL,shield)
                .addDamageSkill(T.DAMAGE_SKILL,damage)
                .addUnit(T.SHIELD_UNIT, u => u.withSkill(T.SHIELD_SKILL))
                .addUnit(T.DAMAGE_UNIT, u => u.withSkill(T.DAMAGE_SKILL))
                .withPlayer(0, [T.DAMAGE_UNIT])
                .withPlayer(1, [T.SHIELD_UNIT])
                .buildConfig();
            vi.spyOn(Math, 'random').mockReturnValue(0.5);
            const result = runner.run(cfg);
            expect(runner.state!.player1.totalDamage).toEqual(damage-shield);
        });
    });

    describe('antishield', function(){
        it('basic antishield', function(){
            const shield = 1, antishield = 1, damage = 2;
			const runner = new BattleRunner();
            const cfg = new TestBattleBuilder()
                .addShieldSkill(T.SHIELD_SKILL,shield)
                .addAntishieldSkill(T.ANTISHIELD_SKILL,antishield)
                .addDamageSkill(T.DAMAGE_SKILL,damage)
                .addUnit(T.SHIELD_UNIT, u => u.withSkill(T.SHIELD_SKILL))
                .addUnit(T.ANTISHIELD_UNIT, u => u.withSkill(T.ANTISHIELD_SKILL))
                .addUnit(T.DAMAGE_UNIT, u => u.withSkill(T.DAMAGE_SKILL))
                .withPlayer(0, [T.DAMAGE_UNIT,T.ANTISHIELD_UNIT])
                .withPlayer(1, [T.SHIELD_UNIT])
                .buildConfig();
            vi.spyOn(Math, 'random').mockReturnValue(0.5);
            const result = runner.run(cfg);
            expect(runner.state!.player1.totalDamage).toEqual(damage-(shield-antishield));
        });
        it('cannot antishield past 0', function(){
            const shield = 1, antishield = 2, damage = 2;
			const runner = new BattleRunner();
            const cfg = new TestBattleBuilder()
                .addShieldSkill(T.SHIELD_SKILL,shield)
                .addAntishieldSkill(T.ANTISHIELD_SKILL,antishield)
                .addDamageSkill(T.DAMAGE_SKILL,damage)
                .addUnit(T.SHIELD_UNIT, u => u.withSkill(T.SHIELD_SKILL))
                .addUnit(T.ANTISHIELD_UNIT, u => u.withSkill(T.ANTISHIELD_SKILL))
                .addUnit(T.DAMAGE_UNIT, u => u.withSkill(T.DAMAGE_SKILL))
                .withPlayer(0, [T.DAMAGE_UNIT,T.ANTISHIELD_UNIT])
                .withPlayer(1, [T.SHIELD_UNIT])
                .buildConfig();
            vi.spyOn(Math, 'random').mockReturnValue(0.5);
            const result = runner.run(cfg);
            expect(runner.state!.player1.totalDamage).toEqual(damage-Math.max(0, shield-antishield));
        });
    });

    describe('heal each', function(){
        it('heal each', function(){
			const runner = new BattleRunner();
            const heal = 1;
            const cfg = new TestBattleBuilder()
                .addType(T.TYPE2,"Type 2")
                .addHealEachSkill(T.HEAL_EACH_SKILL,heal,{target_type:T.TYPE2})
                .addUnit(T.HEAL_EACH_UNIT, u => u.withSkill(T.HEAL_EACH_SKILL))
                .addUnit(T.BASIC_UNIT, u => u.withType(T.TYPE2))
                .withPlayer(0, [T.HEAL_EACH_UNIT,T.BASIC_UNIT,T.BASIC_UNIT,T.BASIC_UNIT])
                .buildConfig();
            vi.spyOn(Math, 'random').mockReturnValue(0.5);
            runner.run(cfg);
            expect(runner.state!.player1.totalHeal).toEqual(heal*3);
		});
        it('heal each respects cap', function(){
			const runner = new BattleRunner();
            const heal = 12, cap = 10;
            const cfg = new TestBattleBuilder()
                .addType(T.TYPE2,"Type 2")
                .addHealEachSkill(T.HEAL_EACH_SKILL,heal,{target_type:T.TYPE2}, cap)
                .addUnit(T.HEAL_EACH_UNIT, u => u.withSkill(T.HEAL_EACH_SKILL))
                .addUnit(T.BASIC_UNIT, u => u.withType(T.TYPE2))
                .withPlayer(0, [T.HEAL_EACH_UNIT,T.BASIC_UNIT,T.BASIC_UNIT,T.BASIC_UNIT])
                .buildConfig();
            vi.spyOn(Math, 'random').mockReturnValue(0.5);
            runner.run(cfg);
            expect(runner.state!.player1.totalHeal).toEqual(cap);
		});
        it('heal each does nothing with 0 targets', function(){
			const runner = new BattleRunner();
            const heal = 1;
            const cfg = new TestBattleBuilder()
                .addType(T.TYPE2,"Type 2")
                .addHealEachSkill(T.HEAL_EACH_SKILL,heal,{target_type:T.TYPE2})
                .addUnit(T.HEAL_EACH_UNIT, u => u.withSkill(T.HEAL_EACH_SKILL))
                .withPlayer(0, [T.HEAL_EACH_UNIT])
                .buildConfig();
            vi.spyOn(Math, 'random').mockReturnValue(0.5);
            runner.run(cfg);
            expect(runner.state!.player1.totalHeal).toEqual(heal*0);
		});
    });

    describe('heal jammed', function(){
        it('heal jammed', function(){
			const runner = new BattleRunner();
            const heal = 1, jam = 3;
            const cfg = new TestBattleBuilder()
                .addType(T.TYPE2,"Type 2")
                .addHealJammedSkill(T.HEAL_JAMMED_SKILL,heal)
                .addJamSkill(T.JAM_SKILL,jam,{target_type:T.TYPE2})
                .addUnit(T.HEAL_JAMMED_UNIT, u => u.withSkill(T.HEAL_JAMMED_SKILL))
                .addUnit(T.JAM_UNIT, u => u.withSkill(T.JAM_SKILL))
                .addUnit(T.BASIC_UNIT, u => u.withType(T.TYPE2))
                .withPlayer(0, [T.HEAL_JAMMED_UNIT,T.BASIC_UNIT,T.BASIC_UNIT,T.BASIC_UNIT])
                .withPlayer(1, [T.JAM_UNIT])
                .buildConfig();
            vi.spyOn(Math, 'random').mockReturnValue(0.5);
            runner.run(cfg);
            expect(runner.state!.player1.totalHeal).toEqual(heal*jam);
		});
        it('heal jammed respects cap', function(){
			const runner = new BattleRunner();
            const heal = 10, jam = 3, cap = 5;
            const cfg = new TestBattleBuilder()
                .addType(T.TYPE2,"Type 2")
                .addHealJammedSkill(T.HEAL_JAMMED_SKILL,heal,cap)
                .addJamSkill(T.JAM_SKILL,jam,{target_type:T.TYPE2})
                .addUnit(T.HEAL_JAMMED_UNIT, u => u.withSkill(T.HEAL_JAMMED_SKILL))
                .addUnit(T.JAM_UNIT, u => u.withSkill(T.JAM_SKILL))
                .addUnit(T.BASIC_UNIT, u => u.withType(T.TYPE2))
                .withPlayer(0, [T.HEAL_JAMMED_UNIT,T.BASIC_UNIT,T.BASIC_UNIT,T.BASIC_UNIT])
                .withPlayer(1, [T.JAM_UNIT])
                .buildConfig();
            vi.spyOn(Math, 'random').mockReturnValue(0.5);
            runner.run(cfg);
            expect(runner.state!.player1.totalHeal).toEqual(cap);
		});
        it('heal jammed does nothing with 0 targets', function(){
			const runner = new BattleRunner();
            const heal = 10;
            const cfg = new TestBattleBuilder()
                .addHealJammedSkill(T.HEAL_JAMMED_SKILL,heal)
                .addUnit(T.HEAL_JAMMED_UNIT, u => u.withSkill(T.HEAL_JAMMED_SKILL))
                .withPlayer(0, [T.HEAL_JAMMED_UNIT])
                .buildConfig();
            vi.spyOn(Math, 'random').mockReturnValue(0.5);
            runner.run(cfg);
            expect(runner.state!.player1.totalHeal).toEqual(heal*0);
		});
    });

    describe('damage each', function(){
        it('damage each', function(){
			const runner = new BattleRunner();
            const damage = 2;
            const cfg = new TestBattleBuilder()
                .addType(T.TYPE2,"Type 2")
                .addDamageEachSkill(T.DAMAGE_EACH_SKILL,damage,{target_type:T.TYPE2})
                .addUnit(T.DAMAGE_EACH_UNIT, u => u.withSkill(T.DAMAGE_EACH_SKILL))
                .addUnit(T.BASIC_UNIT, u => u.withType(T.TYPE2))
                .withPlayer(0, [T.DAMAGE_EACH_UNIT])
                .withPlayer(1, [T.BASIC_UNIT,T.BASIC_UNIT,T.BASIC_UNIT])
                .buildConfig();
            vi.spyOn(Math, 'random').mockReturnValue(0.5);
            runner.run(cfg);
            expect(runner.state!.player1.totalDamage).toEqual(damage*3);
		});
        it('damage each respects cap', function(){
			const runner = new BattleRunner();
            const damage = 6, cap = 10;
            const cfg = new TestBattleBuilder()
                .addType(T.TYPE2,"Type 2")
                .addDamageEachSkill(T.DAMAGE_EACH_SKILL,damage,{target_type:T.TYPE2},cap)
                .addUnit(T.DAMAGE_EACH_UNIT, u => u.withSkill(T.DAMAGE_EACH_SKILL))
                .addUnit(T.BASIC_UNIT, u => u.withType(T.TYPE2))
                .withPlayer(0, [T.DAMAGE_EACH_UNIT])
                .withPlayer(1, [T.BASIC_UNIT,T.BASIC_UNIT,T.BASIC_UNIT])
                .buildConfig();
            vi.spyOn(Math, 'random').mockReturnValue(0.5);
            runner.run(cfg);
            expect(runner.state!.player1.totalDamage).toEqual(cap);
		});
        it('damage each does nothing with no targets', function(){
			const runner = new BattleRunner();
            const damage = 6;
            const cfg = new TestBattleBuilder()
                .addType(T.TYPE2,"Type 2")
                .addDamageEachSkill(T.DAMAGE_EACH_SKILL,damage,{target_type:T.TYPE2})
                .addUnit(T.DAMAGE_EACH_UNIT, u => u.withSkill(T.DAMAGE_EACH_SKILL))
                .withPlayer(0, [T.DAMAGE_EACH_UNIT])
                .buildConfig();
            vi.spyOn(Math, 'random').mockReturnValue(0.5);
            runner.run(cfg);
            expect(runner.state!.player1.totalDamage).toEqual(0*damage);
		});
    });

    describe('damage reinforced', function(){
        it('damage reinforced', function(){
			const runner = new BattleRunner();
            const damage = 2, reinforcements = 2;
            const cfg = new TestBattleBuilder()
                .addDamageReinforcedSkill(T.DAMAGE_REINFORCED_SKILL,damage)
                .addReinforcementSkill(T.REINFORCE_SKILL,reinforcements,{target_type:T.TYPE})
                .addUnit(T.DAMAGE_REINFORCED_UNIT, u => u.withSkill(T.DAMAGE_REINFORCED_SKILL))
                .addUnit(T.REINFORCER_UNIT, u => u.withSkill(T.REINFORCE_SKILL))
                .addUnit(T.BASIC_UNIT)
                .withPlayer(0, [T.DAMAGE_REINFORCED_UNIT])
                .withPlayer(1, [T.REINFORCER_UNIT], [T.BASIC_UNIT])
                .buildConfig();
            vi.spyOn(Math, 'random').mockReturnValue(0.5);
            runner.run(cfg);
            expect(runner.state!.player1.totalDamage).toEqual(damage*reinforcements);
		});
        it('damage reinforced repsects cap', function(){
			const runner = new BattleRunner();
            const damage = 8, reinforcements = 2, cap = 10;
            const cfg = new TestBattleBuilder()
                .addDamageReinforcedSkill(T.DAMAGE_REINFORCED_SKILL,damage,cap)
                .addReinforcementSkill(T.REINFORCE_SKILL,reinforcements,{target_type:T.TYPE})
                .addUnit(T.DAMAGE_REINFORCED_UNIT, u => u.withSkill(T.DAMAGE_REINFORCED_SKILL))
                .addUnit(T.REINFORCER_UNIT, u => u.withSkill(T.REINFORCE_SKILL))
                .addUnit(T.BASIC_UNIT)
                .withPlayer(0, [T.DAMAGE_REINFORCED_UNIT])
                .withPlayer(1, [T.REINFORCER_UNIT], [T.BASIC_UNIT])
                .buildConfig();
            vi.spyOn(Math, 'random').mockReturnValue(0.5);
            runner.run(cfg);
            expect(runner.state!.player1.totalDamage).toEqual(cap);
		});
    });

    describe('damage jammed', function(){
        it('damage jammed', function(){
			const runner = new BattleRunner();
            const damage = 2, jam = 2;
            const cfg = new TestBattleBuilder()
                .addDamageJammedSkill(T.DAMAGE_JAMMED_SKILL,damage)
                .addJamSkill(T.JAM_SKILL,jam,{target_type:T.TYPE})
                .addUnit(T.DAMAGE_JAMMED_UNIT, u => u.withSkill(T.DAMAGE_JAMMED_SKILL))
                .addUnit(T.JAM_UNIT, u => u.withSkill(T.JAM_SKILL))
                .addUnit(T.BASIC_UNIT)
                .withPlayer(0, [T.BASIC_UNIT,T.BASIC_UNIT,T.DAMAGE_JAMMED_UNIT])
                .withPlayer(1, [T.JAM_UNIT])
                .buildConfig();
            vi.spyOn(Math, 'random').mockReturnValue(0.5);
            runner.run(cfg);
            expect(runner.state!.player1.totalDamage).toEqual(damage*jam);
		});
        it('damage jammed respects cap', function(){
			const runner = new BattleRunner();
            const damage = 5, jam = 4, cap = 10;
            const cfg = new TestBattleBuilder()
                .addDamageJammedSkill(T.DAMAGE_JAMMED_SKILL,damage,cap)
                .addJamSkill(T.JAM_SKILL,jam,{target_type:T.TYPE})
                .addUnit(T.DAMAGE_JAMMED_UNIT, u => u.withSkill(T.DAMAGE_JAMMED_SKILL))
                .addUnit(T.JAM_UNIT, u => u.withSkill(T.JAM_SKILL))
                .addUnit(T.BASIC_UNIT)
                .withPlayer(0, [T.BASIC_UNIT,T.BASIC_UNIT,T.BASIC_UNIT,T.BASIC_UNIT,T.DAMAGE_JAMMED_UNIT])
                .withPlayer(1, [T.JAM_UNIT])
                .buildConfig();
            vi.spyOn(Math, 'random').mockReturnValue(0.5);
            runner.run(cfg);
            expect(runner.state!.player1.totalDamage).toEqual(cap);
		});
    });

    describe('damage enemy jammed', function(){
        it('damage enemy jammed', function(){
			const runner = new BattleRunner();
            const damage = 2, jam = 2;
            const cfg = new TestBattleBuilder()
                .addDamageEnemyJammedSkill(T.DAMAGE_ENEMY_JAMMED_SKILL,damage)
                .addJamSkill(T.JAM_SKILL,jam,{target_type:T.TYPE})
                .addUnit(T.DAMAGE_ENEMY_JAMMED_UNIT, u => u.withSkill(T.DAMAGE_ENEMY_JAMMED_SKILL))
                .addUnit(T.JAM_UNIT, u => u.withSkill(T.JAM_SKILL))
                .addUnit(T.BASIC_UNIT)
                .withPlayer(0, [T.DAMAGE_ENEMY_JAMMED_UNIT,T.JAM_UNIT])
                .withPlayer(1, [T.BASIC_UNIT,T.BASIC_UNIT])
                .buildConfig();
            vi.spyOn(Math, 'random').mockReturnValue(0.5);
            const result = runner.run(cfg);
            expect(runner.state!.player1.totalDamage).toEqual(damage*jam);
		});
        it('damage enemy jammed respects cap', function(){
			const runner = new BattleRunner();
            const damage = 5, jam = 4, cap = 10;
            const cfg = new TestBattleBuilder()
                .addDamageEnemyJammedSkill(T.DAMAGE_ENEMY_JAMMED_SKILL,damage,cap)
                .addJamSkill(T.JAM_SKILL,jam,{target_type:T.TYPE})
                .addUnit(T.DAMAGE_ENEMY_JAMMED_UNIT, u => u.withSkill(T.DAMAGE_ENEMY_JAMMED_SKILL))
                .addUnit(T.JAM_UNIT, u => u.withSkill(T.JAM_SKILL))
                .addUnit(T.BASIC_UNIT)
                .withPlayer(0, [T.DAMAGE_ENEMY_JAMMED_UNIT,T.JAM_UNIT])
                .withPlayer(1, [T.BASIC_UNIT,T.BASIC_UNIT,T.BASIC_UNIT,T.BASIC_UNIT])
                .buildConfig();
            vi.spyOn(Math, 'random').mockReturnValue(0.5);
            const result = runner.run(cfg);
            expect(runner.state!.player1.totalDamage).toEqual(cap);
		});
    });

    describe('damage per heal', function(){
        it('damage per heal', function(){
			const runner = new BattleRunner();
            const damage = 0.5, heal = 10;
            const cfg = new TestBattleBuilder()
                .addDamageHealSkill(T.DAMAGE_HEALED_SKILL,damage)
                .addHealSkill(T.HEAL_SKILL,heal)
                .addUnit(T.DAMAGE_HEALED_UNIT, u => u.withSkill(T.DAMAGE_HEALED_SKILL))
                .addUnit(T.HEAL_UNIT, u => u.withSkill(T.HEAL_SKILL))
                .withPlayer(0, [T.HEAL_UNIT,T.DAMAGE_HEALED_UNIT])
                .buildConfig();
            vi.spyOn(Math, 'random').mockReturnValue(0.5);
            const result = runner.run(cfg);
            expect(runner.state!.player1.totalDamage).toEqual(damage*heal);
		});
        it('damage per heal respects cap', function(){
			const runner = new BattleRunner();
            const damage = 0.5, heal = 10, cap = 3;
            const cfg = new TestBattleBuilder()
                .addDamageHealSkill(T.DAMAGE_HEALED_SKILL,damage,cap)
                .addHealSkill(T.HEAL_SKILL,heal)
                .addUnit(T.DAMAGE_HEALED_UNIT, u => u.withSkill(T.DAMAGE_HEALED_SKILL))
                .addUnit(T.HEAL_UNIT, u => u.withSkill(T.HEAL_SKILL))
                .withPlayer(0, [T.HEAL_UNIT,T.DAMAGE_HEALED_UNIT])
                .buildConfig();
            vi.spyOn(Math, 'random').mockReturnValue(0.5);
            const result = runner.run(cfg);
            expect(runner.state!.player1.totalDamage).toEqual(cap);
		});
    });

    describe('damage boost', function(){
        it('damage boost for type', function(){
			const runner = new BattleRunner();
            const damage = 10, boost = 0.25;
            const cfg = new TestBattleBuilder()
                .addType(T.TYPE2, "Type 2")
                .addDamageBoostSkill(T.DAMAGE_BOOST_SKILL,boost,{target_type:T.TYPE2})
                .addDamageSkill(T.DAMAGE_SKILL,damage)
                .addUnit(T.DAMAGE_BOOST_UNIT, u => u.withSkill(T.DAMAGE_BOOST_SKILL))
                .addUnit(T.DAMAGE_UNIT, u => u.withSkill(T.DAMAGE_SKILL).withType(T.TYPE2))
                .withPlayer(0, [T.DAMAGE_UNIT,T.DAMAGE_BOOST_UNIT])
                .buildConfig();
            vi.spyOn(Math, 'random').mockReturnValue(0.5);
            const result = runner.run(cfg);
            expect(runner.state!.player1.totalDamage).toEqual(RoundHalfOdd(damage*(1+boost)));
		});
        it('damage boost for subtype', function(){
			const runner = new BattleRunner();
            const damage = 10, boost = 0.25;
            const cfg = new TestBattleBuilder()
                .addSubtype(T.SUBTYPE2, "Subtype 2")
                .addDamageBoostSkill(T.DAMAGE_BOOST_SKILL,boost,{target_subtype:T.SUBTYPE2})
                .addDamageSkill(T.DAMAGE_SKILL,damage)
                .addUnit(T.DAMAGE_BOOST_UNIT, u => u.withSkill(T.DAMAGE_BOOST_SKILL))
                .addUnit(T.DAMAGE_UNIT, u => u.withSkill(T.DAMAGE_SKILL).withSubType(T.SUBTYPE2))
                .withPlayer(0, [T.DAMAGE_UNIT,T.DAMAGE_BOOST_UNIT])
                .buildConfig();
            vi.spyOn(Math, 'random').mockReturnValue(0.5);
            const result = runner.run(cfg);
            expect(runner.state!.player1.totalDamage).toEqual(RoundHalfOdd(damage*(1+boost)));
		});
        it('damage boost for same type stack additively', function(){
			const runner = new BattleRunner();
            const damage = 10, boost = 0.25;
            const cfg = new TestBattleBuilder()
                .addType(T.TYPE2, "Type 2")
                .addDamageBoostSkill(T.DAMAGE_BOOST_SKILL,boost,{target_type:T.TYPE2})
                .addDamageSkill(T.DAMAGE_SKILL,damage)
                .addUnit(T.DAMAGE_BOOST_UNIT, u => u.withSkill(T.DAMAGE_BOOST_SKILL))
                .addUnit(T.DAMAGE_UNIT, u => u.withSkill(T.DAMAGE_SKILL).withType(T.TYPE2))
                .withPlayer(0, [T.DAMAGE_UNIT,T.DAMAGE_BOOST_UNIT,T.DAMAGE_BOOST_UNIT])
                .buildConfig();
            vi.spyOn(Math, 'random').mockReturnValue(0.5);
            const result = runner.run(cfg);
            expect(runner.state!.player1.totalDamage).toEqual(RoundHalfOdd(damage*(1+boost*2)));
		});
        it('damage boost for same type stack additively', function(){
			const runner = new BattleRunner();
            const damage = 10, boost = 0.25, boost2 = 0.1;
            const cfg = new TestBattleBuilder()
                .addType(T.TYPE2, "Type 2")
                .addSubtype(T.SUBTYPE2, "Subtype 2")
                .addDamageBoostSkill(T.DAMAGE_BOOST_SKILL,boost,{target_type:T.TYPE2})
                .addDamageBoostSkill(T.DAMAGE_BOOST_SKILL2,boost2,{target_subtype:T.SUBTYPE2})
                .addDamageSkill(T.DAMAGE_SKILL,damage)
                .addUnit(T.DAMAGE_BOOST_UNIT, u => u.withSkill(T.DAMAGE_BOOST_SKILL))
                .addUnit(T.DAMAGE_BOOST_UNIT2, u => u.withSkill(T.DAMAGE_BOOST_SKILL2))
                .addUnit(T.DAMAGE_UNIT, u => u.withSkill(T.DAMAGE_SKILL).withType(T.TYPE2).withSubType(T.SUBTYPE2))
                .withPlayer(0, [T.DAMAGE_UNIT,T.DAMAGE_BOOST_UNIT,T.DAMAGE_BOOST_UNIT2])
                .buildConfig();
            vi.spyOn(Math, 'random').mockReturnValue(0.5);
            const result = runner.run(cfg);
            expect(runner.state!.player1.totalDamage).toEqual(RoundHalfOdd(damage*(1+boost+boost2)));
		});
        it('boosts are not applied to rally', function(){
			const runner = new BattleRunner();
            const damage = 10, boost = 0.25, rally = 1;
            const cfg = new TestBattleBuilder()
                .addType(T.TYPE2, "Type 2")
                .addDamageBoostSkill(T.DAMAGE_BOOST_SKILL,boost,{target_type:T.TYPE2})
                .addRallySkill(T.RALLY_SKILL,rally,{target_type:T.TYPE2})
                .addDamageSkill(T.DAMAGE_SKILL,damage)
                .addUnit(T.DAMAGE_BOOST_UNIT, u => u.withSkill(T.DAMAGE_BOOST_SKILL))
                .addUnit(T.RALLY_UNIT, u => u.withSkill(T.RALLY_SKILL))
                .addUnit(T.DAMAGE_UNIT, u => u.withSkill(T.DAMAGE_SKILL).withType(T.TYPE2))
                .withPlayer(0, [T.DAMAGE_UNIT,T.DAMAGE_BOOST_UNIT,T.RALLY_UNIT])
                .buildConfig();
            vi.spyOn(Math, 'random').mockReturnValue(0.5);
            const result = runner.run(cfg);
            expect(runner.state!.player1.totalDamage).toEqual(RoundHalfOdd(damage*(1+boost) + rally));
		});
    });

    describe('ability requirements', function(){
        it('ability without met requirements will not proc', function(){
			const runner = new BattleRunner();
            const damage = 10, unitsRequired = 3;
            const cfg = new TestBattleBuilder()
                .addType(T.TYPE2, "Type 2")
                .addDamageSkill(T.DAMAGE_SKILL,damage,1, s => {
                    s.requirements = [{type_id:T.TYPE2, count:unitsRequired}];
                    return s;
                })
                .addUnit(T.BASIC_UNIT, u => u.withType(T.TYPE2))
                .addUnit(T.DAMAGE_UNIT, u => u.withSkill(T.DAMAGE_SKILL))
                .withPlayer(0, [T.DAMAGE_UNIT,T.BASIC_UNIT])
                .buildConfig();
            vi.spyOn(Math, 'random').mockReturnValue(0.5);
            const result = runner.run(cfg);
            expect(runner.state!.player1.totalDamage).toEqual(0);
		});
        it('ability with met requirements will proc', function(){
			const runner = new BattleRunner();
            const damage = 10, unitsRequired = 3;
            const cfg = new TestBattleBuilder()
                .addType(T.TYPE2, "Type 2")
                .addDamageSkill(T.DAMAGE_SKILL,damage,1, s => {
                    s.requirements = [{type_id:T.TYPE2, count:unitsRequired}];
                    return s;
                })
                .addUnit(T.BASIC_UNIT, u => u.withType(T.TYPE2))
                .addUnit(T.DAMAGE_UNIT, u => u.withSkill(T.DAMAGE_SKILL))
                .withPlayer(0, [T.DAMAGE_UNIT,T.BASIC_UNIT,T.BASIC_UNIT,T.BASIC_UNIT])
                .buildConfig();
            vi.spyOn(Math, 'random').mockReturnValue(0.5);
            const result = runner.run(cfg);
            expect(runner.state!.player1.totalDamage).toEqual(damage);
		});
    });

    describe('reinforcement constraints', function(){
        it('reinforcement constraints respected', function(){
			const runner = new BattleRunner();
            const reinforcements = 3, maxReinforcements = 2;
            const cfg = new TestBattleBuilder()
                .addReinforcementSkill(T.REINFORCE_SKILL,reinforcements,{target_unit:T.BASIC_UNIT})
                .addUnit(T.BASIC_UNIT)
                .addUnit(T.REINFORCER_UNIT, u => u.withSkill(T.REINFORCE_SKILL))
                .withPlayer(0, [T.REINFORCER_UNIT],[T.BASIC_UNIT],0,0,[{unit: T.BASIC_UNIT, count: maxReinforcements}])
                .buildConfig();
            vi.spyOn(Math, 'random').mockReturnValue(0.5);
            const result = runner.run(cfg);
            expect(runner.state!.player1.force.length).toEqual(1 + maxReinforcements);
		});
    });

    describe('custom skills handler', function(){
        it('custom skill is registered and executes', function(){
			const runner = new BattleRunner();
            const customTag = 'test', reinforcementMaxSize = 1;
            runner.registerSkillHandlers([{
                name: 'Limit reinforcements',
                applicablePhase: BattlePhase.PRE,
                applicableTags: [customTag],
                handler: (ctx, skill, player, unit, baseLog) => {
                    const value = skill.custom![customTag].value;
                    player.other!.reinforcements = player.other!.reinforcements.slice(value);
                }
            } as ISkillHandler]);

            const cfg = new TestBattleBuilder()
                .addCustomSkill(T.CUSTOM_SKILL,{custom:{test:{value:reinforcementMaxSize}}})
                .addUnit(T.BASIC_UNIT)
                .addUnit(T.BASIC_UNIT2)
                .addUnit(T.CUSTOM_UNIT, u => u.withSkill(T.CUSTOM_SKILL))
                .withPlayer(0, [T.CUSTOM_UNIT])
                .withPlayer(1, [], [T.BASIC_UNIT, T.BASIC_UNIT2])
                .buildConfig();
            const result = runner.run(cfg);
            expect(runner.state!.player2.reinforcements.length).toEqual(reinforcementMaxSize);
		});
    });
});