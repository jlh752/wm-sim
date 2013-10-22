'use strict';

gmsim.Ability = function(ab, runner){
	this.id = ab;
	this.runner = runner;
	
	this.phase_queues = [];
	for(var i = 0, n = Object.keys(gmsim.PHASE_TAG).length-1; i < n; i++){
		this.phase_queues.push([]);
	}
	
	this.allow = [];//which players meet the requirements for this ability
};

//prepare the ability
//remember that the ability is shared among all units who use it
//stored as <ability name>,<ability type>,<comma seperated arguments>+...
//requirements stored as <requirement id [redundant]>|<skill id [redundant]>|<requirement count>|<type>|<class>|<unit id>;...
//		use blank for no requirements in type,class,id fields
gmsim.Ability.prototype.parse = function(player){
	var abReqs = gmsim.skillData[this.id]['skillReqs'];
	
	//check reqs
	var good = 1;
	var requirements = abReqs.split(';');
	for(var r in requirements){
		if(requirements[r] == '') continue;
		var parts = requirements[r].split('|');
		if(!gmsim.checkRequirements(player, parts[2], parts[3], parts[4], parts[5])){
			good = 0;
			this.runner.outputText += "<span style=\"color: #AA0000;\">Player "+player.getIDp()+" Ability - " + gmsim.skillData[this.id]['skillName'] + ": does not meet unit requirements</span>\n<br />";
		}
	}
	
	if(this.allow.length == 0){//we have not parsed ourselves yet
		//extract relevant data and push the rest onto the appropriate phase queue
		var abString = gmsim.skillData[this.id]['skillSyntax'].substring(gmsim.skillData[this.id]['skillSyntax'].indexOf(',')+1);
		
		var abilities = abString.split('+');
		for(var ab in abilities){
			var a = abilities[ab];
			var tag = a.substring(0, a.indexOf(','));
			var queue = gmsim.PHASE_TAG.NONE;
			switch(tag){
				case "PJ":
				case "PC":
				case "PR":
				case "DAJ":
				case "S":
					queue = gmsim.PHASE_TAG.PRE;
					break;
					
				case "J":
					queue = gmsim.PHASE_TAG.JAM;
					break;
					
				case "C":
					queue = gmsim.PHASE_TAG.CONTROL;
					break;
					
				case "PH":
				case "AP":
				case "DP":
				case "DB":
				case "R":
				case "RA":
				case "RE":
				case "PPH":
				case "AS":
					queue = gmsim.PHASE_TAG.SPECIAL;
					break;
					
				case "EPH":
					if(this.runner.epicMode == 1)
						queue = gmsim.PHASE_TAG.SPECIAL;
					break;
				
				case "D":
				case "H":
				case "HE":
				case "DE":
				case "DR":
				case "DJ":
				case "DJE":
				case "HJ":
				case "UA":
				case "UD":
					queue = gmsim.PHASE_TAG.MAIN;
					break;
					
				case "ED":
				case "EH":
					if(this.runner.epicMode == 1)
						queue = gmsim.PHASE_TAG.MAIN;
					break;
					
				case "DH":
					queue = gmsim.PHASE_TAG.POST;
					break;
			}
			if(queue != gmsim.PHASE_TAG.NONE)
				this.phase_queues[queue].push(a);
		}
	}

	this.allow[player.getIDp()] = good;
};

