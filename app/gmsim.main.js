'use strict';

/*
	setup (either called or through worker)
		players are created with base info
	battle
		copies of forces created
		for each unit in force/reinforcements
			for each ability (each ability id is only parsed once per setup)
				parse parts of ability
		for each phase, each units will execute all of it's abilities in that phase
		results		
*/

var gmsim = gmsim || {};

//struct that holds info about a battle
gmsim.bresult = function(){
	this.dmg1 = 0;
	this.dmg2 = 0;
	this.atkp = 0;
	this.defp = 0;
	this.h1 = 0;
	this.h2 = 0;
	this.forcedmg1 = 0;
	this.forcedmg2 = 0;
	
	this.currCount1 = {};
	this.currCount2 = {};
	this.jamCount1 = {};
	this.jamCount2 = {};
	this.dmgs1 = {};
	this.dmgs2 = {};
	this.heals1 = {};
	this.heals2 = {};
};

gmsim.PHASE_TAG = {
	NONE : -1,
	PRE : 0,
	JAM : 1,
	CONTROL : 2,
	SPECIAL : 3,
	MAIN : 4,
	POST : 5
};

gmsim.battleRunner = function(args){
	args = args || {};
	this.outputText = "";
	this.abilityTable = [];
	this.maxReinfs = {};
	this.doOutput = args['doOutput'] || 0;
	//throw "!"+JSON.stringify(gmsim.Unit);
	//setup the players
	this.player1 = new gmsim.Player();
	this.player1.setIDp(1);
	var p1 = (args['power1'] || 1000000);
	this.player1.setAttack(p1.toString().replace(/,/g,""));

	this.player2 = new gmsim.Player();
	this.player2.setIDp(2);
	var p2 = (args['power2'] || 1000000);
	this.player2.setDefence(p2.toString().replace(/,/g,""));
	
	this.epicMode = args['epicMode'] || 0;
	
	gmsim.unitData = args['unitData'] || gmsim.unitData || unitData || {};
	gmsim.skillData = args['skillData'] || gmsim.skillData || skillData ||{};
	gmsim.typeData = args['typeData'] || gmsim.typeData || typeData || {};
	gmsim.subtypeData = args['subtypeData'] || gmsim.subtypeData ||subtypeData || {};

	this.maxBase = Math.round(2*320*gmsim.log10((args['defenderLevel'] || 1000)/100)+30);//2* added due to 8/Sept/2013 update
	if(this.maxBase != 0){
		if(this.epicMode == 1)
			this.maxBase = 30;//max 30 for bosses added due to 8/Sept/2013 update
		else
			this.maxBase = Math.max(this.maxBase, 30);
	}
	
	var force1 = args['force1'] || '1,81,0,0,';
	var force2 = args['force2'] || '1,81,0,0,';
		
	//some bosses have extra ability to reinforce some units
	//store the maximum amount of reinforcements for each unit
	//then add the reinforce unit to the end of the force
	//e.g. gnorax head reinforces 10 units, but is limited to 6 when not enraged
	var rei = args['reinforcementConstraints'] || '';
	if(rei != ''){
		var defaultReinforcements = rei.split(";");
		var indexes = [];
		for(var i = 0; i < defaultReinforcements.length; i++){
			if(defaultReinforcements[i] == '')
				continue;
			var reparts = defaultReinforcements[i].split('|');
			var renum = reparts[1];
			var reid = reparts[0];
			this.maxReinfs[parseInt(reid)] = renum;
		}
	}

	//prepare the players
	this.player1.buildForce(force1);
	this.player2.buildForce(force2);
	this.player1.initStats();
	this.player2.initStats();
};

gmsim.battleRunner.prototype.setText = function(t){
	this.outputText = t;
};
gmsim.battleRunner.prototype.getText = function(t){
	return this.outputText;
};

gmsim.battleRunner.prototype.getPlayer = function(t){
	if(t == 2)
		return this.player2;
	else
		return this.player1;
};

