import { Skill } from "../../types/datafile";
import { CurrentUnit, IBattleRunner, PlayerBattleState } from "../../types/runner";
import { RandomRange } from "../../util/util";
import { LogTypes, DamageLog, GenericLog } from "../../types/log";
import type {ISkillHandler} from "../skillHandler";
import { BattlePhase } from "../../types/util/battlePhase";

class DamageReinforcedHandler implements ISkillHandler {
    applicablePhase = BattlePhase.MAIN;
    applicableTags = ['reinforce_damage'];
    handler = (ctx:IBattleRunner, skill:Skill, player: PlayerBattleState, unit: CurrentUnit, baseLog?: GenericLog) => {
        const count = player.other?.reinforced || 0;
        const damageValue = count * (RandomRange(100*0.5*skill.reinforce_damage!, 100*1.5*skill.reinforce_damage!)/100);
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

export default DamageReinforcedHandler;