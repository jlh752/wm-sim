import { Skill } from "../../types/datafile";
import { IBattleRunner } from "../../types/runner";
import { PlayerBattleState, CurrentUnit } from "../../types/player";
import { LogTypes, PreventReinforcementLog, GenericLog } from "../../types/log";
import type {ISkillHandler} from "../skillHandler";
import { BattlePhase } from "../../types/util/battlePhase";

class AntiReinforceHandler implements ISkillHandler {
    applicablePhase = BattlePhase.PRE;
    applicableTags = ['antireinforce'];
    handler = (ctx:IBattleRunner, skill:Skill, player: PlayerBattleState, unit: CurrentUnit, baseLog?: GenericLog) => {
        player.preventReinforcements += skill.antireinforce!;
        console.log(player.preventReinforcements, skill.antireinforce);
        ctx.result?.logs.push({
            ...baseLog, type: LogTypes.PREVENT_REINFORCEMENT,
            amount: skill.antireinforce
        } as PreventReinforcementLog);
    };
};

export default AntiReinforceHandler;