//execute the parts of this ability for a specific phase
gmsim.Ability.prototype.execute = function(owner, other, phase, unit, dout){
	var pid = owner.getIDp();
	
	var prefix = "Your";
	if(pid != 1)
		prefix = "&nbsp;&nbsp;&nbsp;&nbsp;Enemy's";
	
	//get the abilities for this phase
	var abs = this.phase_queues[phase];
	
	var total_damage = 0;
	var total_healing = 0;
	var flurry = 1;

	var unitId = unit.getID();
	var reinforced = unit.getReinforced();
	
	if(this.allow[pid] == 0){
		return;
	}
	
	//for each ability, call the appropriate function, get the output
	for(var a in abs){
		var p = abs[a].split(',');
		var res = this.abilities[p[0]]({
			'p':p,
			'id':this.id,
			'owner':owner,
			'other':other,
			'prefix':prefix,
			'unitId':unitId,
			'reinforced':reinforced,
			'runner':this.runner
		});
		total_damage += res['damage'];
		total_healing += res['healing'];
		if(typeof res['flurry'] !== 'undefined')
			flurry = res['flurry'];
		if(dout)
			this.runner.outputText += res['output'];
	}

	//add damage bonuses
	var multiplier = 1;
	var add = 0;
	var antishield = owner.getAntishield();
	var reduction = Math.max(owner.getReduction()-antishield, 0);
	if(total_damage != 0){
		multiplier += owner.getMultiplierUnit(gmsim.unitData[unitId]['unitName']);
		multiplier += owner.getMultiplierType(gmsim.unitData[unitId]['unitType1']);
		multiplier += owner.getMultiplierType(gmsim.unitData[unitId]['unitType2']);
		multiplier += owner.getMultiplierClass(gmsim.unitData[unitId]['unitClass']);
		
		add += owner.getAdditionUnit(gmsim.unitData[unitId]['unitName']);
		add += owner.getAdditionType(gmsim.unitData[unitId]['unitType1']);
		add += owner.getAdditionType(gmsim.unitData[unitId]['unitType2']);
		add += owner.getAdditionClass(gmsim.unitData[unitId]['unitClass']);
		
		total_damage = total_damage*multiplier + add - reduction;
	}
	
	for(var i = 0; i < flurry; i++){
		if(total_healing != 0 || total_damage != 0){
			total_damage = gmsim.roundHalfOdd(total_damage);
			total_healing = gmsim.roundHalfOdd(total_healing);
			owner.total_damage += total_damage;
			owner.setTotalHeal(owner.getTotalHeal() + total_healing);
			
			//stat tracking
			if(owner.trackDamage.hasOwnProperty(unitId)){
				owner.trackDamage[unitId] += total_damage;
				owner.trackHeal[unitId] += total_healing;
			}else{
				owner.trackDamage[unitId] = total_damage;
				owner.trackHeal[unitId] = total_healing;
			}

			//output the damage
			if(dout){
				this.runner.outputText += prefix+" ";
				if(reinforced == 1)
					this.runner.outputText +=  "reinforced ";
				this.runner.outputText += gmsim.unitData[unitId]['unitName']+" used "+gmsim.skillData[this.id]['skillName']+", ";

				if(total_damage != 0){
							
					if(add > 0)
						this.runner.outputText += "rallies for +"+add+", ";
					if(reduction > 0)
						this.runner.outputText += "reduced by "+reduction+", ";
				
					if(total_damage >= 0)
						this.runner.outputText += "dealing "+total_damage+" damage";
					else
						this.runner.outputText += "healing the enemy for "+-total_damage+" health";
				}
				if(total_healing != 0){
					if(total_damage != 0) this.runner.outputText += " and ";
					
					if(total_healing >= 0)
						this.runner.outputText += "healing for "+total_healing+" health";
					else
						this.runner.outputText += "damaging self for "+-total_healing+" damage";
				}
				this.runner.outputText += "!\n<br />";
			}
		}
	}
	
};

/*
	each ability has it's own function stored in the abilities Array
	they inherit from the generic ability class
*/

gmsim.Ability.prototype.abilities = {};
gmsim.genericAbility = function(args){
	if(arguments.length == 1){
		this.p = args['p'];
		this.id = args['id'];
		this.owner = args['owner'];
		this.other = args['other'];
		this.prefix = args['prefix'];
		this.unitId = args['unitId'];
		this.reinforced = args['reinforced'];
		this.runner = args['runner'];
	}
	
	return{'damage':0, 'healing':0,'output':''};
};

