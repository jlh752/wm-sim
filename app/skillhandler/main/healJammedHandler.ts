import { Skill } from "../../types/datafile";
import { CurrentUnit, IBattleRunner, PlayerBattleState } from "../../types/runner";
import { RandomRange } from "../../util/util";
import { LogTypes, HealLog, GenericLog } from "../../types/log";
import type {ISkillHandler} from "../skillHandler";
import { BattlePhase } from "../../types/util/battlePhase";

class HealJammedHandler implements ISkillHandler {
    applicablePhase = BattlePhase.MAIN;
    applicableTags = ['jam_heal'];
    handler = (ctx:IBattleRunner, skill:Skill, player: PlayerBattleState, unit: CurrentUnit, baseLog?: GenericLog) => {
        const count = player.jammed || 0;
        const healValue = count * RandomRange(100*0.5*skill.jam_heal!, 100*1.5*skill.jam_heal!)/100;
        const resultHeal = player.addHeal(skill.heal_cap ? Math.min(skill.heal_cap, healValue) : healValue, skill.flurry || 1);
        if(resultHeal.value !== 0){
            ctx.result?.logs.push({
                ...baseLog, type: LogTypes.HEAL,
                amount: resultHeal.value, prevented: resultHeal.prevented,
                flurry: skill.flurry
            } as HealLog);
        }
    };
};

export default HealJammedHandler;