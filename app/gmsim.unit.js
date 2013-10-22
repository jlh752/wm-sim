'use strict';

gmsim.Unit = function(runner){
	this.id = 0;
	this.reinforced = 0;
	this.abilities = [];
	this.runner = runner;
};
gmsim.Unit.prototype.setID = function(ID){
	this.id = ID;
};
gmsim.Unit.prototype.getID = function(){
	return this.id;
};
gmsim.Unit.prototype.setReinforced = function(Reinforced){
	this.reinforced = Reinforced;
};
gmsim.Unit.prototype.getReinforced = function(){
	return this.reinforced;
};
gmsim.Unit.prototype.abilitiesAdd = function(ab){
	this.abilities.push(ab);
};
gmsim.Unit.prototype.abilitiesGet = function(){
	return this.abilities;
};

//for each ability this unit has check if it procs
//if it procs, parse it. use the cache if this ability has already been parsed
//stored in format <ability id>|<proc chance>;<ability id>|<proc chance>;...
gmsim.Unit.prototype.parseAbilities = function(player){
	var abilities = gmsim.unitData[this.id]['unitAbilities'].split(';');
	for(var a in abilities){
		var t = abilities[a].split('|');
		var abID = t[0];
		var did_proc = gmsim.proc(parseFloat(t[1]));

		if(did_proc){
			if(!(abID in this.runner.abilityTable)){
				var ab = new gmsim.Ability(abID, this.runner);
				ab.parse(player);
				this.runner.abilityTable[abID] = ab;
			}else{
				this.runner.abilityTable[abID].parse(player);
			}
			this.abilitiesAdd(abID);
		}
	}
};

//go
gmsim.Unit.prototype.proc = function(owner, other, phase, dout){
	for(var a in this.abilities){
		this.runner.abilityTable[this.abilities[a]].execute(owner, other, phase, this, dout);
	}
};