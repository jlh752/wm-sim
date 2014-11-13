'use strict';

gmsim.Player = function(){
	this.id = 0;
	this.baseAttack = 0;
	this.baseDefence = 0;
	this.force = [];
	this.baseReinforcements = [];
	
	//stat tracking
	this.reinfEntered = {};
	this.jamCount = {};
	this.contCount = {};
	this.trackDamage = {};
	this.trackHeal = {};
	
	this.runner = undefined;
};

gmsim.Player.prototype.prepare = function(runner){
	this.runner = runner;
	this.resetStats();//clear old battle data
	this.setUnits(this.force, runner);//move stored force to active force
	this.setReinforcements(this.baseReinforcements);//same for refs

	//decide if each active unit will proc
	//if proccing, the ability will be prepared if not already
	for(var uu in this.units){
		this.units[uu].parseAbilities(this);
	}
};

//reset self to pre-battle conditions
gmsim.Player.prototype.resetStats = function(){
	this.preventJams = 0;
	this.preventReinforcements = 0;
	this.preventControls = 0;
	
	this.jammed = 0;
	this.reinforced = 0;
	
	this.attack = this.baseAttack;
	this.unboostAttackv = 1;
	this.defense = this.baseDefence;
	this.unboostDefencev = 1;
	
	this.preventHeal = 0;
	this.total_damage = 0;
	this.total_heal = 0;
	this.unitMultiplierUnit = {};
	this.unitAdditionUnit = {};
	this.unitMultiplierType = {};
	this.unitAdditionType = {};
	this.unitMultiplierClass = {};
	this.unitAdditionClass = {};
	this.unit_reduction = 0;
	this.unitAntishield = 0;
	
	this.units = [];
	this.reinforcements = [];
};

//prepare the counters, initialising them this way will save us a bunch of 'already exists' checks later
//------this could be calculate only on setup
gmsim.Player.prototype.initStats = function(){
	if(Object.keys(this.reinfEntered).length == 0){
		for(var p in this.baseReinforcements){
			this.reinfEntered[this.baseReinforcements[p]] = 0;
		}
	}
	if(Object.keys(this.jamCount).length == 0){
		for(var p in this.force){
			this.jamCount[this.force[p].getID()] = 0;
		}
	}
	if(Object.keys(this.contCount).length == 0){
		for(var p in this.force){
			this.contCount[this.force[p].getID()] = 0;
		}
	}
}

//just getter/setter functions
gmsim.Player.prototype.setIDp = function(ID){
	this.id = ID;
};
gmsim.Player.prototype.getIDp = function(){
	return this.id;
};
gmsim.Player.prototype.setPreventJams = function(pj){
	this.preventJams = pj;
};
gmsim.Player.prototype.getPreventJams = function(){
	return this.preventJams;
};
gmsim.Player.prototype.setPreventControls = function(pj){
	this.preventControls = pj;
};
gmsim.Player.prototype.getPreventControls = function(){
	return this.preventControls;
};
gmsim.Player.prototype.setPreventReinforcements = function(pj){
	this.preventReinforcements = pj;
};
gmsim.Player.prototype.getPreventReinforcements = function(){
	return this.preventReinforcements;
};
gmsim.Player.prototype.setJams = function(j){
	this.jammed = j;
};
gmsim.Player.prototype.getJams = function(){
	return this.jammed;
};
gmsim.Player.prototype.setReinforced = function(r){
	this.reinforced = r;
};
gmsim.Player.prototype.getReinforced = function(){
	return this.reinforced;
};

