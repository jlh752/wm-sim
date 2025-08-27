import type {Log} from './log';
import type {DataFile, Skill, Unit} from './datafile';
import { RoundHalfOdd } from '../util/util';
import { ISkillHandler } from '../skillhandler/skillHandler';

/* export interface PlayerBattleState {
    battlePower: number;
    totalDamage: number;
    totalHeal: number;
    reinforcementCount: number;
    jamCount: number;
    controlledCount: number;
    logs: ActionLog[];

    forceDamage?: number;
} */
export type Force = {
    version?: number,
    units: number[],
    reinforcements: number[]
};
export type ReinforcementConstraint = {
    unit: number,
    count: number
};
export interface  PlayerConfig {
    force: Force | string;
    power: number;
    level?: number;
    reinforcementConstraints?: ReinforcementConstraint[] | string;
}
export interface BattleConfig {
    player1: PlayerConfig;
    player2: PlayerConfig;
    epicMode: boolean;
    data: DataFile;
}
export interface PlayerResult {
    baseDamage: number;
    totalDamage: number;
}
export interface BattleResult {
    player1: PlayerResult;
    player2: PlayerResult;
    logs: Log[];
}

export type PlayerIndex = 0|1;
export interface CurrentUnit {
    unitId:number;
    definition:Unit;
    isReinforced?:boolean;
}
interface DamageModifier {
    multiplier:number;
    fixed:number;
}

export interface PlayerRequirementsData {
    units:Record<number|string,number>;
    types:Record<number|string,number>;
    subtypes:Record<number|string,number>;
}
export interface TargetSpecification {
    target_type?: number;
    target_subtype?: number;
    target_unit?: number;
}
export class PlayerBattleState {
    other?: PlayerBattleState = undefined;
    index: PlayerIndex;
    force: CurrentUnit[];
    reinforcements: CurrentUnit[];

    baseAttack:number;
    private attack:number;
    unboostAttackMultiplier:number = 1;
    baseDefense:number;
    private defense:number;
    unboostDefenseMultiplier:number = 1;
    
    preventHeal:number = 0;
    preventJams:number = 0;
    preventReinforcements:number = 0;
    preventControls:number = 0;

    jammed:number = 0;
    reinforced:number = 0;

    shield:number = 0;
    antishield:number = 0;

    totalDamage:number = 0;
    totalHeal:number = 0;

    unitModifiers: Record<number,DamageModifier> = {};
    typeModifiers:Record<number,DamageModifier> = {};
    subtypeModifiers:Record<number,DamageModifier> = {};

    private _data:DataFile;
    requirementsData:PlayerRequirementsData = {units:{}, types:{}, subtypes:{}};

    constructor(player:PlayerConfig, data:DataFile, ind:PlayerIndex){
        this._data = data;
        this.force = typeof player.force !== "string" ?
                player.force.units.map(u => ({unitId: u, definition: this._data.units[u]})) :
                []
        this.reinforcements = typeof player.force !== "string" ?
                player.force.reinforcements.map(u => ({unitId: u, definition: this._data.units[u]})) :
                [];
        this.populateRequirementsData();
        this.baseAttack = player.power;
        this.attack = player.power;
        this.baseDefense = player.power;
        this.defense = player.power;
        this.index = ind;
    }

    addDamage(unit:CurrentUnit, value:number, flurry: number = 0): {value:number, added:number, reduced:number}{
        let multiplier = 1, addedDamage = 0;
        const antishield = this.antishield;
	    const reduction = Math.max(this.shield-antishield, 0);

        if(value !== 0){
            multiplier += this.unitModifiers[unit.unitId]?.multiplier || 0;
            multiplier += this.typeModifiers[unit.definition.type]?.multiplier || 0;

            addedDamage += this.subtypeModifiers[unit.unitId]?.fixed || 0;
            addedDamage += this.typeModifiers[unit.unitId]?.fixed || 0;

            if(unit.definition.sub_type){
                addedDamage += this.subtypeModifiers[unit.definition.sub_type]?.fixed || 0;
                multiplier += this.subtypeModifiers[unit.definition.sub_type]?.multiplier || 0;
            }
            if(unit.definition.sub_type2){
                addedDamage += this.subtypeModifiers[unit.definition.sub_type2]?.fixed || 0;
                multiplier += this.subtypeModifiers[unit.definition.sub_type2]?.multiplier || 0;
            }

            const totalDamage = RoundHalfOdd(value*multiplier + addedDamage + reduction);
            for(let i = 0; i < flurry; i++){
                this.totalDamage += totalDamage;
            }

            return {value: totalDamage, added: addedDamage, reduced: reduction};
        }
        return {value: 0, added: 0, reduced: 0};
    }

    addHeal(value:number, flurry:number = 0): {value:number, prevented:number}{
        const totalHealing = RoundHalfOdd(value);
        if(totalHealing !== 0){
            for(let i = 0; i < flurry; i++){
                this.totalHeal += totalHealing;
            }
        }

        if(totalHealing > 0 && this.other){
            const preventHeal = this.other.preventHeal || 0;
            if(preventHeal > totalHealing){
                this.other.preventHeal -= totalHealing;
                return {value: 0, prevented: totalHealing};
            }else{
                const adjustedHeal = totalHealing - this.other.preventHeal;
                this.other.preventHeal = 0;
                return {value: adjustedHeal, prevented: preventHeal};
            }
        }

        return {value: totalHealing, prevented: 0};
    }

