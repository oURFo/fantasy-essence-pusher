import {GoldMine} from './mine-game.ts';
import {CoinPusher} from './physics.ts';
import {MACHINES,type MachineId} from './machines.ts';
import {PlayerWallet} from './wallet.ts';
import {SkyWings} from './sky-game.ts';
import {FruitPinball,FruitProgress} from './fruit-game.ts';
import {NightMarket} from './ring-game.ts';
import {FateOrbit} from './fate-game.ts';
export class ArcadeSession {
  game:CoinPusher|FruitPinball|NightMarket|FateOrbit|GoldMine|null=null;
  machineId:MachineId|null=null;
  leaveRequested=false;
  readonly wallet:PlayerWallet;
  readonly fruitProgress:FruitProgress;
  constructor(wallet:PlayerWallet,fruitProgress=new FruitProgress()){this.wallet=wallet;this.fruitProgress=fruitProgress;}
  enter(id:MachineId) {
    if(this.game||!MACHINES.some(m=>m.id===id))return false;
    this.game=id==='gold-mine'?new GoldMine(this.wallet):id==='fate-orbit'?new FateOrbit(this.wallet):id==='night-market'?new NightMarket(this.wallet):id==='fruit-banquet'?new FruitPinball(this.wallet,this.fruitProgress):id==='sky-wings'?new SkyWings(this.wallet):new CoinPusher(undefined,undefined,this.wallet);this.machineId=id;return true;
  }
  requestLeave(){if(!this.game)return false;this.leaveRequested=true;return true;}
  cancelLeave(){this.leaveRequested=false;}
  confirmLeave() {
    if(!this.game||!this.leaveRequested)return false;
    this.game.dispose();this.game=null;this.machineId=null;this.leaveRequested=false;return true;
  }
  step(){if(this.game&&!this.leaveRequested)this.game.step();}
}
