let config; let session;
const el=id=>document.getElementById(id);
function message(text){el('message').textContent=text;}
async function request(path,options={}){
 const headers={apikey:config.key,'Content-Type':'application/json',...options.headers};
 if(session) headers.Authorization='Bearer '+session.access_token;
 const response=await fetch(config.url+path,{...options,headers});
 const data=await response.json().catch(()=>null);
 if(!response.ok) throw new Error(data?.msg || data?.message || data?.error_description || 'Request failed');
 return data;
}
async function authenticate(signup){
 const body={email:el('email').value.trim(),password:el('password').value};
 const result=await request(signup?'/auth/v1/signup':'/auth/v1/token?grant_type=password',{method:'POST',body:JSON.stringify(body)});
 el('password').value='';
 if(!result.access_token){message('Account তৈরি হয়েছে। Email confirmation করে Login করুন।');return;}
 session=result;
 await request('/auth/v1/user');
 el('auth').hidden=true;el('workspace').hidden=false;el('logout').hidden=false;
 message('Login সফল।');await loadWorkspace();
}
async function loadWorkspace(){
 const owner=encodeURIComponent(session.user.id);
 const [channels,drafts]=await Promise.all([request('/rest/v1/agenttube_channels?user_id=eq.'+owner+'&select=*'),request('/rest/v1/agenttube_drafts?user_id=eq.'+owner+'&select=*&order=created_at.desc&limit=100')]);
 if(channels[0]){const c=channels[0];el('channel-name').value=c.channel_name;el('niche').value=c.niche;el('audience').value=c.audience;el('channel-language').value=c.language;el('cadence').value=c.cadence_per_week;}
 const list=el('draft-list');list.replaceChildren();
 if(!drafts.length){list.textContent='এখনো কোনো ভিডিওর বিষয় সংরক্ষণ করা হয়নি।';return;}
 for(const draft of drafts){
  const row=document.createElement('div');row.className='draft';const text=document.createElement('div');const title=document.createElement('strong');title.textContent=draft.topic;const detail=document.createElement('small');detail.textContent=draft.language+' · '+draft.duration_seconds+' sec · Draft';text.append(title,detail);
  const remove=document.createElement('button');remove.textContent='Delete';remove.onclick=()=>run(async()=>{if(!confirm('এই বিষয়টি মুছবেন?'))return;await request('/rest/v1/agenttube_drafts?id=eq.'+encodeURIComponent(draft.id),{method:'DELETE'});await loadWorkspace();message('খসড়া মুছে গেছে।');});const generate=document.createElement('button');generate.textContent='Generate script';generate.disabled=!config.scriptEnabled || draft.script_status==='generating';generate.onclick=()=>run(async()=>{if(!confirm('AI credits ব্যবহার করে এই স্ক্রিপ্ট তৈরি করবেন?'))return;generate.disabled=true;try{const response=await fetch('/api/script',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+session.access_token},body:JSON.stringify({draftId:draft.id,confirmed:true})});const result=await response.json();if(!response.ok)throw new Error(result.error);await loadWorkspace();message('স্ক্রিপ্ট তৈরি ও সংরক্ষিত হয়েছে।');}finally{generate.disabled=!config.scriptEnabled;}});
  const edit=document.createElement('textarea');edit.rows=4;edit.maxLength=10000;edit.value=draft.script||'';edit.setAttribute('aria-label','আপনার স্ক্রিপ্ট');edit.placeholder='নিজের স্ক্রিপ্ট লিখুন বা পেস্ট করুন';
  const save=document.createElement('button');save.textContent='Save script (free)';save.onclick=()=>run(async()=>{await request('/rest/v1/agenttube_drafts?id=eq.'+encodeURIComponent(draft.id),{method:'PATCH',body:JSON.stringify({script:edit.value.trim(),script_status:edit.value.trim()?'ready':'pending',script_model:'manual',script_generated_at:new Date().toISOString()})});await loadWorkspace();message('আপনার স্ক্রিপ্ট সংরক্ষিত হয়েছে।');});
  const use=document.createElement('button');use.textContent='Use in free editor';use.className='secondary';use.onclick=()=>{el('free-script').value=edit.value;el('free-editor').scrollIntoView({behavior:'smooth'});};text.append(edit,save,use);
  row.append(text,generate,remove);if(draft.script){const details=document.createElement('details');const summary=document.createElement('summary');summary.textContent='View script';const script=document.createElement('pre');script.textContent=draft.script;details.append(summary,script);text.append(details);}list.append(row);
 }
}
async function run(fn){try{await fn();}catch(error){message(error.message);}}
el('login-form').onsubmit=event=>{event.preventDefault();run(()=>authenticate(false));};
el('signup').onclick=()=>{if(el('login-form').reportValidity())run(()=>authenticate(true));};
el('logout').onclick=()=>run(async()=>{try{await request('/auth/v1/logout',{method:'POST'});}finally{session=null;el('workspace').hidden=true;el('auth').hidden=false;el('logout').hidden=true;el('draft-list').replaceChildren();el('channel-form').reset();message('Signed out');}});
el('channel-form').onsubmit=event=>{event.preventDefault();run(async()=>{const body={user_id:session.user.id,channel_name:el('channel-name').value.trim(),niche:el('niche').value.trim(),audience:el('audience').value.trim(),language:el('channel-language').value,cadence_per_week:Number(el('cadence').value)};await request('/rest/v1/agenttube_channels?on_conflict=user_id',{method:'POST',headers:{Prefer:'resolution=merge-duplicates'},body:JSON.stringify(body)});message('চ্যানেলের সেটিংস সংরক্ষিত হয়েছে।');});};
el('draft-form').onsubmit=event=>{event.preventDefault();run(async()=>{await request('/rest/v1/agenttube_drafts',{method:'POST',body:JSON.stringify({user_id:session.user.id,topic:el('topic-input').value.trim(),language:el('draft-language').value,duration_seconds:Number(el('duration').value)})});el('topic-input').value='';await loadWorkspace();message('ভিডিওর বিষয় সংরক্ষিত হয়েছে।');});};
run(async()=>{const response=await fetch('/api/config');config=await response.json();if(!response.ok)throw new Error(config.error);});
