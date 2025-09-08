import { Skill } from "../../types/datafile";
import { IBattleRunner } from "../../types/runner";
import { PlayerBattleState, CurrentUnit } from "../../types/player";
import { RandomRange } from "../../util/util";
import { LogTypes, DamageLog, GenericLog } from "../../types/log";
import type {ISkillHandler} from "../skillHandler";
import { BattlePhase } from "../../types/util/battlePhase";

class DamageHealedHandler implements ISkillHandler {
    applicablePhase = BattlePhase.MAIN;
    applicableTags = ['heal_damage'];
    handler = (ctx:IBattleRunner, skill:Skill, player: PlayerBattleState, unit: CurrentUnit, baseLog?: GenericLog) => {
        const count = player.totalHeal || 0;
        const damageValue = count * (RandomRange(1000*0.5*skill.heal_damage!, 1000*1.5*skill.heal_damage!)/1000);
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

export default DamageHealedHandler;