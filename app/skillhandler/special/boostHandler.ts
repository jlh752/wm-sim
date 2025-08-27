import { Skill } from "../../types/datafile";
import { IBattleRunner } from "../../types/runner";
import { PlayerBattleState, CurrentUnit } from "../../types/player";
import { LogTypes, GenericLog, DamageBoostLog } from "../../types/log";
import type {ISkillHandler} from "../skillHandler";
import { BattlePhase } from "../../types/util/battlePhase";

class BoostHandler implements ISkillHandler {
    applicablePhase = BattlePhase.SPECIAL;
    applicableTags = ['support_bonus'];
    handler = (ctx:IBattleRunner, skill:Skill, player: PlayerBattleState, unit: CurrentUnit, baseLog?: GenericLog) => {
        if(skill.unit_type)
            player.multiplyTypeModifier(skill.unit_type, skill.support_bonus!);
        else if(skill.unit_subtype)
            player.multiplySubtypeModifier(skill.unit_subtype, skill.support_bonus!);
        else if(skill.unit_id)
            player.multiplyUnitModifier(skill.unit_id, skill.support_bonus!);
        ctx.result?.logs.push({
            ...baseLog, type: LogTypes.DAMAGE_BOOST,
            amount: skill.support_bonus, target_unit: skill.unit_id,
            target_type: skill.unit_type, target_subtype: skill.unit_subtype
        } as DamageBoostLog);
    };
};

export default BoostHandler;