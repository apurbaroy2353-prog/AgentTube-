const express = require('express');
const path = require('path');
const app = express();
app.disable('x-powered-by');
app.get('/health', (_req, res) => res.json({
 status:'setup_required', dashboardAvailable:true,
 databaseConfigured:Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_PUBLISHABLE_KEY),
 generationAvailable:false, publishingAvailable:false,
 blockers:['background_worker','provider_credentials','youtube_oauth']
}));
app.get('/api/config',(_req,res)=>{
 res.set('Cache-Control','no-store');
 if(!process.env.SUPABASE_URL || !process.env.SUPABASE_PUBLISHABLE_KEY) return res.status(503).json({error:'Database connection is not configured'});
 res.json({url:process.env.SUPABASE_URL,key:process.env.SUPABASE_PUBLISHABLE_KEY});
});
app.use(express.static(path.join(__dirname,'cloud'),{index:'index.html'}));
app.use((_req,res)=>res.status(503).json({success:false,error:'Video generation and publishing are not configured',code:'CLOUD_SETUP_REQUIRED'}));
if(!process.env.VERCEL && require.main===module){
 const {YouTubeAutomationAgent}=require('./local-runtime');
 new YouTubeAutomationAgent().start().catch(error=>{console.error(error);process.exitCode=1;});
}
Object.defineProperty(app,'YouTubeAutomationAgent',{get:()=>require('./local-runtime').YouTubeAutomationAgent});
module.exports=app;
