import { Skill } from "../../types/datafile";
import { CurrentUnit, IBattleRunner, PlayerBattleState } from "../../types/runner";
import { LogTypes, HealLog, GenericLog } from "../../types/log";
import type {ISkillHandler} from "../skillHandler";
import { BattlePhase } from "../../types/util/battlePhase";

class HealHandler implements ISkillHandler {
    applicablePhase = BattlePhase.MAIN;
    applicableTags = ['heal', 'epic_heal'];
    handler = (ctx:IBattleRunner, skill:Skill, player: PlayerBattleState, unit: CurrentUnit, baseLog?: GenericLog) => {
        const baseHeal = (skill?.heal || 0) + (ctx.config!.epicMode ? skill.epic_heal || 0 : 0);
        const resultHeal = player.addHeal(baseHeal, skill.flurry || 1);
        if(resultHeal.value !== 0){
            ctx.result?.logs.push({
                ...baseLog, type: LogTypes.HEAL,
                amount: resultHeal.value, prevented: resultHeal.prevented,
                flurry: skill.flurry
            } as HealLog);
        }
    };
};

export default HealHandler;