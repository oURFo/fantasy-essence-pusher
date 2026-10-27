// Hinged leaves keep the doorway visible throughout opening and reverse on closing.
export const TEMPLE_DOOR={x:218,y:437,width:590,height:727,seam:512} as const;
export function templeDoorPose(amount:number){
 const open=Math.max(0,Math.min(1,amount)),eased=open*open*(3-2*open);
 const leftWidth=294*(1-.94*eased),rightWidth=296*(1-.94*eased);
 return{open,eased,leftX:218,leftWidth,rightX:808-rightWidth,rightWidth};
}
export function drawTempleDoors(c:CanvasRenderingContext2D,closed:CanvasImageSource,interior:CanvasImageSource,amount:number){
 const p=templeDoorPose(amount);if(p.open<=0)return;
 c.save();c.beginPath();c.rect(TEMPLE_DOOR.x,TEMPLE_DOOR.y,TEMPLE_DOOR.width,TEMPLE_DOOR.height);c.clip();
 c.drawImage(interior,218,437,590,727,218,437,590,727);
 // Narrow the original painted leaves toward their outer hinges; never replace the interior with a gradient.
 c.drawImage(closed,218,437,294,727,p.leftX,437,p.leftWidth,727);
 c.drawImage(closed,512,437,296,727,p.rightX,437,p.rightWidth,727);
 c.restore();
}
