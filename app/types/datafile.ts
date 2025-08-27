export interface DataFile{
    units: {[id: number]: Unit;};
    skills: {[id: number]: Skill;};
    types: {[id: number]: Type;};
    subtypes: {[id: number]: SubType;};
}
export interface UnitSkill {
    skill_id: number;
    chance: number;
}
interface DefaultUnitAttributes {

}
export interface Unit {
    id: number;
    name: string;
    unique?: boolean | number;
    type: keyof DataFile["types"];
    sub_type?: keyof DataFile["subtypes"];
    sub_type2?: keyof DataFile["subtypes"];
    attack?: number;
    defense?: number;
    skills?: UnitSkill[];
    level?: number;
    no_control?: number | boolean;
    no_jam?: number | boolean;
}

export interface AbilityRequirement {
    count: number;
    unit_id?: number;
    type_id?: number;
    subtype_id?: number;
}
interface DefaultSkillsAttributes {
    heal?: number;
    damage?: number;
    jamming?: number;
    attack?: number;
    defense?: number;
    reinforce?: number;
    antiheal?: number;
    support_bonus?: number;
    control?: number;
    var_damage?: number;
    var_heal?: number;
    heal_cap?: number;
    epic_damage?: number;
    epic_heal?: number;
    epic_antiheal?: number;
    antijam?: number;
    antireinforce?: number;
    anticontrol?: number;
    flurry?: number;
    shield?: number;
    rally?: number;
    anti_defense?: number;
    anti_attack?: number;
    reinforce_damage?: number;
    jam_heal?: number;
    jam_damage?: number;
    enemy_jam_damage?: number;
    damage_cap?: number;
    percent_antiheal?: number;
    heal_damage?: number;
    antishield?: number;
    summon?: number;
    healing?: number;
}
export interface Skill<TCustomAttributes = {}> extends DefaultSkillsAttributes{
    name: string;
    requirements?: AbilityRequirement[];

    unit_type?: number;
    unit_subtype?: number;
    unit_id?: number;

    isValid?: boolean;//valid per player

    custom?: TCustomAttributes;
}

export type DefaultSkill = Skill<{}>;

export interface Type{
    name: string;
}

export interface SubType{
    name:string;
}