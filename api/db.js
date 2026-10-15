const {timingSafeEqual,createHmac} = require('node:crypto');
function matches(a,b){const x=Buffer.from(a||''),y=Buffer.from(b||'');return x.length===y.length&&timingSafeEqual(x,y);}
const COOKIE='__Host-trang_sat_session';
const SESSION_SECONDS=180*24*60*60;
function signature(payload,user,password){return createHmac('sha256',password).update('trang-sat-session-v1:'+user+':'+payload).digest('base64url');}
function validSession(req,user,password){
 const raw=(req.headers.cookie||'').split(';').map(v=>v.trim()).find(v=>v.startsWith(COOKIE+'='));
 if(!raw)return false;
 const [expires,mac,...extra]=raw.slice(COOKIE.length+1).split('.');
 const now=Math.floor(Date.now()/1000);
 return extra.length===0&&/^\d+$/.test(expires)&&Number(expires)>now&&Number(expires)<=now+SESSION_SECONDS&&matches(mac,signature(expires,user,password));
}
module.exports=async function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 if(req.method!=='POST')return res.status(405).json({ok:false,error:'METHOD_NOT_ALLOWED'});
 const {APPS_SCRIPT_URL,APPS_SCRIPT_TOKEN,APP_USERNAME,APP_PASSWORD}=process.env;
 if(!APPS_SCRIPT_URL||!APPS_SCRIPT_TOKEN||!APP_USERNAME||!APP_PASSWORD)return res.status(503).json({ok:false,error:'SERVER_NOT_CONFIGURED'});
 const expected='Basic '+Buffer.from(APP_USERNAME+':'+APP_PASSWORD).toString('base64');
 if(!matches(req.headers.authorization,expected)&&!validSession(req,APP_USERNAME,APP_PASSWORD))return res.status(401).json({ok:false,error:'กรุณาเข้าสู่ระบบครั้งแรก หรือเข้าสู่ระบบใหม่เมื่อหมดอายุ (APP_CREDENTIALS_INVALID)'});
 const expires=String(Math.floor(Date.now()/1000)+SESSION_SECONDS);
 res.setHeader('Set-Cookie',COOKIE+'='+expires+'.'+signature(expires,APP_USERNAME,APP_PASSWORD)+'; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age='+SESSION_SECONDS);
 try{
 const body=typeof req.body==='string'?JSON.parse(req.body):req.body;
 if(!body||typeof body!=='object'||Array.isArray(body))return res.status(400).json({ok:false,error:'INVALID_REQUEST'});
 const response=await fetch(APPS_SCRIPT_URL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...body,token:APPS_SCRIPT_TOKEN}),signal:AbortSignal.timeout(25000)});
 if(!response.ok)throw new Error('UPSTREAM');
 const data=await response.json();
 if(!data.ok && data.error==='UNAUTHORIZED') return res.status(502).json({ok:false,error:'API_TOKEN ของ Apps Script ไม่ตรงกับ APPS_SCRIPT_TOKEN ใน Vercel (APPS_SCRIPT_TOKEN_INVALID)'});
 return res.status(data.ok?200:400).json(data);
 }catch{return res.status(502).json({ok:false,error:'DATABASE_UNAVAILABLE'});}
};
