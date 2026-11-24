const {execFile}=require('node:child_process');
const fs=require('node:fs/promises');
const path=require('node:path');
const {promisify}=require('node:util');

const run=promisify(execFile);
const filter='split[frames][colors];[colors]palettegen=max_colors=224[palette];[frames][palette]paletteuse=dither=bayer:bayer_scale=4:diff_mode=rectangle';

function studioGifOptions(args){
  if(!args.gif)return null;
  if(typeof args.gif!=='string'||!/^[a-z0-9][a-z0-9_-]{0,79}$/i.test(args.gif)){
    throw new Error('--gif ต้องเป็นชื่อไฟล์ที่ใช้ a-z, 0-9, _ หรือ -');
  }
  const number=(key,fallback,min,max)=>{
    const raw=args[key]??fallback;
    const value=Number(raw);
    if(raw===true||!Number.isFinite(value)||value<min||value>max){
      throw new Error('--'+key+' ต้องอยู่ระหว่าง '+min+' ถึง '+max);
    }
    return value;
  };
  const settings={
    name:args.gif,
    from:number('from',0,0,120),
    to:args.to===undefined?null:number('to',0,0,120),
    still:args['still-at']===undefined?null:number('still-at',0,0,120),
    fps:number('fps',24,1,60),
    width:number('gif-width',760,160,1920),
    max:args['max-len']===undefined?null:number('max-len',0,0.2,120)
  };
  if(!Number.isInteger(settings.fps)||!Number.isInteger(settings.width)){
    throw new Error('--fps และ --gif-width ต้องเป็นจำนวนเต็ม');
  }
  if(settings.to!==null&&settings.to<=settings.from)throw new Error('--to ต้องมากกว่า --from');
  return settings;
}

async function captureStudioGif({settings,url,evaluate,temp,root,pageErrors,timeout}){
  const requested=new URL(url).searchParams.get('fx');
  const studio=await evaluate(`(async()=>{
    const studio=window.STUDIO;
    if(!studio?.state.ready||!studio.data())throw new Error('Studio โหลดเอฟเฟกต์ไม่สำเร็จ');
    studio.pause();
    await studio.prepareCapture();
    studio.seek(0);
    return {fx:studio.name(),duration:studio.duration(),tail:studio.state.tail};
  })()`);
  if(requested&&studio.fx!==requested)throw new Error('Studio เปิดเอฟเฟกต์ไม่สำเร็จ: '+requested);
  const {from,fps,width,name}=settings;
  const to=settings.to??(settings.max?Math.min(studio.duration+studio.tail,from+settings.max):studio.duration);
  const still=settings.still??(from+to)/2;
  const max=studio.duration+studio.tail;
  if(to<=from||to>max+1e-6||still<from||still>to){
    throw new Error('ช่วงอัดต้องอยู่ใน 0–'+max.toFixed(2)+' วิ และ --still-at ต้องอยู่ในช่วงอัด');
  }
  const count=Math.max(1,Math.ceil((to-from)*fps-1e-8));
  const frameScript=`(time=>{
    if(STUDIO.state.t>time+1/120)STUDIO.seek(0);
    STUDIO.seek(time);
    while(STUDIO.state.t+1/120+1e-6<time){
      const previous=STUDIO.state.t;
      STUDIO.seek(time);
      if(STUDIO.state.t<=previous)throw new Error('Studio กรอไปยังเวลาที่ขอไม่ได้');
    }
    const renderer=WD.gl.domElement;
    const canvas=document.createElement('canvas');
    canvas.width=Math.min(${width},renderer.width);
    canvas.height=Math.max(1,Math.round(renderer.height*canvas.width/renderer.width));
    canvas.getContext('2d').drawImage(renderer,0,0,canvas.width,canvas.height);
    return canvas.toDataURL('image/png').slice('data:image/png;base64,'.length);
  })`;
  const saveFrame=async(file,time)=>{
    const data=Buffer.from(await evaluate(frameScript+'('+time+')'),'base64');
    if(data.length<8||data.toString('hex',0,8)!=='89504e470d0a1a0a')throw new Error('จับเฟรม PNG ไม่สำเร็จ');
    await fs.writeFile(path.join(temp,file),data);
  };
  for(let i=0;i<count;i++)await saveFrame(String(i).padStart(5,'0')+'.png',from+i/fps);
  await saveFrame('still.png',still);
  if(pageErrors.length)throw new Error('Studio รายงานข้อผิดพลาดระหว่างจับภาพ');
  try{
    await run(process.env.FFMPEG||'ffmpeg',[
      '-hide_banner','-loglevel','error','-y','-filter_complex_threads','1',
      '-framerate',String(fps),'-i',path.join(temp,'%05d.png'),
      '-filter_complex',filter,'-loop','0',path.join(temp,'capture.gif')
    ],{timeout,windowsHide:true});
  }catch(error){
    if(error.code==='ENOENT'){
      // no FFmpeg on this machine: pack the same PNG frames with Python + Pillow
      try{await run(process.env.PYTHON||'python',[path.join(__dirname,'png-to-gif.py'),temp,String(fps)],{timeout,windowsHide:true});}
      catch(e2){throw new Error('ไม่พบ FFmpeg และประกอบ GIF ด้วย Python ไม่สำเร็จ: '+(e2.stderr||e2.message).trim());}
    }else throw new Error('ประกอบ GIF ไม่สำเร็จ: '+(error.stderr||error.message).trim());
  }
  const shots=path.join(root,'shots');
  await fs.mkdir(shots,{recursive:true});
  const gif=path.join(shots,name+'.gif'),image=path.join(shots,name+'.png');
  await fs.copyFile(path.join(temp,'capture.gif'),gif);
  await fs.copyFile(path.join(temp,'still.png'),image);
  return {fx:studio.fx,gif,still:image,from,to,stillAt:still,frames:count,fps};
}

module.exports={studioGifOptions,captureStudioGif};
