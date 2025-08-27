import type { PlayerConfig, Force, ReinforcementConstraint, CurrentUnit, TargetSpecification } from '../types/runner';
import type { DataFile } from '../types/datafile';

const FORCE_INSERT_MODE = {
    FORCE: 0,
    BOOSTS: 1,
    REINFORCEMENTS: 2
} as const;
type FORCE_INSERT_MODE = typeof FORCE_INSERT_MODE[keyof typeof FORCE_INSERT_MODE];

/*
    * Normalizes the PlayerConfig by converting string representations of forces and reinforcement constraints
    * into structured objects.
    * @param config - The PlayerConfig to normalize.
    * @returns The normalized PlayerConfig.
*/
export function NormalizePlayerConfig(config:PlayerConfig, data:DataFile): PlayerConfig {
    if (typeof config.force === 'string') {
        const newForce:Force = {
            version: 1,
            units: [],
            reinforcements: []
        };

        //the string form of the force code was not originally designed for this purpose.
        //the format is <version>,<formation id>,...<units>,<boost1>,<boost2>,...<reinforcements>
        //so the only option we have for detecting the transition into reinforcements is by watching for the boosts category of ids
        let mode:FORCE_INSERT_MODE = FORCE_INSERT_MODE.FORCE;
        const parts = config.force.split(',').map(x => parseInt(x));
        if(parts.length > 1){//has at least version and formation
            newForce.version = parts[0];
            newForce.units.push(7000+parts[1]);
            const boostType = Object.keys(data.types).map(k => parseInt(k)).find(k => data.types[k].name === "Boost");
            for(let i = 2; i < parts.length; i++){
                const id = parts[i];
                if(mode !== FORCE_INSERT_MODE.REINFORCEMENTS){
                    const unitType = data.units[id]?.type;
                    if(mode === FORCE_INSERT_MODE.BOOSTS && unitType !== boostType){
                        mode = FORCE_INSERT_MODE.REINFORCEMENTS;
                    }else{
                        if(mode === FORCE_INSERT_MODE.FORCE && (unitType === boostType || id === 0)){
                            mode = FORCE_INSERT_MODE.BOOSTS;
                        }
                    }
                }
                if(id > 10){//any id less than 10 is a place holder, regrettable design choice in the force code syntax
                    if(mode === FORCE_INSERT_MODE.REINFORCEMENTS)
                        newForce.reinforcements.push(id);
                    else
                        newForce.units.push(id);
                }
            }
        }
        config.force = newForce;
    }

    if(typeof config.reinforcementConstraints === 'string') {
        const constraints:ReinforcementConstraint[] = [];
        const parts = config.reinforcementConstraints.split(';');
        for (const part of parts) {
            const [unit, count] = part.split('|');
            constraints.push({
                unit: parseInt(unit, 10),
                count: parseInt(count, 10)
            });
        }
        config.reinforcementConstraints = constraints;
    }
    return config;
}

export function RandomRange(min:number, max:number){
    return min + (max-min)*Math.random();
}

//the rounding function used by WM
//use regular round
//in the event of a x.5 number, round to the nearest odd
export function RoundHalfOdd(value:number){
	var floored = Math.floor(value);
	
	//do nothing if already rounded
	if(floored === value)
		return value;
	
	//use regular round unless at x.5
	if(value-floored !== 0.5)
		return Math.round(value);
	
	//if the floor is even, then we should've rounded to the next number
	if(floored % 2 == 0)
		return floored+1;
	else
		return floored;
};

export function MeetsCriteria(unit:CurrentUnit, criteria:TargetSpecification):boolean{
    if(criteria.target_type && criteria.target_type !== unit.definition.type)
        return false;
    if(criteria.target_subtype && (criteria.target_subtype !== unit.definition.sub_type && criteria.target_subtype !== unit.definition.sub_type2))
        return false;
    if(criteria.target_unit && criteria.target_unit !== unit.unitId)
        return false;
    return true;
}