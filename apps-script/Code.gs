/** TRANG SAT — bound Google Sheets database. Run setupSystem from the sheet editor. */
const PHOTO_FOLDER_ID = '1TMxlpDlhdhxxilLHaH85qcYmGT-zR3jH';
const MAX_PHOTO_BYTES = 2 * 1024 * 1024;
const TABLES = {
  Photos: ['id','reportDate','districtId','districtName','fileId','fileName','mimeType','sizeBytes','caption','driveUrl','uploadedAt'],
  Districts: ['id','english','thai','longitude','latitude'],
  DailyReports: ['id','reportDate','districtId','districtName','status','submitted','rain','waterLevel','trend','reporter','notes','updatedAt'],
  PHEOCReports: ['id','reportDate','group','readiness','personnelCount','nextPlan','updatedAt'],
  Incidents: ['id','reportDate','districtId','type','severity','description','status','updatedAt'],
  SupportRequests: ['id','reportDate','districtId','item','quantity','unit','reason','status','updatedAt']
};
const DISTRICT_SEEDS = [
 ['d01','Mueang Trang','เมืองตรัง',99.577585,7.592029],['d02','Kantang','กันตัง',99.484528,7.413772],
 ['d03','Yan Ta Khao','ย่านตาขาว',99.742636,7.427812],['d04','Palian','ปะเหลียน',99.786034,7.246110],
 ['d05','Sikao','สิเกา',99.322001,7.611775],['d06','Huai Yot','ห้วยยอด',99.601382,7.789611],
 ['d07','Wang Wiset','วังวิเศษ',99.396592,7.751236],['d08','Na Yong','นาโยง',99.756852,7.556241],
 ['d09','Ratsada','รัษฎา',99.639057,7.928633],['d10','Hat Samran','หาดสำราญ',99.585232,7.226366]
];
function setupSystem() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) throw new Error('เปิด Apps Script จากเมนูส่วนขยายของ Google Sheet ฐานข้อมูลก่อน');
  const lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    const props = PropertiesService.getScriptProperties();
    props.setProperty('SPREADSHEET_ID', ss.getId());
    if (!props.getProperty('API_TOKEN')) props.setProperty('API_TOKEN', Utilities.getUuid() + Utilities.getUuid());
    ss.setSpreadsheetTimeZone('Asia/Bangkok');
    Object.keys(TABLES).forEach(name => {
      const sh = ss.getSheetByName(name) || ss.insertSheet(name);
      if (sh.getLastRow() === 0) {
        sh.getRange(1,1,1,TABLES[name].length).setValues([TABLES[name]]);
        sh.getRange(1,1,1,TABLES[name].length).setBackground('#102D50').setFontColor('#ffffff').setFontWeight('bold');
        sh.setFrozenRows(1);
      }
      if (name === 'PHEOCReports') migratePheocSheet_(ss,sh);
      checkHeaders_(sh,name);
    });
    const districts = ss.getSheetByName('Districts');
    const existing = new Set(readRows_('Districts').map(r=>r.id));
    const missing = DISTRICT_SEEDS.filter(r=>!existing.has(r[0]));
    if (missing.length) districts.getRange(districts.getLastRow()+1,1,missing.length,5).setValues(missing);
    SpreadsheetApp.flush();
    return {ok:true, spreadsheetId:ss.getId(), tables:Object.keys(TABLES)};
  } finally {lock.releaseLock();}
}
function doGet() {return json_({ok:true,service:'TRANG SAT DB',version:'1.1',message:'ใช้ POST พร้อม API token จาก server'});}
function doPost(e) {
  try {
    if (!e || !e.postData || e.postData.contents.length > 3000000) throw new Error('INVALID_REQUEST');
    const input = JSON.parse(e.postData.contents);
    const expected = PropertiesService.getScriptProperties().getProperty('API_TOKEN');
    if (!expected || typeof input.token !== 'string' || !equal_(input.token,expected)) throw new Error('UNAUTHORIZED');
    const result = dispatch_(input);
    return json_({ok:true,data:result});
  } catch(err) {return json_({ok:false,error:String(err.message || err)});}
}
function dispatch_(input) {
  if(input.action === 'uploadPhoto') return uploadPhoto_(input);
  if(input.action === 'getPhoto') return getPhoto_(input.id);
  if(input.action === 'bootstrap') {
    const date = validDate_(input.reportDate || today_());
    return {
      reportDate:date, districts:readRows_('Districts'),
      reports:readRows_('DailyReports').filter(r=>r.reportDate===date).map(r=>({...r,submitted:r.submitted===true||r.submitted==='true'||r.submitted==='TRUE'})),
      pheoc:readRows_('PHEOCReports').filter(r=>r.reportDate===date)
    };
  }
  const name = input.table;
  if (!Object.prototype.hasOwnProperty.call(TABLES,name)) throw new Error('UNKNOWN_TABLE');
  if(input.action === 'list') {
    return readRows_(name).filter(r=>(!input.reportDate||r.reportDate===validDate_(input.reportDate))&&(!input.districtId||r.districtId===input.districtId));
  }
  if(input.action === 'upsert' && name !== 'Districts' && name !== 'Photos') return upsert_(name,input.record);
  throw new Error('UNKNOWN_ACTION');
}
function upsert_(name,record) {
  if(!record || typeof record!=='object' || Array.isArray(record)) throw new Error('INVALID_RECORD');
  const date = validDate_(record.reportDate || today_());
  const allowed = TABLES[name];
  Object.keys(record).forEach(k=>{if(!allowed.includes(k))throw new Error('UNKNOWN_FIELD:'+k);});
  if(allowed.includes('districtId') && !DISTRICT_SEEDS.some(d=>d[0]===record.districtId)) throw new Error('INVALID_DISTRICT');
  if(name==='PHEOCReports') {
    if(record.readiness!==''&&!['พร้อมปฏิบัติการ','พร้อมบางส่วน','ไม่พร้อม','กำลังประเมิน'].includes(record.readiness))throw new Error('INVALID_READINESS');
    if(record.personnelCount!==''&&record.personnelCount!==undefined&&(typeof record.personnelCount!=='number'||!Number.isInteger(record.personnelCount)||record.personnelCount<0))throw new Error('INVALID_PERSONNEL_COUNT');
  }
  let id = record.id;
  if(name==='DailyReports') id=date+'_'+record.districtId;
  if(!id)id=Utilities.getUuid();
  if(!/^[A-Za-z0-9_-]{1,100}$/.test(id))throw new Error('INVALID_ID');
  if(name==='DailyReports') {
    if(!['ปกติ','เฝ้าระวัง','เสี่ยงสูง'].includes(record.status))throw new Error('INVALID_STATUS');
    if(typeof record.rain!=='number'||!Number.isFinite(record.rain)||record.rain<0)throw new Error('INVALID_RAIN');
    if(typeof record.submitted!=='boolean')throw new Error('INVALID_SUBMITTED');
    record={...record,districtName:DISTRICT_SEEDS.find(d=>d[0]===record.districtId)[2]};
  }
  if(name==='SupportRequests' && (typeof record.quantity!=='number'||!Number.isFinite(record.quantity)||record.quantity<=0))throw new Error('INVALID_QUANTITY');
  const lock=LockService.getScriptLock();lock.waitLock(20000);
  try {
    const sh=sheet_(name); checkHeaders_(sh,name);
    const rows=readRows_(name);const index=rows.findIndex(r=>r.id===id);
    const previous=index<0?{}:rows[index];
    const clean={...previous,...record,id,reportDate:date,updatedAt:new Date().toISOString()};
    if(index>=0 && previous.reportDate!==date)throw new Error('RECORD_DATE_CONFLICT');
    const row=allowed.map(k=>safeCell_(clean[k]===undefined?'':clean[k]));
    sh.getRange(index<0?sh.getLastRow()+1:index+2,1,1,allowed.length).setValues([row]);
    SpreadsheetApp.flush();return clean;
  } finally {lock.releaseLock();}
}
function sheet_(name) {
 const id=PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
 if(!id)throw new Error('RUN_SETUP_FIRST');
 const sh=SpreadsheetApp.openById(id).getSheetByName(name);
 if(!sh)throw new Error('MISSING_TABLE:'+name);return sh;
}
function checkHeaders_(sh,name) {
 if(JSON.stringify(sh.getRange(1,1,1,TABLES[name].length).getDisplayValues()[0])!==JSON.stringify(TABLES[name]))throw new Error('HEADER_MISMATCH:'+name);
}
function migratePheocSheet_(ss,sh) {
 const current=TABLES.PHEOCReports;
 const legacy=['id','reportDate','group','readiness','personnel','actions','issues','nextPlan','updatedAt'];
 const headers=sh.getRange(1,1,1,legacy.length+1).getDisplayValues()[0];
 if(JSON.stringify(headers.slice(0,current.length))===JSON.stringify(current))return;
 if(JSON.stringify(headers.slice(0,legacy.length))!==JSON.stringify(legacy)||!['','personnelCount'].includes(headers[legacy.length]))return;
 const lastRow=sh.getLastRow();
 const oldRows=lastRow>1?sh.getRange(2,1,lastRow-1,headers[legacy.length]?legacy.length+1:legacy.length).getValues():[];
 if(oldRows.some(row=>row[0])) {
  const suffix=Utilities.formatDate(new Date(),'Asia/Bangkok','yyyyMMdd_HHmmss');
  let archiveName='PHEOCReports_Legacy_'+suffix,serial=1;
  while(ss.getSheetByName(archiveName))archiveName='PHEOCReports_Legacy_'+suffix+'_'+serial++;
  sh.copyTo(ss).setName(archiveName);
 }
 const hasCount=headers[legacy.length]==='personnelCount';
 const rows=oldRows.filter(row=>row[0]).map(row=>[
  row[0],row[1],row[2],row[3],toPersonnelCount_(hasCount?row[legacy.length]:row[4]),row[7],row[8]
 ]);
 sh.clearContents();
 sh.getRange(1,1,1,current.length).setValues([current]).setBackground('#102D50').setFontColor('#ffffff').setFontWeight('bold');
 if(rows.length)sh.getRange(2,1,rows.length,current.length).setValues(rows);
 sh.setFrozenRows(1);
}
function toPersonnelCount_(value) {
 if(typeof value==='number'&&Number.isInteger(value)&&value>=0)return value;
 const match=String(value==null?'':value).match(/^\s*(\d+)\s*(?:คน|นาย|ราย)?\s*$/);
 return match?Number(match[1]):'';
}
function readRows_(name) {
 const sh=sheet_(name);checkHeaders_(sh,name);
 if(sh.getLastRow()<2)return [];
 return sh.getRange(2,1,sh.getLastRow()-1,TABLES[name].length).getValues().map(row=>Object.fromEntries(TABLES[name].map((k,i)=>[k,row[i] instanceof Date?Utilities.formatDate(row[i],'Asia/Bangkok','yyyy-MM-dd'):row[i]]))).filter(r=>r.id);
}
function validDate_(date) {
 if(typeof date!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(date))throw new Error('INVALID_DATE');
 const d=new Date(date+'T00:00:00Z');if(!Number.isFinite(d.getTime())||d.toISOString().slice(0,10)!==date)throw new Error('INVALID_DATE');return date;
}
function today_(){return Utilities.formatDate(new Date(),'Asia/Bangkok','yyyy-MM-dd');}
function safeCell_(v){if(typeof v==='string'){if(v.length>20000)throw new Error('TEXT_TOO_LONG');return /^[=+@-]/.test(v)?"'"+v:v;}if(typeof v==='number'&&!Number.isFinite(v))throw new Error('INVALID_NUMBER');if(typeof v!=='string'&&typeof v!=='number'&&typeof v!=='boolean')throw new Error('INVALID_CELL');return v;}
function equal_(a,b){let diff=a.length^b.length;for(let i=0;i<b.length;i++)diff|=(a.charCodeAt(i)||0)^b.charCodeAt(i);return diff===0;}
function json_(v){return ContentService.createTextOutput(JSON.stringify(v)).setMimeType(ContentService.MimeType.JSON);}

