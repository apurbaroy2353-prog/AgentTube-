const express = require('express');
const app = express();
app.disable('x-powered-by');

// The local pipeline needs persistent files and a continuously running worker.
// Do not initialize SQLite or start cron inside a Vercel request.
app.get('/health', (_req, res) => res.json({
  status: 'setup_required', dashboardAvailable: true,
  generationAvailable: false, publishingAvailable: false,
  blockers: ['persistent_database_adapter', 'media_storage', 'background_worker', 'provider_credentials', 'youtube_oauth']
}));
app.get('/', (_req, res) => res.type('html').send(`<!doctype html>
<html lang="bn"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>AgentTube | Cloud setup</title>
<style>body{margin:0;background:#f4f6fa;color:#182238;font:16px system-ui,sans-serif}main{max-width:880px;margin:8vh auto;padding:32px}.brand{font-size:34px;font-weight:800}b{color:#ed2028}.card{background:white;border:1px solid #dde3ec;border-radius:18px;padding:28px;margin-top:24px}h1{font-size:28px}li{padding:8px}a{color:#c71721}small{color:#59657b}.badge{display:inline-block;background:#fff0cd;padding:8px 14px;border-radius:20px}</style>
<main><div class="brand">Agent<b>Tube</b></div><p class="badge">Cloud setup in progress</p>
<div class="card"><h1>হোস্টিং চালু হয়েছে</h1><p>ভিডিও তৈরি ও YouTube publishing এখনো চালু হয়নি।</p>
<ol><li>স্থায়ী database ও media storage সংযোগ</li><li>ভিডিও তৈরির background worker</li><li>AI provider ও YouTube account সংযোগ</li><li>প্রথম ভিডিও তৈরি ও private upload পরীক্ষা</li></ol>
<p><a href="https://github.com/apurbaroy2353-prog/AgentTube-">Project source</a> · <a href="/health">Setup status</a></p>
<small>No generated videos or account credentials are exposed on this page.</small></div></main></html>`));
app.use((_req, res) => res.status(503).json({
  success: false, error: 'Cloud production setup is incomplete. Generation and publishing are disabled.',
  code: 'CLOUD_SETUP_REQUIRED'
}));

if (!process.env.VERCEL && require.main === module) {
  const { YouTubeAutomationAgent } = require('./local-runtime');
  new YouTubeAutomationAgent().start().catch(error => { console.error(error); process.exitCode = 1; });
}
Object.defineProperty(app, 'YouTubeAutomationAgent', {
  get: () => require('./local-runtime').YouTubeAutomationAgent
});
module.exports = app;