//getter/setters for the pvp stats
//setting attack resets all the multipliers etc
gmsim.Player.prototype.setAttack = function(a){
	a = parseInt(a);
	this.attack = a;
	this.baseAttack = a;
	this.unboostAttackv = 1;
};
//attack is upper bounded to 200%
gmsim.Player.prototype.addAttack = function(a){
	this.attack = Math.min(2*this.baseAttack, this.attack+a);
};
gmsim.Player.prototype.mulAttack = function(a){
	this.attack = Math.min(2*this.baseAttack, this.attack*(1+a));
};
gmsim.Player.prototype.unboostAttack = function(a){
	this.unboostAttackv = this.unboostAttackv*(1-a);
};
//attack boosters do not work in epics
gmsim.Player.prototype.getAttack = function(a){
	return (this.baseAttack + (this.attack - this.baseAttack)*Math.max(0, this.unboostAttackv));
};
gmsim.Player.prototype.getRawAttack = function(a){
	return this.baseAttack;
};
gmsim.Player.prototype.setDefence = function(a){
	a = parseInt(a);
	this.defense = a;
	this.baseDefence = a;
	this.unboostDefencev = 1;
};
gmsim.Player.prototype.addDefence = function(a){
	this.defense = Math.min(2*this.baseDefence, this.defense+a);
};
gmsim.Player.prototype.mulDefence = function(a){
	this.defense = Math.min(2*this.baseDefence, this.defense*(1+a));
};
gmsim.Player.prototype.unboostDefence = function(a){
	this.unboostDefencev = this.unboostDefencev*(1-a);
};
gmsim.Player.prototype.getDefence = function(a){
	return (this.baseDefence + (this.defense - this.baseDefence)*Math.max(0, this.unboostDefencev));
};
gmsim.Player.prototype.getRawDefence = function(a){
	return this.baseDefence;
};

//create copy of units stored in the master force
gmsim.Player.prototype.setUnits = function(u, runner){
	this.units = [];
	for(var U in u){
		var uu = new gmsim.Unit(runner);
		uu.setID(u[U].id); 
		this.units.push(uu);
	}
};
gmsim.Player.prototype.addUnit = function(u){
	this.units = this.units.concat(u);
};
gmsim.Player.prototype.prependUnit = function(u){
	this.units.unshift(u);
};
gmsim.Player.prototype.getUnits = function(){
	return this.units;
};
gmsim.Player.prototype.getForce = function(){
	return this.force;
};
//create a duplicate of the array, rather than just copy it's reference
gmsim.Player.prototype.setReinforcements = function(u){
	this.reinforcements = u.slice(0);
};
gmsim.Player.prototype.add_reinforcements = function(u){
	this.reinforcements = this.reinforcements.concat(u);
};
gmsim.Player.prototype.removeReinforcements = function(id){
	for(var key in this.reinforcements){
		if(this.reinforcements[key] == id){
			this.reinforcements.splice(key,1);
			break;
		}
	}
};
gmsim.Player.prototype.getReinforcements = function(){
	return this.reinforcements;
};

//more getters/setters
gmsim.Player.prototype.setPreventHeal = function(p){
	this.preventHeal = p;
};
gmsim.Player.prototype.getPreventHeal = function(){
	return this.preventHeal;
};
gmsim.Player.prototype.setTotalDamage = function(d){
	this.total_damage = d;
};
gmsim.Player.prototype.getTotalDamage = function(){
	return this.total_damage;
};
gmsim.Player.prototype.setTotalHeal = function(d){
	this.total_heal = d;
};
gmsim.Player.prototype.getTotalHeal = function(){
	return this.total_heal;
};

gmsim.Player.prototype.addReduction = function(amount){
	this.unit_reduction += amount;
};
gmsim.Player.prototype.getReduction = function(){
	return this.unit_reduction;
};
gmsim.Player.prototype.addAntishield = function(amount){
	this.unitAntishield += amount;
};
gmsim.Player.prototype.getAntishield = function(){
	return this.unitAntishield;
};

//set the multiplier to 0 if it doesn't exist, then add the multiplier
//multipliers stack addditively rather than multiplicatively
//_id is for unit specific boosts, _t is for type (assault, etc) boosts, _c is for class (robotic, etc) boosts
gmsim.Player.prototype.addMultiplierUnit = function(name, amount){
	if(this.unitMultiplierUnit[name] == undefined)
		this.unitMultiplierUnit[name] = 0;
	this.unitMultiplierUnit[name] += amount;
};
gmsim.Player.prototype.getMultiplierUnit = function(name){
	if(!(name in this.unitMultiplierUnit))
		return 0;
	else
		return this.unitMultiplierUnit[name];
};
gmsim.Player.prototype.addMultiplierType = function(name, amount){
	if(this.unitMultiplierType[name] == undefined)
		this.unitMultiplierType[name] = 0;
	this.unitMultiplierType[name] += amount;
};
gmsim.Player.prototype.getMultiplierType = function(name){
	if(!(name in this.unitMultiplierType))
		return 0;
	else
		return this.unitMultiplierType[name];};
