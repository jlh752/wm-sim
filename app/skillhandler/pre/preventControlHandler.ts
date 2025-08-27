import { Skill } from "../../types/datafile";
import { CurrentUnit, IBattleRunner, PlayerBattleState } from "../../types/runner";
import { LogTypes, PreventControlLog, GenericLog } from "../../types/log";
import type {ISkillHandler} from "../skillHandler";
import { BattlePhase } from "../../types/util/battlePhase";

class AnticontrolHandler implements ISkillHandler {
    applicablePhase = BattlePhase.PRE;
    applicableTags = ['anticontrol'];
    handler = (ctx:IBattleRunner, skill:Skill, player: PlayerBattleState, unit: CurrentUnit, baseLog?: GenericLog) => {
        player.preventControls += skill.anticontrol!;
        ctx.result?.logs.push({
            ...baseLog, type: LogTypes.PREVENT_CONTROL,
            amount: skill.anticontrol
        } as PreventControlLog);
    };
};

export default AnticontrolHandler;