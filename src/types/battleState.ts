import { PlayerBattleState } from "./player";
import { BattleConfig } from "./config";
import PlayerIndex from "./util/playerIndex";

export class BattleState {
    player1: PlayerBattleState;
    player2: PlayerBattleState;
    maxBase: number; 
    constructor(config:BattleConfig){
        this.player1 = new PlayerBattleState(config.player1, config.data, 0);
        this.player2 = new PlayerBattleState(config.player2, config.data, 1);
        this.player1.other = this.player2;
        this.player2.other = this.player1;
        this.maxBase = Math.round(2*320*Math.log10((config.player2.level || 1000)/100)+30);//2* added due to 8/Sept/2013 update
        if(this.maxBase != 0){
            if(config.epicMode)
                this.maxBase = 30;//max 30 for bosses added due to 8/Sept/2013 update
            else
                this.maxBase = Math.max(this.maxBase, 30);
        }
    }

    forPlayer(playerIndex:PlayerIndex){
        return playerIndex === 0 ? this.player1 : this.player2;
    }
}