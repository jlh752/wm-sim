import { Skill } from "../../types/datafile";
import { IBattleRunner } from "../../types/runner";
import { PlayerBattleState, CurrentUnit } from "../../types/player";
import { LogTypes, UnboostDefenseLog, GenericLog } from "../../types/log";
import type {ISkillHandler} from "../skillHandler";
import { BattlePhase } from "../../types/util/battlePhase";

class UnboostDefenseHandler implements ISkillHandler {
    applicablePhase = BattlePhase.MAIN;
    applicableTags = ['anti_defense'];
    handler = (ctx:IBattleRunner, skill:Skill, player: PlayerBattleState, unit: CurrentUnit, baseLog?: GenericLog) => {
        player.unboostAttack(skill.anti_defense!);
        ctx.result?.logs.push({
            ...baseLog, type: LogTypes.UNBOOST_DEFENSE,
            amount: skill.anti_defense
        } as UnboostDefenseLog);
    };
};

export default UnboostDefenseHandler;