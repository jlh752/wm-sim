import { Skill } from "../../types/datafile";
import { CurrentUnit, IBattleRunner, PlayerBattleState } from "../../types/runner";
import { LogTypes, RallyLog, GenericLog } from "../../types/log";
import type {ISkillHandler} from "../skillHandler";
import { BattlePhase } from "../../types/util/battlePhase";

class RallyHandler implements ISkillHandler {
    applicablePhase = BattlePhase.SPECIAL;
    applicableTags = ['rally'];
    handler = (ctx:IBattleRunner, skill:Skill, player: PlayerBattleState, unit: CurrentUnit, baseLog?: GenericLog) => {
        if(skill.unit_type)
            player.addTypeModifier(skill.unit_type, skill.rally!);
        else if(skill.unit_subtype)
            player.addSubtypeModifier(skill.unit_subtype, skill.rally!);
        else if(skill.unit_id)
            player.addUnitModifier(skill.unit_id, skill.rally!);
        ctx.result?.logs.push({
            ...baseLog, type: LogTypes.RALLY,
            amount: skill.rally, target_unit: skill.unit_id,
            target_type: skill.unit_type, target_subtype: skill.unit_subtype
        } as RallyLog);
    };
};

export default RallyHandler;