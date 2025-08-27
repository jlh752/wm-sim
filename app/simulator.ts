import type {IBattleRunner, BattleConfig, BattleResult, Force, PlayerConfig, PlayerRequirementsData, PlayerIndex, CurrentUnit, TargetSpecification, PlayerBattleState} from './types/runner';
import {BattleState} from './types/runner';
import type {DataFile, Unit, Skill} from './types/datafile';
import { NormalizePlayerConfig, RoundHalfOdd, RandomRange } from './util/util';
import { PHASE_ORDER, BattlePhase } from './types/util/battlePhase';
import { GenericLog, DamageLog, HealLog, LogTypes, PreventJamLog, PreventControlLog, PreventReinforcementLog, JamLog, ControlLog } from './types/log';
import { ISkillHandler, SkillHandlerRegistry } from './skillhandler/skillHandler';

export default class BattleRunner implements IBattleRunner {
    private _config?:BattleConfig = undefined;
    private _result?:BattleResult = undefined;
    private _state?:BattleState = undefined;
    private _skillHandler:SkillHandlerRegistry = new SkillHandlerRegistry();
    private userHasRegisteredSkills = false;

    get config():(BattleConfig | undefined) {return this._config;}
    set config(value: BattleConfig) { this._config = value; }
    get result():(BattleResult | undefined) {return this._result;}
    set result(value: BattleResult) { this._result = value; }
    get state():(BattleState | undefined) {return this._state;}
    set state(value: BattleState) { this._state = value; }

    run(config: BattleConfig): BattleResult {
        if(this.userHasRegisteredSkills === false)
            this._skillHandler.registerDefaults();
        config.player1 = NormalizePlayerConfig(config.player1, config.data);
        config.player2 = NormalizePlayerConfig(config.player2, config.data);
        this.config = config;
        this.state = new BattleState(config);

        this.result = {
            player1: { baseDamage: 0, totalDamage: 0 },
            player2: { baseDamage: 0, totalDamage: 0 },
            logs: []
        };

        for(const phase of PHASE_ORDER) {
            this.executePhase(phase, 0);
            this.executePhase(phase, 1);
        }

        return this.result;
    }

    registerSkillHandlers(skillHandlers: ISkillHandler[]): void {
        this.userHasRegisteredSkills = true;
        this._skillHandler.registerHandlers(skillHandlers);
    }

    executePhase(phase: BattlePhase, playerIndex:PlayerIndex): void {
        console.log('executing', phase, 'for', playerIndex)
        if(!this.config || !this.state || !this.result)
            return;
        const player = playerIndex === 0 ? this.state.player1 : this.state.player2;
        //iterate on length to ensure controlled and reinforced units also get executed
        for(let i = 0; i < player.force.length; i++){
            const unit = player.force[i];
            if(!unit.definition.skills)
                continue;
            for(const ability of unit.definition.skills) {
                if(this.proc(ability.chance)){
                    if(player.checkRequirements(ability.skill_id)){
                        this.executeSkill(phase, ability.skill_id, unit, playerIndex);
                    }
                }
            }
        }
    }

    executeSkill(phase: BattlePhase, skill_id: number, unit:CurrentUnit, playerIndex:PlayerIndex): void{
        const player = this.state?.forPlayer(playerIndex);
        if(!player || !this.config || !this.result)
            return;
        const skill = this.config!.data.skills[skill_id];
        const genericLog:GenericLog = {type:LogTypes.DAMAGE, skill_id: skill_id, player_id: playerIndex, unit_id: unit.unitId, is_reinforced: unit.isReinforced};
        const applicableHandlers = this._skillHandler.getHandlers(phase);
        for(const handler in applicableHandlers){
            if(handler in skill){
                for(let i = 0; i < applicableHandlers[handler].length; i++){
                    applicableHandlers[handler][i].handler(this, skill, player, unit, genericLog);
                }
            }
        }
        switch(phase){
            case BattlePhase.SPECIAL:
                if(skill.antiheal){}
                if(skill.attack){}
                if(skill.defense){}
                if(skill.support_bonus){}
                if(skill.reinforce){}
                if(skill.rally){}
                if(skill.shield){}
                if(skill.antishield){}
                if(skill.epic_antiheal){}
                break;
            case BattlePhase.MAIN:
                if(skill.var_heal){}
                if(skill.var_damage){}
                if(skill.reinforce_damage){}
                if(skill.jam_damage){}
                if(skill.enemy_jam_damage){}
                if(skill.jam_heal){}
                if(skill.anti_attack){}
                if(skill.anti_defense){}
                if(skill.heal_damage){}
                break;
            default:
                console.warn(`Unknown phase: ${phase}`);
                break;
        }
    }

    proc(p: number){
        return (1-p <= Math.random());
    }
}