import { Skill } from "../../types/datafile";
import { IBattleRunner } from "../../types/runner";
import { PlayerBattleState, CurrentUnit } from "../../types/player";
import { LogTypes, GenericLog, AttackBoostLog } from "../../types/log";
import type {ISkillHandler} from "../skillHandler";
import { BattlePhase } from "../../types/util/battlePhase";

class AttackHandler implements ISkillHandler {
    applicablePhase = BattlePhase.SPECIAL;
    applicableTags = ['attack'];
    handler = (ctx:IBattleRunner, skill:Skill, player: PlayerBattleState, unit: CurrentUnit, baseLog?: GenericLog) => {
        player.multiplyAttack(skill.attack!);
        ctx.result?.logs.push({
            ...baseLog, type: LogTypes.ATTACK_POWER,
            amount: skill.attack
        } as AttackBoostLog);
    };
};

export default AttackHandler;