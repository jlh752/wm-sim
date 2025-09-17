import { Skill } from "../../types/datafile";
import { IBattleRunner } from "../../types/runner";
import { PlayerBattleState, CurrentUnit } from "../../types/player";
import { RandomRange } from "../../util/util";
import { LogTypes, HealLog, GenericLog } from "../../types/log";
import type {ISkillHandler} from "../skillHandler";
import { BattlePhase } from "../../types/util/battlePhase";

class HealEachHandler implements ISkillHandler {
    applicablePhase = BattlePhase.MAIN;
    applicableTags = ['var_heal'];
    handler = (ctx:IBattleRunner, skill:Skill, player: PlayerBattleState, unit: CurrentUnit, baseLog?: GenericLog) => {
        const count = player.getRequirementsCount(skill.unit_id, skill.unit_type, skill.unit_subtype);
        const healValue = RandomRange(0.5*skill.var_heal!*count, 1.5*skill.var_heal!*count);
        const cappedHeal = skill.heal_cap ? Math.min(skill.heal_cap, healValue) : healValue;
        const resultHeal = player.addHeal(cappedHeal, skill.flurry || 1);
        //if(resultHeal.value !== 0){
            ctx.result?.logs.push({
                ...baseLog, type: LogTypes.HEAL,
                amount: cappedHeal, prevented: resultHeal.prevented,
                flurry: skill.flurry
            } as HealLog);
        //}
    };
};

export default HealEachHandler;