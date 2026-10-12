'use strict';
/* Local region processing. No model, network or generative reconstruction. */
self.onmessage=({data:m})=>{let image=m.bitmap,mask=m.mask;try{
const w=image.width,h=image.height,n=w*h;if(n>12000000||mask.width!==w||mask.height!==h)throw Error('retouchLarge');
const c=new OffscreenCanvas(w,h),ctx=c.getContext('2d',{willReadFrequently:true});ctx.drawImage(image,0,0);image.close();image=null;
const mc=new OffscreenCanvas(w,h),mx=mc.getContext('2d',{willReadFrequently:true});mx.drawImage(mask,0,0);mask.close();mask=null;
const base=ctx.getImageData(0,0,w,h),d=base.data,selection=mx.getImageData(0,0,w,h).data;let count=0,left=w,top=h,right=-1,bottom=-1;
for(let i=0;i<n;i++)if(selection[i*4+3]>0){count++;const x=i%w,y=Math.floor(i/w);left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}
if(!count)throw Error('selectionEmpty');let processed;
if(m.op==='heal'){
if(count>100000||count>n*.15)throw Error('healArea');left=Math.max(0,left-2);top=Math.max(0,top-2);right=Math.min(w-1,right+2);bottom=Math.min(h-1,bottom+2);
const rw=right-left+1,rh=bottom-top+1,size=rw*rh;if(size>1000000)throw Error('healArea');
const rgb=new Float32Array(size*3),known=new Uint8Array(size),selected=new Uint8Array(size),opaque=new Uint8Array(size),queue=new Uint32Array(size);let head=0,tail=0;
for(let y=0;y<rh;y++)for(let x=0;x<rw;x++){const k=y*rw+x,i=((top+y)*w+left+x)*4;for(let z=0;z<3;z++)rgb[k*3+z]=d[i+z];opaque[k]=d[i+3]>8?1:0;selected[k]=selection[i+3]>0&&opaque[k]?1:0;if(!selected[k]&&opaque[k]){known[k]=1;queue[tail++]=k;}}
if(!tail)throw Error('healArea');
const neighbors=k=>{const x=k%rw,y=Math.floor(k/rw),v=[];if(x)v.push(k-1);if(x<rw-1)v.push(k+1);if(y)v.push(k-rw);if(y<rh-1)v.push(k+rw);return v;};
while(head<tail){const k=queue[head++];for(const q of neighbors(k))if(!known[q]&&selected[q]){const adjacent=neighbors(q).filter(a=>known[a]&&opaque[a]);if(!adjacent.length)continue;for(let z=0;z<3;z++)rgb[q*3+z]=adjacent.reduce((sum,a)=>sum+rgb[a*3+z],0)/adjacent.length;known[q]=1;queue[tail++]=q;}}
for(let pass=0;pass<80;pass++)for(let y=0;y<rh;y++)for(let x=(y+pass)%2;x<rw;x+=2){const k=y*rw+x;if(!selected[k]||!known[k])continue;const adjacent=neighbors(k).filter(a=>known[a]&&opaque[a]);if(adjacent.length)for(let z=0;z<3;z++)rgb[k*3+z]=adjacent.reduce((sum,a)=>sum+rgb[a*3+z],0)/adjacent.length;}
for(let y=0;y<rh;y++)for(let x=0;x<rw;x++){const k=y*rw+x;if(!selected[k]||!known[k])continue;const i=((top+y)*w+left+x)*4,a=selection[i+3]/255;for(let z=0;z<3;z++)d[i+z]=d[i+z]*(1-a)+rgb[k*3+z]*a;}
}else{
if(m.op==='blur'){const bc=new OffscreenCanvas(w,h),bx=bc.getContext('2d',{willReadFrequently:true});bx.filter='blur('+Math.max(1,Math.min(40,Number(m.radius)||12))+'px)';bx.drawImage(c,0,0);processed=bx.getImageData(0,0,w,h).data;}
if(!['blur','bw','sepia'].includes(m.op))throw Error('worker');
for(let i=0;i<d.length;i+=4){const a=selection[i+3]/255;if(!a)continue;const r=d[i],g=d[i+1],b=d[i+2],l=.2126*r+.7152*g+.0722*b;const color=m.op==='blur'?[processed[i],processed[i+1],processed[i+2]]:m.op==='bw'?[l,l,l]:[Math.min(255,.393*r+.769*g+.189*b),Math.min(255,.349*r+.686*g+.168*b),Math.min(255,.272*r+.534*g+.131*b)];for(let z=0;z<3;z++)d[i+z]=d[i+z]*(1-a)+color[z]*a;}
}
ctx.putImageData(base,0,0);const out=c.transferToImageBitmap();self.postMessage({bitmap:out},[out]);
}catch(e){image?.close();mask?.close();self.postMessage({error:e.message});}};
