import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import BattleRunner from '../app/simulator';
import type { BattleConfig } from '../app/types/config';
import { DEFAULT_POWER, MAGIC_LEVEL, UNIT_MULTIPLIER } from '../app/util/magicNumbers';
import { TestBattleBuilder } from './builder';
import T from './constants';
import { ReinforceLog } from '../app/types/log';

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
                .addUnit(T.JAM_UNIT)
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
                .addUnit(T.JAM_UNIT)
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
            
        });
    });
});