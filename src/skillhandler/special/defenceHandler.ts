import { Skill } from "../../types/datafile";
import { IBattleRunner } from "../../types/runner";
import { PlayerBattleState, CurrentUnit } from "../../types/player";
import { LogTypes, GenericLog, DefenseBoostLog } from "../../types/log";
import type {ISkillHandler} from "../skillHandler";
import { BattlePhase } from "../../types/util/battlePhase";

class DefenseHandler implements ISkillHandler {
    applicablePhase = BattlePhase.SPECIAL;
    applicableTags = ['defense'];
    handler = (ctx:IBattleRunner, skill:Skill, player: PlayerBattleState, unit: CurrentUnit, baseLog?: GenericLog) => {
        player.multiplyDefense(skill.defense!);
        ctx.result?.logs.push({
            ...baseLog, type: LogTypes.DEFENSE_POWER,
            amount: skill.defense
        } as DefenseBoostLog);
    };
};

export default DefenseHandler;