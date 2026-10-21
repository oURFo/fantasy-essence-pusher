// Lobby-only key sequence. Repeated keydown and editable fields never grant coins.
export class LobbyGMCode{
 private digits='';private last=-Infinity;
 reset(){this.digits='';this.last=-Infinity;}
 key(key:string,now:number,allowed:boolean,repeat=false,modified=false){
  if(!allowed||modified){this.reset();return false;}if(repeat)return false;
  if(now-this.last>2000)this.digits='';
  if(key!=='9'&&key!=='5'){this.reset();return false;}
  this.last=now;this.digits=(this.digits+key).slice(-3);
  if(this.digits==='995'){this.reset();return true;}return false;
 }
}