gmsim.battleRunner.prototype.battle = function(){
	//resets the players force and stats that change during battles
	this.player1.prepare(this);
	this.player2.prepare(this);

	//go through each battle phase
	for(var i = 0, n = Object.keys(gmsim.PHASE_TAG).length-1; i < n; i++){
		this.player1.phase(i, this.player2, this.doOutput);
		this.player2.phase(i, this.player1, this.doOutput);
	}	
	
	if(this.epicMode == 0){
		var atkp = this.player1.getAttack();
		var defp = this.player2.getDefence();
	}else{
		var atkp = this.player1.getRawAttack();
		var defp = this.player2.getRawDefence();
	}
	
	//choose a 'mid-point' for the base damage
	var r = 2 + Math.random();
	var mult = 1;
	if(this.epicMode == 1){//epic have much less variation than pvp, minimum player damage is also 10 instead of 1
		r = 2.4 + Math.random()/5;
		mult = 10;
	}
	
	//the mythical base damage formula
	//from the semi-random mid-point, move away from it logarithmicly based on the ratio between atk/def powers
	//bound within max and min damage
	var atkval = Math.round(Math.min(Math.max(this.maxBase/r + 0.75*this.maxBase*gmsim.log10(atkp/defp) + 1, mult), this.maxBase));
	var defval = Math.round(Math.min(Math.max(this.maxBase/r - 0.75*this.maxBase*gmsim.log10(atkp/defp) + 1, 1), this.maxBase));

	var finalp1 = atkval + this.player1.getTotalDamage() - this.player2.getTotalHeal();
	var finalp2 = defval + this.player2.getTotalDamage() - this.player1.getTotalHeal();
	
	//prepare the battle result report
	var res = new gmsim.bresult();
	res.dmg1 = finalp1;
	res.dmg2 = finalp2;
	res.h1 = this.player1.getTotalHeal();
	res.h2 = this.player2.getTotalHeal();
	res.atkp = atkp;
	res.defp = defp;
	res.forcedmg1 = atkval;
	res.forcedmg2 = defval;
	res.currCount1 = this.player1.reinfEntered;
	res.currCount2 = this.player2.reinfEntered;
	res.jamCount1 = this.player1.jamCount;
	res.jamCount2 = this.player2.jamCount;
	res.dmgs1 = this.player1.trackDamage;
	res.dmgs2 = this.player2.trackDamage;
	res.heals1 = this.player1.trackHeal;
	res.heals2 = this.player2.trackHeal;
	
	return res;
};

//random between 2 numbers
gmsim.rand = function(a,b){
	return a + (b-a)*Math.random();
};

//return true p% of the time
gmsim.proc = function(p){
	return (1-p <= Math.random());
};

//shortcut for log base 10
gmsim.log10 = function(x){
	return Math.log(x)/Math.LN10;
};

//round to x decimal places
gmsim.roundToX = function(num, dec){
	var result = Math.round(num*Math.pow(10,dec))/Math.pow(10,dec);
	return result;
};

//the rounding function used by WM
//use regular round
//in the event of a x.5 number, round to the nearest odd
gmsim.roundHalfOdd = function(num){
	var floored = Math.floor(num);
	
	//do nothing if already rounded
	if(floored === num)
		return num;
	
	//use regular round unless at x.5
	if(num-floored !== 0.5)
		return Math.round(num);
	
	//if the floor is even, then we should've rounded to the next number
	if(floored % 2 == 0)
		return floored+1;
	else
		return floored;
};

gmsim.runner = null;
if(typeof(importScripts) !== "undefined"){
	self.addEventListener('message', function(e) {
		var d = e.data;
		switch(d.cmd){
			case 'setup':
				try{
					if(typeof d.url === 'undefined')
						d.url = "";
					if(typeof gmsim.Player === 'undefined')
						importScripts(d.url+"gmsim.player.js");
					if(typeof gmsim.Unit === 'undefined')
						importScripts(d.url+"gmsim.unit.js");
					if(typeof gmsim.Ability === 'undefined')
						importScripts(d.url+"gmsim.ability.js");
					if(typeof d.simdata !== 'undefined')
						importScripts(d.url+d.simdata);
					
					gmsim.unitData = gmsim.unitData || unitData;
					gmsim.skillData = gmsim.skillData || skillData;
					gmsim.typeData = gmsim.typeData || typeData;
					gmsim.subtypeData = gmsim.subtypeData || subtypeData;

					gmsim.runner = new gmsim.battleRunner({
						'epicMode':d.epicMode || 0,
						'force1': d.force1 || "1,81,0,0",
						'force2': d.force2 || "1,81,0,0",
						'power1': d.power1 || 0,
						'power2': d.power2 || 0,
						'defenderLevel': d.defenderLevel || 89.77,
						'doOutput': d.doOutput || 0,
						'reinforcementConstraints': d.reinforcementConstraints || ""
					});
					self.postMessage({'msg': 'setup'});
				}
				catch(err){
					self.postMessage({'msg': 'error', 'content': err});
				}
				break;
			case 'battle':
				try{
					if(gmsim.runner === null)
						throw 'runner not defined';
					gmsim.runner.setText('');
					var b = gmsim.runner.battle();
					self.postMessage({'msg': 'battle', 'str': gmsim.runner.getText(), 'result': b});
				}
				catch(err){
					self.postMessage({'msg': 'error', 'content': err});
				}
				break;
		};
	}, false);
}else{
	//not workers
}