    addUnitModifier(id:number, value:number){this.alterModifier(id, 'unitModifiers', {fixed:value});}
    multiplyUnitModifier(id:number, value:number){this.alterModifier(id, 'unitModifiers', {multiplier:value});}
    addTypeModifier(id:number, value:number){this.alterModifier(id, 'typeModifiers', {fixed:value});}
    multiplyTypeModifier(id:number, value:number){this.alterModifier(id, 'typeModifiers', {multiplier:value});}
    addSubtypeModifier(id:number, value:number){this.alterModifier(id, 'subtypeModifiers', {fixed:value});}
    multiplySubtypeModifier(id:number, value:number){this.alterModifier(id, 'subtypeModifiers', {multiplier:value});}

    //multipliers stack additively instead of multiplicatively
    private alterModifier(id:number, key:('unitModifiers'|'typeModifiers'|'subtypeModifiers'), value:{fixed?:number,multiplier?:number}){
        if(!('id' in this[key]))
            this[key][id] = {multiplier:0,fixed:0};
        this[key][id].multiplier += value.multiplier ?? 0;
        this[key][id].fixed += value.fixed ?? 0;
    }

    addAttack(value:number){//cap to 200% of base
        this.attack = Math.min(2*this.baseAttack, this.attack+value);
    }
    multiplyAttack(multiplier:number){
        this.attack = Math.min(2*this.baseAttack, this.attack*(1+multiplier));
    }
    unboostAttack(value:number){
        this.unboostAttackMultiplier *= (1-value);
    }
    getAttack():number{
        return (this.baseAttack + (this.attack - this.baseAttack)*Math.max(0, this.unboostAttackMultiplier));
    }

    addDefense(value:number){
        this.defense = Math.min(2*this.baseDefense, this.defense+value);
    }
    multiplyDefense(multiplier:number){
        this.defense = Math.min(2*this.baseDefense, this.defense*(1+multiplier));
    }
    unboostDefense(value:number){
        this.unboostDefenseMultiplier *= (1-value);
    }
    getDefense():number{
        return (this.baseDefense + (this.defense - this.baseDefense)*Math.max(0, this.unboostDefenseMultiplier));
    }

    addUnit(unit:CurrentUnit):void{
        this.force.push(unit);
        this.addUnitToRequirementsData(unit.unitId);
    }
    removeUnit(slot:number):(CurrentUnit | undefined){
        if(slot < 0 || slot >= this.force.length)
            return undefined;
        const unit = this.force.splice(slot, 1)[0];
        this.removeUnitFromRequirementsData(unit.unitId);
    }

    /*
        count units of each unit id, type, and subtype to speed up later requirement checking
    */
    populateRequirementsData(){
        this.requirementsData = {units:{}, types: {}, subtypes:{}};
        for(const t in this._data)
            this.requirementsData.types[t] = 0;
        for(const st in this._data.subtypes)
            this.requirementsData.subtypes[st] = 0;
        for(let i = 0; i < this.force.length; i++) {
            this.addUnitToRequirementsData(this.force[i].unitId);
        }
    }

    addUnitToRequirementsData(unitId:number){
        if(unitId < 10) return;
        if(!this.requirementsData.units[unitId])
            this.requirementsData.units[unitId] = 1;
        else
            this.requirementsData.units[unitId]++;

        const unitDefinition = this._data.units[unitId];
        if(unitDefinition.type)
            this.requirementsData.types[unitDefinition.type]++;
        if(unitDefinition.sub_type)
            this.requirementsData.types[unitDefinition.sub_type]++;
        if(unitDefinition.sub_type2)
            this.requirementsData.types[unitDefinition.sub_type2]++;
    }
    removeUnitFromRequirementsData(unitId:number){
        if(unitId < 10) return;
        if(this.requirementsData.units[unitId])
            this.requirementsData.units[unitId]--;

        const unitDefinition = this._data.units[unitId];
        if(unitDefinition.type)
            this.requirementsData.types[unitDefinition.type]--;
        if(unitDefinition.sub_type)
            this.requirementsData.types[unitDefinition.sub_type]--;
        if(unitDefinition.sub_type2)
            this.requirementsData.types[unitDefinition.sub_type2]--;
    }

    checkRequirements(skillId:number) {
        const skill = this._data.skills[skillId];
        if(!skill.requirements)
            return true;
        return skill.requirements.every(req => {
            const data = this.requirementsData;
            return (!req.unit_id || data.units[req.unit_id] >= req.count) &&
                (!req.type_id || data.types[req.type_id] >= req.count) &&
                (!req.subtype_id || data.subtypes[req.subtype_id] >= req.count);
        });
    }

    getRequirementsCount(unit_id?:number, unit_type?:number, unit_subtype?:number):number{
        return (unit_id ? this.requirementsData.units[unit_id] : 0) +
            (unit_type ? this.requirementsData.types[unit_type] : 0) +
            (unit_subtype ? this.requirementsData.subtypes[unit_subtype] : 0);
    }
}

export class BattleState {
    player1: PlayerBattleState;
    player2: PlayerBattleState;
    maxBase: number; 
    constructor(config:BattleConfig){
        this.player1 = new PlayerBattleState(config.player1, config.data, 0);
        this.player2 = new PlayerBattleState(config.player2, config.data, 1);
        this.player1.other = this.player2;
        this.player2.other = this.player1;
        this.maxBase = Math.round(2*320*Math.log10((config.player2.level || 1000)/100)+30);//2* added due to 8/Sept/2013 update
        if(this.maxBase != 0){
            if(config.epicMode)
                this.maxBase = 30;//max 30 for bosses added due to 8/Sept/2013 update
            else
                this.maxBase = Math.max(this.maxBase, 30);
        }
    }

    forPlayer(playerIndex:PlayerIndex){
        return playerIndex === 0 ? this.player1 : this.player2;
    }
}

export interface IBattleRunner {
    config?:BattleConfig;
    result?:BattleResult;
    state?:BattleState;
    registerSkillHandlers(skillHandlers:ISkillHandler[]):void;
    run(config: BattleConfig): BattleResult;
}