import { BattleConfig, Force } from "../src/types/config";
import type {PlayerConfig, ReinforcementConstraint} from "../src/types/config";
import { Skill, SubType, Type, Unit } from "../src/types/datafile";
import PlayerIndex from "../src/types/util/playerIndex";
import TargetSpecification from "../src/types/util/targetSpecification";
import { DEFAULT_POWER, MAGIC_LEVEL } from "../src/util/magicNumbers";
import T from './constants';

export class TestUnitBuilder {
    private unit:Unit = { name: 'Test Unit', attack: 1, defense: 1, type: 1, level: 1, skills: [] };
    
    withName(name:string): this {
        this.unit.name = name;
        return this;
    }
    withSkill(skillId:number,chance:number = 1): this {
        this.unit.skills!.push({skill_id: skillId, chance: chance});
        return this;
    }
    withType(type:number): this {
        this.unit.type = type;
        return this;
    }
    withSubType(subtype:number): this {
        this.unit.sub_type = subtype;
        return this;
    }
    withSubType2(subtype:number): this {
        this.unit.sub_type2 = subtype;
        return this;
    }
    withAttack(attack:number): this {
        this.unit.attack = attack;
        return this;
    }
    withDefense(defense:number): this {
        this.unit.defense = defense;
        return this;
    }
    withLevel(level:number){
        this.unit.level = level;
        return this;
    }
    isUnique(unique:boolean = true){
        this.unit.unique = unique;
        return this;
    }
    isUnjammable(unjammable:boolean = true){
        this.unit.no_jam = unjammable;
        return this;
    }
    isUncontrollable(uncontrollable:boolean = true){
        this.unit.no_control = uncontrollable;
        return this;
    }

    build(id: number): [number, any] {
        return [id, { ...this.unit }];
    }
}

type SkillModifierFuction = (skill:Skill) => Skill;
export class TestBattleBuilder {
    private units:Record<number, Unit> = {};
    private skills:Record<number, Skill> = {};
    private types:Record<number, Type> = {};
    private subtypes:Record<number, SubType> = {};
    private epicMode:boolean = false;
    private player1:PlayerConfig = {power:DEFAULT_POWER,level:MAGIC_LEVEL,force:{units:[], reinforcements: []},reinforcementConstraints:[]};
    private player2:PlayerConfig = {power:DEFAULT_POWER,level:MAGIC_LEVEL,force:{units:[], reinforcements: []},reinforcementConstraints:[]};

    constructor(withDefaultsTypes:boolean = true){
        if(withDefaultsTypes){
            this.types[T.TYPE] = { name: 'Basic Type' }; 
            this.subtypes[T.SUBTYPE] = { name: 'Basic Subtype' };
        }
    }

    isEpic(epicMode:boolean = true) : this{
        this.epicMode = epicMode;
        return this;
    }