function uploadPhoto_(input) {
 const date=validDate_(input.reportDate || today_());
 const district=DISTRICT_SEEDS.find(d=>d[0]===input.districtId);
 if(!district)throw new Error('INVALID_DISTRICT');
 if(typeof input.id!=='string'||!/^photo_[A-Za-z0-9_-]{10,100}$/.test(input.id))throw new Error('INVALID_UPLOAD_ID');
 if(!['image/jpeg','image/png','image/webp'].includes(input.mimeType))throw new Error('INVALID_IMAGE_TYPE');
 if(typeof input.base64!=='string'||input.base64.length>Math.ceil(MAX_PHOTO_BYTES/3)*4||!/^([A-Za-z0-9+/]{4})*([A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(input.base64))throw new Error('INVALID_IMAGE_DATA');
 const bytes=Utilities.base64Decode(input.base64);
 if(bytes.length<12||bytes.length>MAX_PHOTO_BYTES)throw new Error('IMAGE_TOO_LARGE_OR_EMPTY');
 const u=i=>(bytes[i]+256)%256;
 const valid=input.mimeType==='image/jpeg'?u(0)===255&&u(1)===216&&u(2)===255:input.mimeType==='image/png'?[137,80,78,71,13,10,26,10].every((n,i)=>u(i)===n):[82,73,70,70].every((n,i)=>u(i)===n)&&[87,69,66,80].every((n,i)=>u(i+8)===n);
 if(!valid)throw new Error('IMAGE_SIGNATURE_MISMATCH');
 const caption=String(input.caption||'');if(caption.length>1000)throw new Error('CAPTION_TOO_LONG');
 const lock=LockService.getScriptLock();lock.waitLock(20000);
 let file;
 try {
  const sh=sheet_('Photos');checkHeaders_(sh,'Photos');
  const old=readRows_('Photos').find(r=>r.id===input.id);
  if(old){if(old.districtId!==input.districtId||old.reportDate!==date)throw new Error('UPLOAD_ID_CONFLICT');return old;}
  const ext={'image/jpeg':'jpg','image/png':'png','image/webp':'webp'}[input.mimeType];
  const name=date+'_'+district[2]+'_'+input.id+'.'+ext;
  file=DriveApp.getFolderById(PHOTO_FOLDER_ID).createFile(Utilities.newBlob(bytes,input.mimeType,name));
  // Inherit folder access; do not make uploaded photos public.
  const row={id:input.id,reportDate:date,districtId:district[0],districtName:district[2],fileId:file.getId(),fileName:name,mimeType:input.mimeType,sizeBytes:bytes.length,caption,driveUrl:file.getUrl(),uploadedAt:new Date().toISOString()};
  sh.getRange(sh.getLastRow()+1,1,1,TABLES.Photos.length).setValues([TABLES.Photos.map(k=>safeCell_(row[k]))]);
  SpreadsheetApp.flush();return row;
 }catch(err){if(file){try{file.setTrashed(true);}catch(ignored){}}throw err;}finally{lock.releaseLock();}
}
function getPhoto_(id) {
 const row=readRows_('Photos').find(r=>r.id===id);if(!row)throw new Error('PHOTO_NOT_FOUND');
 const file=DriveApp.getFileById(row.fileId);if(file.isTrashed())throw new Error('PHOTO_NOT_FOUND');
 const parents=file.getParents();let belongs=false;while(parents.hasNext()){if(parents.next().getId()===PHOTO_FOLDER_ID)belongs=true;}
 if(!belongs)throw new Error('PHOTO_FOLDER_MISMATCH');
 if(file.getSize()>MAX_PHOTO_BYTES)throw new Error('IMAGE_TOO_LARGE');
 return {mimeType:row.mimeType,base64:Utilities.base64Encode(file.getBlob().getBytes())};
}
function checkPhotoFolder() {
 const folder=DriveApp.getFolderById(PHOTO_FOLDER_ID);
 return {id:folder.getId(),name:folder.getName()};
}
