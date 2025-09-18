import type { BattleResult } from '../types/result';
import {LogTypes} from '../types/log';
import type { IMultiBattleResult } from '../orchestrator/types/simulationOrchestrator';
import type {Log} from '../types/log';
import type {DataFile} from '../types/datafile';
import PlayerIndex from '../types/util/playerIndex';


export function RenderAggregateBattleResult(result: IMultiBattleResult): HTMLElement {
    return document.createElement('div');
}

const OTHER_PLAYER_CLASS = 'other';
export function RenderSingleBattleResult(result: BattleResult, data: DataFile, customLogTypes: Record<string, (log:Log, data:DataFile) => HTMLElement[]> = {}): HTMLElement {
    const prefixes = ["Your", "Enemy's"];
    const resultElement = document.createElement('ul');
    result.logs.forEach(log => {
        let els:HTMLElement[] = [];
        const prefix = `${prefixes[log.player_id]} ${log.is_reinforced ? "reinforced " : ""} ${data.units[log.unit_id].name}`;
        switch(log.type){
            case LogTypes.DAMAGE:
                els.push(LogLine(log.player_id, `${prefix} \
                    used ${data.skills[log.skill_id].name},  \
                    ${log.rally ? `rallies for ${log.rally}, ` : ""} \
                    ${log.rally ? `rallies for ${log.rally}, ` : ""} \
                    ${log.amount >= 0 ? `dealing ${log.amount} damage` : `healing the enemy for ${-log.amount} health}`}`));
                break;
            case LogTypes.HEAL:
                if(log.prevented){
                    els.push(LogLine(log.player_id, `${prefix} healing for ${log.prevented} was prevented`));
                }
                if(log.amount > 0){
                    els.push(LogLine(log.player_id, `${prefix} \
                        used ${data.skills[log.skill_id].name}, \
                        ${log.amount >= 0 ? `healing for ${log.amount} health` : `damaging self for ${-log.amount} damage`}`));
                }
                break;
            case LogTypes.JAM:
                els.push(LogLine(log.player_id, `${prefix} ${log.success ?
                    `jammed ${data.units[log.target_unit_id].name}` :
                    `'s Jam against ${data.units[log.target_unit_id].name} was prevented`}`));
                break;
            case LogTypes.CONTROL:
                els.push(LogLine(log.player_id, `${prefix} \
                    ${log.success ? "took control of" : "failed to control"} \
                    ${data.units[log.unit_id].name}`));
                break;
            case LogTypes.PREVENT_JAM:
                els.push(LogLine(log.player_id, `${prefix} will block ${log.amount} jam(s)`));
                break;
            case LogTypes.PREVENT_CONTROL:
                els.push(LogLine(log.player_id, `${prefix} will block ${log.amount} control(s)`));
                break;
            case LogTypes.PREVENT_REINFORCEMENT:
                els.push(LogLine(log.player_id, `${prefix} will block ${log.amount} reinforcements(s)`));
                break;
            case LogTypes.PREVENT_HEAL:
                els.push(LogLine(log.player_id, `${prefix} will prevent up to ${log.amount} healing`));
                break;
            case LogTypes.ATTACK_POWER:
                els.push(LogLine(log.player_id, `${prefix} \
                    used ${data.skills[log.skill_id].name}, \
                    increasing Attack by ${100*log.amount}%!`));
                break;
            case LogTypes.DEFENSE_POWER:
                els.push(LogLine(log.player_id, `${prefix} \
                    used ${data.skills[log.skill_id].name}, \
                    increasing Defense by ${100*log.amount}%!`));
                break;
            case LogTypes.DAMAGE_BOOST:
                els.push(LogLine(log.player_id, `${prefix} \
                    used ${data.skills[log.skill_id].name}, \
                    increasing ${log.target_unit ? data.units[log.target_unit].name : ""} \
                    ${log.target_type ? data.types[log.target_type].name : ""}${log.target_subtype ? data.subtypes[log.target_subtype].name : ""} \
                    by ${100*log.amount}%!`));
                break;
            case LogTypes.REINFORCE:
                log.instances.forEach(reinforceInstance => {
                    if(!reinforceInstance.success){
                        els.push(LogLine(log.player_id, `${prefixes[log.player_id]} reinforce ${reinforceInstance.amount} \
                            ${data.units[reinforceInstance.target_unit_id].name} was prevented`));
                    }else{
                        els.push(LogLine(log.player_id, `${prefix} brought ${reinforceInstance.amount} \
                            ${data.units[reinforceInstance.target_unit_id].name} into battle`));
                    }
                });
                break;
            case LogTypes.SUMMON:
                els.push(LogLine(log.player_id, `${prefix} summoned ${log.amount} \
                    ${data.units[log.target_unit_id]} into battle`));
                break;
            case LogTypes.RALLY:
                els.push(LogLine(log.player_id, `${prefix} \
                    used ${data.skills[log.skill_id].name} \
                    and rallies ${log.target_unit ? data.units[log.target_unit].name : ""} \
                    ${log.target_type ? data.types[log.target_type].name : ""}${log.target_subtype ? data.subtypes[log.target_subtype].name : ""} \
                    damage by ${log.amount} per attack`));
                break;
            case LogTypes.REDUCE:
                els.push(LogLine(log.player_id, `${prefix} \
                    used ${data.skills[log.skill_id].name} \
                    and will reduce damage by ${log.amount} per attack`));
                break;
            case LogTypes.ANTISHIELD:
                els.push(LogLine(log.player_id, `${prefix} \
                    used ${data.skills[log.skill_id].name} \
                    and will reduce enemy shield by ${log.amount}`));
                break;
            case LogTypes.UNBOOST_ATTACK:
                els.push(LogLine(log.player_id, `${prefix} \
                    used ${data.skills[log.skill_id].name} \
                    reducing boosted enemy Attack by ${100*log.amount}%!`));
                break;
            case LogTypes.UNBOOST_DEFENSE:
                els.push(LogLine(log.player_id, `${prefix} \
                    used ${data.skills[log.skill_id].name} \
                    reducing boosted enemy Defense by ${100*log.amount}%!`));
                break;
            default:
                if(log.custom in customLogTypes){
                    els.splice(-1, 0, ...customLogTypes[log.custom](log, data));
                }
                break;
        }
        els.forEach(el => resultElement.appendChild(el));
    });

    const p1Base = LogLine(0,`Your Force dealt ${result.player1.baseDamage} Damage. [${result.player1.power}]`);
    p1Base.classList.add("space-above");
    resultElement.appendChild(p1Base);
    const p2Base = LogLine(0,`Enemy Force dealt ${result.player2.baseDamage} Damage. [${result.player2.power}]`);
    resultElement.appendChild(p2Base);

    const totalText = LogLine(0,"Total Damage Dealt");
    totalText.classList.add("space-above");
    resultElement.appendChild(totalText);

    const p1Total = LogLine(0,`You: ${Math.abs(result.player1.totalDamage)} ${result.player1.totalDamage <= 0 ? "heal" : "damage"}.`);
    resultElement.appendChild(p1Total);
    const p2Total = LogLine(0,`Enemy: ${Math.abs(result.player2.totalDamage)}  ${result.player2.totalDamage <= 0 ? "heal" : "damage"}.`);
    resultElement.appendChild(p2Total);

    const verdictText = LogLine(0,`You ${result.player1.totalDamage >= result.player2.totalDamage ? "Won" : "Lost"}!`);
    resultElement.appendChild(verdictText);

    return resultElement;
}

export function LogLine(playerId:PlayerIndex, text:string):HTMLElement{
    const el = document.createElement("li");
    if(playerId === 1)
        el.classList.add(OTHER_PLAYER_CLASS);
    el.innerText = text;
    return el;
}