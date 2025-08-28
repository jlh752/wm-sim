import { BattleConfig, Force } from "../app/types/config";
import type {PlayerConfig} from "../app/types/config";
import { Skill, SubType, Type, Unit } from "../app/types/datafile";
import PlayerIndex from "../app/types/util/playerIndex";
import TargetSpecification from "../app/types/util/targetSpecification";
import { DEFAULT_POWER, MAGIC_LEVEL } from "../app/util/magicNumbers";
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
    private player1:PlayerConfig = {power:DEFAULT_POWER,level:MAGIC_LEVEL,force:{units:[], reinforcements: []}};
    private player2:PlayerConfig = {power:DEFAULT_POWER,level:MAGIC_LEVEL,force:{units:[], reinforcements: []}};

    constructor(withDefaultsTypes:boolean = true){
        if(withDefaultsTypes){
            this.types[T.TYPE] = { name: 'Basic Type' }; 
            this.subtypes[T.SUBTYPE] = { name: 'Basic Subtype' };
        }
    }

    isEpic(epicMode:boolean) : this{
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
    withPlayer(index:PlayerIndex, units:number[] = [], reinforcements:number[] = [], power:number = DEFAULT_POWER, level:number = MAGIC_LEVEL) : this{
        if(index === 0){
            (this.player1.force as Force).units = units;
            (this.player1.force as Force).reinforcements = reinforcements;
            this.player1.power = power;
            this.player1.level = level;
        }else{
            (this.player2.force as Force).units = units;
            (this.player2.force as Force).reinforcements = reinforcements;
            this.player2.power = power;
            this.player2.level = level;
        }
        return this;
    }

    addReinforcementSkill(id:number, amount:number, criteria:TargetSpecification, modifier?:SkillModifierFuction): this {
        this.skills[id] = { name: `Reinforce`, reinforce: amount };
        if(criteria.target_unit) this.skills[id].unit_id = criteria.target_unit;
        if(criteria.target_type) this.skills[id].unit_type = criteria.target_type;
        if(criteria.target_subtype) this.skills[id].unit_subtype = criteria.target_subtype;
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