    addUnit(id: number, builder: (b: TestUnitBuilder) => TestUnitBuilder = (b) => b): this {
        const [unitId, unit] = builder(new TestUnitBuilder()).build(id);
        this.units[unitId] = unit;
        return this;
    }
    addType(id: number, name:string): this {
        this.types[id] = {name:name};
        return this;
    }
    addSubtype(id: number, name:string): this {
        this.subtypes[id] = {name:name};
        return this;
    }
    withPlayer(index:PlayerIndex, units:number[] = [], reinforcements:number[] = [], power:number = DEFAULT_POWER, level:number = MAGIC_LEVEL, reinforcementConstraints:ReinforcementConstraint[] = []) : this{
        const player = index === 0 ? this.player1 : this.player2;
        (player.force as Force).units = units;
        (player.force as Force).reinforcements = reinforcements;
        player.power = power;
        player.level = level;
        player.reinforcementConstraints = reinforcementConstraints;
        return this;
    }
    addDamageSkill(id:number, amount:number, flurry:number = 1, modifier?:SkillModifierFuction): this {
        this.skills[id] = { name: "Damage", damage: amount, flurry: flurry };
        if(modifier) this.skills[id] = modifier(this.skills[id]);
        return this;
    }
    addEpicDamageSkill(id:number, amount:number, modifier?:SkillModifierFuction): this {
        this.skills[id] = { name: "Epic Damage", epic_damage: amount };
        if(modifier) this.skills[id] = modifier(this.skills[id]);
        return this;
    }
    addHealSkill(id:number, amount:number, flurry:number = 1, modifier?:SkillModifierFuction): this {
        this.skills[id] = { name: "Heal", heal: amount, flurry: flurry };
        if(modifier) this.skills[id] = modifier(this.skills[id]);
        return this;
    }
    addEpicHealSkill(id:number, amount:number, modifier?:SkillModifierFuction): this {
        this.skills[id] = { name: "Epic Heal", epic_heal: amount };
        if(modifier) this.skills[id] = modifier(this.skills[id]);
        return this;
    }
    addPreventHealSkill(id:number, amount:number, modifier?:SkillModifierFuction): this {
        this.skills[id] = { name: "Prevent Heal", antiheal: amount };
        if(modifier) this.skills[id] = modifier(this.skills[id]);
        return this;
    }
    addEpicPreventHealSkill(id:number, amount:number, modifier?:SkillModifierFuction): this {
        this.skills[id] = { name: "Epic Prevent Heal", epic_antiheal: amount };
        if(modifier) this.skills[id] = modifier(this.skills[id]);
        return this;
    }
    addJamSkill(id:number, amount:number, criteria:TargetSpecification, modifier?:SkillModifierFuction): this {
        this.skills[id] = { name: "Jam", jamming: amount };
        if(criteria.target_unit) this.skills[id].unit_id = criteria.target_unit;
        if(criteria.target_type) this.skills[id].unit_type = criteria.target_type;
        if(criteria.target_subtype) this.skills[id].unit_subtype = criteria.target_subtype;
        if(modifier) this.skills[id] = modifier(this.skills[id]);
        return this;
    }
    addPreventJamSkill(id:number, amount:number, modifier?:SkillModifierFuction): this {
        this.skills[id] = { name: "Prevent Jam", antijam: amount };
        if(modifier) this.skills[id] = modifier(this.skills[id]);
        return this;
    }
    addReinforcementSkill(id:number, amount:number, criteria:TargetSpecification, modifier?:SkillModifierFuction): this {
        this.skills[id] = { name: "Reinforce", reinforce: amount };
        if(criteria.target_unit) this.skills[id].unit_id = criteria.target_unit;
        if(criteria.target_type) this.skills[id].unit_type = criteria.target_type;
        if(criteria.target_subtype) this.skills[id].unit_subtype = criteria.target_subtype;
        if(modifier) this.skills[id] = modifier(this.skills[id]);
        return this;
    }
    addPreventReinforcementSkill(id:number, amount:number, modifier?:SkillModifierFuction): this {
        this.skills[id] = { name: "Prevent Reinforcement", antireinforce: amount };
        if(modifier) this.skills[id] = modifier(this.skills[id]);
        return this;
    }
    addControlSkill(id:number, amount:number, criteria:TargetSpecification, modifier?:SkillModifierFuction): this {
        this.skills[id] = { name: "Control", control: amount };
        if(criteria.target_unit) this.skills[id].unit_id = criteria.target_unit;
        if(criteria.target_type) this.skills[id].unit_type = criteria.target_type;
        if(criteria.target_subtype) this.skills[id].unit_subtype = criteria.target_subtype;
        if(modifier) this.skills[id] = modifier(this.skills[id]);
        return this;
    }
    addPreventControlSkill(id:number, amount:number, modifier?:SkillModifierFuction): this {
        this.skills[id] = { name: "Prevent Control", anticontrol: amount };
        if(modifier) this.skills[id] = modifier(this.skills[id]);
        return this;
    }
    addAttackBoostSkill(id:number, amount:number, modifier?:SkillModifierFuction): this {
        this.skills[id] = { name: "Attack boost", attack: amount };
        if(modifier) this.skills[id] = modifier(this.skills[id]);
        return this;
    }
    addDefenseBoostSkill(id:number, amount:number, modifier?:SkillModifierFuction): this {
        this.skills[id] = { name: "Defense boost", defense: amount };
        if(modifier) this.skills[id] = modifier(this.skills[id]);
        return this;
    }
    addAttackUnboostSkill(id:number, amount:number, modifier?:SkillModifierFuction): this {
        this.skills[id] = { name: "Attack unboost", anti_attack: amount };
        if(modifier) this.skills[id] = modifier(this.skills[id]);
        return this;
    }
    addDefenseUnboostSkill(id:number, amount:number, modifier?:SkillModifierFuction): this {
        this.skills[id] = { name: "Defense unboost", anti_defense: amount };
        if(modifier) this.skills[id] = modifier(this.skills[id]);
        return this;
    }
    addSummonSkill(id:number, amount:number, unitId:number, modifier?:SkillModifierFuction): this {
        this.skills[id] = { name: "Summon", summon: amount, unit_id: unitId };
        if(modifier) this.skills[id] = modifier(this.skills[id]);
        return this;
    }
    addRallySkill(id:number, amount:number, criteria:TargetSpecification, modifier?:SkillModifierFuction): this {
        this.skills[id] = { name: "Rally", rally: amount };
        if(criteria.target_unit) this.skills[id].unit_id = criteria.target_unit;
        if(criteria.target_type) this.skills[id].unit_type = criteria.target_type;
        if(criteria.target_subtype) this.skills[id].unit_subtype = criteria.target_subtype;
        if(modifier) this.skills[id] = modifier(this.skills[id]);
        return this;
    }
    addShieldSkill(id:number, amount:number, modifier?:SkillModifierFuction): this {
        this.skills[id] = { name: "Shield", shield: amount };
        if(modifier) this.skills[id] = modifier(this.skills[id]);
        return this;
    }
    addAntishieldSkill(id:number, amount:number, modifier?:SkillModifierFuction): this {
        this.skills[id] = { name: "Anti-Shield", antishield: amount };
        if(modifier) this.skills[id] = modifier(this.skills[id]);
        return this;
    }
    addHealEachSkill(id:number, amount:number, criteria:TargetSpecification, cap:(number|undefined) = undefined, modifier?:SkillModifierFuction): this {
        this.skills[id] = { name: "Heal each", var_heal: amount, heal_cap: cap };
        if(criteria.target_unit) this.skills[id].unit_id = criteria.target_unit;
        if(criteria.target_type) this.skills[id].unit_type = criteria.target_type;
        if(criteria.target_subtype) this.skills[id].unit_subtype = criteria.target_subtype;
        if(modifier) this.skills[id] = modifier(this.skills[id]);
        return this;
    }
    addHealJammedSkill(id:number, amount:number, cap:(number|undefined) = undefined, modifier?:SkillModifierFuction): this {
        this.skills[id] = { name: "Heal jammed", jam_heal: amount, heal_cap: cap };
        if(modifier) this.skills[id] = modifier(this.skills[id]);
        return this;
    }
    addDamageEachSkill(id:number, amount:number, criteria:TargetSpecification, cap:(number|undefined) = undefined, modifier?:SkillModifierFuction): this {
        this.skills[id] = { name: "Damage each", var_damage: amount, damage_cap: cap };
        if(criteria.target_unit) this.skills[id].unit_id = criteria.target_unit;
        if(criteria.target_type) this.skills[id].unit_type = criteria.target_type;
        if(criteria.target_subtype) this.skills[id].unit_subtype = criteria.target_subtype;
        if(modifier) this.skills[id] = modifier(this.skills[id]);
        return this;
    }
    addDamageReinforcedSkill(id:number, amount:number, cap:(number|undefined) = undefined, modifier?:SkillModifierFuction): this {
        this.skills[id] = { name: "Damage Reinforced", reinforce_damage: amount, damage_cap: cap };
        if(modifier) this.skills[id] = modifier(this.skills[id]);
        return this;
    }
    addDamageJammedSkill(id:number, amount:number, cap:(number|undefined) = undefined, modifier?:SkillModifierFuction): this {
        this.skills[id] = { name: "Damage Jammed", jam_damage: amount, damage_cap: cap };
        if(modifier) this.skills[id] = modifier(this.skills[id]);
        return this;
    }
    addDamageEnemyJammedSkill(id:number, amount:number, cap:(number|undefined) = undefined, modifier?:SkillModifierFuction): this {
        this.skills[id] = { name: "Damage Enemy Jammed", enemy_jam_damage: amount, damage_cap: cap };
        if(modifier) this.skills[id] = modifier(this.skills[id]);
        return this;
    }
    addDamageHealSkill(id:number, amount:number, cap:(number|undefined) = undefined, modifier?:SkillModifierFuction): this {
        this.skills[id] = { name: "Damage Heal", heal_damage: amount, damage_cap: cap };
        if(modifier) this.skills[id] = modifier(this.skills[id]);
        return this;
    }
    addDamageBoostSkill(id:number, amount:number, criteria:TargetSpecification, modifier?:SkillModifierFuction): this {
        this.skills[id] = { name: "Damage Boost", support_bonus: amount };
        if(criteria.target_unit) this.skills[id].unit_id = criteria.target_unit;
        if(criteria.target_type) this.skills[id].unit_type = criteria.target_type;
        if(criteria.target_subtype) this.skills[id].unit_subtype = criteria.target_subtype;
        if(modifier) this.skills[id] = modifier(this.skills[id]);
        return this;
    }
    addCustomSkill(id:number, params:Record<string, any>, modifier?:SkillModifierFuction): this {
        this.skills[id] = { name: 'Custom Skill', ...params };
        if(modifier) this.skills[id] = modifier(this.skills[id]);
        return this;
    }

    buildConfig(): BattleConfig {
        return {
            player1: this.player1,
            player2: this.player2,
            epicMode: this.epicMode,
            data: {
                units: this.units,
                skills: this.skills,
                types: this.types,
                subtypes: this.subtypes
            }
        };
    }
}