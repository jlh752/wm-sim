import { Skill } from "../../types/datafile";
import { CurrentUnit, IBattleRunner, PlayerBattleState } from "../../types/runner";
import { LogTypes, ReinforceLog, GenericLog } from "../../types/log";
import type {ISkillHandler} from "../skillHandler";
import { BattlePhase } from "../../types/util/battlePhase";
import { MeetsCriteria } from "../../util/util";

class ReinforceHandler implements ISkillHandler {
    applicablePhase = BattlePhase.SPECIAL;
    applicableTags = ['reinforce'];
    handler = (ctx:IBattleRunner, skill:Skill, player: PlayerBattleState, unit: CurrentUnit, baseLog?: GenericLog) => {
        if(!player.other)
            return;
        
        const log = {
            ...baseLog, type: LogTypes.REINFORCE,
            instances: []
        } as ReinforceLog;

        const slotsToRemove:number[] = [];
        let availableReinforcements = skill.reinforce!;
        for(let i = 0; i < player.reinforcements.length; i++){
            const reinforcement = player.reinforcements[i];
            if(MeetsCriteria(reinforcement, {target_type: skill.unit_type, target_subtype: skill.unit_subtype, target_unit: skill.unit_id})){
                if(reinforcement.definition.unique){
                    if(player.force.some(u => u.unitId === reinforcement.unitId))
                        continue;
                    if(player.other.preventReinforcements > 0){
                        player.other.preventReinforcements--;
                        log.instances.push({success: false, amount: 1, target_unit_id: reinforcement.unitId});
                    }else{
                        player.addUnit({
                            unitId: reinforcement.unitId,
                            definition: reinforcement.definition,
                            isReinforced: true
                        });
                        player.reinforced++;
                        log.instances.push({success: true, amount: 1, target_unit_id: reinforcement.unitId});
                        slotsToRemove.unshift(i);//remove in reverse order to preserve indicies
                    }
                    availableReinforcements--;
                }else{
                    const prevented = Math.min(player.other.preventReinforcements, availableReinforcements);
                    const succeeded = availableReinforcements - prevented;
                    if(prevented > 0){
                        player.other.preventReinforcements -= prevented;
                        log.instances.push({success: false, amount: prevented, target_unit_id: reinforcement.unitId});
                    }
                    if(succeeded > 0){
                        log.instances.push({success: true, amount: succeeded, target_unit_id: reinforcement.unitId});
                        for(let j = 0; j < succeeded; j++){
                            player.addUnit({
                                unitId: reinforcement.unitId,
                                definition: reinforcement.definition,
                                isReinforced: true
                            });
                            player.reinforced++;
                        }
                    }
                    availableReinforcements = 0;
                }
            }
            if(availableReinforcements === 0)
                break;
        }
        slotsToRemove.forEach(slot => player.other?.removeUnit(slot));
        ctx.result?.logs.push(log);
    };
};

export default ReinforceHandler;