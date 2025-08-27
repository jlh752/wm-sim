import { Skill } from "../../types/datafile";
import { CurrentUnit, IBattleRunner, PlayerBattleState } from "../../types/runner";
import { RoundHalfOdd, RandomRange } from "../../util/util";
import { LogTypes, DamageLog, GenericLog } from "../../types/log";
import type {ISkillHandler} from "../skillHandler";
import { BattlePhase } from "../../types/util/battlePhase";

class DamageHandler implements ISkillHandler {
    applicablePhase = BattlePhase.MAIN;
    applicableTags = ['damage', 'epic_damage'];
    handler = (ctx:IBattleRunner, skill:Skill, player: PlayerBattleState, unit: CurrentUnit, baseLog?: GenericLog) => {
        const baseDmg = (skill.damage || 0) + (ctx.config!.epicMode ? (skill.epic_damage || 0) : 0);
        const resultDamage = player.addDamage(unit, RoundHalfOdd(RandomRange(baseDmg*0.5, baseDmg*1.5)), skill.flurry || 1);
        if(resultDamage.value !== 0){
            ctx.result?.logs.push({
                ...baseLog, type: LogTypes.DAMAGE,
                amount: resultDamage.value, reduced: resultDamage.reduced,
                rally: resultDamage.added, flurry: skill.flurry
            } as DamageLog);
        }
    };
};

export default DamageHandler;