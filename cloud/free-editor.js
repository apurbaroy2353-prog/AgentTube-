(() => {
 const {MediaRecorder,AudioContext,webkitAudioContext,Blob,HTMLCanvasElement} = window;
 const get=id=>document.getElementById(id);
 let cancel;let outputUrl;
 const status=text=>{get('render-status').textContent=text;};
 get('media-files').addEventListener('change',()=>{
  const list=get('media-order');list.replaceChildren();
  for(const file of get('media-files').files){const li=document.createElement('li');li.textContent=file.name;list.append(li);}
 });
 get('cancel-render').onclick=()=>cancel?.();
 get('render-form').onsubmit=async event=>{
  event.preventDefault();
  if(cancel)return;
  const files=[...get('media-files').files];
  const duration=Number(get('render-duration').value);
  if(!files.length || files.length>20 || files.reduce((n,f)=>n+f.size,0)>150*1024*1024){status('১ থেকে ২০টি ফাইল দিন; মোট ১৫০ MB-এর মধ্যে রাখুন।');return;}
  if(!Number.isFinite(duration)||duration<3||duration>120){status('দৈর্ঘ্য ৩ থেকে ১২০ সেকেন্ড দিন।');return;}
  if(!MediaRecorder || !HTMLCanvasElement.prototype.captureStream){status('এই ব্রাউজারে recording নেই। Desktop Chrome বা Edge ব্যবহার করুন।');return;}
  const mime=['video/webm;codecs=vp9,opus','video/webm;codecs=vp8,opus','video/webm'].find(x=>MediaRecorder.isTypeSupported(x));
  if(!mime){status('এই ব্রাউজারে WebM export নেই। Chrome বা Edge ব্যবহার করুন।');return;}
  get('render-button').disabled=true;get('cancel-render').hidden=false;get('render-progress').hidden=false;get('render-progress').value=0;
  get('render-download').hidden=true;get('render-preview').hidden=true;
  const urls=[];const assets=[];let context;let source;let stream;let recorder;let animation;let aborted=false;let finished=false;let rejectRecording;
  cancel=()=>{aborted=true;if(recorder?.state==='recording')recorder.stop();rejectRecording?.(new Error('ভিডিও তৈরি বাতিল হয়েছে।'));};
  const visible=()=>{if(document.hidden)cancel();};
  document.addEventListener('visibilitychange',visible);
  try{
   const voice=get('voice-file').files[0];
   if(voice){const Audio=AudioContext||webkitAudioContext;if(!Audio)throw new Error('Audio recording এই ব্রাউজারে নেই।');context=new Audio();await context.resume();}
   status('আপনার ফাইল প্রস্তুত হচ্ছে…');
   for(const file of files){
    if(aborted)throw new Error('ভিডিও তৈরি বাতিল হয়েছে।');
    if(!file.type.startsWith('image/')&&!file.type.startsWith('video/'))throw new Error('ছবি বা ভিডিও ফাইল দিন।');
    const url=URL.createObjectURL(file);urls.push(url);
    const node=document.createElement(file.type.startsWith('image/')?'img':'video');
    if(node.tagName==='VIDEO'){node.muted=true;node.loop=true;node.playsInline=true;node.preload='auto';}
    await new Promise((resolve,reject)=>{
     const timer=setTimeout(()=>reject(new Error('ফাইলটি খোলা যায়নি: '+file.name)),15000);
     const done=()=>{clearTimeout(timer);resolve();};node.addEventListener(node.tagName==='IMG'?'load':'loadeddata',done,{once:true});node.addEventListener('error',()=>{clearTimeout(timer);reject(new Error('ফাইলটি supported নয়: '+file.name));},{once:true});node.src=url;
    });
    assets.push(node);
   }
   const canvas=document.createElement('canvas');const portrait=get('render-shape').value==='portrait';canvas.width=portrait?720:1280;canvas.height=portrait?1280:720;
   const ctx=canvas.getContext('2d');const captions=get('free-script').value.split(/\n/).map(x=>x.trim()).filter(Boolean);
   stream=canvas.captureStream(25);
   if(voice){
    const buffer=await context.decodeAudioData(await voice.arrayBuffer());
    source=context.createBufferSource();source.buffer=buffer;
    const destination=context.createMediaStreamDestination();source.connect(destination);
    destination.stream.getAudioTracks().forEach(track=>stream.addTrack(track));
   }
   let active=-1;let started;
   const paint=(elapsed)=>{
    const index=Math.min(assets.length-1,Math.floor(elapsed/duration*assets.length));
    const asset=assets[index];
    if(active!==index){if(active>=0&&assets[active].tagName==='VIDEO')assets[active].pause();active=index;if(asset.tagName==='VIDEO'){asset.currentTime=0;asset.play().catch(()=>cancel());}}
    ctx.fillStyle='#101827';ctx.fillRect(0,0,canvas.width,canvas.height);
    const w=asset.naturalWidth||asset.videoWidth,h=asset.naturalHeight||asset.videoHeight;const scale=Math.min(canvas.width/w,canvas.height/h);ctx.drawImage(asset,(canvas.width-w*scale)/2,(canvas.height-h*scale)/2,w*scale,h*scale);
    if(captions.length){
     const text=captions[Math.min(captions.length-1,Math.floor(elapsed/duration*captions.length))];
     ctx.font='bold 32px "Noto Sans Bengali", system-ui';ctx.textAlign='center';const lines=[];let line='';
     for(const word of text.split(/\s+/)){const candidate=line?line+' '+word:word;if(ctx.measureText(candidate).width>canvas.width-100&&line){lines.push(line);line=word;}else line=candidate;}if(line)lines.push(line);
     const shown=lines.slice(0,5),height=shown.length*44+32;ctx.fillStyle='rgba(0,0,0,.78)';ctx.fillRect(28,canvas.height-height-70,canvas.width-56,height);ctx.fillStyle='white';shown.forEach((s,i)=>ctx.fillText(s,canvas.width/2,canvas.height-height-26+i*44,canvas.width-90));
    }
   };
   await document.fonts.ready;paint(0);const chunks=[];
   recorder=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:2500000});
   const recording=new Promise((resolve,reject)=>{rejectRecording=reject;recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};recorder.onerror=()=>reject(new Error('Recording ব্যর্থ হয়েছে।'));recorder.onstop=()=>{if(!aborted&&finished)resolve(new Blob(chunks,{type:mime}));else reject(new Error('ভিডিও তৈরি বাতিল হয়েছে।'));};});
   if(aborted)throw new Error('ভিডিও তৈরি বাতিল হয়েছে।');
   recorder.start(250);source?.start();started=performance.now();
   const tick=()=>{
    if(aborted)return;
    const elapsed=(performance.now()-started)/1000;paint(Math.min(elapsed,duration));
    get('render-progress').value=Math.min(100,elapsed/duration*100);status('ভিডিও তৈরি হচ্ছে: '+Math.min(duration,Math.floor(elapsed))+' / '+duration+' sec');
    if(elapsed>=duration){finished=true;recorder.stop();return;}animation=requestAnimationFrame(tick);
   };animation=requestAnimationFrame(tick);
   status('ভিডিও export হচ্ছে…');const raw=await recording;const blob=await new Promise(resolve=>window.ysFixWebmDuration(raw,performance.now()-started,resolve,{logger:false}));if(blob.size<1000)throw new Error('ভিডিও ফাইল খালি। আবার চেষ্টা করুন।');
   if(outputUrl)URL.revokeObjectURL(outputUrl);outputUrl=URL.createObjectURL(blob);
   get('render-preview').src=outputUrl;get('render-preview').hidden=false;get('render-download').href=outputUrl;get('render-download').download='AgentTube-'+Date.now()+'.webm';get('render-download').hidden=false;get('render-progress').value=100;status('ভিডিও প্রস্তুত। Preview দেখে Download করুন।');
  }catch(error){status(error.message);}
  finally{cancelAnimationFrame(animation);if(recorder?.state==='recording')recorder.stop();try{source?.stop();}catch{/* Audio may already have ended. */}stream?.getTracks().forEach(track=>track.stop());assets.forEach(a=>{if(a.tagName==='VIDEO')a.pause();a.removeAttribute('src');});urls.forEach(url=>URL.revokeObjectURL(url));await context?.close();document.removeEventListener('visibilitychange',visible);cancel=null;get('render-button').disabled=false;get('cancel-render').hidden=true;}
 };
})();

