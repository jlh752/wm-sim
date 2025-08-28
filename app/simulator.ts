import type {IBattleRunner} from './types/runner';
import { BattleConfig, Force, PlayerConfig } from './types/config';
import { BattleResult } from './types/result';
import { CurrentUnit } from './types/player';
import { BattleState } from './types/battleState';
import type PlayerIndex from './types/util/playerIndex';
import { NormalizePlayerConfig, Proc } from './util/util';
import { PHASE_ORDER, BattlePhase } from './types/util/battlePhase';
import { GenericLog, LogTypes } from './types/log';
import { ISkillHandler, SkillHandlerRegistry } from './skillhandler/skillHandler';
import { DataFile } from './types/datafile';
import { DEFAULT_POWER, MAGIC_LEVEL } from './util/magicNumbers';

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

    static PVP_MIN_DMG:number = 1;
    static PVE_MIN_DMG:number = 10;

    run(config: BattleConfig): BattleResult {
        if(this.userHasRegisteredSkills === false)
            this._skillHandler.registerDefaults();
        this.config = this.ensureDefaultConfig(config);
        config.player1 = NormalizePlayerConfig(config.player1, config.data);
        config.player2 = NormalizePlayerConfig(config.player2, config.data);
        this.state = new BattleState(config);

        this.result = {
            player1: { baseDamage: 0, totalDamage: 0, power: 0 },
            player2: { baseDamage: 0, totalDamage: 0, power: 0 },
            logs: []
        };

        for(const phase of PHASE_ORDER) {
            this.executePhase(phase, 0);
            this.executePhase(phase, 1);
        }
        
        this.result.player1.power = this.config.epicMode ? this.state.player1.baseAttack : this.state.player1.getAttack();
        this.result.player2.power = this.config.epicMode ? this.state.player2.baseDefense : this.state.player2.getDefense();
        const minimumAttackerDamage = this.config.epicMode ? BattleRunner.PVE_MIN_DMG : BattleRunner.PVP_MIN_DMG;
        //choose a 'mid-point' for the base damage, epic have much less variation than pvp
	    const baseDmgMidpoint = this.state.maxBase / (this.config.epicMode ? 2.4 + Math.random()/5 : 2 + Math.random());
        //from the semi-random mid-point, move away from it logarithmicly based on the ratio between atk/def powers
        //bound within max and min damage
        const powerDifferential = 0.75*this.state.maxBase*Math.log10(this.result.player1.power/this.result.player2.power);
        this.result.player1.baseDamage = Math.round(Math.min(Math.max(baseDmgMidpoint + powerDifferential + 1, minimumAttackerDamage), this.state.maxBase));
	    this.result.player2.baseDamage = Math.round(Math.min(Math.max(baseDmgMidpoint - powerDifferential + 1, 1), this.state.maxBase));

        this.result.player1.totalDamage = this.result.player1.baseDamage + this.state.player1.totalDamage - this.state.player2.totalHeal;
        this.result.player2.totalDamage = this.result.player2.baseDamage + this.state.player2.totalDamage - this.state.player1.totalHeal;

        return this.result;
    }

    registerSkillHandlers(skillHandlers: ISkillHandler[]): void {
        this.userHasRegisteredSkills = true;
        this._skillHandler.registerHandlers(skillHandlers);
    }

    executePhase(phase: BattlePhase, playerIndex:PlayerIndex): void {
        if(!this.config || !this.state || !this.result)
            return;
        const player = playerIndex === 0 ? this.state.player1 : this.state.player2;
        //iterate on length to ensure controlled and reinforced units also get executed
        for(let i = 0; i < player.force.length; i++){
            const unit = player.force[i];
            if(!unit.definition.skills)
                continue;
            for(const ability of unit.definition.skills) {
                if(Proc(ability.chance)){
                    if(player.checkRequirements(ability.skill_id)){
                        this.executeSkill(phase, ability.skill_id, unit, playerIndex);
                    }
                }
            }
        }
        player.phaseComplete();
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
    }

    private ensureDefaultConfig(config:BattleConfig):BattleConfig{
        if(!config.player1)
            config.player1 = {} as PlayerConfig;
        if(!config.player1.force)
            config.player1.force = {} as Force;
        if(typeof config.player1.force !== "string"){
            if(!config.player1.force.units)
                config.player1.force.units = [];
            if(!config.player1.force.reinforcements)
                config.player1.force.reinforcements = [];
        }
        if(!config.player1.power)
            config.player1.power = DEFAULT_POWER;

        if(!config.player2)
            config.player2 = {} as PlayerConfig;
        if(!config.player2.force)
            config.player2.force = {} as Force;
        if(typeof config.player2.force !== "string"){
            if(!config.player2.force.units)
                config.player2.force.units = [];
            if(!config.player2.force.reinforcements)
                config.player2.force.reinforcements = [];
        }
        if(!config.player2.power)
            config.player2.power = DEFAULT_POWER;
        if(!config.player2.level)
            config.player2.level = MAGIC_LEVEL;

        config.epicMode = config.epicMode || false;
        if(!config.data)
            config.data = {} as DataFile;
        if(!config.data.units) config.data.units = [];
        if(!config.data.skills) config.data.skills = [];
        if(!config.data.types) config.data.types = [];
        if(!config.data.subtypes) config.data.subtypes = [];
        return config;
    }
}