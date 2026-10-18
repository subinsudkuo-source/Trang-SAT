module.exports=async function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 if(req.method!=='POST')return res.status(405).json({ok:false,error:'METHOD_NOT_ALLOWED'});
 const {APPS_SCRIPT_URL,APPS_SCRIPT_TOKEN}=process.env;
 if(!APPS_SCRIPT_URL||!APPS_SCRIPT_TOKEN)return res.status(503).json({ok:false,error:'SERVER_NOT_CONFIGURED'});
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
