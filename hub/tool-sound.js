/* tool-sound.js — สวิตช์เสียงกลางของ Tool ทุกตัว (กฎ: guides/TOOL-UI-RULES.md)
   ค่าเริ่มต้น = ปิดเสียง • เก็บใน localStorage 'fs_tool_sound' ('1' = เปิด) ใช้ร่วมกันทุก Tool บน origin เดียวกัน
   เกมที่ถูกฝังใน Tool (index.html?studio / ?tunetool) อ่านคีย์เดียวกันใน js/18-audio.js และฟัง event 'storage' เพื่อเปลี่ยนทันที
   ใช้: <script src="hub/tool-sound.js"></script> แล้วมีปุ่มโผล่ใน <div data-tool-sound></div> หรือเรียก ToolSound.button() เอง */
(function(){
  const KEY='fs_tool_sound';
  const get=()=>{try{return localStorage.getItem(KEY)==='1';}catch(e){return false;}};
  const set=v=>{try{localStorage.setItem(KEY,v?'1':'0');}catch(e){}
    document.querySelectorAll('.tl-snd').forEach(b=>paint(b));
    document.querySelectorAll('iframe').forEach(f=>{try{f.contentWindow.postMessage({fsToolSound:!!v},'*');}catch(e){}});};
  function paint(b){const on=get();b.classList.toggle('on',on);b.textContent=on?'🔊 เสียง: เปิด':'🔇 เสียง: ปิด';b.title=on?'คลิกเพื่อปิดเสียง (ค่าเริ่มต้นของ Tool คือปิด)':'Tool ปิดเสียงไว้เป็นค่าเริ่มต้น — คลิกเพื่อเปิด';}
  function button(){const b=document.createElement('button');b.className='tl-snd';b.type='button';paint(b);b.onclick=()=>set(!get());return b;}
  window.ToolSound={get,set,button};
  window.addEventListener('storage',e=>{if(e.key===KEY)document.querySelectorAll('.tl-snd').forEach(paint);});
  document.addEventListener('DOMContentLoaded',()=>document.querySelectorAll('[data-tool-sound]').forEach(n=>n.append(button())));
})();