gmsim.Player.prototype.addMultiplierClass = function(name, amount){
	if(this.unitMultiplierClass[name] == undefined)
		this.unitMultiplierClass[name] = 0;
	this.unitMultiplierClass[name] += amount;
};
gmsim.Player.prototype.getMultiplierClass = function(name){
	if(!(name in this.unitMultiplierClass))
		return 0;
	else
		return this.unitMultiplierClass[name];
};

//addition function work in the same way as the multiplier functions
gmsim.Player.prototype.addAdditionUnit = function(name, amount){
	if(!(name in this.unitAdditionUnit))
		this.unitAdditionUnit[name] = 0;
	this.unitAdditionUnit[name] += amount;
};
gmsim.Player.prototype.getAdditionUnit = function(name){
	if(!(name in this.unitAdditionUnit))
		return 0;
	else
		return this.unitAdditionUnit[name];
};
gmsim.Player.prototype.addAdditionType = function(name, amount){
	if(!(name in this.unitAdditionType))
		this.unitAdditionType[name] = 0;
	this.unitAdditionType[name] += amount;
};
gmsim.Player.prototype.getAdditionType = function(name){
	if(!(name in this.unitAdditionType))
		return 0;
	else
		return this.unitAdditionType[name];
};
gmsim.Player.prototype.addAdditionClass = function(name, amount){
	if(!(name in this.unitAdditionClass))
		this.unitAdditionClass[name] = 0;
	this.unitAdditionClass[name] += amount;
};
gmsim.Player.prototype.getAdditionClass = function(name){
	if(!(name in this.unitAdditionClass))
		return 0;
	else
		return this.unitAdditionClass[name];
};


//setup the force
//force looks like this <time [redundant]>,<formation id>,<units ids>,..,<boost1>,<boost2>,<reinforcements>,..
gmsim.Player.prototype.buildForce = function(force){
	var Units = force.split(",");
	var time = Units.shift();//we don't need this, just remove it
	var formation1 = parseInt(Units.shift());//get the formation id

	if((7000+formation1) in gmsim.unitData){
		//use a unit to represent the formation
		var u = new gmsim.Unit(this.runner);
		u.setID(7000+formation1);
		this.force.push(u);
	}
	 
	var mode = 0;//track which part of the formation we are on
	//the force data format was not originally designed for this, so it is not the most elegant solution
	
	for(var id_ in Units){
		if(Units[id_] == '' || !(Units[id_] in gmsim.unitData)) continue;
		var id = parseInt(Units[id_]);
		if(mode != 2){//not in reinforcements mode
			var uc = 0;
			if(id in gmsim.unitData)
				uc = gmsim.unitData[id]['unitClass'];
			if(mode == 1 && uc != 7){//end boosts
				mode = 2;//begin reinforcements
			}else{
				if(mode == 0 && (uc == 7 || id == 0)){//start boosts
					mode = 1;
				}
				
				if(id > 10){//any id less than 10 is a place holder, regrettable design choice in the force code syntax a long time ago
					u = new gmsim.Unit(this.runner);
					u.setID(id);
					this.force.push(u);
					this.baseAttack += 10*parseInt(gmsim.unitData[id]['unitAttack']);
					this.baseDefence += 10*parseInt(gmsim.unitData[id]['unitDefence']);
				}
			}
		}
		if(mode == 2){
			if(id > 10){
				this.baseReinforcements.push(id);
			}
		}
	}


};

//remove the target unit from the force. could be better but copes with the current game mechanics
gmsim.Player.prototype.removeUnit = function(target){
	var s = null;
	for(var u in this.units){
		if(this.units[u].getID() == target){
			s = this.units[u];
			this.units.splice(u, 1);
			break;
		}
	}
	return s;
};

//execute a phase
gmsim.summonList = [];
gmsim.Player.prototype.phase = function(phase, other, dout){
	gmsim.summonList = [];
	for(var i = 0; i < this.units.length; i++){
		this.units[i].proc(this, other, phase, dout);
	}
	this.phaseEnd();
};

//after implementing each ability as separate modules
gmsim.Player.prototype.phaseEnd = function(){
	//summon units if necessary
	//not nice, but prepending them while parsing abilities will break the iteration
	for(var sl in gmsim.summonList){
		var nu = new gmsim.Unit(this.runner);
		nu.setID(gmsim.summonList[sl]);
		nu.setReinforced(1);
		nu.parseAbilities(this);
		this.prependUnit(nu);
	}
};