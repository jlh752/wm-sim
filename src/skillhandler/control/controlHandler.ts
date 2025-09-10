import { Skill } from "../../types/datafile";
import { MeetsCriteria } from "../../util/util";
import { IBattleRunner } from "../../types/runner";
import { PlayerBattleState, CurrentUnit } from "../../types/player";
import { LogTypes, ControlLog, GenericLog } from "../../types/log";
import type {ISkillHandler} from "../skillHandler";
import { BattlePhase } from "../../types/util/battlePhase";

class ControlHandler implements ISkillHandler {
    applicablePhase = BattlePhase.CONTROL;
    applicableTags = ['control'];
    handler = (ctx:IBattleRunner, skill:Skill, player: PlayerBattleState, unit: CurrentUnit, baseLog?: GenericLog) => {
        let availableControls = skill.control!;
        const slotsToControl:number[] = [];
        
        const targets = player.other!.force.map((u,i) => ({slot:i,unit:u})).filter(unit => (
            MeetsCriteria(unit.unit, {target_type: skill.unit_type, target_subtype: skill.unit_subtype, target_unit: skill.unit_id}) &&
            !unit.unit.definition.no_control)
        );

        targets.sort(function(a,b){
            if(a.unit.definition.level === b.unit.definition.level)
                return a.unit.unitId - b.unit.unitId;
            else
                return (b.unit.definition.level || 0) - (a.unit.definition.level || 0);
        });
        for(let i = 0; i < targets.length && availableControls > 0; i++){
            availableControls--;
            if(player.other!.preventControls == 0){
                slotsToControl.push(targets[i].slot);
                ctx.result?.logs.push({...baseLog, type: LogTypes.CONTROL, target_unit_id: targets[i].unit.unitId, success: true} as ControlLog);
            }else{
                player.other!.preventControls--;
                ctx.result?.logs.push({...baseLog, type: LogTypes.CONTROL, target_unit_id: targets[i].unit.unitId, success: false} as ControlLog);
            }
        }

        //remove controlled units in reverse order to avoid messing up indexes
        slotsToControl.sort((a, b) => b - a).forEach(slot => {
            const controlledUnit = player.other!.removeUnit(slot);
            if(controlledUnit){
                controlledUnit.isReinforced = true;
                player.addUnit(controlledUnit);
            }
        });
    };
};

export default ControlHandler;