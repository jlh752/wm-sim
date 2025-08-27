import { Skill } from "../../types/datafile";
import { IBattleRunner } from "../../types/runner";
import { PlayerBattleState, CurrentUnit } from "../../types/player";
import { LogTypes, AntishieldLog, GenericLog } from "../../types/log";
import type {ISkillHandler} from "../skillHandler";
import { BattlePhase } from "../../types/util/battlePhase";

class AntishieldHandler implements ISkillHandler {
    applicablePhase = BattlePhase.SPECIAL;
    applicableTags = ['antishield'];
    handler = (ctx:IBattleRunner, skill:Skill, player: PlayerBattleState, unit: CurrentUnit, baseLog?: GenericLog) => {
        player.antishield += skill.antishield!;
        ctx.result?.logs.push({
            ...baseLog, type: LogTypes.ANTISHIELD,
            amount: skill.antishield
        } as AntishieldLog);
    };
};

export default AntishieldHandler;