'use strict';

describe('Simulator', function(){
	var origRandom = Math.random;
	var trials = 100;
	
	//these are required for almost every situation,
	//so we just define them here once and then merge them with the other arguments
	var def = {"unitData":unitData,"skillData":skillData,"typeData":typeData,"subtypeData":subtypeData};
	
	//http://stackoverflow.com/a/171256/1690495
	function merge(obj1,obj2){
		var obj3 = {};
		for(var attrname in obj1)
			obj3[attrname] = obj1[attrname];
		for(var attrname in obj2)
			obj3[attrname] = obj2[attrname];
		return obj3;
	}

	describe('Battle Runner initialising', function(){
		var runner;
		
		it('defaults working', function(){
			runner = new gmsim.battleRunner();
			
			expect(runner.epicMode).toEqual(0);
			expect(runner.getPlayer(1).getForce().length).toEqual(1);
			expect(runner.getPlayer(2).getForce().length).toEqual(1);
			expect(runner.getPlayer(1).getRawAttack()).toEqual(1000000);
			expect(runner.getPlayer(2).getRawDefence()).toEqual(1000000);
			expect(runner.maxBase).toEqual(670);//2*320*log10(1000/100)+30
			expect(runner.doOutput).toEqual(0);
			expect(Object.keys(runner.maxReinfs).length).toEqual(0);
		});
		
		it('epic max base damage is 30', function(){
			runner = new gmsim.battleRunner(merge(def, {
				"epicMode":1
			}));

			expect(runner.maxBase).toEqual(30);
		});
		
		it('max base damagecan be zeroed', function(){
			runner = new gmsim.battleRunner(merge(def, {
				"defenderLevel":89.77
			}));

			expect(runner.maxBase).toEqual(0);
		});

		it('formation should count as unit', function(){
			runner = new gmsim.battleRunner(merge(def, {
				'force1': "1,81,0,0"
			}));
			
			expect(runner.getPlayer(1).getForce().length).toEqual(1);
			expect(runner.getPlayer(2).getForce().length).toEqual(1);
		});
		
		it('invalid force code ignores formation', function(){
			runner = new gmsim.battleRunner(merge(def, {
				'force1': " "
			}));
			
			expect(runner.getPlayer(1).getForce().length).toEqual(0);
		});
		
		it('invalid formation code is ignored', function(){
			runner = new gmsim.battleRunner(merge(def, {
				'force1': "1,999999"
			}));
			
			expect(runner.getPlayer(1).getForce().length).toEqual(0);
		});
		
		it('units added correctly', function(){
			runner = new gmsim.battleRunner(merge(def, {
				'force1': "1,81,2001,2086,0,0"
			}));
			
			expect(runner.getPlayer(1).getForce().length).toEqual(3);
		});
		
		it('invalid units not added', function(){
			runner = new gmsim.battleRunner(merge(def, {
				'force1': "1,81,2001,99999,2186,0,0"
			}));
			
			expect(runner.getPlayer(1).getForce().length).toEqual(3);
		});
		
		it('units contribute to base stat', function(){
			runner = new gmsim.battleRunner(merge(def, {
				'force1': "1,81,2001,0,0",
				'force2': "1,81,2001,2001,0,0"
			}));
			
			expect(runner.getPlayer(1).getRawAttack()).toEqual(1000010);
			expect(runner.getPlayer(2).getRawDefence()).toEqual(1000020);
		});
		
		it('reinforcements added correctly', function(){
			runner = new gmsim.battleRunner(merge(def, {
				'force1': "1,81,2001,2086,0,0,2001"
			}));

			expect(runner.getPlayer(1).baseReinforcements.length).toEqual(1);
		});
	});
	
	describe('Ability Tests', function(){
		var runner;
		
		beforeEach(function(){
		Math.random = function(){
				return 1;
			};
		});
		
		/*runner = new gmsim.battleRunner(merge(def, {
			'epicMode':d.em,
			'force1': d.f1,
			'force2': d.f2,
			'power1': d.p1,
			'power2': d.p2,
			'defenderLevel': d.lvl,
			'doOutput': d.out,
			'reinforcementConstraints': d.rei
		}));
		
		function bresult(){
			this.dmg1 = 0;
			this.dmg2 = 0;
			this.atkp = 0;
			this.defp = 0;
			this.h1 = 0;
			this.h2 = 0;
			this.forcedmg1 = 0;
			this.forcedmg2 = 0;
		}*/
		
		//D
		it('damage', function(){
			//using Ion Stryker with Smite 1-3
			runner = new gmsim.battleRunner(merge(def, {
				"force1": "1,81,2186,0,0",
				"defenderLevel": 89.77
			}));
			Math.random = origRandom;
			for(var i = 0; i < trials; i++){
				var res = runner.battle();
				expect(res.dmg1).toBeLessThan(3.01)
				expect(res.dmg1).toBeGreaterThan(0.99);//.toEqual(3);
			}
		});
		//flurry
		it('damage', function(){
			//using sneaky brute flurry 3x(1-3)
			runner = new gmsim.battleRunner(merge(def, {
				"force1": "1,81,2517,0,0",
				"defenderLevel": 89.77
			}));
			var res = runner.battle();
			expect(res.dmg1).toEqual(9);
		});

		//ED
		it('epic damage', function(){
			//using Anvil with 10-30
			runner = new gmsim.battleRunner(merge(def, {
				"force1": "1,81,2510,0,0",
				"defenderLevel": 89.77,
				"epicMode": 1
			}));
			var res = runner.battle();
			expect(res.dmg1).toEqual(30);
		});
		it('epic damage not counted in regular', function(){
			//using Anvil with 10-30
			runner = new gmsim.battleRunner(merge(def, {
				"force1": "1,81,2510,0,0",
				"defenderLevel": 89.77,
				"epicMode": 0
			}));
			var res = runner.battle();
			expect(res.dmg1).toEqual(0);
		});

		//H
		it('heal', function(){
			//using Attalia with 20
			runner = new gmsim.battleRunner(merge(def, {
				"force1": "1,81,1052,0,0",
				"defenderLevel": 89.77
			}));
			var res = runner.battle();
			expect(res.dmg2).toEqual(-20);
		});

		it('negative heal counts as self damage', function(){
			//using custom unit who does -25 heal
			gmsim.unitData['99999'] = {"unitName":"Gustavo","unitUnique":"1","unitClass":"0","unitType1":"0","unitType2":"0","unitAttack":"2","unitDefence":"3","unitAbilities":"222|1;","unitPriority":"3","unitIronwill":"0","unitStealth":"0"};
			runner = new gmsim.battleRunner(merge(def, {
				"force1": "1,81,99999,0,0",
				"defenderLevel": 89.77	
			}));
			var res = runner.battle();
			expect(res.dmg2).toEqual(25);
		});

		//EH
		it('epic heal', function(){
			//using purifier with 15
			runner = new gmsim.battleRunner(merge(def, {
				"force1": "1,81,4059,0,0",
				"defenderLevel": 89.77,
				"epicMode": 1
			}));
			var res = runner.battle();
			expect(res.dmg2).toEqual(-15);
		});
		it('epic heal not counted in regular', function(){
			//using purifier with 15
			runner = new gmsim.battleRunner(merge(def, {
				"force1": "1,81,4059,0,0",
				"defenderLevel": 89.77,
				"epicMode": 0
			}));
			var res = runner.battle();
			expect(res.dmg2).toEqual(0);
		});
		
		//heal and damage are both working, so we can now test dual abilities
		it('dual abilities - heal and damage', function(){
			//patriach Redemption,H,20+D,1,15
			runner = new gmsim.battleRunner(merge(def, {
				"force1": "1,81,1075,0,0",
				"defenderLevel": 89.77
			}));
			var res = runner.battle();
			expect(res.dmg1).toEqual(23);
			expect(res.dmg2).toEqual(-20);
		});
		
		//heal and damage are both working, so we can now test units with 2 abilities
		it('dual abilities - heal and damage', function(){
			//mortifex maw Leeching Bite,H,10+D,1,100
			runner = new gmsim.battleRunner(merge(def, {
				"force1": "1,81,521,0,0",
				"defenderLevel": 89.77
			}));
			var res = runner.battle();
			expect(res.dmg1).toEqual(150);
			expect(res.dmg2).toEqual(-10);
		});
		
		//PH
		it('prevent heal', function(){
			//using butcher with 10 ph
			//attalia 20 heal
			runner = new gmsim.battleRunner(merge(def, {
				"force1": "1,81,1016,0,0",
				"force2": "1,81,1052,0,0",
				"defenderLevel": 89.77
			}));
			var res = runner.battle();
			expect(res.dmg1).toEqual(-10);
			expect(res.dmg2).toEqual(0);
		});
		//EPH
		it('epic prevent heal', function(){
			//using rad lt 45 ph
			//lithid link 100 heal
			runner = new gmsim.battleRunner(merge(def, {
				"force1": "1,81,1068,0,0",
				"force2": "1,81,528,0,0",
				"defenderLevel": 89.77,
				"epicMode":1
			}));
			var res = runner.battle();
			expect(res.dmg1).toEqual(-55);
			expect(res.dmg2).toEqual(0);
		});
		it('epic prevent heal should not work in non epic mode', function(){
			//using rad lt 45 ph
			//lithid link 100 heal
			runner = new gmsim.battleRunner(merge(def, {
				"force1": "1,81,1068,0,0",
				"force2": "1,81,528,0,0",
				"defenderLevel": 89.77,
				"epicMode":0
			}));
			var res = runner.battle();
			expect(res.dmg1).toEqual(-100);
			expect(res.dmg2).toEqual(0);
		});
		
		//J
		it('jam unit', function(){
			//using Tempest jam 1 flying
			//tiamat Gravity Bomb,D,1,12
			runner = new gmsim.battleRunner(merge(def, {
				"force1": "1,81,2026,0,0",
				"force2": "1,81,2091,0,0",
				"defenderLevel": 89.77
			}));
			var res = runner.battle();
			expect(runner.getPlayer(2).getUnits().length).toEqual(1);
			expect(res.dmg2).toEqual(0);
			expect(runner.getPlayer(2).getJams()).toEqual(1);
		});
		it('multijam', function(){
			//gustmich jam 3x assault
			//4xtiamat Gravity Bomb,D,1,12
			runner = new gmsim.battleRunner(merge(def, {
				"force1": "1,81,1061,0,0",
				"force2": "1,81,2091,2091,2091,2091,0,0",
				"defenderLevel": 89.77
			}));
			var res = runner.battle();
			expect(runner.getPlayer(1).getUnits().length).toEqual(2);
			expect(runner.getPlayer(2).getUnits().length).toEqual(2);
			expect(res.dmg2).toEqual(18);
			expect(runner.getPlayer(2).getJams()).toEqual(3);
		});
		
		//PJ
		it('prevent jam unit', function(){
			//using Tempest jam 1 flying
			//tiamat Gravity Bomb,D,1,12, comsat
			runner = new gmsim.battleRunner(merge(def, {
				"force1": "1,81,2026,0,0",
				"force2": "1,81,2091,4041,0,0",
				"defenderLevel": 89.77
			}));
			var res = runner.battle();
			expect(runner.getPlayer(2).getUnits().length).toEqual(3);
			expect(res.dmg2).toEqual(18);
			expect(runner.getPlayer(2).getJams()).toEqual(0);
		});
		it('prevent multiple jams coming from same unit', function(){
			//gustmich jam 3x assault
			//tiamat Gravity Bomb,D,1,12, comsat
			runner = new gmsim.battleRunner(merge(def, {
				"force1": "1,81,1061,0,0",
				"force2": "1,81,2091,4041,4041,4041,0,0",
				"defenderLevel": 89.77
			}));
			var res = runner.battle();
			expect(runner.getPlayer(2).getUnits().length).toEqual(5);
			expect(res.dmg2).toEqual(18);
			expect(runner.getPlayer(2).getJams()).toEqual(0);
		});
		it('prevent multiple jams coming from multiple units', function(){
			//3x tempest
			//tiamat Gravity Bomb,D,1,12, comsat
			runner = new gmsim.battleRunner(merge(def, {
				"force1": "1,81,2026,2026,2026,0,0",
				"force2": "1,81,2091,4041,4041,4041,0,0",
				"defenderLevel": 89.77
			}));
			var res = runner.battle();
			expect(runner.getPlayer(2).getUnits().length).toEqual(5);
			expect(res.dmg2).toEqual(18);
			expect(runner.getPlayer(2).getJams()).toEqual(0);
		});
		it('prevent some jams coming from same unit', function(){
			//gustmich jam 3x assault
			//tiamat Gravity Bomb,D,1,12, comsat
			runner = new gmsim.battleRunner(merge(def, {
				"force1": "1,81,1061,0,0",
				"force2": "1,81,2091,2091,4041,4041,0,0",
				"defenderLevel": 89.77
			}));
			var res = runner.battle();
			expect(runner.getPlayer(2).getUnits().length).toEqual(4);
			expect(res.dmg2).toEqual(18);
			expect(runner.getPlayer(2).getJams()).toEqual(1);
		});
		
		//R
		it('reinforce unit and it can proc', function(){
			//pelican reinforce skullkeeper
			runner = new gmsim.battleRunner(merge(def, {
				"force1": "1,81,2086,0,0,1022",
				"defenderLevel": 89.77
			}));
			var res = runner.battle();
			expect(runner.getPlayer(1).getUnits().length).toEqual(3);
			expect(res.dmg1).toEqual(9);
		});
		it('can not reinforce unique unit which is already in force', function(){
			//juggernaut reinforce juggernaut
			runner = new gmsim.battleRunner(merge(def, {
				"force1": "1,81,2163,0,0,2163,1022",
				"defenderLevel": 89.77
			}));
			var res = runner.battle();
			expect(runner.getPlayer(1).getUnits().length).toEqual(3);
			expect(res.dmg1).toEqual(9);
		});
		it('can not reinforce unique unit which has already been reinforced', function(){
			//island launchports reinforce tiamat and hawkeye
			runner = new gmsim.battleRunner(merge(def, {
				"force1": "1,81,4042,4042,0,0,2091,2010",
				"defenderLevel": 89.77
			}));
			var res = runner.battle();
			expect(runner.getPlayer(1).getUnits().length).toEqual(5);
			expect(res.dmg1).toEqual(18);
		});
		it('reinforced unit can reinforce', function(){
			//juggernaut reinforce skycom neurocore reinforce skullkeepr
			runner = new gmsim.battleRunner(merge(def, {
				"force1": "1,81,2163,0,0,4033,1022",
				"defenderLevel": 89.77
			}));
			var res = runner.battle();
			expect(runner.getPlayer(1).getUnits().length).toEqual(4);
			expect(res.dmg1).toEqual(12+9);
		});
		
		//PR
		it('prevent reinforcement', function(){
			//pelican reinforce skullkeeper
			//sulfuris pit
			runner = new gmsim.battleRunner(merge(def, {
				"force1": "1,81,2086,0,0,1022",
				"force2": "1,81,4112,0,0",
				"defenderLevel": 89.77
			}));
			var res = runner.battle();
			expect(runner.getPlayer(1).getUnits().length).toEqual(2);
		});
		it('prevent 1 of several reinforces', function(){
			//seige capt reinforces medicc
			//sulfuris pit
			runner = new gmsim.battleRunner(merge(def, {
				"force1": "1,81,1054,0,0,2280",
				"force2": "1,81,4112,0,0",
				"defenderLevel": 89.77
			}));
			var res = runner.battle();
			expect(runner.getPlayer(1).getUnits().length).toEqual(5);
			expect(res.dmg2).toEqual(6+-9);
		});
		it('multi prevent reinforce in single go', function(){
			//seige capt reinforces medic
			//ruthless brute
			runner = new gmsim.battleRunner(merge(def, {
				"force1": "1,81,1054,0,0,2280",
				"force2": "1,81,2631,0,0",
				"defenderLevel": 89.77
			}));
			var res = runner.battle();
			expect(runner.getPlayer(1).getUnits().length).toEqual(4);
			expect(res.dmg2).toEqual((7+9)+-3*2);
		});
		it('multi prevent reinforce over several', function(){
			//island launchports reinforcing tiamat
			//ruthless brute
			runner = new gmsim.battleRunner(merge(def, {
				"force1": "1,81,4042,4042,4042,0,0,2091",
				"force2": "1,81,2631,0,0",
				"defenderLevel": 89.77
			}));
			var res = runner.battle();
			expect(runner.getPlayer(1).getUnits().length).toEqual(5);
			expect(res.dmg1).toEqual(18);
		});
		it('multi prevent reinforce in single go can not reinforce skipped unit', function(){
			//seige capt reinforces havoc and medics
			//acid pit
			runner = new gmsim.battleRunner(merge(def, {
				"force1": "1,81,1054,0,0,2014,2280",
				"force2": "1,81,4112,0,0",
				"defenderLevel": 89.77
			}));
			var res = runner.battle();
			expect(runner.getPlayer(1).getUnits().length).toEqual(5);
			expect(res.dmg2).toEqual(6+-9);
		});
		
		//C
		it('control unit', function(){
			//omega lithid (boss) control assault
			//hawkeye
			runner = new gmsim.battleRunner(merge(def, {
				"force1": "1,81,527,0,0",
				"force2": "1,81,2010,0,0",
				"defenderLevel": 89.77
			}));
			var res = runner.battle();
			expect(runner.getPlayer(2).getUnits().length).toEqual(1);
			expect(runner.getPlayer(1).getUnits().length).toEqual(3);
		});
		it('control priority', function(){
			//omega lithid (boss) control assault
			//hawkeye,pulsebot gets controlled
			runner = new gmsim.battleRunner(merge(def, {
				"force1": "1,81,527,0,0",
				"force2": "1,81,2010,2622,0,0",
				"defenderLevel": 89.77
			}));
			var res = runner.battle();
			expect(runner.getPlayer(1).getUnits().length).toEqual(3);
			expect(runner.getPlayer(2).getUnits().length).toEqual(2);
			expect(res.dmg1).toEqual(6);
		});
		//control unit can proc
		it('control unit and it does damage', function(){
			//omega lithid (boss) control assault
			//hawkeye
			runner = new gmsim.battleRunner(merge(def, {
				"force1": "1,81,527,0,0",
				"force2": "1,81,2091,0,0",
				"defenderLevel": 89.77
			}));
			var res = runner.battle();
			expect(runner.getPlayer(2).getUnits().length).toEqual(1);
			expect(runner.getPlayer(1).getUnits().length).toEqual(3);
			expect(res.dmg1).toEqual(18);
		});
		//control unit can reinforce
		it('control unit and it can reinforce', function(){
			//omega lithid (boss) control assault
			//pelican reinforce skullkeeper 6
			runner = new gmsim.battleRunner(merge(def, {
				"force1": "1,81,527,0,0,1022",
				"force2": "1,81,2086,0,0",
				"defenderLevel": 89.77
			}));
			var res = runner.battle();
			expect(runner.getPlayer(2).getUnits().length).toEqual(1);
			expect(runner.getPlayer(1).getUnits().length).toEqual(4);
			expect(res.dmg1).toEqual(9);
		});
		//control unit can control
		it('control unit and it can control', function(){
			//omega lithid (boss) control assault
			//lullfiend Bloodlull,D,1,7+C,1,,1, control hyperion 2230
			runner = new gmsim.battleRunner(merge(def, {
				"force1": "1,81,527,0,0",
				"force2": "1,81,2662,2230,0,0",
				"defenderLevel": 89.77
			}));
			var res = runner.battle();
			expect(runner.getPlayer(2).getUnits().length).toEqual(1);
			expect(runner.getPlayer(1).getUnits().length).toEqual(4);
			expect(res.dmg1).toEqual(11+5);
		});
		//controlled unit can be controlled back
		it('can control back a controlled unit', function(){
			//omega lithid (boss) control assault
			//tiamat, omega lithid (boss)
			runner = new gmsim.battleRunner(merge(def, {
				"force1": "1,81,527,0,0",
				"force2": "1,81,2091,527,0,0",
				"defenderLevel": 89.77
			}));
			var res = runner.battle();
			expect(runner.getPlayer(1).getUnits().length).toEqual(2);
			expect(runner.getPlayer(2).getUnits().length).toEqual(3);
			expect(res.dmg1).toEqual(0);
			expect(res.dmg2).toEqual(18);
		});
		
		//PC
		it('prevent control unit', function(){
			//omega lithid (boss) control assault
			//tiamat, fake unit with prevent control
			gmsim.unitData['99999'] = {"unitName":"Gustavo","unitUnique":"1","unitClass":"0","unitType1":"0","unitType2":"0","unitAttack":"2","unitDefence":"3","unitAbilities":"327|1;","unitPriority":"3","unitIronwill":"0","unitStealth":"0"};
			runner = new gmsim.battleRunner(merge(def, {
				"force1": "1,81,527,0,0",
				"force2": "1,81,2091,99999,0,0",
				"defenderLevel": 89.77
			}));
			var res = runner.battle();
			expect(runner.getPlayer(1).getUnits().length).toEqual(2);
			expect(runner.getPlayer(2).getUnits().length).toEqual(3);
			expect(res.dmg2).toEqual(18);
		});
		

		//AP
		it('attack power boost', function(){
			//goliath
			runner = new gmsim.battleRunner(merge(def, {
				"force1": "1,81,2031,0,0",
				"defenderLevel": 89.77,
				"power1": 1000000-360//take away goliaths attack so we have even numbers to work with
			}));
			var res = runner.battle();
			expect(res.atkp).toEqual(1250000);
		});
		
		it('attack power boosts stack multiplicatively', function(){
			//goliath
			runner = new gmsim.battleRunner(merge(def, {
				"force1": "1,81,2031,2031,0,0",
				"defenderLevel": 89.77,
				"power1": 1000000-2*360//take away goliaths attack so we have even numbers to work with
			}));
			var res = runner.battle();
			expect(res.atkp).toEqual(1000000*1.25*1.25);
		});

		it('attack power boost is capped at 200%', function(){
			//goliath
			runner = new gmsim.battleRunner(merge(def, {
				"force1": "1,81,2031,2031,2031,2031,0,0",
				"defenderLevel": 89.77,
				"power1": 1000000-4*360//take away goliaths attack so we have even numbers to work with
			}));
			var res = runner.battle();
			expect(res.atkp).toEqual(2000000);
		});
		
		//DP
		it('defence power boost', function(){
			//hydra
			runner = new gmsim.battleRunner(merge(def, {
				"force2": "1,81,2610,0,0",
				"defenderLevel": 89.77,
				"power2": 1000000-8000//take away hydra def so we have even numbers to work with
			}));
			var res = runner.battle();
			expect(res.defp).toEqual(1250000);
		});
		
		it('defence power boosts stack multiplicatively', function(){
			//hydra
			runner = new gmsim.battleRunner(merge(def, {
				"force2": "1,81,2610,2610,0,0",
				"defenderLevel": 89.77,
				"power2": 1000000-2*8000//take away hydra def so we have even numbers to work with
			}));
			var res = runner.battle();
			expect(res.defp).toEqual(1000000*1.25*1.25);
		});

		it('defence power boost is capped at 200%', function(){
			//hydra
			runner = new gmsim.battleRunner(merge(def, {
				"force2": "1,81,2610,2610,2610,2610,0,0",
				"defenderLevel": 89.77,
				"power2": 1000000-4*8000//take away hydra def so we have even numbers to work with
			}));
			var res = runner.battle();
			expect(res.defp).toEqual(2000000);
		});
		
		//UA
		it('unboost attack power', function(){
			//goliath
			//zander
			runner = new gmsim.battleRunner(merge(def, {
				"force1": "1,81,2031,0,0",
				"force2": "1,81,1072,0,0",
				"defenderLevel": 89.77,
				"power1": 1000000-360//take away goliaths attack so we have even numbers to work with
			}));
			var res = runner.battle();
			expect(res.atkp).toEqual(1000000+250000*0.75);
		});

		//UD
		it('unboost attack power', function(){
			//centurian
			//hydra
			runner = new gmsim.battleRunner(merge(def, {
				"force1": "1,81,2621,0,0",
				"force2": "1,81,2610,0,0",
				"defenderLevel": 89.77,
				"power2": 1000000-8000//take away hydra def so we have even numbers to work with
			}));
			var res = runner.battle();
			expect(res.defp).toEqual(1000000+250000*0.75);
		});
		
		//S
		it('summon ability', function(){
			//reclamax summons enclave razor
			runner = new gmsim.battleRunner(merge(def, {
				"force1": "1,81,2664,0,0",
				"defenderLevel": 89.77
			}));
			var res = runner.battle();
			expect(res.dmg1).toEqual(12+15);
			expect(runner.getPlayer(1).getUnits().length).toEqual(3);
		});

		it('summon ability places units in front of force', function(){
			//reclamax summons enclave razor
			//reaper should jam razor instead of reclamax
			runner = new gmsim.battleRunner(merge(def, {
				"force1": "1,81,2664,0,0",
				"force2": "1,81,2095,0,0",
				"defenderLevel": 89.77
			}));
			var res = runner.battle();
			expect(res.dmg1).toEqual(12);
			expect(runner.getPlayer(1).getUnits().length).toEqual(2);
		});

		//RA
		it('rally', function(){
			//hyperion, beowulf
			runner = new gmsim.battleRunner(merge(def, {
				"force1": "1,81,2230,4055,0,0",
				"defenderLevel": 89.77
			}));
			var res = runner.battle();
			expect(res.dmg1).toEqual(6);
		});
		it('more than 1 point of rally', function(){
			//hyperion, equalizer
			runner = new gmsim.battleRunner(merge(def, {
				"force1": "1,81,2230,2606,0,0",
				"defenderLevel": 89.77
			}));
			var res = runner.battle();
			expect(res.dmg1).toEqual(7);
		});
		it('2 sources of rally', function(){
			//hyperion, beowulf, equalizer
			runner = new gmsim.battleRunner(merge(def, {
				"force1": "1,81,2230,2606,4055,0,0",
				"defenderLevel": 89.77
			}));
			var res = runner.battle();
			expect(res.dmg1).toEqual(8);
		});

		//RE
		it('reduction', function(){
			//hyperion
			//photonic shield generator
			runner = new gmsim.battleRunner(merge(def, {
				"force1": "1,81,2230,0,0",
				"force2": "1,81,4056,0,0",
				"defenderLevel": 89.77
			}));
			var res = runner.battle();
			expect(res.dmg1).toEqual(4);
		});
		//reduce flurry
		it('reduction on flurry', function(){
			//sneaky brute Flurry,D,3,2
			//photonic shield generator
			runner = new gmsim.battleRunner(merge(def, {
				"force1": "1,81,2517,10600,0",
				"force2": "1,81,4056,0,0",
				"defenderLevel": 89.77
			}));
			var res = runner.battle();
			expect(res.dmg1).toEqual(3*(3-1));
		});
		//reduce rally
		it('reduction on flurry', function(){
			//sneaky brute Flurry,D,3,2, barracus
			//photonic shield generator
			runner = new gmsim.battleRunner(merge(def, {
				"force1": "1,81,2517,1060,0,0",
				"force2": "1,81,4056,0,0",
				"defenderLevel": 89.77
			}));
			var res = runner.battle();
			expect(res.dmg1).toEqual((9-1)+3*(3+1-1));
		});

		//AS
		it('anti-shield', function(){
			//lionheart
			//photonic shield generator
			runner = new gmsim.battleRunner(merge(def, {
				"force1": "1,81,2663,0,0",
				"force2": "1,81,4056,0,0",
				"defenderLevel": 89.77
			}));
			var res = runner.battle();
			expect(res.dmg1).toEqual(37);
		});
		it('anti-shield cant reduce past 0', function(){
			//lionheartx2
			//photonic shield generator
			runner = new gmsim.battleRunner(merge(def, {
				"force1": "1,81,2663,2663,0,0",
				"force2": "1,81,4056,0,0",
				"defenderLevel": 89.77
			}));
			var res = runner.battle();
			expect(res.dmg1).toEqual(2*37);
		});

		//HE
		it('heal for each', function(){
			//petrol rig 1.25 for each naval
			runner = new gmsim.battleRunner(merge(def, {
				"force1": "1,81,4028,2151,2151,2151,0,0",
				"defenderLevel": 89.77
			}));
			var res = runner.battle();
			expect(res.dmg2).toEqual(gmsim.roundHalfOdd(-1.875*3));
		});
		it('heal for each does nothing with 0 units', function(){
			//petrol rig 1.25 for each naval
			runner = new gmsim.battleRunner(merge(def, {
				"force1": "1,81,4028,0,0",
				"defenderLevel": 89.77
			}));
			var res = runner.battle();
			expect(res.dmg2).toEqual(0);
		});
		it('heal for each can be capped', function(){
			//gaia + knights
			runner = new gmsim.battleRunner(merge(def, {
				"force1": "1,81,1070,2181,2181,2181,2181,2181,2181,2181,2181,2181,2181,2181,2181,2181,2181,2181,2181,2181,2181,2181,2181,2181,2181,2181,2181,2181,2181,2181,2181,2181,2181,2181,2181,2181,2181,2181,2181,0,0",
				"defenderLevel": 89.77
			}));
			var res = runner.battle();
			expect(res.dmg2).toEqual(-80);
		});

		//DE
		it('damage for each', function(){
			//gungnir DE,1.5,,6, D,4,4
			//Xeno Interceptor
			runner = new gmsim.battleRunner(merge(def, {
				"force1": "1,81,4057,0,0",
				"force2": "1,81,2104,2104,2104,0,0",
				"defenderLevel": 89.77
			}));
			var res = runner.battle();
			expect(res.dmg1).toEqual(24+gmsim.roundHalfOdd(3*2.25));
		});
		it('damage for each does nothing with no units', function(){
			//gungnir DE,1.5,,6, D,4,4
			runner = new gmsim.battleRunner(merge(def, {
				"force1": "1,81,4057,0,0",
				"defenderLevel": 89.77
			}));
			var res = runner.battle();
			expect(res.dmg1).toEqual(24);
		});

		//DR
		it('damage for each reinforced unit', function(){
			//blitz 2.5
			//launchports reinforcing hawkeyes
			runner = new gmsim.battleRunner(merge(def, {
				"force1": "1,81,2601,0,0",
				"force2": "1,81,4042,4042,4042,0,0,2010",
				"defenderLevel": 89.77
			}));
			var res = runner.battle();
			expect(res.dmg1).toEqual(gmsim.roundHalfOdd(3*3.75));
		});

		//DJ
		it('damage for each friendly unit jammed', function(){
			//infantry tarantula 2 + 7
			//viral clusters
			runner = new gmsim.battleRunner(merge(def, {
				"force1": "1,81,2001,2001,2001,2604,0,0",
				"force2": "1,81,4034,4034,4034,0,0",
				"defenderLevel": 89.77
			}));
			var res = runner.battle();
			expect(res.dmg1).toEqual(11+gmsim.roundHalfOdd(3*3));
		});

		//DJE
		it('damage for each enemy unit jammed', function(){
			//guulak
			//infantry
			runner = new gmsim.battleRunner(merge(def, {
				"force1": "1,81,2667,0,0",
				"force2": "1,81,2001,2001,2001,2001,2001,2001,2001,0,0",
				"defenderLevel": 89.77
			}));
			var res = runner.battle();
			expect(res.dmg1).toEqual(gmsim.roundHalfOdd(5*4.5));
		});
		it('damage for each enemy unit jammed with maximum damage', function(){
			//guulak, viral clusters
			//infantry
			runner = new gmsim.battleRunner(merge(def, {
				"force1": "1,81,2667,4034,4034,4034,4034,4034,4034,4034,4034,4034,4034,4034,4034,4034,4034,4034,4034,4034,4034,4034,4034,4034,0,0",
				"force2": "1,81,2001,2001,2001,2001,2001,2001,2001,2001,2001,2001,2001,2001,2001,2001,2001,2001,2001,2001,2001,2001,2001,0,0",
				"defenderLevel": 89.77
			}));
			var res = runner.battle();
			expect(res.dmg1).toEqual(60);
		});

		//HJ
		it('heal for each friendly unit jammed', function(){
			//hydropod (no proc naval), selfless soldier
			//spec ops
			runner = new gmsim.battleRunner(merge(def, {
				"force1": "1,81,2194,2194,2194,2603,0,0",
				"force2": "1,81,2153,2153,2153,0,0",
				"defenderLevel": 89.77
			}));
			var res = runner.battle();
			expect(res.dmg1).toEqual(3);
			expect(res.dmg2).toEqual(-gmsim.roundHalfOdd(3*7.5));
		});
		
		//DH
		it('damage for each point of enemy healing', function(){
			//betrach
			//attalia 20
			runner = new gmsim.battleRunner(merge(def, {
				"force1": "1,81,1052,2665,0,0",
				"force2": "1,81,0,0",
				"defenderLevel": 89.77
			}));
			var res = runner.battle();
			expect(res.dmg1).toEqual(gmsim.roundHalfOdd(20*0.375));
		});
		/*it('damage for each point of enemy healing capped', function(){
			//cap not working in real war metal, so ignore this for now
		});*/
		
		//DB
		/*"Boosts to the same class are added together, for example a 50% boost and a 25% boost will result in a 75% boost. This is most evident when observing the Sentinel Cannons in Sentinel Undying; their base damage is 10-30 and if you let all 12 whips boost them by 50% each, their range will be 70-210 (700% of the base damage range). - http://greymarch.x10.mx/numbers.php"*/
		it('damage boost for type', function(){
			//opak, dawnbringer 15
			runner = new gmsim.battleRunner(merge(def, {
				"force1": "1,81,1067,2659,0,0",
				"defenderLevel": 89.77
			}));
			var res = runner.battle();
			expect(res.dmg1).toEqual(gmsim.roundHalfOdd(15*1.25));
		});
		it('damage boost for class', function(){
			//juggeranut overlord, fission charge 23
			runner = new gmsim.battleRunner(merge(def, {
				"force1": "1,81,2620,4045,0,0",
				"defenderLevel": 89.77
			}));
			var res = runner.battle();
			expect(res.dmg1).toEqual(gmsim.roundHalfOdd(23*1.3));
		});
		it('damage boost for same class stack', function(){
			//opakx2, dawnbringer 15
			runner = new gmsim.battleRunner(merge(def, {
				"force1": "1,81,1067,1067,2659,0,0",
				"defenderLevel": 89.77
			}));
			var res = runner.battle();
			expect(res.dmg1).toEqual(gmsim.roundHalfOdd(15*1.5));
		});
		it('2 types of boosts stack', function(){
			//opak, ryoko, dawnbringer 15
			runner = new gmsim.battleRunner(merge(def, {
				"force1": "1,81,1067,1040,2659,0,0",
				"defenderLevel": 89.77
			}));
			var res = runner.battle();
			expect(res.dmg1).toEqual(6+gmsim.roundHalfOdd(15*1.5));
		});
		it('boosts stack with rally correctly', function(){
			//opak, dawnbringer 15, purity augment
			runner = new gmsim.battleRunner(merge(def, {
				"force1": "1,81,1067,2659,9004,0,0",
				"defenderLevel": 89.77
			}));
			var res = runner.battle();
			expect(res.dmg1).toEqual(gmsim.roundHalfOdd(15*1.25+1));//note the rounding is applied at the end
		});
		
		//test requirements for abilities
		it('ability with requirements not met will not proc', function(){
			//exodrone 7 requires 3x robotic, hyperion (no damage) robotic
			runner = new gmsim.battleRunner(merge(def, {
				"force1": "1,81,2018,2330,0,0",
				"defenderLevel": 89.77
			}));
			var res = runner.battle();
			expect(res.dmg1).toEqual(0);
		});
		it('ability with requirements met will proc', function(){
			//exodrone 7 requires 3x robotic, hyperions (no damage) robotic
			runner = new gmsim.battleRunner(merge(def, {
				"force1": "1,81,2018,2330,2330,0,0",
				"defenderLevel": 89.77,
			}));
			var res = runner.battle();
			expect(res.dmg1).toEqual(7);
		});
		
		//reinforcement limiting
		it('set the maximum number of reinforcements', function(){
			//gnorax non-enraged
			runner = new gmsim.battleRunner(merge(def, {
				"force1": "1,81,539,539,539,539,540,541,541,541,541,541,541,0,0,542,0,0",
				"defenderLevel": 89.77,
				"reinforcementConstraints": "542|6;"
			}));
			var res = runner.battle();
			expect(runner.getPlayer(1).getUnits().length).toEqual(18);
		});
		it('reinforce less than maximum number of reinforcements', function(){
			//gnorax non-enraged
			runner = new gmsim.battleRunner(merge(def, {
				"force1": "1,81,539,539,539,539,540,541,541,541,541,541,541,0,0,542,0,0",
				"defenderLevel": 89.77,
				"reinforcementConstraints": "542|456;"
			}));
			var res = runner.battle();
			expect(runner.getPlayer(1).getUnits().length).toEqual(22);
		});
		it('reinforce others after maximum reached, multiple maximums', function(){
			//seige captain and medics
			//should reinforce 2 medics, 1 infantry, and 1 commando
			runner = new gmsim.battleRunner(merge(def, {
				"force1": "1,81,1054,0,0,2280,2001,2202",
				"defenderLevel": 89.77,
				"reinforcementConstraints": "2280|2;2001|1;"
			}));
			var res = runner.battle();
			expect(res.dmg2).toEqual(-3*2);
			expect(runner.getPlayer(1).getUnits().length).toEqual(6);
		});
		
		it('formations can proc', function(){
			//artemis formation, fission charge 23
			runner = new gmsim.battleRunner(merge(def, {
				"force1": "1,50,4045,0,0",
				"defenderLevel": 89.77
			}));
			var res = runner.battle();
			expect(res.dmg1).toEqual(gmsim.roundHalfOdd(23*1.3));
		});
		
	});
});

