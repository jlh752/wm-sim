import { Skill } from "../../types/datafile";
import { IBattleRunner } from "../../types/runner";
import { PlayerBattleState, CurrentUnit } from "../../types/player";
import { LogTypes, PreventHealingLog, GenericLog } from "../../types/log";
import type {ISkillHandler} from "../skillHandler";
import { BattlePhase } from "../../types/util/battlePhase";

class AntijamHandler implements ISkillHandler {
    applicablePhase = BattlePhase.SPECIAL;
    applicableTags = ['antiheal', 'epic_antiheal'];
    handler = (ctx:IBattleRunner, skill:Skill, player: PlayerBattleState, unit: CurrentUnit, baseLog?: GenericLog) => {
        const amount = (skill.antiheal || 0)
            + (ctx.config?.epicMode ? skill.epic_antiheal || 0 : 0)
        player.preventHeal += amount;
        ctx.result?.logs.push({
            ...baseLog, type: LogTypes.PREVENT_HEAL,
            amount: amount
        } as PreventHealingLog);
    };
};

export default AntijamHandler;