//prevent jam
gmsim.Ability.prototype.abilities['PJ'] = function(args){
	gmsim.genericAbility.call(this, args);
	this.owner.preventJams += parseInt(this.p[1]);
	var o = this.prefix+" "+gmsim.unitData[this.unitId]['unitName']+" will block "+this.p[1]+" jam(s)<br />\n";
	return{'damage':0, 'healing':0, 'output':o};
};
//prevent control
gmsim.Ability.prototype.abilities['PC'] = function(args){
	gmsim.genericAbility.call(this, args);
	this.owner.preventControls += parseInt(this.p[1]);
	var o = this.prefix+" "+gmsim.unitData[this.unitId]['unitName']+" will block "+this.p[1]+" control(s)<br />\n";
	return{'damage':0, 'healing':0, 'output':o};
};
//prevent reinforcement
gmsim.Ability.prototype.abilities['PR'] = function(args){
	gmsim.genericAbility.call(this, args);
	this.owner.preventReinforcements += parseInt(this.p[1]);
	var o = this.prefix+" "+gmsim.unitData[this.unitId]['unitName']+" will block "+this.p[1]+" reinforcements(s)<br />\n";
	return{'damage':0, 'healing':0, 'output':o};
};
//direct anti-jam, not sure what this is but will just treat it as regular anti-jam
gmsim.Ability.prototype.abilities['DAJ'] = function(args){
	gmsim.genericAbility.call(this, args);
	this.owner.preventJams += parseInt(this.p[1]);
	var o = this.prefix+" "+gmsim.unitData[this.unitId]['unitName']+" will block "+this.p[1]+" jam(s)<br />\n";
	return{'damage':0, 'healing':0, 'output':o};
};

