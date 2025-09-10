import { Skill, DefaultSkill } from "../types/datafile";
import type { IBattleRunner } from '../types/runner';
import { CurrentUnit, PlayerBattleState } from "../types/player";
import { GenericLog } from "../types/log";
import { BattlePhase } from "../types/util/battlePhase";

import damage from './main/damageHandler';
import heal from './main/healHandler';
import preventJam from './pre/preventJamHandler';
import preventControl from './pre/preventControlHandler';
import preventReinforce from './pre/preventReinforceHandler';
import summon from './pre/summonHandler';
import jam from './jam/jamHandler';
import control from './control/controlHandler';
import antiheal from './special/antihealHandler';
import attack from './special/attackHandler';
import defense from './special/defenceHandler';
import boost from './special/boostHandler';
import reinforce from './special/reinforceHandler';
import rally from './special/rallyHandler';
import shield from './special/shieldHandler';
import antishield from './special/antishieldHandler';
import varheal from './main/healEachHandler';
import vardamage from './main/damageEachHandler';
import reinforcedamage from './main/damageReinforcedHandler';
import jamdamage from './main/damageJammedHandler';
import enemyjamdamage from './main/damageEnemyJammedHandler';
import jamheal from './main/healJammedHandler';
import healdamage from './main/damageHealedHandler';
import unboostAttack from './main/unboostAttackHandler';
import unboostDefense from './main/unboostDefenseHandler';

interface ISkillHandler<TSkillType extends Skill = DefaultSkill> {
    applicablePhase: BattlePhase;
    applicableTags: string[],//tags to listen for
    handler: (ctx:IBattleRunner, skill:TSkillType, player: PlayerBattleState, unit: CurrentUnit, baseLog?: GenericLog) => void;
};

const DefaultSkills:ISkillHandler[] = [
    new preventJam(),
    new preventControl(),
    new preventReinforce(),
    new summon(),
    new jam(),
    new control(),
    new antiheal(),
    new attack(),
    new defense(),
    new boost(),
    new reinforce(),
    new rally(),
    new shield(),
    new antishield(),
    new damage(),
    new heal(),
    new varheal(),
    new vardamage(),
    new reinforcedamage(),
    new jamdamage(),
    new enemyjamdamage(),
    new jamheal(),
    new healdamage(),
    new unboostAttack(),
    new unboostDefense()
];

type PhaseHandlerMap<TSkillType extends Skill = DefaultSkill> = Record<string, ISkillHandler<TSkillType>[]>;
type HandlerRegistry<TSkillType extends Skill = DefaultSkill> = Record<BattlePhase, PhaseHandlerMap<TSkillType>>;

class SkillHandlerRegistry<TSkillType extends Skill = DefaultSkill> {
    private handlers: HandlerRegistry<TSkillType> = {} as HandlerRegistry<TSkillType>;

    constructor() {
        Object.values(BattlePhase).forEach(phase => {
            this.handlers[phase] = {};
        });
    }

    registerDefaults(): void {
        this.registerHandlers(DefaultSkills);
    }

    registerHandlers(skillHandlers:ISkillHandler<TSkillType>[]){
        skillHandlers.forEach((skillHandler:ISkillHandler<TSkillType>) => {
            this.register(skillHandler);
        });
    }

    register(handler: ISkillHandler<TSkillType>): void {
        const phase = this.handlers[handler.applicablePhase];
        if(!phase)
            return;
        handler.applicableTags.forEach(tag => {
            if(!(tag in phase)){
                phase[tag] = [];
            }
            phase[tag].push(handler);
        });
    }

    getHandlers(phase:BattlePhase): PhaseHandlerMap<TSkillType> {
        return this.handlers[phase];
    }
}

export { DefaultSkills, SkillHandlerRegistry };
export type { ISkillHandler };