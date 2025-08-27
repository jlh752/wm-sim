import { Skill } from "../../types/datafile";
import { CurrentUnit, IBattleRunner, PlayerBattleState } from "../../types/runner";
import { LogTypes, UnboostAttackLog, GenericLog } from "../../types/log";
import type {ISkillHandler} from "../skillHandler";
import { BattlePhase } from "../../types/util/battlePhase";

class UnboostAttackHandler implements ISkillHandler {
    applicablePhase = BattlePhase.MAIN;
    applicableTags = ['anti_attack'];
    handler = (ctx:IBattleRunner, skill:Skill, player: PlayerBattleState, unit: CurrentUnit, baseLog?: GenericLog) => {
        player.unboostAttack(skill.anti_attack!);
        ctx.result?.logs.push({
            ...baseLog, type: LogTypes.UNBOOST_ATTACK,
            amount: skill.anti_attack
        } as UnboostAttackLog);
    };
};

export default UnboostAttackHandler;