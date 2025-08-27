import { Skill } from "../../types/datafile";
import { CurrentUnit, IBattleRunner, PlayerBattleState } from "../../types/runner";
import { RandomRange } from "../../util/util";
import { LogTypes, DamageLog, GenericLog } from "../../types/log";
import type {ISkillHandler} from "../skillHandler";
import { BattlePhase } from "../../types/util/battlePhase";

class DamageEnemyJammedHandler implements ISkillHandler {
    applicablePhase = BattlePhase.MAIN;
    applicableTags = ['enemy_jam_damage'];
    handler = (ctx:IBattleRunner, skill:Skill, player: PlayerBattleState, unit: CurrentUnit, baseLog?: GenericLog) => {
        const count = player.other!.jammed || 0;
        const damageValue = count * (RandomRange(100*0.5*skill.jam_damage!, 100*1.5*skill.jam_damage!)/100);
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

export default DamageEnemyJammedHandler;