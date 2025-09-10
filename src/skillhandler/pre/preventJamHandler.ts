import { Skill } from "../../types/datafile";
import { IBattleRunner } from "../../types/runner";
import { PlayerBattleState, CurrentUnit } from "../../types/player";
import { LogTypes, PreventJamLog, GenericLog } from "../../types/log";
import type {ISkillHandler} from "../skillHandler";
import { BattlePhase } from "../../types/util/battlePhase";

class AntijamHandler implements ISkillHandler {
    applicablePhase = BattlePhase.PRE;
    applicableTags = ['antijam'];
    handler = (ctx:IBattleRunner, skill:Skill, player: PlayerBattleState, unit: CurrentUnit, baseLog?: GenericLog) => {
        player.preventJams += skill.antijam!;
        ctx.result?.logs.push({
            ...baseLog, type: LogTypes.PREVENT_JAM,
            amount: skill.antijam
        } as PreventJamLog);
    };
};

export default AntijamHandler;