//jam
gmsim.Ability.prototype.abilities['J'] = function(args){
	gmsim.genericAbility.call(this, args);
	var jams = parseInt(this.p[1]);
	var enemy = this.other.getUnits();
	var o = '';
	//search for matching unit
	for(var j = 0; j < enemy.length; j++){
		var e = enemy[j];
		var jammed = 0;
		var eid = e.getID();
		//unit matches and is jammable
		if(gmsim.checkMatch(eid, this.p[2], this.p[3], this.p[4]) && parseInt(gmsim.unitData[eid]['unitDefence']) > 0 && gmsim.unitData[eid]['unitStealth'] != 1){
			var s = null;
			//keep attempting jams if they are prevented
			while(s == null && jams > 0){
				s = null;
				if(this.other.preventJams == 0){
					this.other.jamCount[eid]++;
					s = this.other.removeUnit(eid);
					jammed = 1;
					o = this.prefix+ " "+gmsim.unitData[this.unitId]['unitName']+" jammed "+gmsim.unitData[eid]['unitName']+"<br />\n";
					this.other.jammed++;
				}else{
					this.other.preventJams--;
					o = this.prefix+" "+gmsim.unitData[this.unitId]['unitName']+"'s Jam against "+gmsim.unitData[eid]['unitName']+" was prevented<br />\n";
				}
				jams--;
			}
		}
		if(jams == 0)
			break;
		if(jammed) j--;//we jammed a unit, so don't run off the end of the array
	}
	return{'damage':0, 'healing':0, 'output':o};
};
//control
gmsim.Ability.prototype.abilities['C'] = function(args){
	gmsim.genericAbility.call(this, args);
	var controls = parseInt(this.p[1]);
	var enemy = this.other.getUnits();
	var targets = [];
	
	//first, identify units that we could control
	for(var e in enemy){
		var iid = enemy[e].getID();
		if(gmsim.checkMatch(iid, this.p[2], this.p[3], this.p[4]) && gmsim.unitData[iid]['unitIronwill'] != 1){
			targets[iid] = gmsim.unitData[iid]['unitPriority'];
		}
	}
	
	//sort the list of candidates by their control order (unit priority DESC -> unit id ASC)
	var rv = [];
	for(var k in targets){
		rv.push({
			key: k,
			value:  targets[k]
		});
	}
	rv.sort(
		function(a,b){
			if(a.value == b.value)
				return a.key > b.key;
			else
				return a.value < b.value;
		}
	);
	var o = '';
	//go through the list of candidates
	for(var curr in rv){
		controls--;
		if(this.other.getPreventControls() == 0){
			//completed a controller
			//remove the units from the enemy
			//add it to our force, all parsing should already be complete
			var c = this.other.removeUnit(rv[curr].key);
			if(c != null){
				c.setReinforced(1);
				this.owner.addUnit(c);
				o += this.prefix+" ";
				if(this.reinforced)
					o += "reinforced ";
				o += gmsim.unitData[this.unitId]['unitName']+" took control of "+gmsim.unitData[c.getID()]['unitName']+"<br />\n";
			}
		}else{
			this.other.setPreventControls(this.other.getPreventControls()-1);
			o += this.prefix+" ";
			if(this.reinforced)
				o += "reinforced ";
			o += gmsim.unitData[this.unitId]['unitName']+" failed to control "+gmsim.unitData[rv[curr].key]['unitName']+"<br />\n";
		}
		if(controls == 0) break;
	}
	return{'damage':0, 'healing':0, 'output':o};
};
//prevent heal
gmsim.Ability.prototype.abilities['PH'] = function(args){
	gmsim.genericAbility.call(this, args);
	var ph = this.p[1];
	var o = this.prefix+" ";
	if(this.reinforced)
		o += "reinforced ";
	o += gmsim.unitData[this.unitId]['unitName']+" will prevent up to "+ph+" Healing\n<br />";
	this.owner.preventHeal += parseInt(ph);
	return{'damage':0, 'healing':0, 'output':o};
};
//epic prevent heal
gmsim.Ability.prototype.abilities['EPH'] = gmsim.Ability.prototype.abilities['PH'];
//attack power boost
gmsim.Ability.prototype.abilities['AP'] = function(args){
	gmsim.genericAbility.call(this, args);
	var o = this.prefix+" ";
	if(this.reinforced == 1)
		o += "reinforced ";
	o += gmsim.unitData[this.unitId]['unitName']+" used "+gmsim.skillData[this.id]['skillName']+" increasing Attack by "+(100*parseFloat(this.p[1]))+"%!\n<br />";
	this.owner.mulAttack(parseFloat(this.p[1]));
	return{'damage':0, 'healing':0, 'output':o};
};
//defence power boost
gmsim.Ability.prototype.abilities['DP'] = function(args){
	gmsim.genericAbility.call(this, args);
	var o = this.prefix+" ";
	if(this.reinforced == 1)
		o += "reinforced ";
	o += gmsim.unitData[this.unitId]['unitName']+" used "+gmsim.skillData[this.id]['skillName']+" increasing Defense by "+(100*parseFloat(this.p[1]))+"%!\n<br />";
	this.owner.mulDefence(parseFloat(this.p[1]));
	return{'damage':0, 'healing':0, 'output':o};
};
//boost damage for type/class/specific unit(s)
gmsim.Ability.prototype.abilities['DB'] = function(args){
	gmsim.genericAbility.call(this, args);
	var o = this.prefix+" ";
	if(this.p[2] != ''){//type (eg. commander)
		var out = this.prefix+" ";
		if(this.reinforced == 1)
			o += "reinforced ";
		o += gmsim.unitData[this.unitId]['unitName']+" used "+gmsim.skillData[this.id]['skillName']+" increasing "+gmsim.typeData[this.p[2]]['typeName']+" damage by "+(100*parseFloat(this.p[1]))+"%\n<br />";
		this.owner.addMultiplierClass(this.p[2], parseFloat(this.p[1]));
	}
	if(this.p[3] != ''){//class (eg. robotic)
		if(this.reinforced == 1)
			o += "reinforced ";
		o += gmsim.unitData[this.unitId]['unitName']+" used "+gmsim.skillData[this.id]['skillName']+" increasing "+gmsim.subtypeData[this.p[3]]['subtypeName']+" damage by "+(100*parseFloat(this.p[1]))+"%\n<br />";
		this.owner.addMultiplierType(this.p[3], parseFloat(this.p[1]));
	}
	if(this.p[4] != ''){//unit (eg. posiedon). not sure if this exists, but including it for future
		if(this.reinforced == 1)
			o += "reinforced ";
		o += gmsim.unitData[this.unitId]['unitName']+" used "+gmsim.skillData[this.id]['skillName']+" increasing "+gmsim.unitData[this.p[4]]['unitName']+" damage by "+(100*parseFloat(this.p[1]))+"%\n<br />";
		this.owner.addMultiplierUnit(this.p[4], parseFloat(this.p[1]));
	}
	return{'damage':0, 'healing':0, 'output':o};
};
//reinforce
gmsim.Ability.prototype.abilities['R'] = function(args){
	gmsim.genericAbility.call(this, args);
	var r = parseInt(this.p[1]);
	//search for first in reinforce list matching criteria
	
	//create a copy of the reinforcements.
	//we remove unique units from reinforcements while iterating, so using this copy stops the iteration from breaking
	var dc = [];
	for(var q in this.owner.reinforcements) dc[q] = this.owner.reinforcements[q];
	
	var o = '';

	//keep looking for suitable units until we run out of reinforcements
	for(var nid_ in dc){
		var nid = parseInt(dc[nid_]);
		var success = 1;
		var uniq = 0;
		if(gmsim.checkMatch(nid, this.p[2], this.p[3], this.p[4])){
			var uniq = (gmsim.unitData[nid]['unitUnique'] == "1");
			if(uniq){//be sure not the reinforce a unique that has already been reinforced
				var cid = 0;
				var forcee = this.owner.getForce();
				for(var curr in forcee){
					cid = forcee[curr].getID();
					if(cid == nid){
						success = 0;
					}
				}
			}
		}else{
			success = 0;
		}
		
		if(success == 1){
			o = this.prefix+' ';
			var count = r;

			//some bosses reinforce a certain amount of units
			if(typeof this.runner.maxReinfs[nid] !== "undefined"){
				count = Math.min(this.runner.maxReinfs[nid], count);
			}
			
			var cc = count;
			var pr = this.other.getPreventReinforcements();
			if(uniq)
				count = 1;
			
			//prevent all the reinforces
			if(count >= pr){
				if(pr != 0){
					count -= pr;
					this.other.setPreventReinforcements(0);
					o += "Reinforce "+pr+" x "+gmsim.unitData[nid]['unitName']+" was prevented\n<br />";
					r -= pr;
					pr = 0;
				}
			}else{
				//prevent only some of the reinforces
				this.other.setPreventReinforcements(pr - count);
				o += "Reinforce "+count+" x "+gmsim.unitData[nid]['unitName']+" was prevented\n<br />";
				r -= count;
				count = 0;
			}
			if((uniq && count != 0) || (this.runner.epicMode == 1 && this.owner.getIDp() == 2)){
				//remove unique from reinforcements to speed up future searches
				this.owner.removeReinforcements(nid);
			}
			
			//reinforce how many we have left after the preventions
			for(var i = 0; i < count; i++){
				var nu = new gmsim.Unit(this.runner);
				nu.setID(nid);
				nu.setReinforced(1);
				nu.parseAbilities(this.owner);//may need to parse if not already done so
				this.owner.addUnit(nu);
				this.owner.addAttack(10*parseInt(gmsim.unitData[nid]['unitAttack']));
				this.owner.addDefence(10*parseInt(gmsim.unitData[nid]['unitDefence']));
				this.owner.reinforced++;
				this.owner.reinfEntered[nid]++;
				r--;
			}

			if(count > 0){
				if(this.reinforced == 1)
					o += "reinforced ";
				o += gmsim.unitData[this.unitId]['unitName']+" brought ["+count+"] "+gmsim.unitData[nid]['unitName']+" into battle\n<br />";
			}
		}
		
		if(r == 0) break;
	}
	//reached the end of the units without using all reinforcements
	if(r != 0){
		if(!(this.runner.epicMode == 1 && this.owner.getIDp() == 2)){
			o += "<span style=\"color: #AA0000;\">" + this.prefix + " " + gmsim.unitData[this.unitId]['unitName'] + ": Missing ";
			if(r > 1) o += r+"x";
			if(gmsim.typeData[this.p[2]]['typeName'] != undefined) o += gmsim.typeData[this.p[2]]['typeName'];
			if(gmsim.subtypeData[this.p[3]]['subtypeName'] != undefined) o += gmsim.subtypeData[this.p[3]]['subtypeName'];
			if(gmsim.unitData[this.p[4]]["unitName"] != undefined) o += gmsim.unitData[this.p[4]]["unitName"];
			o += " reinforcement</span>\n<br />";
		}
	}
	return{'damage':0, 'healing':0, 'output':o};
};
//summon
gmsim.Ability.prototype.abilities['S'] = function(args){
	gmsim.genericAbility.call(this, args);
	var count = parseInt(this.p[1]);
	var nid = this.p[2];
	
	//set the stats if not already done
	if(typeof this.owner.jamCount[nid] === 'undefined'){
		this.owner.jamCount[nid] = 0;
		this.owner.reinfEntered[nid] = 0;
		this.owner.trackDamage[nid] = 0;
		this.owner.trackHeal[nid] = 0;
	}
	
	for(var i = 0; i < count; i++){					
		//owner.reinforced++;
		gmsim.summonList.push(nid);
	}
	var o = this.prefix+" ";
	if(this.reinforced == 1)
		o += "reinforced ";
	o += gmsim.unitData[this.unitId]['unitName']+" summoned ["+count+"] "+gmsim.unitData[nid]['unitName']+" into battle\n<br />";
	return{'damage':0, 'healing':0, 'output':o};
};
//rally
gmsim.Ability.prototype.abilities['RA'] = function(args){
	gmsim.genericAbility.call(this, args);
	//rally damage for type/class/specific unit(s)
	var o = this.prefix+" ";
	if(this.reinforced == 1)
			o += "reinforced ";
	if(this.p[2] != ''){
		o += gmsim.unitData[this.unitId]['unitName']+" used "+gmsim.skillData[this.id]['skillName']+" and rallies "+gmsim.typeData[this.p[2]]['typeName']+" damage by +"+this.p[1]+" per attack\n<br />";
		this.owner.addAdditionClass(this.p[2], parseFloat(this.p[1]));
	}
	if(this.p[3] != ''){
		o += gmsim.unitData[this.unitId]['unitName']+" used "+gmsim.skillData[this.id]['skillName']+" and rallies "+gmsim.subtypeData[this.p[3]]['subtypeName']+" damage by +"+this.p[1]+" per attack\n<br />";
		this.owner.addAdditionType(this.p[3], parseFloat(this.p[1]));
	}
	if(this.p[4] != ''){
		o += gmsim.unitData[this.unitId]['unitName']+" used "+gmsim.skillData[this.id]['skillName']+" and rallies "+gmsim.unitData[this.p[4]]['unitName']+" damage by +"+this.p[1]+" per attack\n<br />";
		this.owner.addAdditionUnit(this.p[4], parseFloat(this.p[1]));
	}
	return{'damage':0, 'healing':0, 'output':o};
};
//reduce
gmsim.Ability.prototype.abilities['RE'] = function(args){
	gmsim.genericAbility.call(this, args);
	var o = this.prefix+" ";
	if(this.reinforced == 1)
		o += "reinforced ";
	o += gmsim.unitData[this.unitId]['unitName']+" used "+gmsim.skillData[this.id]['skillName']+" and will reduce damage by "+this.p[1]+" per attack\n<br />";
	this.other.addReduction(parseFloat(this.p[1]));
	return{'damage':0, 'healing':0, 'output':o};
};
//antisheild
gmsim.Ability.prototype.abilities['AS'] = function(args){
	gmsim.genericAbility.call(this, args);
	var o = this.prefix+" ";
	if(this.reinforced == 1)
		o += "reinforced ";
	o += gmsim.unitData[this.unitId]['unitName']+" used "+gmsim.skillData[this.id]['skillName']+" and will reduce enemy shield by "+this.p[1]+"\n<br />";
	this.owner.addAntishield(parseFloat(this.p[1]));
	return{'damage':0, 'healing':0, 'output':o};
};
//mystery
gmsim.Ability.prototype.abilities['PPH'] = function(args){return{'damage':0, 'healing':0, 'output':''};};
//damage
gmsim.Ability.prototype.abilities['D'] = function(args){
	gmsim.genericAbility.call(this, args);
	var dmg = parseFloat(this.p[2]);
	return{
		'damage': gmsim.roundHalfOdd(gmsim.rand(dmg-dmg/2, dmg+dmg/2)),
		'healing': 0,
		'output': '',
		'flurry': parseInt(this.p[1])
	};
};
//epic damage
gmsim.Ability.prototype.abilities['ED'] = gmsim.Ability.prototype.abilities['D'];
//heal
gmsim.Ability.prototype.abilities['H'] = function(args){
	gmsim.genericAbility.call(this, args);
	var heal = parseInt(this.p[1]);
	var pre = this.other.getPreventHeal();
	var o = '';
	if(heal > 0){//damage self units don't need this logic
		if(pre > heal){//negate all heal
			pre -= heal;
			o = this.prefix+" ";
			if(this.reinforced == 1)
				o +=  "reinforced ";
			o += "Healing for "+heal+" was prevented!<br />";
			heal = 0;
		}else{//negate some heal
			heal -= pre;
			if(pre != 0){
				o = this.prefix+" ";
				if(this.reinforced == 1)
					o +=  "reinforced ";
				o += "Healing for "+pre+" was prevented!<br />";
			}
			pre = 0;
		}
		this.other.setPreventHeal(pre);
	}
	return{'damage':0, 'healing':heal, 'output':o};
};
//epic heal
gmsim.Ability.prototype.abilities['EH'] = gmsim.Ability.prototype.abilities['H'];
//heal for each
gmsim.Ability.prototype.abilities['HE'] = function(args){
	gmsim.genericAbility.call(this, args);
	var heal = parseFloat(this.p[1]);
	var mmin = heal-heal/2;
	var mmax = heal+heal/2;
	heal = 0;
	//sum up the heal
	for(var curr in this.owner.units){
		if(gmsim.checkMatch(this.owner.units[curr].getID(), this.p[2], this.p[3], this.p[4])){
			heal += gmsim.rand(mmin*100, mmax*100)/100;
		}
	}
	if(this.p[5] != '')//cap the heal
		heal = Math.min(parseFloat(this.p[5]), heal);
	heal = gmsim.roundHalfOdd(heal);
	
	var o = '';
	
	//prevent heal logic
	if(heal > 0){
		var pre = this.other.getPreventHeal();
		if(pre > heal){
			pre -= heal;
			o += "Healing for "+heal+" was prevented!<br />";
			heal = 0;
			
		}else{
			heal -= pre;
			if(pre != 0)
				o += "Healing for "+pre+" was prevented!<br />";
			pre = 0;
		}
		this.other.setPreventHeal(pre);
	}
	return{'damage':0, 'healing':heal, 'output':o};
};
//damage for each
gmsim.Ability.prototype.abilities['DE'] = function(args){
	gmsim.genericAbility.call(this, args);
	var dmg = parseFloat(this.p[1]);
	var mmin = dmg-dmg/2;
	var mmax = dmg+dmg/2;
	dmg = 0;
	//sum up damage for matching units
	for(var curr in this.other.units){
		if(gmsim.checkMatch(this.other.units[curr].getID(), this.p[2], this.p[3], this.p[4])){
			dmg += gmsim.rand(mmin*100, mmax*100)/100;
		}
	}
	//no units need capped currently
	return{'damage':gmsim.roundHalfOdd(dmg), 'healing':0, 'output':''};
};
//damage for reinforced
gmsim.Ability.prototype.abilities['DR'] = function(args){
	gmsim.genericAbility.call(this, args);
	var dmg = parseFloat(this.p[1]);
	return{
		'damage': this.other.getReinforced()*(gmsim.rand((dmg-dmg/2)*100,
		(dmg+dmg/2)*100)/100),
		'healing': 0,
		'output': ''
	};
};
//damage for friendly jams
gmsim.Ability.prototype.abilities['DJ'] = function(args){
	gmsim.genericAbility.call(this, args);
	var dmg = parseFloat(this.p[1]);
	return{
		'damage': this.owner.getJams()*(gmsim.rand((dmg-dmg/2)*100, (dmg+dmg/2)*100)/100),
		'healing': 0,
		'output': ''
	};
};
//damage for each enemy you have jammed
gmsim.Ability.prototype.abilities['DJE'] = function(args){
	gmsim.genericAbility.call(this, args);
	var dmg = parseFloat(this.p[1]);
	dmg = this.other.getJams()*(gmsim.rand((dmg-dmg/2)*100, (dmg+dmg/2)*100)/100);
	if(this.p[2] != '')
		dmg = Math.min(parseFloat(this.p[2]), dmg);
	return{'damage':dmg, 'healing':0, 'output':''};
};
//heal for jammed
gmsim.Ability.prototype.abilities['HJ'] = function(args){
	gmsim.genericAbility.call(this, args);
	var heal = parseFloat(this.p[1]);
	var mmin = heal-heal/2;
	var mmax = heal+heal/2;
	heal = gmsim.roundHalfOdd((gmsim.rand(mmin*100, mmax*100)/100)*this.owner.getJams());
	
	var o = '';
	
	//prevent heal logic
	if(heal > 0){
		var pre = this.other.getPreventHeal();
		if(pre > heal){
			pre -= heal;
			o += "Healing for "+heal+" was prevented!<br />";
			heal = 0;
		}else{
			heal -= pre;
			if(pre != 0)
				o += "Healing for "+pre+" was prevented!<br />";
			pre = 0;
		}
		this.other.setPreventHeal(pre);
	}
	return{'damage':0, 'healing':heal, 'output':o};
};
//unboost attack
gmsim.Ability.prototype.abilities['UA'] = function(args){
	gmsim.genericAbility.call(this, args);
	var o = this.prefix+" ";
	if(this.reinforced == 1)
		o += "reinforced ";
	o += gmsim.unitData[this.unitId]['unitName']+" used "+gmsim.skillData[this.id]['skillName']+" reducing boosted enemy Attack by  "+(100*parseFloat(this.p[1]))+"%!\n<br />";
	this.other.unboostAttack(parseFloat(this.p[1]));
	return{'damage':0, 'healing':0, 'output':o};
};
//unboost defence
gmsim.Ability.prototype.abilities['UD'] = function(args){
	gmsim.genericAbility.call(this, args);
	var o = this.prefix+" ";
	if(this.reinforced == 1)
		o += "reinforced ";
	o += gmsim.unitData[this.unitId]['unitName']+" used "+gmsim.skillData[this.id]['skillName']+" reducing boosted enemy Defense by  "+(100*parseFloat(this.p[1]))+"%!\n<br />";
	this.other.unboostDefence(parseFloat(this.p[1]));
	return{'damage':0, 'healing':0, 'output':o};
};
//damage per heal
gmsim.Ability.prototype.abilities['DH'] = function(args){
	gmsim.genericAbility.call(this, args);
	var dmg = parseFloat(this.p[1]);
	var mmin = dmg-dmg/2;
	var mmax = dmg+dmg/2;
	dmg = 0;
	
	var heal = this.other.getTotalHeal();
	dmg = (gmsim.rand(mmin*1000, mmax*1000)/1000)*heal;
if(this.p[2] !== '')//capped damage
		dmg = Math.min(parseFloat(this.p[2]), dmg);
	return{'damage':dmg, 'healing':0, 'output':''};
};

//set all the sub-abilites to inherit the generic prototype
for(var a in gmsim.Ability.prototype.abilities)
	gmsim.Ability.prototype.abilities[a].prototype = new gmsim.genericAbility();

//check player's force to see how many units exist matching requirement
gmsim.checkRequirements = function(player, count, Class, type, name){
	if(count == 0) return 1;
	var c = 0;
	//for each unit in force
	var f = player.getForce();
	for(var u in f){
		if(gmsim.checkMatch(f[u].getID(), Class, type, name)){
			c++;
		}
	}
	return (c >= count);
};

//check if unit matches requirements
gmsim.checkMatch = function(id, Class, type, name){
	var success = -1;
	//class match
	if(Class != '' && success != 0){
		if(gmsim.unitData[id]['unitClass'] == Class){
			success = 1;
		}else{
			success = 0;
		}
	}
	//don't count if wrong type
	if(type != '' && success != 0){
		if(gmsim.unitData[id]['unitType1'] == type || gmsim.unitData[id]['unitType2'] == type){
			success = 1;
		}else{
			success = 0;
		}
	}
	//don't count if wrong name
	if(name != '' && success != 0){
		if(id == name){
			success = 1;
		}else{
			success = 0;
		}
	}
	return (success == 1);
};