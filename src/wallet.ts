import {CONFIG} from './config.ts';
export interface WalletStorage {getItem(key:string):string|null;setItem(key:string,value:string):void;}
export const REFILL_AMOUNT=500,REFILL_COOLDOWN=4*60*60*1000;
export const WALLET_KEY='fantasy-arcade.wallet.v1';
export class PlayerWallet {
  private value=CONFIG.startingGold;
  private refillAt=0;
  private storage?:WalletStorage;
  constructor(storage?:WalletStorage) {
    this.storage=storage;
    try {
      const raw=storage?.getItem(WALLET_KEY);
      if(raw!==null&&raw!==undefined) {
        const data=JSON.parse(raw);
        if(data?.version===1&&Number.isSafeInteger(data.gold)&&data.gold>=0){this.value=data.gold;if(Number.isSafeInteger(data.refillAt)&&data.refillAt>=0)this.refillAt=data.refillAt;}
      }
    } catch { /* Restricted storage and invalid data fall back to an in-memory wallet. */ }
    this.persist();
  }
  get gold(){return this.value;}
  refillRemaining(now=Date.now()){return Math.max(0,this.refillAt-now);}
  claimRefill(now=Date.now()){
    if(!Number.isSafeInteger(now)||now<0||!Number.isSafeInteger(now+REFILL_COOLDOWN))return false;
    // Re-read before claiming so an older lobby tab cannot bypass another tab's cooldown.
    try{const data=JSON.parse(this.storage?.getItem(WALLET_KEY)??'null');if(data?.version===1&&Number.isSafeInteger(data.gold)&&data.gold>=0){this.value=data.gold;if(Number.isSafeInteger(data.refillAt)&&data.refillAt>=0)this.refillAt=Math.max(this.refillAt,data.refillAt);}}catch{}
    if(this.refillRemaining(now)>0||!Number.isSafeInteger(this.value+REFILL_AMOUNT))return false;
    this.value+=REFILL_AMOUNT;this.refillAt=now+REFILL_COOLDOWN;this.persist();return true;
  }
  setBalance(value:number) {
    if(!Number.isSafeInteger(value)||value<0)throw new RangeError('Invalid coin balance');
    this.value=value;this.persist();
  }
  spend(amount:number) {
    if(!Number.isSafeInteger(amount)||amount<=0||this.value<amount)return false;
    this.setBalance(this.value-amount);return true;
  }
  credit(amount:number) {
    if(!Number.isSafeInteger(amount)||amount<=0||!Number.isSafeInteger(this.value+amount))return false;
    this.setBalance(this.value+amount);return true;
  }
  private persist(){try{this.storage?.setItem(WALLET_KEY,JSON.stringify({version:1,gold:this.value,refillAt:this.refillAt}));}catch{/* Keep the session playable without browser storage. */}}
}
