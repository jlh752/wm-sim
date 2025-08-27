import { Skill } from "../../types/datafile";
import { CurrentUnit, IBattleRunner, PlayerBattleState } from "../../types/runner";
import { RandomRange } from "../../util/util";
import { LogTypes, DamageLog, GenericLog } from "../../types/log";
import type {ISkillHandler} from "../skillHandler";
import { BattlePhase } from "../../types/util/battlePhase";

class DamageEachHandler implements ISkillHandler {
    applicablePhase = BattlePhase.MAIN;
    applicableTags = ['var_damage'];
    handler = (ctx:IBattleRunner, skill:Skill, player: PlayerBattleState, unit: CurrentUnit, baseLog?: GenericLog) => {
        const count = player.getRequirementsCount(skill.unit_id, skill.unit_type, skill.unit_subtype);
        const damageValue = RandomRange(0.5*skill.var_damage!*count, 1.5*skill.var_damage!*count);
        const resultDamage = player.addDamage(unit, skill.damage_cap ? Math.min(skill.damage_cap, damageValue) : damageValue, skill.flurry || 1);
        if(resultDamage.value !== 0){
            ctx.result?.logs.push({
                ...baseLog, type: LogTypes.DAMAGE,
                amount: resultDamage.value, reduced: resultDamage.reduced,
                rally: resultDamage.added, flurry: skill.flurry
            } as DamageLog);
        }
    };
};

export default DamageEachHandler;