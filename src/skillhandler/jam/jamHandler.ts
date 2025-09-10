import { Skill } from "../../types/datafile";
import { IBattleRunner } from "../../types/runner";
import { PlayerBattleState, CurrentUnit } from "../../types/player";
import { LogTypes, JamLog, GenericLog } from "../../types/log";
import { MeetsCriteria } from "../../util/util";
import type {ISkillHandler} from "../skillHandler";
import { BattlePhase } from "../../types/util/battlePhase";

class JamHandler implements ISkillHandler {
    applicablePhase = BattlePhase.JAM;
    applicableTags = ['jamming'];
    handler = (ctx:IBattleRunner, skill:Skill, player: PlayerBattleState, unit: CurrentUnit, baseLog?: GenericLog) => {
        let availableJams = skill.jamming!;
        const slotsToRemove:number[] = [];
        for(let i = 0; i < player.other!.force.length; i++){
            const enemy = player.other!.force[i];
            if(MeetsCriteria(enemy, {target_type: skill.unit_type, target_subtype: skill.unit_subtype, target_unit: skill.unit_id})
                && enemy.definition.defense && enemy.definition.defense > 0//this is a war machine quirk
                && !enemy.definition.no_jam){
                //keep trying if blocked
                while(availableJams > 0){
                    if(player.other!.preventJams == 0){
                        player.other!.jammed++;
                        slotsToRemove.unshift(i);//add in reverse order to preserve indicies
                        ctx.result?.logs.push({...baseLog, type: LogTypes.JAM, target_unit_id: enemy.unitId, success: true} as JamLog);
                        availableJams--;
                        break;
                    }else{
                        player.other!.preventJams--;
                        ctx.result?.logs.push({...baseLog, type: LogTypes.JAM, target_unit_id: enemy.unitId, success: false} as JamLog);
                        availableJams--;
                    }
                }
            }
            if(availableJams === 0)
                break;
        }
        slotsToRemove.forEach(slot => player.other?.removeUnit(slot));
    };
};

export default JamHandler;