const {timingSafeEqual} = require('node:crypto');
function matches(a,b){const x=Buffer.from(a||''),y=Buffer.from(b||'');return x.length===y.length&&timingSafeEqual(x,y);}
module.exports=async function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 if(req.method!=='POST')return res.status(405).json({ok:false,error:'METHOD_NOT_ALLOWED'});
 const {APPS_SCRIPT_URL,APPS_SCRIPT_TOKEN,APP_USERNAME,APP_PASSWORD}=process.env;
 if(!APPS_SCRIPT_URL||!APPS_SCRIPT_TOKEN||!APP_USERNAME||!APP_PASSWORD)return res.status(503).json({ok:false,error:'SERVER_NOT_CONFIGURED'});
 const expected='Basic '+Buffer.from(APP_USERNAME+':'+APP_PASSWORD).toString('base64');
 if(!matches(req.headers.authorization,expected))return res.status(401).json({ok:false,error:'UNAUTHORIZED'});
 try{
 const body=typeof req.body==='string'?JSON.parse(req.body):req.body;
 if(!body||typeof body!=='object'||Array.isArray(body))return res.status(400).json({ok:false,error:'INVALID_REQUEST'});
 const response=await fetch(APPS_SCRIPT_URL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...body,token:APPS_SCRIPT_TOKEN}),signal:AbortSignal.timeout(25000)});
 if(!response.ok)throw new Error('UPSTREAM');
 const data=await response.json();return res.status(data.ok?200:400).json(data);
 }catch{return res.status(502).json({ok:false,error:'DATABASE_UNAVAILABLE'});}
};
