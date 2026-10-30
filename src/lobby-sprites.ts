// The AI atlas has uneven row seams. Keep each cabinet inside its own source
// rectangle, while retaining the original cell scale and foot placement.
const ROW_SEAMS=[504,502,496,498] as const;
export function cabinetFrame(index:number,width:number,height:number){
 if(!Number.isInteger(index)||index<0||index>7)throw new RangeError('Unknown cabinet sprite');
 const column=index%4,row=Math.floor(index/4),seam=ROW_SEAMS[column]/1024*height;
 const y=row?seam:0,h=row?height-seam:seam;
 return {x:column*width/4,y,w:width/4,h,offsetY:y-row*height/2};
}
export function drawCabinetSprite(ctx:CanvasRenderingContext2D,image:HTMLImageElement,index:number,x:number,bottom:number,w:number,h:number){
 const frame=cabinetFrame(index,image.width,image.height),scale=h/(image.height/2);
 ctx.drawImage(image,frame.x,frame.y,frame.w,frame.h,x-w/2,bottom-h+frame.offsetY*scale,w,frame.h*scale);
}
