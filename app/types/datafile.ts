export interface DataFile{
    units: {[id: string]: Unit;};
    skills: {[id: string]: Skill;};
    types: {[id: string]: Type;};
    subtypes: {[id: string]: SubType;};
}
        
export interface Unit {
  unitName: string;
  unitUnique?: boolean | number;
  unitClass: keyof DataFile["types"];
  unitType1?: keyof DataFile["subtypes"];
  unitType2?: keyof DataFile["subtypes"];
  unitAttack?: number;
  unitDefence?: number;
  unitAbilities?: string;
  unitPriority?: number;
  unitIronwill?: boolean | number;
  unitStealth?: boolean | number;
}

export interface Skill{
    skillName: string;
    skillSyntax: string;
    skillReqs: string;
}

export interface Type{
    typeName: string;
}

export interface SubType{
    subtypeName:string;
}