import { Skill } from "../../types/datafile";
import { CurrentUnit, IBattleRunner, PlayerBattleState } from "../../types/runner";
import { LogTypes, SummonLog, GenericLog } from "../../types/log";
import type {ISkillHandler} from "../skillHandler";
import { BattlePhase } from "../../types/util/battlePhase";

class SummonHandler implements ISkillHandler {
    applicablePhase = BattlePhase.PRE;
    applicableTags = ['summon'];
    handler = (ctx:IBattleRunner, skill:Skill, player: PlayerBattleState, unit: CurrentUnit, baseLog?: GenericLog) => {
        if(ctx.config && skill.unit_id && skill.unit_id in ctx.config?.data.units!){
            const unitDef = ctx.config?.data.units[skill.unit_id];
            for(let i = 0; i < skill.summon!; i++){
                player.addUnit({
                    unitId: skill.unit_id,
                    definition: unitDef,
                    isReinforced: true
                });
            }
            ctx.result?.logs.push({
                ...baseLog, type: LogTypes.SUMMON,
                amount: skill.summon, target_unit_id: skill.unit_id
            } as SummonLog);
        }
    };
};

export default SummonHandler;