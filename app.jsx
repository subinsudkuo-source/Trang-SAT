
        const { useState, useEffect, useMemo, useRef } = React;

        const DISTRICTS = [
            { id: "d01", english: "Mueang Trang", thai: "เมืองตรัง", labelPoint: [99.577585, 7.592029], status: 'เฝ้าระวัง', rain: 45.5, water: '2.15 ม. (ล้นตลิ่งเล็กน้อย)', trend: 'เพิ่มขึ้น' },
            { id: "d02", english: "Kantang", thai: "กันตัง", labelPoint: [99.484528, 7.413772], status: 'ปกติ', rain: 15.0, water: '1.40 ม. (ปกติ)', trend: 'ทรงตัว' },
            { id: "d03", english: "Yan Ta Khao", thai: "ย่านตาขาว", labelPoint: [99.742636, 7.427812], status: 'ปกติ', rain: 18.2, water: '1.80 ม. (ปกติ)', trend: 'ลดลง' },
            { id: "d04", english: "Palian", thai: "ปะเหลียน", labelPoint: [99.786034, 7.246110], status: 'ปกติ', rain: 22.0, water: '1.65 ม. (ปกติ)', trend: 'ทรงตัว' },
            { id: "d05", english: "Sikao", thai: "สิเกา", labelPoint: [99.322001, 7.611775], status: 'ปกติ', rain: 12.5, water: '1.10 ม. (ปกติ)', trend: 'ลดลง' },
            { id: "d06", english: "Huai Yot", thai: "ห้วยยอด", labelPoint: [99.601382, 7.789611], status: 'เฝ้าระวัง', rain: 52.0, water: '3.10 ม. (ใกล้เตือนภัย)', trend: 'เพิ่มขึ้น' },
            { id: "d07", english: "Wang Wiset", thai: "วังวิเศษ", labelPoint: [99.396592, 7.751236], status: 'ปกติ', rain: 28.4, water: '2.05 ม. (ปกติ)', trend: 'ทรงตัว' },
            { id: "d08", english: "Na Yong", thai: "นาโยง", labelPoint: [99.756852, 7.556241], status: 'เสี่ยงสูง', rain: 68.0, water: '3.45 ม. (วิกฤต)', trend: 'เพิ่มขึ้น' },
            { id: "d09", english: "Ratsada", thai: "รัษฎา", labelPoint: [99.639057, 7.928633], status: 'ปกติ', rain: 30.1, water: '2.20 ม. (ปกติ)', trend: 'ทรงตัว' },
            { id: "d10", english: "Hat Samran", thai: "หาดสำราญ", labelPoint: [99.585232, 7.226366], status: 'ปกติ', rain: 19.3, water: '1.25 ม. (ปกติ)', trend: 'ทรงตัว' }
        ];

        const ROLES = {
            ADMIN: 'ผู้ดูแลระบบ',
            PROV_SAT: 'SAT จังหวัด',
            DIST_SAT: 'SAT อำเภอ (เมืองตรัง)',
            PHEOC: 'กลุ่มภารกิจ PHEOC',
            EXEC: 'ผู้บริหาร / ผู้ติดตาม'
        };

        const getCurrentBKKTime = () => {
            return new Date().toLocaleString("th-TH", { timeZone: "Asia/Bangkok" });
        };

        const callGeminiAI = async (prompt, systemInstruction = "คุณคือ AI ผู้ช่วยอัจฉริยะประจำระบบ TRANG SAT วิเคราะห์ข้อมูลอุทกภัยสาธารณสุขจังหวัดตรัง ให้คำแนะนำที่แม่นยำ กระชับ และเป็นมืออาชีพ") => {
            const apiUrl = '/api/summarize';
            
            try {
                const response = await fetch(apiUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ prompt, systemInstruction })
                });
                const data = await response.json();
                if (!response.ok || !data.ok || !data.text) throw new Error(data.error || "AI_UNAVAILABLE");
                return data.text;
            } catch (err) {
                console.warn("Gemini API unavailable:", err);
                return null;
            }
        };

        
const DB_READS_IN_FLIGHT = new Map(); async function sharedDBRead(input){const key=JSON.stringify(input);if(DB_READS_IN_FLIGHT.has(key))return DB_READS_IN_FLIGHT.get(key);const request=(async()=>{const headers={'Content-Type':'application/json'};const response=await fetch('/api/db',{method:'POST',credentials:'same-origin',headers,body:JSON.stringify(input)});const result=await response.json();if(!result.ok){const error=new Error(result.error||'บันทึกไม่สำเร็จ');error.status=response.status;throw error;}const data=result.data;if(Array.isArray(data))return data.map(unpackFloodReport);if(data&&Array.isArray(data.reports))return {...data,reports:data.reports.map(unpackFloodReport)};return unpackFloodReport(data);})();DB_READS_IN_FLIGHT.set(key,request);request.then(()=>DB_READS_IN_FLIGHT.delete(key),()=>DB_READS_IN_FLIGHT.delete(key));return request;} const DB = {
 async request(input) { if (['list','bootstrap'].includes(input?.action)) return sharedDBRead(input);
   const headers={'Content-Type':'application/json'};
   const response = await fetch('/api/db', {method:'POST', credentials:'same-origin', headers,body:JSON.stringify(input)});
   const result = await response.json();
   if(!result.ok){const error=new Error(result.error || 'บันทึกไม่สำเร็จ');error.status=response.status;throw error;}
   const data=result.data;
   if(Array.isArray(data))return data.map(unpackFloodReport);
   if(data&&Array.isArray(data.reports))return {...data,reports:data.reports.map(unpackFloodReport)};
   return unpackFloodReport(data);
 }
};
const PHOTO_URL_CACHE = new Map();
function loadPhotoUrl(action,id){
 const key=`${action}:${id}`;
 if(!PHOTO_URL_CACHE.has(key)){
  const promise=DB.request({action,id}).then(data=>{
   const bytes=Uint8Array.from(atob(data.base64),char=>char.charCodeAt(0));
   return URL.createObjectURL(new Blob([bytes],{type:data.mimeType}));
  }).catch(error=>{PHOTO_URL_CACHE.delete(key);throw error;});
  PHOTO_URL_CACHE.set(key,promise);
 }
 return PHOTO_URL_CACHE.get(key);
}
async function optimizePhoto(file){
 if(!file.type.startsWith('image/')||!window.createImageBitmap||file.size<350*1024)return file;
 const bitmap=await createImageBitmap(file),maxEdge=1600,scale=Math.min(1,maxEdge/bitmap.width,maxEdge/bitmap.height);
 if(scale===1&&file.type==='image/png'){bitmap.close();return file;}
 const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(bitmap.width*scale));canvas.height=Math.max(1,Math.round(bitmap.height*scale));
 const context=canvas.getContext('2d');context.drawImage(bitmap,0,0,canvas.width,canvas.height);bitmap.close();
 const type=file.type==='image/png'?'image/png':file.type==='image/webp'?'image/webp':'image/jpeg';
 const blob=await new Promise((resolve,reject)=>canvas.toBlob(value=>value?resolve(value):reject(new Error('บีบอัดภาพไม่สำเร็จ')),type,type==='image/png'?undefined:0.82));
 if(blob.size>=file.size)return file;
 const ext=type==='image/png'?'.png':type==='image/webp'?'.webp':'.jpg';
 return new File([blob],file.name.replace(/\.[^.]+$/,ext),{type,lastModified:file.lastModified});
}
function DatabasePanel({onLoaded}) {
 const [message,setMessage]=useState('');
 const [busy,setBusy]=useState(true);
 const connect=async()=>{setBusy(true);setMessage('');try{
   const data=await DB.request({action:'bootstrap'});onLoaded(data);
 }catch(e){setMessage(e.message);}finally{setBusy(false);}};
 useEffect(()=>{connect();},[]);
 if(!message)return null;
 return <div role="alert" className="bg-red-50 text-red-800 p-3 text-base">โหลดข้อมูลไม่สำเร็จ: {message} <button disabled={busy} onClick={()=>connect()} className="underline ml-2">ลองใหม่</button></div>;
}


function DistrictPhotos({districtId,reportDate,showToast}) {
 const [photos,setPhotos]=useState([]),[busy,setBusy]=useState(false),[caption,setCaption]=useState(''),[message,setMessage]=useState('กำลังโหลดภาพจากฐานข้อมูล');
 const fileInput=useRef(null), uploadIds=useRef(new WeakMap());
 const load=async()=>{try{const rows=await DB.request({action:'list',table:'Photos',districtId,reportDate});setPhotos(rows);setMessage(rows.length?'ภาพที่บันทึกใน Drive':'ยังไม่มีภาพสำหรับอำเภอและวันที่นี้');}catch(e){setPhotos([]);setMessage(e.message==='UNKNOWN_TABLE'?'ต้องอัปเดต Code.gs และรัน setupSystem() เพื่อเปิดระบบภาพก่อน':e.message);}};
 useEffect(()=>{setPhotos([]);load();},[districtId,reportDate]);
 const upload=async()=>{
 const files=Array.from(fileInput.current.files||[]);if(!files.length){setMessage('กรุณาเลือกภาพ');return;}
 if(files.length>5){setMessage('อัปโหลดได้ครั้งละไม่เกิน 5 ภาพ');return;}
 setBusy(true);
 try{for(const original of files){
 const file=await optimizePhoto(original);if(!['image/jpeg','image/png','image/webp'].includes(original.type)||!original.size||original.size>12*1024*1024||file.size>2*1024*1024)throw new Error('รองรับ JPG / PNG / WEBP และขนาดหลังปรับไม่เกิน 2 MB ต่อภาพ');
 if(!uploadIds.current.has(file))uploadIds.current.set(file,'photo_'+crypto.randomUUID());
 const base64=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result).split(',')[1]);reader.onerror=()=>reject(new Error('อ่านไฟล์ไม่สำเร็จ'));reader.readAsDataURL(file);});
 await DB.request({action:'uploadPhoto',id:uploadIds.current.get(file),districtId,reportDate,mimeType:file.type,base64,caption});
 }
 fileInput.current.value='';setCaption('');await load();showToast('บันทึกภาพในโฟลเดอร์ Drive และข้อมูลอ้างอิงในชีตแล้ว');
 }catch(e){setMessage('อัปโหลดไม่สำเร็จ: '+e.message);}finally{setBusy(false);}
 };
 return <section className="bg-blue-50 border border-blue-100 rounded-xl p-4 space-y-3">
 <h4 className="font-bold">ภาพสถานการณ์อำเภอ • {reportDate}</h4>
 <p className="text-sm">ภาพเก็บในโฟลเดอร์ Drive “Trang SAT” รองรับ JPG / PNG / WEBP ไม่เกิน 2 MB ต่อภาพ ครั้งละ 5 ภาพ</p>
 <input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp" multiple disabled={busy} aria-label="เลือกภาพสถานการณ์อำเภอ" className="block w-full"/>
 <input value={caption} onChange={e=>setCaption(e.target.value)} maxLength={1000} placeholder="คำอธิบายภาพ / สถานที่" aria-label="คำอธิบายภาพ" className="border rounded p-2 w-full"/>
 <div className="flex gap-2"><button type="button" disabled={busy} onClick={upload} className="bg-blue-700 text-white px-4 py-2 rounded">{busy?'กำลังอัปโหลด…':'อัปโหลดภาพลง Drive'}</button><button type="button" disabled={busy} onClick={load} className="border px-4 py-2 rounded bg-white">โหลดภาพ</button></div>
 <p role="status" className="text-sm">{message}</p>
 <div className="grid sm:grid-cols-2 gap-3">{photos.map(photo=><PhotoCard key={photo.id} photo={photo}/>)}</div>
 </section>;
}
function PhotoCard({photo}) {
 const [image,setImage]=useState(''),[message,setMessage]=useState('');
 const preview=async()=>{setMessage('กำลังโหลด…');try{const data=await DB.request({action:'getPhoto',id:photo.id});setImage('data:'+data.mimeType+';base64,'+data.base64);setMessage('');}catch(e){setMessage(e.message);}};
 return <article className="rounded border bg-white p-3 space-y-2">{image?<img src={image} alt={photo.caption||'ภาพสถานการณ์อำเภอ'} className="w-full h-48 object-contain rounded"/>:<button type="button" onClick={preview} className="text-blue-700 underline">ดูภาพในแอป</button>}<p className="text-sm">{photo.caption||photo.fileName}</p><p className="text-xs text-gray-500">{photo.districtName} • {photo.reportDate}</p><a href={photo.driveUrl} target="_blank" rel="noopener noreferrer" className="text-blue-700 underline text-sm">เปิดภาพใน Drive</a><p role="status">{message}</p></article>;
}

function App() {
            const [currentRole, setCurrentRole] = useState('PROV_SAT');
            const [activeTab, setActiveTab] = useState('summary');
            const [toastMessage, setToastMessage] = useState(null);

            const [districtReports, setDistrictReports] = useState(
                DISTRICTS.map(d => ({
                    districtId: d.id,
                    districtName: d.thai,
                    status: d.status,
                    submitted: d.status !== 'ปกติ' || d.id === 'd01' || d.id === 'd08',
                    rain: d.rain,
                    waterLevel: d.water,
                    trend: d.trend,
                    updatedAt: '13 ต.ค. 2569 16:30 น.',
                    reporter: 'สาธารณสุขอำเภอ' + d.thai,
                    notes: d.status === 'เสี่ยงสูง' ? 'น้ำป่าไหลหลากเข้าท่วมพื้นที่ลุ่มต่ำ 2 หมู่บ้าน หน่วยบริการ รพ.สต. กำลังเสริมกระสอบทราย' : 'สถานการณ์ปกติ เฝ้าระวังฝนตกต่อเนื่อง'
                }))
            );

            const [pheocReports, setPheocReports] = useState([
                { id: 'P1', group: 'ทีมปฏิบัติการฉุกเฉินทางการแพทย์ (MERT / EMT)', readiness: 'พร้อมปฏิบัติการ 100%', personnel: '25 นาย (แพทย์ 4, พยาบาล 12, ฉุกเฉิน 9)', actions: 'เตรียมพร้อมยาและเวชภัณฑ์ชุดน้ำท่วม 1,000 ชุด พร้อมเคลื่อนย้าย', issues: 'ไม่มี', nextPlan: 'ออกหน่วยแพทย์เคลื่อนที่จุดอพยพนาโยง' },
                { id: 'P2', group: 'กลุ่มอนามัยสิ่งแวดล้อมและควบคุมโรค', readiness: 'พร้อมปฏิบัติการ 95%', personnel: '14 นาย', actions: 'แจกจ่ายคลอรีนเม็ดและสารส้ม พร้อมแนะนำสุขาภิบาลน้ำดื่ม', issues: 'บางพื้นที่น้ำประปาขุ่น', nextPlan: 'ตรวจคุณภาพน้ำอุปโภคบริโภคหลังน้ำลด' },
                { id: 'P3', group: 'กลุ่มสนับสนุนทรัพยากรและเวชภัณฑ์', readiness: 'พร้อมปฏิบัติการ 90%', personnel: '10 นาย', actions: 'สำรองเวชภัณฑ์พระราชทานและยารักษาโรคเรื้อรังเพียงพอ 1 เดือน', issues: 'รถยกสูง 4x4 ต้องการเพิ่ม 1 คัน', nextPlan: 'จัดส่งเวชภัณฑ์สำรองให้ รพ.ห้วยยอด' }
            ]);

            const showToast = (msg) => {
                setToastMessage(msg);
                setTimeout(() => setToastMessage(null), 4000);
            };

            return (
                <div className="min-h-screen bg-[#EDF4F8] text-[#17324d] font-sans flex flex-col">
                    <DatabasePanel onLoaded={data=>{
 const date=data.reportDate;
 setDistrictReports(DISTRICTS.map(d=>data.reports.find(r=>r.districtId===d.id)||{districtId:d.id,districtName:d.thai,reportDate:date,status:'ปกติ',submitted:false,rain:0,waterLevel:'',trend:'',reporter:'',notes:'',updatedAt:''}));
 setPheocReports(data.pheoc);
 }} />
 {/* Header */}
                    <header className="bg-navy text-white shadow-lg sticky top-0 z-50">
                        <div className="max-w-7xl mx-auto px-4 py-3.5 flex flex-col md:flex-row justify-between items-center gap-3">
                            <div className="flex items-center gap-3">
                                <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-bluePrimary to-cyan-400 flex items-center justify-center shadow-md">
                                    <i className="ph-fill ph-shield-warning text-2xl text-white"></i>
                                </div>
                                <div>
                                    <h1 className="text-lg md:text-xl font-bold tracking-wide">TRANG SAT — ระบบเฝ้าระวังอุทกภัยและรายงานสถานการณ์จังหวัดตรัง</h1>
                                    <p className="text-xs text-slate-300">สำนักงานสาธารณสุขจังหวัดตรัง</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                                <div className="bg-slate-800/90 border border-slate-700 px-3 py-1.5 rounded-xl flex items-center gap-2 text-xs">
                                    <i className="ph ph-user-circle text-cyan-400 text-base"></i>
                                    <span>สิทธิ:</span>
                                    <select 
                                        value={currentRole} 
                                        onChange={(e) => setCurrentRole(e.target.value)}
                                        className="bg-transparent text-white font-medium focus:outline-none cursor-pointer"
                                    >
                                        {Object.entries(ROLES).map(([k, v]) => (
                                            <option key={k} value={k} className="text-slate-900">{v}</option>
                                        ))}
                                    </select>
                                </div>

                                <button 
                                    onClick={() => setActiveTab('incident')}
                                    className="bg-bluePrimary hover:bg-blue-600 text-white px-3.5 py-2 rounded-xl text-xs font-medium flex items-center gap-1.5 transition shadow"
                                >
                                    <i className="ph ph-bell-ringing text-sm"></i>
                                    <span className="hidden sm:inline">แจ้งเหตุเร่งด่วน</span>
                                </button>
                            </div>
                        </div>
                    </header>

                    {/* Navigation Tabs */}
                    <nav className="bg-white border-b border-slate-200 shadow-sm sticky top-[69px] z-40 overflow-x-auto custom-scrollbar">
                        <div className="max-w-7xl mx-auto px-4 flex gap-1.5 py-2.5 whitespace-nowrap">
                            {[
                                { id: 'summary', label: 'ภาพรวมจังหวัด', icon: 'ph-newspaper-clipping', badge: 'หลัก' },
                                { id: 'map', label: 'แผนที่ geoBoundaries & Google View', icon: 'ph-map-trifold' },
                                { id: 'dashboard', label: 'Dashboard ภาพรวม', icon: 'ph-squares-four' },
                                { id: 'district', label: 'รายงานประจำวันอำเภอ', icon: 'ph-clipboard-text' },
                                { id: 'pheoc', label: 'รายงานกลุ่มภารกิจ PHEOC', icon: 'ph-users-three' },
                                { id: 'incident', label: 'แจ้งเหตุเร่งด่วน', icon: 'ph-warning-octagon' },
                                { id: 'support', label: 'คำขอสนับสนุน', icon: 'ph-hand-fist' },
                                { id: 'automation', label: 'ศูนย์ Automation', icon: 'ph-gear-six' }
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`px-3.5 py-2 rounded-xl text-xs md:text-sm font-medium flex items-center gap-2 transition ${
                                        activeTab === tab.id 
                                            ? 'bg-bluePrimary text-white shadow-md shadow-blue-500/20' 
                                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                                    }`}
                                >
                                    <i className={`ph ${tab.icon} text-lg`}></i>
                                    <span>{tab.label}</span>
                                    {tab.badge && (
                                        <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                                            {tab.badge}
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>
                    </nav>

                    {/* Main Content Area */}
                    <main className="max-w-7xl mx-auto px-4 py-6 flex-1 w-full">
                        {activeTab === 'summary' && <ProvincialSummaryView districts={DISTRICTS} districtReports={districtReports} pheocReports={pheocReports} showToast={showToast} setActiveTab={setActiveTab} />}
                        {activeTab === 'map' && <GoogleAndGeoMap districts={DISTRICTS} districtReports={districtReports} showToast={showToast} />}
                        {activeTab === 'dashboard' && <DashboardView districts={DISTRICTS} />}
                        {activeTab === 'district' && <DistrictReportView districts={DISTRICTS} reports={districtReports} setReports={setDistrictReports} showToast={showToast} />}
                        {activeTab === 'pheoc' && <PheocView reports={pheocReports} setReports={setPheocReports} showToast={showToast} />}
                        {activeTab === 'incident' && <IncidentView showToast={showToast} />}
                        {activeTab === 'support' && <SupportView showToast={showToast} />}
                        {activeTab === 'automation' && <AutomationView showToast={showToast} />}
                    </main>

                    {/* Footer */}
                    <footer className="bg-white border-t border-slate-200 py-4 mt-8">
                        <p className="max-w-7xl mx-auto px-4 pb-3 text-sm text-slate-500">รายงานอำเภอและ PHEOC ดึงจากข้อมูลที่บันทึกในระบบ</p>
                        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center text-xs text-slate-500 gap-2">
                            <p>© 2569 สำนักงานสาธารณสุขจังหวัดตรัง — TRANG SAT Flood Monitoring System (geoBoundaries ADM2)</p>
                            <p className="flex items-center gap-2">
                                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                                ระบบทำงานปกติ (Asia/Bangkok) | อัปเดตล่าสุด: {getCurrentBKKTime()}
                            </p>
                        </div>
                    </footer>

                    {/* Toast Notification */}
                    {toastMessage && (
                        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-slate-700 animate-bounce">
                            <i className="ph-fill ph-check-circle text-emerald-400 text-xl"></i>
                            <span className="text-sm font-medium">{toastMessage}</span>
                        </div>
                    )}
                </div>
            );
        }

        function ProvincialSummaryView({ districts, districtReports, pheocReports, showToast, setActiveTab }) {
            const [isAiLoading, setIsAiLoading] = useState(false);
            const [chartMetric, setChartMetric] = useState('affected'); const [pheocFiles, setPheocFiles] = useState([]), [pheocFilesLoading, setPheocFilesLoading] = useState(true), [pheocFilesError, setPheocFilesError] = useState(''); 
            const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' });
            const reportDate = districtReports.find(r => r.reportDate)?.reportDate || today; useEffect(() => { let active = true; setPheocFilesLoading(true); setPheocFilesError(''); DB.request({ action: 'list', table: 'PHEOCFiles', reportDate }).then(rows => { if (active) setPheocFiles(Array.isArray(rows) ? rows : []); }).catch(error => { if (active) { setPheocFiles([]); setPheocFilesError(error.message || 'โหลดรายการไฟล์ไม่สำเร็จ'); } }).finally(() => { if (active) setPheocFilesLoading(false); }); return () => { active = false; }; }, [reportDate]);
            const reportDateLabel = new Date(reportDate + 'T00:00:00+07:00').toLocaleDateString('th-TH', { timeZone: 'Asia/Bangkok', dateStyle: 'long' });
            const byId = new Map((districtReports || []).map(r => [r.districtId, r]));
            const daily = districts.map(d => {
                const savedReport = byId.get(d.id);
                return savedReport
                    ? { ...savedReport, districtId:d.id, districtName:savedReport.districtName||d.thai, _hasSavedReport:true }
                    : { districtId:d.id, districtName:d.thai, submitted:false, status:'ยังไม่ส่ง', rain:'', waterLevel:'', trend:'', notes:'', _hasSavedReport:false };
            });
            const hasSavedReport = report => Boolean(report?._hasSavedReport || report?.id || report?.reporter || report?.updatedAt || report?.floodReport || report?.notes);
            const submitted = daily.filter(r => r.submitted);
            const missing = daily.filter(r => !r.submitted);
            const drafts = missing.filter(hasSavedReport);
            const noResponse = missing.filter(r => !hasSavedReport(r));
            const risk = submitted.filter(r => ['เสี่ยงสูง','วิกฤต'].some(x => String(r.status||'').includes(x)));
            const watch = submitted.filter(r => String(r.status||'').includes('เฝ้าระวัง'));
            const pheoc = Array.isArray(pheocReports) ? pheocReports : [];
            const fmt = n => Number(n||0).toLocaleString('th-TH');
            const hasValue = value => value !== '' && value !== null && value !== undefined;
            const sumRows = (rows, key) => ({
                reported: rows.some(row => hasValue(row?.[key]) && Number.isFinite(Number(row[key]))),
                total: rows.reduce((sum,row) => {
                    const value=Number(row?.[key]);
                    return hasValue(row?.[key]) && Number.isFinite(value) ? sum+value : sum;
                },0)
            });
            const allTotals = submitted.reduce((totals, report) => {
                const flood=report.floodReport||{};
                const areas=Array.isArray(flood.areas)?flood.areas:[];
                const population=Array.isArray(flood.population)?flood.population:[];
                const vulnerable=Array.isArray(flood.vulnerable)?flood.vulnerable:[];
                const add=(key,rows,field)=>{const value=sumRows(rows,field);totals[key]+=value.total;if(value.reported)totals[key+'Sources']++;};
                add('villages',areas,'villages'); add('households',areas,'households'); add('affected',areas,'people');
                population.forEach(row=>{
                    const type=String(row.type||''),value=Number(row.count);
                    if(!hasValue(row.count)||!Number.isFinite(value))return;
                    if(type.includes('เสียชีวิต')){totals.deaths+=value;totals.deathSources++;}
                    else if(type.includes('บาดเจ็บ')){totals.injuries+=value;totals.injurySources++;}
                    else if(type.includes('สูญหาย')){totals.missing+=value;totals.missingSources++;}
                });
                add('assistedVulnerable',vulnerable,'count');
                ['assessed','highStress','depression','suicideRisk','ptsd','specialCare'].forEach(key=>{
                    if(hasValue(flood[key])&&Number.isFinite(Number(flood[key]))){totals[key]+=Number(flood[key]);totals[key+'Sources']++;}
                });
                return totals;
            }, {villages:0,villagesSources:0,households:0,householdsSources:0,affected:0,affectedSources:0,deaths:0,deathSources:0,injuries:0,injurySources:0,missing:0,missingSources:0,assistedVulnerable:0,assistedVulnerableSources:0,assessed:0,assessedSources:0,highStress:0,highStressSources:0,depression:0,depressionSources:0,suicideRisk:0,suicideRiskSources:0,ptsd:0,ptsdSources:0,specialCare:0,specialCareSources:0});
            const chartMetrics = [
                {key:'affected',label:'ประชาชนได้รับผลกระทบ',unit:'คน',color:'#2563eb',value:r=>sumRows(r.floodReport?.areas||[],'people')},
                {key:'households',label:'ครัวเรือน',unit:'หลัง',color:'#7c3aed',value:r=>sumRows(r.floodReport?.areas||[],'households')},
                {key:'villages',label:'หมู่บ้าน',unit:'แห่ง',color:'#0891b2',value:r=>sumRows(r.floodReport?.areas||[],'villages')},
                {key:'deaths',label:'เสียชีวิต',unit:'ราย',color:'#dc2626',value:r=>sumRows((r.floodReport?.population||[]).filter(row=>String(row.type||'').includes('เสียชีวิต')),'count')},
                {key:'injuries',label:'บาดเจ็บ',unit:'ราย',color:'#ea580c',value:r=>sumRows((r.floodReport?.population||[]).filter(row=>String(row.type||'').includes('บาดเจ็บ')),'count')},
                {key:'missing',label:'สูญหาย',unit:'ราย',color:'#be123c',value:r=>sumRows((r.floodReport?.population||[]).filter(row=>String(row.type||'').includes('สูญหาย')),'count')}
            ];
            const selectedChartMetric=chartMetrics.find(metric=>metric.key===chartMetric)||chartMetrics[0];
            const chartData=submitted.map(report=>{const result=selectedChartMetric.value(report);return {name:report.districtName,value:result.reported?result.total:null};});
            const chartValues=chartData.filter(point=>point.value!==null).map(point=>point.value);
            const chartMax=Math.max(1,...chartValues);
            const chartStep=Math.max(1,Math.ceil(chartMax/4));
            const chartAxisMax=chartStep*4;
            const chartWidth=960,chartHeight=360,chartLeft=72,chartRight=24,chartTop=28,chartBottom=100;
            const chartPlotWidth=chartWidth-chartLeft-chartRight,chartPlotHeight=chartHeight-chartTop-chartBottom;
            const chartX=index=>chartLeft+(chartData.length<=1?chartPlotWidth/2:index*chartPlotWidth/(chartData.length-1));
            const chartY=value=>chartTop+chartPlotHeight-(value/chartAxisMax)*chartPlotHeight;
            const chartSegments=[];let activeSegment=[];
            chartData.forEach((point,index)=>{if(point.value===null){if(activeSegment.length)chartSegments.push(activeSegment);activeSegment=[];}else activeSegment.push({index,...point});});
            if(activeSegment.length)chartSegments.push(activeSegment);
            const groupName = row => String(row?.group||'').trim();
            const reportedPheoc = pheoc.filter(row=>groupName(row)&&[row.actions,row.issues].some(hasValue));
            const reportedPheocGroups = [...new Set(pheocFiles.map(groupName).filter(Boolean))];
            const expectedPheocGroups = [...new Set([...(PHEOC_UPLOAD_GROUPS||[]),...pheocFiles.map(groupName).filter(Boolean)])];
            const missingPheocGroups = expectedPheocGroups.filter(group=>!reportedPheocGroups.includes(group)); const pheocUploads = expectedPheocGroups.map(group=>({group,files:pheocFiles.filter(file=>groupName(file)===group)}));
            const renderRows = (title,rows,columns) => rows.length ? <div className="space-y-1"><h5 className="font-semibold text-xs text-slate-700">{title}</h5><div className="overflow-x-auto"><table className="w-full text-xs"><thead><tr className="text-left text-slate-500">{columns.map(([key,label])=><th className="pr-3 py-1" key={key}>{label}</th>)}</tr></thead><tbody>{rows.map((row,index)=><tr className="border-t border-slate-200" key={index}>{columns.map(([key])=><td className="pr-3 py-1 align-top whitespace-pre-line" key={key}>{hasValue(row?.[key])?String(row[key]):'—'}</td>)}</tr>)}</tbody></table></div></div> : null;
            const districtDetails = report => {
                const flood=report.floodReport||{};
                const population=Array.isArray(flood.population)?flood.population:[];
                const staff=Array.isArray(flood.staff)?flood.staff:[];
                const vulnerable=Array.isArray(flood.vulnerable)?flood.vulnerable:[];
                const facilities=[...(flood.partial||[]).map(row=>({...row,serviceStatus:'เปิดบริการบางส่วน'})),...(flood.closed||[]).map(row=>({...row,serviceStatus:'ปิดบริการ'}))];
                const support=(flood.support||[]).filter(row=>row.item||hasValue(row.quantity)||row.notes);
                return <details className="mt-3 rounded-lg bg-white/80 border border-slate-200 p-3"><summary className="cursor-pointer text-xs font-semibold text-blue-800">ดูรายละเอียดรายงานฉบับเต็ม</summary><div className="mt-3 space-y-4">
                    <div><h5 className="font-semibold text-xs">1. สรุปสถานการณ์ทั่วไป</h5><p className="text-xs whitespace-pre-line mt-1">{flood.summary||'ไม่มีข้อความสรุป'}</p><p className="text-[11px] text-slate-500 mt-1">ข้อมูล ณ {flood.areaDate||flood.asOfDate||report.reportDate||'—'} {flood.areaTime||flood.asOfTime||''}</p></div>
                    {renderRows('พื้นที่และประชาชนที่ได้รับผลกระทบ',flood.areas||[],[['tambon','ตำบล'],['villages','หมู่บ้าน (แห่ง)'],['households','ครัวเรือน (หลัง)'],['people','ประชาชน (คน)'],['notes','หมายเหตุ']])}
                    {renderRows('2. ประชาชนที่ได้รับผลกระทบ',population,[['type','ประเภท'],['count','จำนวน (ราย)'],['detail','รายละเอียด']])}
                    {flood.populationDetail&&<p className="text-xs"><b>รายละเอียดเพิ่มเติม:</b> {flood.populationDetail}</p>}
                    {renderRows('3. บุคลากรสาธารณสุข',staff,[['type','ประเภท'],['count','จำนวน (ราย)'],['detail','รายละเอียด'],['families','ครอบครัว'],['homes','บ้าน (หลัง)']])}
                    <div><h5 className="font-semibold text-xs">4. สถานบริการที่ได้รับผลกระทบ</h5><p className="text-xs mt-1">ข้อมูล ณ {flood.facilityDate||'—'} • เปิดปกติ รพ. {hasValue(flood.normalHospitals)?flood.normalHospitals:'—'} / รพ.สต. {hasValue(flood.normalPcu)?flood.normalPcu:'—'} แห่ง • เปิดบางส่วน รพ. {hasValue(flood.partialHospitals)?flood.partialHospitals:'—'} / รพ.สต. {hasValue(flood.partialPcu)?flood.partialPcu:'—'} แห่ง • ปิด {hasValue(flood.closedCount)?flood.closedCount:'—'} แห่ง</p>{renderRows('สถานบริการบางส่วน / ปิดบริการ',facilities,[['serviceStatus','สถานะ'],['facility','สถานบริการ'],['damage','ความเสียหาย (บาท)'],['detail','รายละเอียด']])}</div>
                    <div><h5 className="font-semibold text-xs">5. การช่วยเหลือประชาชนด้านสาธารณสุข</h5><p className="text-xs mt-1">ยอดสะสม {flood.aidStart||'—'} ถึง {flood.aidEnd||'—'} • ประเมินสุขภาพจิต {hasValue(flood.assessed)?flood.assessed:'—'} ราย • เครียดสูง {hasValue(flood.highStress)?flood.highStress:'—'} • ซึมเศร้า {hasValue(flood.depression)?flood.depression:'—'} • เสี่ยงฆ่าตัวตาย {hasValue(flood.suicideRisk)?flood.suicideRisk:'—'} • PTSD {hasValue(flood.ptsd)?flood.ptsd:'—'} • ติดตามพิเศษ {hasValue(flood.specialCare)?flood.specialCare:'—'}</p></div>
                    {renderRows('ช่วยเหลือกลุ่มเปราะบาง',vulnerable,[['type','ประเภท'],['count','จำนวน (ราย)'],['unit','หน่วยบริการรับผิดชอบ']])}
                    {renderRows('หน่วยแพทย์เคลื่อนที่',flood.mobile||[],[['unit','หน่วยแพทย์'],['units','จำนวนหน่วย'],['visits','ครั้งบริการ'],['patients','ผู้รับบริการ'],['education','สุขศึกษา']])}
                    {renderRows('โรคที่พบ',flood.diseases||[],[['communicable','โรคติดต่อ'],['noncommunicable','โรคไม่ติดต่อ'],['specific','ผู้ป่วยเฉพาะ'],['other','อื่น ๆ']])}
                    {renderRows('สุขาภิบาล / ป้องกันโรค',flood.sanitation||[],[['activity','กิจกรรม'],['date','วันที่'],['place','สถานที่'],['people','ผู้รับบริการ']])}
                    {renderRows('การแจกยาชุดช่วยเหลือ',flood.medicine||[],[['date','วันที่'],['quantity','จำนวนชุด']])}
                    {renderRows('การช่วยเหลือศูนย์พักพิง / อพยพ',flood.shelters||[],[['activity','กิจกรรม'],['date','วันที่'],['place','สถานที่'],['people','ผู้รับบริการ']])}
                    {renderRows('การช่วยเหลือเยียวยาด้านจิตใจ (MACTT)',flood.mentalAid||[],[['activity','กิจกรรม'],['date','วันที่'],['place','สถานที่'],['people','ผู้รับบริการ']])}
                    {support.length>0&&renderRows('6. ความต้องการสนับสนุน',support,[['item','รายการ'],['quantity','จำนวน'],['unit','หน่วย'],['notes','หมายเหตุ']])}
                    {flood.recommendations&&<div><h5 className="font-semibold text-xs">ข้อเสนอแนะ / แนวโน้ม / การประเมินความเสี่ยง</h5><p className="text-xs whitespace-pre-line mt-1">{flood.recommendations}</p></div>}
                </div></details>;
            };
            const localSummary = () => {
                const ptext=reportedPheoc.length ? reportedPheoc.map(p=>'• '+p.group+': การดำเนินงาน '+(p.actions||'ไม่ระบุ')+'; ปัญหา/อุปสรรค '+(p.issues||'ไม่ระบุ')).join(String.fromCharCode(10)) : 'ยังไม่มีข้อมูลการดำเนินงานกลุ่มภารกิจ PHEOC (สถานะส่งไฟล์แสดงแยกด้านบน)';
                const dataLine=(label,total,sources,unit)=>label+' '+(sources?fmt(total)+' '+unit:'ยังไม่มีข้อมูล');
                return 'สรุปสถานการณ์จังหวัดตรังประจำวันที่ '+reportDateLabel+'\n\nความครบถ้วนรายงานอำเภอ: ส่งแล้ว '+submitted.length+' / '+districts.length+' อำเภอ ('+(districts.length?Math.round(submitted.length/districts.length*100):0)+'%)'+(missing.length?' • ยังไม่ส่ง '+missing.map(r=>r.districtName+(r.id?' (ร่าง)':'')).join(', '):' • ได้รับครบทุกอำเภอ')+'. มีรายงานร่าง '+drafts.length+' อำเภอ และยังไม่มีข้อมูล '+noResponse.length+' อำเภอ.\n\nสถานการณ์: '+(risk.length?'พื้นที่เสี่ยงสูง/วิกฤต '+risk.map(r=>r.districtName).join(', '):'ไม่มีรายงานพื้นที่เสี่ยงสูง/วิกฤต')+'; '+(watch.length?'เฝ้าระวัง '+watch.map(r=>r.districtName).join(', '):'ไม่มีรายงานพื้นที่เฝ้าระวัง')+'.\n\nยอดสะสมจากรายงานที่ส่งแล้ว: '+[dataLine('หมู่บ้าน',allTotals.villages,allTotals.villagesSources,'แห่ง'),dataLine('ครัวเรือน',allTotals.households,allTotals.householdsSources,'หลัง'),dataLine('ประชาชนได้รับผลกระทบ',allTotals.affected,allTotals.affectedSources,'คน'),dataLine('เสียชีวิต',allTotals.deaths,allTotals.deathSources,'ราย'),dataLine('บาดเจ็บ',allTotals.injuries,allTotals.injurySources,'ราย'),dataLine('สูญหาย',allTotals.missing,allTotals.missingSources,'ราย')].join(' • ')+'.\n\nสถานะส่งไฟล์ PHEOC (ภาพ/เอกสาร): ส่งแล้ว '+reportedPheocGroups.length+' / '+expectedPheocGroups.length+' กลุ่ม'+(missingPheocGroups.length?' • รอติดตาม '+missingPheocGroups.join(', '):' • ครบตามกลุ่มที่กำหนด')+'.\n'+ptext;
            };
            const [aiSummary,setAiSummary]=useState('');
            useEffect(()=>{setAiSummary(localSummary());},[reportDate,districtReports,pheocReports,pheocFiles,pheocFilesLoading,pheocFilesError]);
            const generate=async()=>{
                setIsAiLoading(true);
                const payload={reportDate,districtSubmission:{submitted:submitted.length,drafts:drafts.map(r=>r.districtName),noResponse:noResponse.map(r=>r.districtName),total:districts.length},districts:daily.map(r=>({...r,submitted:!!r.submitted,floodReport:r.floodReport||null})),pheocFileSubmission:{status:pheocFilesLoading?'loading':pheocFilesError?'error':'loaded',submittedGroups:reportedPheocGroups,pendingGroups:missingPheocGroups,totalGroups:expectedPheocGroups.length,files:pheocUploads.map(item=>({group:item.group,files:item.files.map(file=>file.fileName)}))},pheocReadinessReports:pheoc};
                const prompt='สังเคราะห์ข้อมูล JSON นี้เป็นรายงานภาษาไทยทางการสำหรับผู้บริหาร โดยยึดข้อมูลที่บันทึกจริงทุกส่วนจากรายงานอำเภอและแบบฟอร์มความพร้อม PHEOC พร้อมรายการไฟล์ภาพ/เอกสาร PHEOC โดยการนับส่ง/ไม่ส่งของกลุ่ม PHEOC ให้ใช้รายการไฟล์เท่านั้น แยกสถานะส่งแล้ว/ร่าง/ยังไม่มีรายงาน ระบุจำนวนอำเภอที่ส่งและยังไม่ส่ง รายชื่ออำเภอที่ขาด สถานะเสี่ยง ยอดหมู่บ้าน ครัวเรือน ประชาชนเสียชีวิต บาดเจ็บ สูญหาย ข้อมูลสถานบริการ การช่วยเหลือกลุ่มเปราะบาง สุขภาพจิต ความต้องการสนับสนุน ข้อเสนอแนะ และผล/ปัญหา/แผนของแต่ละกลุ่มภารกิจ ห้ามแต่งตัวเลขหรือสรุปช่องว่างเป็นศูนย์ และระบุหัวข้อที่ไม่มีข้อมูล:\n'+JSON.stringify(payload);
                const result=await callGeminiAI(prompt);
                if(result){setAiSummary(result);showToast('Gemini Flash สรุปข้อมูลรายวันสำเร็จ');}
                else{setAiSummary(localSummary()+'\n\nหมายเหตุ: ยังไม่ได้ตั้งค่า GEMINI_API_KEY ใน Vercel จึงแสดงสรุปจากข้อมูลจริงอัตโนมัติ');showToast('ยังไม่ได้ตั้งค่า Gemini; แสดงสรุปข้อมูลจริงแทน');}
                setIsAiLoading(false);
            };
            return <div id="provincial-report" className="space-y-6">
                <header className="bg-gradient-to-r from-navy to-bluePrimary text-white p-6 rounded-2xl shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4"><div><p className="text-cyan-300 text-xs mb-1">รายงานจังหวัดตรัง • รายงานอำเภอและ PHEOC</p><h2 className="text-2xl font-bold">สรุปสถานการณ์อุทกภัยและรายงานประจำวัน</h2><p className="text-slate-200 text-xs mt-1">ประจำวันที่ {reportDateLabel} | ข้อมูลที่บันทึกในระบบ</p></div><button type="button" onClick={()=>window.print()} className="no-print bg-white/10 border border-white/20 px-4 py-2 rounded-xl text-xs"><i className="ph ph-printer mr-2"></i>พิมพ์ / บันทึกเป็น PDF</button></header>
                <section className="glass-card p-6 border-l-4 border-l-bluePrimary"><div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-3"><h3 className="font-bold text-slate-800">วิเคราะห์และสังเคราะห์สถานการณ์ประจำวันโดย AI (Gemini Flash) จากรายงานอำเภอและ PHEOC</h3><button type="button" onClick={generate} disabled={isAiLoading} className="no-print bg-bluePrimary text-white px-3.5 py-1.5 rounded-lg text-xs disabled:opacity-50">{isAiLoading?'กำลังสรุป...':'ให้ AI สรุปข้อมูลวันนี้'}</button></div><p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line bg-white p-4 rounded-xl border">{aiSummary||localSummary()}</p></section>
                <section className="glass-card p-5 space-y-3"><div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2"><div><h3 className="font-bold">ความครบถ้วนการรายงานอำเภอ</h3><p className="text-xs text-slate-500">ส่งแล้ว {submitted.length} จาก {districts.length} อำเภอ ({districts.length?Math.round(submitted.length/districts.length*100):0}%) • ร่าง {drafts.length} • ยังไม่มีข้อมูล {noResponse.length}</p></div><button type="button" onClick={()=>setActiveTab('district')} className="no-print text-xs text-bluePrimary">เปิดรายงานอำเภอ</button></div><div className="h-2 rounded-full bg-slate-100 overflow-hidden"><div className="h-full bg-emerald-500" style={{width:`${districts.length?submitted.length/districts.length*100:0}%`}}/></div><div className="grid md:grid-cols-2 gap-3 text-xs"><p className="text-emerald-800 bg-emerald-50 rounded-lg p-3"><b>ส่งแล้ว ({submitted.length}):</b> {submitted.length?submitted.map(r=>r.districtName).join(' • '):'ยังไม่มีอำเภอส่งรายงาน'}</p><p className="text-amber-800 bg-amber-50 rounded-lg p-3"><b>รอติดตาม ({missing.length}):</b> {missing.length?missing.map(r=>r.districtName+(hasSavedReport(r)?' (มีร่าง)':'')).join(' • '):'ได้รับครบทุกอำเภอ'}</p></div></section>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">{[
                    ['หมู่บ้าน / ครัวเรือน',`${allTotals.villagesSources?fmt(allTotals.villages):'—'} / ${allTotals.householdsSources?fmt(allTotals.households):'—'}`],
                    ['ประชาชนได้รับผลกระทบ',allTotals.affectedSources?fmt(allTotals.affected)+' คน':'ไม่มีข้อมูล'],
                    ['เสียชีวิต / บาดเจ็บ / สูญหาย',`${allTotals.deathSources?fmt(allTotals.deaths):'—'} / ${allTotals.injurySources?fmt(allTotals.injuries):'—'} / ${allTotals.missingSources?fmt(allTotals.missing):'—'} ราย`],
                    ['กลุ่มภารกิจ PHEOC ส่งไฟล์แล้ว',`${reportedPheocGroups.length} / ${expectedPheocGroups.length} กลุ่ม`],
                    ['ช่วยเหลือกลุ่มเปราะบาง',allTotals.assistedVulnerableSources?fmt(allTotals.assistedVulnerable)+' ราย':'ไม่มีข้อมูล'],
                    ['ประเมินสุขภาพจิต',allTotals.assessedSources?fmt(allTotals.assessed)+' ราย':'ไม่มีข้อมูล'],
                    ['เสี่ยงสูง / วิกฤต',risk.length+' อำเภอ'],['เฝ้าระวัง',watch.length+' อำเภอ']
                ].map(([label,value])=><div key={label} className="glass-card p-4 text-center"><p className="text-xs text-slate-500">{label}</p><p className="text-lg font-bold mt-1 text-blue-700">{value}</p></div>)}</div>
                <section className="glass-card p-5 sm:p-6 space-y-4 border-t-4" style={{borderTopColor:selectedChartMetric.color}}><div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3"><div><h3 className="font-bold text-slate-800">กราฟเส้นสรุปข้อมูลรายอำเภอ</h3><p className="text-xs text-slate-500 mt-1">เปรียบเทียบรายงานที่ส่งแล้วประจำวันที่ {reportDateLabel} • มีตัวเลข {chartValues.length} / {submitted.length} อำเภอ • เลือกตัวชี้วัดเพื่อดูแนวโน้ม</p></div><span className="text-xs font-semibold rounded-full px-3 py-1.5" style={{color:selectedChartMetric.color,backgroundColor:`${selectedChartMetric.color}14`}}>หน่วย: {selectedChartMetric.unit}</span></div><div className="flex flex-wrap gap-2">{chartMetrics.map(metric=><button type="button" key={metric.key} onClick={()=>setChartMetric(metric.key)} aria-pressed={chartMetric===metric.key} className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${chartMetric===metric.key?'text-white shadow-sm':'bg-white hover:bg-slate-50'}`} style={chartMetric===metric.key?{backgroundColor:metric.color,borderColor:metric.color}:{color:metric.color,borderColor:`${metric.color}55`}}>{metric.label}</button>)}</div>{chartData.some(point=>point.value!==null)?<div className="w-full overflow-x-auto rounded-xl bg-gradient-to-b from-slate-50 to-white p-2"><svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full min-w-[640px]" role="img" aria-label={`กราฟ${selectedChartMetric.label}รายอำเภอ หน่วย${selectedChartMetric.unit}`}><defs><linearGradient id="district-impact-area" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor={selectedChartMetric.color} stopOpacity=".22"/><stop offset="100%" stopColor={selectedChartMetric.color} stopOpacity=".015"/></linearGradient></defs>{Array.from({length:5},(_,i)=>{const value=chartStep*(4-i),y=chartY(value);return <g key={i}><line x1={chartLeft} x2={chartWidth-chartRight} y1={y} y2={y} stroke="#dbe4ef" strokeDasharray={i===4?'0':'4 5'}/><text x={chartLeft-12} y={y+4} textAnchor="end" fontSize="12" fill="#64748b">{fmt(value)}</text></g>;})}<line x1={chartLeft} x2={chartLeft} y1={chartTop} y2={chartTop+chartPlotHeight} stroke="#94a3b8"/><line x1={chartLeft} x2={chartWidth-chartRight} y1={chartTop+chartPlotHeight} y2={chartTop+chartPlotHeight} stroke="#94a3b8"/>{chartSegments.map((segment,index)=>{const line=segment.map((point,i)=>`${i?'L':'M'} ${chartX(point.index)} ${chartY(point.value)}`).join(String.fromCharCode(10));const area=segment.length>1?`${line} L ${chartX(segment[segment.length-1].index)} ${chartTop+chartPlotHeight} L ${chartX(segment[0].index)} ${chartTop+chartPlotHeight} Z`:'';return <g key={index}>{area&&<path d={area} fill="url(#district-impact-area)"/>}<path d={line} fill="none" stroke={selectedChartMetric.color} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>{segment.map(point=><g key={point.index}><circle cx={chartX(point.index)} cy={chartY(point.value)} r="7" fill="white" stroke={selectedChartMetric.color} strokeWidth="4"><title>{point.name}: {fmt(point.value)} {selectedChartMetric.unit}</title></circle><text x={chartX(point.index)} y={chartY(point.value)-13} textAnchor="middle" fontSize="12" fontWeight="700" fill={selectedChartMetric.color}>{fmt(point.value)}</text></g>)}</g>;})}{chartData.map((point,index)=><g key={point.name}><text transform={`translate(${chartX(index)},${chartTop+chartPlotHeight+24}) rotate(-38)`} textAnchor="end" fontSize="12" fill="#334155">{point.name}</text>{point.value===null&&<text x={chartX(index)} y={chartTop+chartPlotHeight-8} textAnchor="middle" fontSize="10" fill="#94a3b8">ไม่มีข้อมูล</text>}</g>)}</svg></div>:<div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center"><p className="font-semibold text-slate-700">ยังไม่มีข้อมูลตัวเลขสำหรับแสดงกราฟ</p><p className="text-xs text-slate-500 mt-1">กราฟจะแสดงเมื่อมีรายงานอำเภอของวันที่นี้ที่ส่งแล้วและมีตัวเลขในหัวข้อ “{selectedChartMetric.label}”</p></div>}<p className="text-[11px] text-slate-500">แสดงเฉพาะตัวเลขที่ระบุในรายงาน • ช่องที่ไม่มีข้อมูลจะเว้นไว้ ไม่ตีความเป็นศูนย์ • รายงานที่ยังเป็นร่างไม่รวมในกราฟ</p></section>
                <section className="glass-card p-5 space-y-3"><h3 className="font-bold">สรุปข้อมูลรายอำเภอ (ข้อมูลจากรายงานที่บันทึก)</h3><p className="text-xs text-slate-500">ช่องว่างหมายถึงไม่มีข้อมูล ส่วนเลข 0 คือรายงานยืนยันว่าไม่มี • เปิดรายละเอียดแต่ละอำเภอเพื่อดูแบบรายงานครบทุกหัวข้อ</p><div className="space-y-3">{daily.map(r=>{const flood=r.floodReport||{},areas=flood.areas||[],population=flood.population||[],pop=(type)=>{const row=population.find(item=>String(item.type||'').includes(type));return row&&hasValue(row.count)?fmt(row.count):'—';},vulnerable=flood.vulnerable||[],vulnTotal=sumRows(vulnerable,'count'),hasReport=hasSavedReport(r);return <article key={r.districtId} className="rounded-xl border border-slate-200 p-4 break-inside-avoid"><div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3"><div className="min-w-0"><div className="flex items-center gap-2"><h4 className="font-bold">{r.districtName}</h4><span className={`rounded-full px-2 py-0.5 text-[11px] ${r.submitted?'bg-emerald-100 text-emerald-800':hasReport?'bg-blue-100 text-blue-800':'bg-amber-100 text-amber-800'}`}>{r.submitted?(r.status||'ส่งแล้ว'):hasReport?'บันทึกร่าง • ยังไม่ส่ง':'ยังไม่มีรายงาน'}</span></div><p className="text-xs text-slate-500 mt-1">{hasReport?`ผู้รายงาน ${r.reporter||'ไม่ระบุ'} • บันทึกล่าสุด ${r.updatedAt||'ไม่ระบุเวลา'}`:'รอข้อมูลจาก สสอ.'}</p></div>{hasReport&&<div className="text-xs text-right text-slate-600">หมู่บ้าน {sumRows(areas,'villages').reported?fmt(sumRows(areas,'villages').total):'—'} • ครัวเรือน {sumRows(areas,'households').reported?fmt(sumRows(areas,'households').total):'—'} หลัง<br/>กระทบ {sumRows(areas,'people').reported?fmt(sumRows(areas,'people').total):'—'} คน • เสียชีวิต/เจ็บ/สูญหาย {pop('เสียชีวิต')}/{pop('บาดเจ็บ')}/{pop('สูญหาย')} ราย<br/>ช่วยกลุ่มเปราะบาง {vulnTotal.reported?fmt(vulnTotal.total):'—'} ราย</div>}</div>{hasReport&&<><p className="text-xs whitespace-pre-line mt-3">{flood.summary||r.notes||'บันทึกร่างแล้ว แต่ไม่มีข้อความสรุปสถานการณ์'}</p>{districtDetails(r)}</>}</article>;})}</div></section>
                <section className="glass-card p-6 space-y-4"><div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2"><h3 className="font-bold">สรุปการดำเนินงานกลุ่มภารกิจ PHEOC จังหวัดประจำวัน</h3><p className="text-xs text-slate-500">{pheocFilesLoading?'กำลังตรวจสอบ…':pheocFilesError?'ตรวจสอบไม่ได้':`ส่งไฟล์แล้ว ${reportedPheocGroups.length} / ${expectedPheocGroups.length} กลุ่ม`}</p></div>{missingPheocGroups.length>0&&<p className="text-xs bg-amber-50 text-amber-900 rounded-lg p-3">กลุ่มที่ยังไม่อัปโหลดไฟล์: {missingPheocGroups.join(' • ')}</p>}{pheocFilesLoading?<p role="status" className="text-sm bg-slate-50 rounded-lg p-3">กำลังตรวจรายการอัปโหลดประจำวัน…</p>:pheocFilesError?<p role="status" className="text-sm bg-rose-50 text-rose-800 rounded-lg p-3">ตรวจสอบรายการไฟล์ไม่ได้: {pheocFilesError}</p>:<div className="grid grid-cols-1 md:grid-cols-2 gap-3">{pheocUploads.map((item,index)=><article key={item.group} className={`rounded-xl border p-3 ${item.files.length?'border-emerald-200 bg-emerald-50/70':'border-amber-200 bg-amber-50/70'}`}><div className="flex items-start justify-between gap-2"><h4 className="font-semibold text-sm">{index+1}. {item.group}</h4><span className="text-xs font-semibold">{item.files.length?`ส่งแล้ว ${item.files.length} ไฟล์`:'ยังไม่ส่ง'}</span></div>{item.files.map(file=><p key={file.id} className="mt-2 text-xs break-all">📎 {file.fileName}</p>)}</article>)}</div>}{reportedPheoc.length?<div className="grid grid-cols-1 md:grid-cols-2 gap-4">{reportedPheoc.map((p,i)=><article key={p.id||p.group||i} className="bg-slate-50 p-4 rounded-xl border space-y-2 break-inside-avoid"><div className="flex justify-between"><h4 className="font-bold text-sm">{p.group||'กลุ่มภารกิจ'}</h4><span className="text-xs">{p.actions||'การดำเนินงานไม่ระบุ'}</span></div><p className="text-xs whitespace-pre-line"><b>การดำเนินงาน:</b> {p.actions||'ไม่ระบุ'}</p><p className="text-xs whitespace-pre-line"><b>ปัญหา/อุปสรรค:</b> {p.issues||'ไม่ระบุ'}</p></article>)}</div>:<p className="text-sm bg-amber-50 p-3">วันที่นี้ยังไม่มีข้อมูลแบบฟอร์มความพร้อม PHEOC</p>}</section>
                <div className="no-print grid grid-cols-1 lg:grid-cols-3 gap-6"><DailyPhotoCarousel setActiveTab={setActiveTab}/><PheocSituationCarousel/></div>
            </div>;
        }

        function DailyPhotoCarousel({ setActiveTab }) {
            const [photos, setPhotos] = useState([]);
            const [activeIndex, setActiveIndex] = useState(0);
            const [image, setImage] = useState(null);
            const [message, setMessage] = useState('กำลังโหลดภาพประจำวันที่ ' + new Date().toLocaleDateString('th-TH', {timeZone:'Asia/Bangkok'}));
            const reportDate = new Date().toLocaleDateString('en-CA', {timeZone:'Asia/Bangkok'});

            useEffect(() => {
                let active = true;
                const load = () => DB.request({action:'list', table:'Photos', reportDate}).then(rows => {
                    if (!active) return;
                    const ordered = rows.slice().sort((a,b) => String(b.uploadedAt).localeCompare(String(a.uploadedAt)));
                    setPhotos(ordered);
                    setActiveIndex(index => ordered.length ? index % ordered.length : 0);
                    setMessage(ordered.length ? '' : 'วันนี้ยังไม่มีภาพแนบจากอำเภอ');
                }).catch(e => { if (active) setMessage('โหลดรายการภาพไม่สำเร็จ: ' + e.message); });
                load();
                const timer = setInterval(load, 60000);
                return () => { active = false; clearInterval(timer); };
            }, [reportDate]);

            useEffect(() => {
                if (photos.length < 2) return;
                const timer = setInterval(() => setActiveIndex(index => (index + 1) % photos.length), 5000);
                return () => clearInterval(timer);
            }, [photos.length]);

            const current = photos[activeIndex];
            useEffect(() => {
                if (!current) { setImage(null); return; }
                let active = true;
                setImage(null);
                loadPhotoUrl('getPhoto',current.id).then(src => {
                    if (active) setImage({id:current.id, src});
                }).catch(e => { if (active) setMessage('เปิดภาพไม่สำเร็จ: ' + e.message); });
                return () => { active = false; };
            }, [current?.id]);

            const move = direction => {
                if (photos.length < 2) return;
                setActiveIndex(index => (index + direction + photos.length) % photos.length);
            };

            return <section className="glass-card p-6 space-y-4" aria-label="ภาพถ่ายสถานการณ์ประจำวัน">
                <style>{`@keyframes daily-photo-slide { from { opacity: .55; transform: translateX(7%); } to { opacity: 1; transform: translateX(0); } }`}</style>
                <div className="flex items-center justify-between gap-2">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                        <i className="ph ph-image text-bluePrimary text-lg"></i>
                        <span>ภาพถ่ายสถานการณ์ประจำวัน</span>
                    </h3>
                    <span className="text-[11px] text-slate-500">{photos.length ? `${activeIndex + 1} / ${photos.length}` : reportDate}</span>
                </div>
                <p className="text-xs text-slate-500">ภาพแนบจากรายงานของทุกอำเภอ • เลื่อนอัตโนมัติและวนซ้ำ</p>
                {current ? <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-100 h-64 flex items-center justify-center">
                    {image?.id === current.id ? <img key={current.id} src={image.src} alt={current.caption || `ภาพสถานการณ์อำเภอ${current.districtName}`} className="w-full h-full object-contain" style={{animation:'daily-photo-slide 550ms ease-out'}} /> : <span role="status" className="text-sm text-slate-500">กำลังโหลดภาพ…</span>}
                    {photos.length > 1 && <>
                        <button type="button" onClick={() => move(-1)} aria-label="ภาพก่อนหน้า" className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/60 hover:bg-black/80 text-white w-9 h-9">‹</button>
                        <button type="button" onClick={() => move(1)} aria-label="ภาพถัดไป" className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/60 hover:bg-black/80 text-white w-9 h-9">›</button>
                    </>}
                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-3 pt-10 text-white">
                        <p className="text-sm font-bold">อำเภอ{current.districtName}</p>
                        <p className="text-xs text-slate-200 truncate">{current.caption || current.fileName}</p>
                    </div>
                </div> : <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 h-64 flex flex-col items-center justify-center gap-3 text-center p-4">
                    <i className="ph ph-image text-4xl text-slate-400"></i>
                    <p role="status" className="text-sm text-slate-600">{message}</p>
                    <button type="button" onClick={() => setActiveTab('district')} className="text-blue-700 underline text-sm">ไปแนบภาพในรายงานอำเภอ</button>
                </div>}
            </section>;
        }

        function PheocSituationCarousel() {
            const [items, setItems] = useState([]);
            const [activeIndex, setActiveIndex] = useState(0);
            const [image, setImage] = useState(null);
            const [message, setMessage] = useState('กำลังโหลดภาพแนบประจำวัน');
            const reportDate = new Date().toLocaleDateString('en-CA', {timeZone:'Asia/Bangkok'});

            useEffect(() => {
                let active = true;
                const load = async () => {
                    const [districtResult, groupResult] = await Promise.allSettled([
                        DB.request({action:'list', table:'Photos', reportDate}),
                        DB.request({action:'list', table:'PHEOCFiles', reportDate})
                    ]);
                    if (!active) return;
                    const districtImages = districtResult.status === 'fulfilled' ? districtResult.value
                        .filter(file => String(file.mimeType || '').startsWith('image/'))
                        .map(file => ({...file, source:'district', label:`อำเภอ${file.districtName || ''}`, caption:file.caption || file.fileName})) : [];
                    const groupImages = groupResult.status === 'fulfilled' ? groupResult.value
                        .filter(file => String(file.mimeType || '').startsWith('image/'))
                        .map(file => ({...file, source:'pheoc', label:file.group || 'กลุ่มภารกิจ PHEOC', caption:file.fileName})) : [];
                    const ordered = [...districtImages, ...groupImages].sort((a,b) => String(b.uploadedAt || '').localeCompare(String(a.uploadedAt || '')));
                    setItems(ordered);
                    setActiveIndex(index => ordered.length ? index % ordered.length : 0);
                    setMessage(ordered.length ? '' : 'วันนี้ยังไม่มีภาพแนบจากอำเภอหรือกลุ่มภารกิจ PHEOC');
                };
                load();
                const refresh = setInterval(load, 60000);
                return () => { active = false; clearInterval(refresh); };
            }, [reportDate]);

            useEffect(() => {
                if (items.length < 2) return;
                const timer = setInterval(() => setActiveIndex(index => (index + 1) % items.length), 5000);
                return () => clearInterval(timer);
            }, [items.length]);

            const current = items[activeIndex];
            useEffect(() => {
                if (!current) { setImage(null); return; }
                let active = true;
                setImage(null);
                const action = current.source === 'pheoc' ? 'getPheocFile' : 'getPhoto';
                loadPhotoUrl(action,current.id).then(src => {
                    if (active) setImage({id:current.id, src});
                }).catch(error => { if (active) setMessage('เปิดภาพแนบไม่สำเร็จ: '+error.message); });
                return () => { active = false; };
            }, [current?.id]);

            const move = direction => {
                if (items.length < 2) return;
                setActiveIndex(index => (index + direction + items.length) % items.length);
            };

            return <section aria-label="ภาพสรุปการดำเนินงาน PHEOC ประจำวัน" className="rounded-xl border border-blue-100 bg-blue-50/60 p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                    <div>
                        <h4 className="font-bold text-slate-800">ภาพสรุปการดำเนินงานประจำวัน</h4>
                        <p className="text-xs text-slate-500">ภาพแนบจากรายงานอำเภอและกลุ่มภารกิจ PHEOC • เลื่อนอัตโนมัติและวนซ้ำ</p>
                    </div>
                    <span className="text-xs text-slate-500">{items.length ? `${activeIndex + 1} / ${items.length}` : reportDate}</span>
                </div>
                {current ? <div className="relative h-72 rounded-xl overflow-hidden border border-slate-200 bg-white flex items-center justify-center">
                    {image?.id === current.id ? <img key={current.id} src={image.src} alt={current.caption || current.label} className="w-full h-full object-contain" style={{animation:'daily-photo-slide 550ms ease-out'}} /> : <span role="status" className="text-sm text-slate-500">กำลังโหลดภาพ…</span>}
                    {items.length > 1 && <>
                        <button type="button" onClick={() => move(-1)} aria-label="ภาพ PHEOC ก่อนหน้า" className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/60 text-white w-9 h-9">‹</button>
                        <button type="button" onClick={() => move(1)} aria-label="ภาพ PHEOC ถัดไป" className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/60 text-white w-9 h-9">›</button>
                    </>}
                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-3 pt-10 text-white">
                        <p className="text-sm font-bold">{current.label}</p>
                        <p className="text-xs text-slate-200 truncate">{current.caption}</p>
                    </div>
                </div> : <div className="h-44 rounded-xl border border-dashed border-slate-300 bg-white flex items-center justify-center p-4 text-center">
                    <p role="status" className="text-sm text-slate-600">{message}</p>
                </div>}
            </section>;
        }

        function getAffectedPopulationTotals(report) {
            const rows = report?.floodReport?.population || [];
            const hasValue = value => value !== '' && value !== null && value !== undefined && Number.isFinite(Number(value));
            const sumType = type => {
                const matching = rows.filter(row => String(row.type || '').includes(type) && hasValue(row.count));
                return { reported: matching.length > 0, value: matching.reduce((sum,row)=>sum+Math.max(0,Number(row.count)),0) };
            };
            const deaths=sumType('เสียชีวิต'), injuries=sumType('บาดเจ็บ'), missing=sumType('สูญหาย');
            const totals = { deaths:deaths.value, deathsReported:deaths.reported, injuries:injuries.value, injuriesReported:injuries.reported, missing:missing.value, missingReported:missing.reported };
            const areaRows = report?.floodReport?.areas || [];
            const affected=areaRows.filter(row=>hasValue(row.people));
            totals.affectedReported = affected.length > 0;
            totals.affected = affected.reduce((sum,row)=>sum+Math.max(0,Number(row.people)),0);
            return totals;
        }

        function GoogleAndGeoMap({ districts, districtReports, showToast }) {
            const [mapMode, setMapMode] = useState('geoboundaries'); // 'geoboundaries' or 'satellite'
            const [selectedDistId, setSelectedDistId] = useState('d01');
            const [zoom, setZoom] = useState(1);
            const [mapFeatures, setMapFeatures] = useState([]);
            const [mapStatus, setMapStatus] = useState("กำลังโหลดขอบเขตอำเภอจาก geoBoundaries...");
            const layerRef = useRef(null);
            const [mapAttempt, setMapAttempt] = useState(0);
            const [mapError, setMapError] = useState(false);
            const [attribution, setAttribution] = useState('');
            const [casualtyReports, setCasualtyReports] = useState(districtReports);
            const getDistrictReport = districtId => casualtyReports.find(r=>r.districtId===districtId) || districtReports.find(r=>r.districtId===districtId);
            const districtImpactRows = districts.map(district => ({district,report:getDistrictReport(district.id),...getAffectedPopulationTotals(getDistrictReport(district.id))}));
            const districtImpactTotals = ['deaths','missing','affected'].reduce((result,key)=>{
                const reportedRows=districtImpactRows.filter(row=>row[`${key}Reported`]);
                result[key]={value:reportedRows.reduce((sum,row)=>sum+row[key],0),districts:reportedRows.length};
                return result;
            },{});

            useEffect(() => {
                let active = true;
                const loadCasualtyReports = async () => {
                    try {
                        const rows = await DB.request({action:'list', table:'DailyReports'});
                        if (!active) return;
                        const latestByDistrict = new Map();
                        rows.filter(row => row?.districtId && (
                            (Array.isArray(row?.floodReport?.population) && row.floodReport.population.some(item =>
                                (String(item.type || '').includes('เสียชีวิต') || String(item.type || '').includes('สูญหาย') || String(item.type || '').includes('บาดเจ็บ')) && item.count !== '' && item.count != null
                            )) ||
                            (Array.isArray(row?.floodReport?.areas) && row.floodReport.areas.some(item => item.people !== '' && item.people != null))
                        )).forEach(row => {
                            const previous = latestByDistrict.get(row.districtId);
                            if (!previous || String(row.reportDate || '') > String(previous.reportDate || '')) latestByDistrict.set(row.districtId, row);
                        });
                        setCasualtyReports(Array.from(latestByDistrict.values()));
                    } catch (error) {
                        console.warn('โหลดข้อมูลยอดสะสมบนแผนที่ไม่สำเร็จ', error);
                    }
                };
                loadCasualtyReports();
                const refresh = setInterval(loadCasualtyReports, 60000);
                return () => { active = false; clearInterval(refresh); };
            }, []);

            const colors = [
                "#bddff0", "#b7daca", "#f3dfa3", "#eec1a8", "#c6c7ea",
                "#abd9df", "#d0dfac", "#ecc7d8", "#c4dcf3", "#e4d2b8"
            ];

            useEffect(() => {
                const controller = new AbortController();
                let active = true;
                const timer = setTimeout(() => controller.abort(), 90000);
                async function getJSON(url) {
                    const response = await fetch(url, {signal: controller.signal});
                    if (!response.ok) throw new Error('HTTP ' + response.status);
                    return response.json();
                }
                async function loadMapData() {
                    const API = "https://www.geoboundaries.org/api/current/gbOpen/THA/ADM2/";
                    setMapError(false);
                    setMapStatus('กำลังโหลดขอบเขตจริง 10 อำเภอจาก geoBoundaries…');
                    try {
                        const metadata = await getJSON(API);
                        let downloadURL = metadata.simplifiedGeometryGeoJSON || metadata.gjDownloadURL;
                        if (!downloadURL) throw new Error('ไม่พบลิงก์ดาวน์โหลด GeoJSON');
                        // GitHub /raw redirects omit CORS headers; media serves the LFS GeoJSON with CORS.
                        const download = new URL(downloadURL);
                        if (download.hostname === 'github.com') {
                            const parts = download.pathname.split('/').filter(Boolean);
                            if (parts[2] === 'raw') {
                                downloadURL = 'https://media.githubusercontent.com/media/' + [parts[0], parts[1], ...parts.slice(3)].join('/');
                            }
                        }
                        const thailand = await getJSON(downloadURL);
                        if (thailand.type !== 'FeatureCollection' || !Array.isArray(thailand.features)) throw new Error('ข้อมูลไม่ใช่ GeoJSON FeatureCollection');

                        const features = districts.map(district => {
                            const matches = thailand.features.filter(f => f.properties?.shapeName === district.english);
                            if (matches.length !== 1) throw new Error(`อำเภอ${district.thai}: พบ ${matches.length} พื้นที่`);
                            const feature = matches[0];
                            if (!['Polygon', 'MultiPolygon'].includes(feature.geometry?.type)) throw new Error(`ขอบเขตอำเภอ${district.thai}ไม่ถูกต้อง`);
                            return {
                                ...feature,
                                properties: {
                                    ...feature.properties,
                                    districtId: district.id,
                                    thaiName: district.thai,
                                    labelPoint: district.labelPoint
                                }
                            };
                        });

                        if (!active) return;
                        setMapFeatures(features);
                        setMapStatus(`โหลดสำเร็จ ${features.length} อำเภอ · ขอบเขตปี ${metadata.boundaryYearRepresented}`);
                        setAttribution(`geoBoundaries · ${metadata.boundarySource} · ${metadata.boundaryLicense}`);
                    } catch (err) {
                        if (!active) return;
                        setMapFeatures([]);
                        setMapError(true);
                        setMapStatus('โหลดขอบเขตไม่สำเร็จ: ' + (err.name === 'AbortError' ? 'เกินเวลารอ กรุณาลองใหม่' : err.message));
                    } finally {
                        clearTimeout(timer);
                    }
                }
                loadMapData();
                return () => {active = false; clearTimeout(timer); controller.abort();};
            }, [mapAttempt]);

            const projectionData = useMemo(() => {
                if (!mapFeatures.length) return null;
                let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
                const collect = coords => {
                    if (typeof coords[0] === 'number') {
                        minX = Math.min(minX, coords[0]); maxX = Math.max(maxX, coords[0]);
                        minY = Math.min(minY, coords[1]); maxY = Math.max(maxY, coords[1]);
                    } else coords.forEach(collect);
                };
                mapFeatures.forEach(f => collect(f.geometry.coordinates));
                if (![minX,maxX,minY,maxY].every(Number.isFinite) || maxX <= minX || maxY <= minY) return null;
                const scale = Math.min(500 / (maxX - minX), 520 / (maxY - minY));
                const offsetX = (600 - (maxX - minX) * scale) / 2;
                const offsetY = (620 - (maxY - minY) * scale) / 2;
                return { minX, maxX, minY, maxY, scale, offsetX, offsetY };
            }, [mapFeatures]);

            const project = (lng, lat) => {
                if (!projectionData) return [0, 0];
                const { minX, maxY, scale, offsetX, offsetY } = projectionData;
                return [
                    offsetX + (lng - minX) * scale,
                    offsetY + (maxY - lat) * scale
                ];
            };

            const geometryToPath = (geometry) => {
                if (!projectionData || !geometry || !geometry.coordinates) return "";
                const polygons = geometry.type === "Polygon" ? [geometry.coordinates] : geometry.coordinates;
                return polygons.map(polygon =>
                    polygon.map(ring =>
                        ring.map((pt, i) => {
                            const [x, y] = project(pt[0], pt[1]);
                            return `${i === 0 ? "M" : "L"}${x},${y}`;
                        }).join(" ") + " Z"
                    ).join(" ")
                ).join(" ");
            };

            const selectedDistObj = districts.find(d => d.id === selectedDistId);

            return (
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                                <i className="ph ph-map-trifold text-bluePrimary"></i>
                                <span>แผนที่สถานการณ์อุทกภัยจังหวัดตรัง (geoBoundaries ADM2 & Google View)</span>
                            </h3>
                            <p className="text-xs text-slate-500">เลือกสลับระหว่างแผนที่ขอบเขตการปกครอง 10 อำเภอ และมุมมองดาวเทียม/แผนที่ถนนจริง</p>
                        </div>
                        <div className="flex bg-slate-100 p-1 rounded-xl">
                            <button 
                                onClick={() => setMapMode('geoboundaries')}
                                className={`px-4 py-2 rounded-lg text-xs font-semibold transition ${mapMode === 'geoboundaries' ? 'bg-bluePrimary text-white shadow' : 'text-slate-600 hover:text-slate-900'}`}
                            >
                                <i className="ph ph-polygon mr-1"></i> geoBoundaries ADM2
                            </button>
                            <button 
                                onClick={() => setMapMode('satellite')}
                                className={`px-4 py-2 rounded-lg text-xs font-semibold transition ${mapMode === 'satellite' ? 'bg-bluePrimary text-white shadow' : 'text-slate-600 hover:text-slate-900'}`}
                            >
                                <i className="ph ph-globe mr-1"></i> Google Maps View (ตรัง)
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Map View Panel */}
                        <div className="glass-card p-6 lg:col-span-2 space-y-4">
                            {mapMode === 'satellite' ? (
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center text-xs text-slate-500">
                                        <span>มุมมองพื้นที่จริงจังหวัดตรัง (Google Maps Integration)</span>
                                        <span className="text-emerald-600 font-medium">● เชื่อมต่อพิกัด GPS สำเร็จ</span>
                                    </div>
                                    <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-inner h-[500px] bg-slate-100 relative flex flex-col items-center justify-center p-6 text-center">
                                        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#258DCE_1px,transparent_1px)] [background-size:16px_16px]"></div>
                                        <div className="z-10 bg-white/90 backdrop-blur p-6 rounded-2xl shadow-xl max-w-md border border-slate-200 space-y-3">
                                            <div className="w-12 h-12 rounded-full bg-blue-100 text-bluePrimary mx-auto flex items-center justify-center text-2xl">
                                                <i className="ph ph-map-pin"></i>
                                            </div>
                                            <h4 className="font-bold text-slate-800 text-base">พิกัดศูนย์กลางจังหวัดตรัง (Trang Province)</h4>
                                            <p className="text-xs text-slate-600">พิกัดละติจูด 7.5599° N, ลองจิจูด 99.6068° E ครอบคลุม 10 อำเภอ</p>
                                            <a 
                                                href="https://maps.google.com/?q=Trang+Province" 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="inline-block bg-bluePrimary hover:bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow transition"
                                            >
                                                เปิดดูบน Google Maps ในแท็บใหม่
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center text-xs text-slate-500">
                                        <span role="status" className={mapError ? 'text-red-700 text-base' : 'text-base'}>{mapStatus}</span>
                                        {mapError && <button onClick={()=>setMapAttempt(n=>n+1)} className="border rounded px-3 py-2 bg-white">ลองโหลดใหม่</button>}
                                        <div className="flex gap-2">
                                            <button onClick={() => setZoom(z => Math.min(z + 0.25, 3))} className="px-2.5 py-1 border rounded bg-white text-xs">＋</button>
                                            <button onClick={() => setZoom(z => Math.max(z - 0.25, 0.75))} className="px-2.5 py-1 border rounded bg-white text-xs">－</button>
                                            <button onClick={() => setZoom(1)} className="px-2.5 py-1 border rounded bg-white text-xs">รีเซ็ต</button>
                                        </div>
                                    </div>
                                    <div className="relative overflow-hidden rounded-2xl bg-[#E8F5FA] border border-slate-200 flex items-center justify-center p-2 h-[500px]">
                                        <svg viewBox="0 0 600 620" className="w-full h-full" role="group" aria-label="แผนที่ขอบเขต 10 อำเภอ จังหวัดตรัง">
                                            <text x="25" y="45" fill="#526a7d" fontSize="18" fontWeight="bold">N ↑</text>
                                            <g transform={`translate(${300 * (1 - zoom)}, ${310 * (1 - zoom)}) scale(${zoom})`} ref={layerRef}>
                                                {mapFeatures.map((feature, idx) => {
                                                    const { districtId, thaiName } = feature.properties;
                                                    const isSelected = districtId === selectedDistId;
                                                    const pathData = geometryToPath(feature.geometry);
                                                    return (
                                                        <path
                                                            key={districtId}
                                                            d={pathData}
                                                            fill={colors[idx % colors.length]}
                                                            fillRule="evenodd"
                                                            tabIndex={0}
                                                            role="button"
                                                            aria-label={'เลือกอำเภอ'+thaiName}
                                                            aria-pressed={isSelected}
                                                            onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();setSelectedDistId(districtId);}}}
                                                            className={`district ${isSelected ? 'selected' : ''}`}
                                                            onClick={() => setSelectedDistId(districtId)}
                                                        >
                                                            <title>อำเภอ{thaiName}</title>
                                                        </path>
                                                    );
                                                })}
                                                {mapFeatures.map((feature) => {
                                                    const { districtId, thaiName, labelPoint } = feature.properties;
                                                    const [x, y] = project(labelPoint[0], labelPoint[1]);
                                                    const report = getDistrictReport(districtId);
                                                    const { deaths, missing, affected } = getAffectedPopulationTotals(report);
                                                    const hasPopulationData = deaths > 0 || missing > 0 || affected > 0;
                                                    return (
                                                        <g key={'l-' + districtId} textAnchor="middle">
                                                            <text x={x} y={y} className="map-label" dominantBaseline="middle" fontSize="14" fontWeight="700" fill="#17324d" paintOrder="stroke" stroke="#ffffff" strokeWidth="3" strokeLinejoin="round">
                                                                {thaiName}
                                                            </text>
                                                            {hasPopulationData && <g aria-label={`อำเภอ${thaiName} เสียชีวิต ${deaths} ราย สูญหาย ${missing} ราย ประสบภัย ${affected} คน`}>
                                                                <title>{`อำเภอ${thaiName} • เสียชีวิต ${deaths.toLocaleString('th-TH')} ราย • สูญหาย ${missing.toLocaleString('th-TH')} ราย • ประชาชนประสบภัย ${affected.toLocaleString('th-TH')} คน (ยอดสะสม)`}</title>
                                                                <text x={x - 35} y={y + 27} fontSize="10" fontWeight="800" fill="#7f1d1d" stroke="#ffffff" strokeWidth="2.5" strokeLinejoin="round" paintOrder="stroke">🪦 {deaths.toLocaleString('th-TH')}</text>
                                                                <text x={x} y={y + 27} fontSize="10" fontWeight="800" fill="#6d28d9" stroke="#ffffff" strokeWidth="2.5" strokeLinejoin="round" paintOrder="stroke">🔎 {missing.toLocaleString('th-TH')}</text>
                                                                <text x={x + 38} y={y + 27} fontSize="10" fontWeight="800" fill="#14532d" stroke="#ffffff" strokeWidth="2.5" strokeLinejoin="round" paintOrder="stroke">👥 {affected.toLocaleString('th-TH')}</text>
                                                            </g>}
                                                        </g>
                                                    );
                                                })}
                                            </g>
                                        </svg>
                                    </div>
                                    <p className="text-sm text-slate-600">แผนที่แสดงขอบเขตการปกครอง สีใช้แยกอำเภอ ไม่ใช่พื้นที่น้ำท่วมหรือระดับความเสี่ยง • เมื่อมีข้อมูล จะแสดงยอดผู้เสียชีวิต ผู้สูญหาย และประชาชนประสบภัยสะสมใต้ชื่ออำเภอ</p>
                                    {attribution && <p className="text-sm text-slate-500">แหล่งข้อมูล: <a href="https://www.geoboundaries.org/api/current/gbOpen/THA/ADM2/" target="_blank" rel="noopener noreferrer" className="underline">{attribution}</a></p>}
                                </div>
                            )}
                        </div>

                        {/* District Selection & Detail Sidebar */}
                        <div className="glass-card p-6 space-y-4">
                            <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                                <i className="ph ph-list-bullets text-bluePrimary text-lg"></i>
                                <span>10 อำเภอ จังหวัดตรัง</span>
                            </h3>
                            <p className="text-xs text-slate-500">คลิกเลือกอำเภอเพื่อดูรายงานสถานการณ์และพิกัดบนแผนที่</p>

                            <div className="grid grid-cols-2 gap-2 max-h-[240px] overflow-y-auto custom-scrollbar pr-1">
                                {districts.map(d => {
                                    const active = d.id === selectedDistId;
                                    return (
                                        <button
                                            key={d.id}
                                            onClick={() => setSelectedDistId(d.id)}
                                            className={`p-2.5 rounded-xl text-xs font-medium text-left transition border ${
                                                active 
                                                    ? 'bg-navy text-white border-navy shadow' 
                                                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                                            }`}
                                        >
                                            อำเภอ{d.thai}
                                        </button>
                                    );
                                })}
                            </div>

                        </div>
                    </div>
                    <section className="glass-card p-5 space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"><div><h3 className="font-bold text-slate-800">ยอดผู้เสียชีวิต ผู้สูญหาย และประชาชนประสบภัย แยกอำเภอ</h3><p className="text-xs text-slate-500 mt-1">แสดงข้อมูลล่าสุดที่แต่ละอำเภอบันทึกไว้ • เลือกอำเภอบนแผนที่หรือในรายชื่อเพื่อไฮไลต์แถว</p></div><span className="text-[11px] text-slate-500">{districtImpactRows.filter(row=>row.deathsReported||row.missingReported||row.affectedReported).length} / {districts.length} อำเภอมีข้อมูลตัวเลข</span></div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">{[['deaths','ผู้เสียชีวิต','ราย','bg-red-50 text-red-700 border-red-200'],['missing','ผู้สูญหาย','ราย','bg-violet-50 text-violet-700 border-violet-200'],['affected','ประชาชนประสบภัย','คน','bg-emerald-50 text-emerald-700 border-emerald-200']].map(([key,label,unit,style])=><div key={key} className={`rounded-xl border p-3 ${style}`}><p className="text-xs">ยอดรวม{label}</p><p className="text-xl font-bold mt-1">{districtImpactTotals[key].districts?districtImpactTotals[key].value.toLocaleString('th-TH'):'—'} <span className="text-xs font-medium">{unit}</span></p><p className="text-[11px] opacity-80">มีข้อมูล {districtImpactTotals[key].districts} อำเภอ</p></div>)}</div>
                        <div className="overflow-x-auto"><table className="w-full min-w-[560px] text-sm"><thead><tr className="bg-slate-100 text-slate-700 text-left"><th className="px-3 py-2 rounded-l-lg">อำเภอ</th><th className="px-3 py-2 text-right">ผู้เสียชีวิต (ราย)</th><th className="px-3 py-2 text-right">ผู้สูญหาย (ราย)</th><th className="px-3 py-2 text-right rounded-r-lg">ประชาชนประสบภัย (คน)</th></tr></thead><tbody>{districtImpactRows.map(row=><tr key={row.district.id} onClick={()=>setSelectedDistId(row.district.id)} className={`border-b border-slate-100 cursor-pointer hover:bg-blue-50 ${row.district.id===selectedDistId?'bg-blue-50/70 font-semibold':''}`}><th scope="row" className="px-3 py-2 text-left whitespace-nowrap">อำเภอ{row.district.thai}</th><td className={`px-3 py-2 text-right tabular-nums ${row.deathsReported?'text-red-700':'text-slate-400'}`}>{row.deathsReported?row.deaths.toLocaleString('th-TH'):'—'}</td><td className={`px-3 py-2 text-right tabular-nums ${row.missingReported?'text-violet-700':'text-slate-400'}`}>{row.missingReported?row.missing.toLocaleString('th-TH'):'—'}</td><td className={`px-3 py-2 text-right tabular-nums ${row.affectedReported?'text-emerald-700':'text-slate-400'}`}>{row.affectedReported?row.affected.toLocaleString('th-TH'):'—'}</td></tr>)}<tr className="bg-slate-50 font-bold"><th scope="row" className="px-3 py-2 text-left rounded-l-lg">ยอดรวมที่มีข้อมูล</th><td className="px-3 py-2 text-right text-red-700 tabular-nums">{districtImpactTotals.deaths.districts?districtImpactTotals.deaths.value.toLocaleString('th-TH'):'—'}</td><td className="px-3 py-2 text-right text-violet-700 tabular-nums">{districtImpactTotals.missing.districts?districtImpactTotals.missing.value.toLocaleString('th-TH'):'—'}</td><td className="px-3 py-2 text-right text-emerald-700 tabular-nums rounded-r-lg">{districtImpactTotals.affected.districts?districtImpactTotals.affected.value.toLocaleString('th-TH'):'—'}</td></tr></tbody></table></div>
                        <p className="text-[11px] text-slate-500">ขีด — หมายถึงยังไม่มีตัวเลขในรายงาน ไม่ใช่ศูนย์ • ยอดรวมเป็นผลรวมของอำเภอที่มีการระบุตัวเลขไว้</p>
                    </section>
                </div>
            );
        }

        function DashboardBars({items, color, unit}) {
            const maximum=Math.max(1,...items.map(item=>item.value||0));
            return <div className="space-y-3" role="list" aria-label={`ข้อมูลรายอำเภอ หน่วย ${unit}`}>
                {items.map(item=><div key={item.name} role="listitem" className="grid grid-cols-[80px_1fr_72px] sm:grid-cols-[100px_1fr_80px] items-center gap-3 text-xs">
                    <span className="text-slate-600 truncate" title={item.name}>{item.name}</span>
                    <div className="h-5 rounded-md bg-slate-100 overflow-hidden relative">
                        {item.value!==null&&<div className="h-full rounded-md transition-all duration-500" style={{width:`${item.value/maximum*100}%`,background:color,minWidth:item.value>0?3:0}}/>}
                        {item.value===null&&<span className="absolute inset-0 text-center text-[10px] leading-5 text-slate-400">{item.note||'ไม่ระบุตัวเลข'}</span>}
                    </div>
                    <span className="text-right tabular-nums font-semibold text-slate-700">{item.value===null?'—':item.value.toLocaleString('th-TH',{maximumFractionDigits:1})}</span>
                </div>)}
                <p className="text-[11px] text-slate-400 text-right">หน่วย: {unit} • เทียบขนาดจากค่าสูงสุดในกราฟ</p>
            </div>;
        }
        function DashboardTrend({points, color, unit}) {
            const max=Math.max(1,...points.map(point=>point.value||0));
            const x=index=>55+index*90, y=value=>165-value/max*120;
            return <div>
                <svg viewBox="0 0 640 220" className="w-full" role="img" aria-label={`แนวโน้ม 7 วัน หน่วย ${unit} มีข้อมูล ${points.filter(p=>p.value!==null).length} วัน`}>
                    {[0,0.5,1].map(fraction=><g key={fraction}><line x1="55" x2="595" y1={y(max*fraction)} y2={y(max*fraction)} stroke="#e2e8f0" strokeDasharray="4 4"/><text x="44" y={y(max*fraction)+4} textAnchor="end" fontSize="10" fill="#64748b">{(max*fraction).toLocaleString('th-TH',{maximumFractionDigits:1})}</text></g>)}
                    {points.map((point,index)=><g key={point.date}>
                        {index>0&&point.value!==null&&points[index-1].value!==null&&<line x1={x(index-1)} y1={y(points[index-1].value)} x2={x(index)} y2={y(point.value)} stroke={color} strokeWidth="3"/>}
                        {point.value!==null?<g><title>{point.date}: {point.value} {unit} • มีตัวเลข {point.sources} อำเภอ</title><circle cx={x(index)} cy={y(point.value)} r="5" fill={color} stroke="white" strokeWidth="2"/><text x={x(index)} y={y(point.value)-12} textAnchor="middle" fontSize="11" fill={color}>{point.value.toLocaleString('th-TH')}</text></g>:<text x={x(index)} y="150" textAnchor="middle" fontSize="10" fill="#94a3b8">ไม่มีข้อมูล</text>}
                        <text x={x(index)} y="190" textAnchor="middle" fontSize="11" fill="#475569">{new Date(point.date+'T12:00:00Z').toLocaleDateString('th-TH',{day:'numeric',month:'short'})}</text>
                        <text x={x(index)} y="208" textAnchor="middle" fontSize="10" fill="#94a3b8">{point.sources} อำเภอ</text>
                    </g>)}
                </svg>
                <details className="text-xs text-slate-500"><summary className="cursor-pointer">ดูข้อมูลแนวโน้มแบบตาราง</summary><div className="overflow-x-auto mt-3"><table className="w-full text-left"><thead><tr><th className="p-2">วันที่</th><th>ยอด ({unit})</th><th>อำเภอที่มีตัวเลข</th></tr></thead><tbody>{points.map(point=><tr key={point.date} className="border-t"><td className="p-2">{point.date}</td><td>{point.value===null?'ไม่มีข้อมูล':point.value.toLocaleString('th-TH')}</td><td>{point.sources}</td></tr>)}</tbody></table></div></details>
            </div>;
        }
        function DashboardView({ districts }) {
            const today=new Date(Date.now()+7*60*60*1000).toISOString().slice(0,10);
            const [date,setDate]=useState(today),[records,setRecords]=useState([]),[loading,setLoading]=useState(true),[error,setError]=useState(''),[loadedAt,setLoadedAt]=useState(''),[refresh,setRefresh]=useState(0),[metricKey,setMetricKey]=useState('affected');
            useEffect(()=>{
                let active=true;setLoading(true);setError('');
                DB.request({action:'list',table:'DailyReports'}).then(rows=>{
                    if(!Array.isArray(rows))throw new Error('รูปแบบข้อมูลรายงานไม่ถูกต้อง');
                    if(active){setRecords(rows);setLoadedAt(getCurrentBKKTime());}
                }).catch(e=>{if(active)setError(e.message||'ไม่สามารถเชื่อมต่อฐานข้อมูล');}).finally(()=>{if(active)setLoading(false);});
                return ()=>{active=false;};
            },[refresh]);
            const D=DashboardData, daily=D.daily(records,districts,date), submitted=daily.filter(row=>row.submitted), drafts=daily.filter(row=>row.report&&!row.submitted), absent=daily.filter(row=>!row.report);
            const metric=D.metrics.find(item=>item.key===metricKey)||D.metrics[0], impact=D.total(daily,metric.key), affected=D.total(daily,'affected'), households=D.total(daily,'households');
            const riskGroups=[{name:'เสี่ยงสูง / วิกฤต',color:'#ef4444'},{name:'เฝ้าระวัง',color:'#f59e0b'},{name:'ปกติ',color:'#10b981'},{name:'ไม่ระบุสถานะ',color:'#8b5cf6'},{name:'ยังไม่ส่ง',color:'#cbd5e1'}].map(group=>({...group,count:daily.filter(row=>row.risk===group.name).length}));
            const highRisk=riskGroups[0].count, percent=districts.length?Math.round(submitted.length/districts.length*100):0;
            const points=D.history(records,districts,date,metric.key);
            const impactItems=daily.map(row=>({name:row.district.thai,value:row.submitted?D.metric(row.report,metric.key):null,note:row.submitted?'ไม่ระบุตัวเลข':row.report?'ยังไม่ส่งรายงาน':'ไม่มีรายงาน'})).sort((a,b)=>(b.value??-1)-(a.value??-1));
            const rainItems=daily.map(row=>({name:row.district.thai,value:row.submitted?D.metric(row.report,'rain'):null,note:row.submitted?'ไม่ระบุตัวเลข':'ยังไม่ส่งรายงาน'})).sort((a,b)=>(b.value??-1)-(a.value??-1));
            const rainKnown=rainItems.filter(row=>row.value!==null), rainMax=rainKnown[0];
            const fmt=value=>value===null?'—':value.toLocaleString('th-TH');
            const dateLabel=new Date(date+'T12:00:00Z').toLocaleDateString('th-TH',{dateStyle:'long'});
            let offset=0;
            return <div className="space-y-6" aria-busy={loading}>
                <header className="bg-gradient-to-r from-navy via-[#15476b] to-bluePrimary text-white p-6 md:p-8 rounded-2xl shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-5">
                    <div><p className="text-cyan-200 text-xs tracking-wide">TRANG FLOOD MONITORING • PHEOC จังหวัดตรัง</p><h2 className="text-2xl md:text-3xl font-bold mt-2">Dashboard ภาพรวมอุทกภัยจังหวัดตรัง</h2><p className="text-blue-100 text-sm mt-2">เชื่อมโยงข้อมูลรายงานอำเภอจาก Google Sheets • {districts.length} อำเภอ</p></div>
                    <div className="rounded-xl border border-white/20 bg-white/10 p-4 text-xs shrink-0"><p className="text-blue-100">ข้อมูลประจำวันที่</p><p className="text-lg font-semibold mt-1">{dateLabel}</p><p className="text-cyan-200 mt-1">{loadedAt?'ดึงข้อมูลล่าสุด '+loadedAt:'กำลังเชื่อมต่อฐานข้อมูล…'}</p></div>
                </header>
                <div className="glass-card p-4 flex flex-wrap items-center justify-between gap-3"><label className="text-sm font-medium flex flex-wrap items-center gap-3">เลือกวันที่รายงาน<input aria-label="วันที่รายงาน Dashboard" type="date" max={today} value={date} onChange={e=>{if(/^\d{4}-\d{2}-\d{2}$/.test(e.target.value))setDate(e.target.value);}} className="border rounded-lg px-3 py-2 bg-slate-50 text-slate-700"/></label><button type="button" disabled={loading} onClick={()=>setRefresh(n=>n+1)} className="rounded-lg bg-blue-50 text-blue-700 px-4 py-2 text-sm font-medium disabled:opacity-50"><i className="ph ph-arrow-clockwise mr-2" aria-hidden="true"/>{loading?'กำลังโหลด…':'อัปเดตข้อมูล'}</button></div>
                {error?<div role="alert" className="bg-red-50 text-red-800 border border-red-200 rounded-xl p-5">โหลดข้อมูล Dashboard ไม่สำเร็จ: {error} <button onClick={()=>setRefresh(n=>n+1)} className="underline font-semibold ml-2">ลองใหม่</button><p className="text-xs mt-2">กราฟถูกซ่อนไว้จนกว่าจะเชื่อมต่อฐานข้อมูลสำเร็จ</p></div>:loading?<div role="status" className="glass-card p-12 text-center text-slate-500">กำลังอ่านรายงานจากฐานข้อมูล เพื่อสรุปกราฟสถานการณ์…</div>:<>
                    <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
                        {[
                            {label:'อำเภอส่งรายงานแล้ว',value:`${submitted.length} / ${districts.length}`,note:`${percent}% • ร่าง ${drafts.length} • ไม่มีรายงาน ${absent.length}`,color:'#10b981',icon:'ph-check-square-offset'},
                            {label:'พื้นที่เสี่ยงสูง / วิกฤต',value:highRisk+' อำเภอ',note:daily.filter(row=>row.risk===riskGroups[0].name).map(row=>row.district.thai).join(' • ')||'จากรายงานที่ส่งแล้ว',color:'#ef4444',icon:'ph-warning-circle'},
                            {label:'ประชาชนได้รับผลกระทบ',value:fmt(affected.value)+' คน',note:`มีตัวเลข ${affected.sources} / ${districts.length} อำเภอ`,color:'#258dce',icon:'ph-users-three'},
                            {label:'ครัวเรือนได้รับผลกระทบ',value:fmt(households.value)+' หลัง',note:`มีตัวเลข ${households.sources} / ${districts.length} อำเภอ`,color:'#7c3aed',icon:'ph-house'}
                        ].map(card=><article key={card.label} className="glass-card p-4 sm:p-5 border-t-4" style={{borderTopColor:card.color}}><div className="flex justify-between gap-2"><p className="text-xs text-slate-500">{card.label}</p><i aria-hidden="true" className={`ph ${card.icon} text-xl`} style={{color:card.color}}/></div><p className="text-xl sm:text-2xl font-bold mt-3 tabular-nums" style={{color:card.color}}>{card.value}</p><p className="text-[11px] text-slate-500 mt-2">{card.note}</p></article>)}
                    </div>
                    <aside className={`rounded-xl border p-4 text-sm flex items-start gap-3 ${submitted.length<districts.length?'bg-amber-50 border-amber-200 text-amber-900':'bg-emerald-50 border-emerald-200 text-emerald-900'}`}><i aria-hidden="true" className="ph ph-info text-xl"/><div><p className="font-semibold">{submitted.length===0?'ยังไม่มีรายงานที่ส่งแล้วสำหรับวันที่เลือก':`ภาพรวมจากรายงานที่ส่งแล้ว ${submitted.length} อำเภอ${percent<100?' • ข้อมูลยังไม่ครบทั้งจังหวัด':''}`}</p><p className="text-xs mt-1">{daily.filter(row=>!row.submitted).length?'รอติดตาม: '+daily.filter(row=>!row.submitted).map(row=>row.district.thai).join(' • '):'ได้รับรายงานครบทุกอำเภอ'} • ไม่รวมรายงานร่างในยอดสถานการณ์</p></div></aside>
                    <div className="grid lg:grid-cols-2 gap-6">
                        <section className="glass-card p-5 sm:p-6"><div className="flex justify-between items-start gap-3"><div><h3 className="font-bold text-lg">ระดับความเสี่ยงรายอำเภอ</h3><p className="text-xs text-slate-500 mt-1">สัดส่วนพื้นที่จากรายงานวันที่เลือก</p></div><span className="text-xs bg-slate-100 rounded-full px-3 py-1">{districts.length} อำเภอ</span></div><div className="flex flex-col sm:flex-row items-center gap-6 mt-5">
                            <svg viewBox="0 0 200 200" className="w-48 h-48 shrink-0" role="img" aria-label={riskGroups.map(g=>`${g.name} ${g.count} อำเภอ`).join(', ')}><circle cx="100" cy="100" r="76" fill="none" stroke="#f1f5f9" strokeWidth="22"/>{riskGroups.filter(g=>g.count).map(group=>{const length=group.count/Math.max(1,districts.length)*100,start=offset;offset+=length;return <circle key={group.name} cx="100" cy="100" r="76" fill="none" stroke={group.color} strokeWidth="22" pathLength="100" strokeDasharray={`${length} ${100-length}`} strokeDashoffset={-start} transform="rotate(-90 100 100)"><title>{group.name}: {group.count} อำเภอ</title></circle>;})}<text x="100" y="97" textAnchor="middle" fontSize="34" fontWeight="600" fill="#102d50">{submitted.length}</text><text x="100" y="121" textAnchor="middle" fontSize="12" fill="#64748b">อำเภอส่งรายงานแล้ว</text></svg>
                            <div className="w-full space-y-3">{riskGroups.map(group=><div key={group.name} className="flex items-center justify-between gap-3 text-sm"><span className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full" style={{background:group.color}}/>{group.name}</span><b className="tabular-nums">{group.count} <span className="font-normal text-xs text-slate-400">อำเภอ</span></b></div>)}</div></div>
                        </section>
                        <section className="glass-card p-5 sm:p-6"><div className="flex justify-between items-start gap-3 mb-5"><div><h3 className="font-bold text-lg">ปริมาณฝนรายอำเภอ</h3><p className="text-xs text-slate-500 mt-1">เรียงจากมากไปน้อย • ตามค่าฝนที่อำเภอบันทึก</p></div><span className="text-xs text-blue-700 bg-blue-50 px-3 py-1 rounded-full">มม.</span></div><DashboardBars items={rainItems} color="#258dce" unit="มม."/><p className="text-xs text-slate-500 mt-4">{rainMax?`ค่าสูงสุด: ${rainMax.name} ${rainMax.value.toLocaleString('th-TH')} มม. • มีตัวเลข ${rainKnown.length} อำเภอ`:'ยังไม่มีรายงานที่ส่งแล้วพร้อมตัวเลขปริมาณฝน'}</p></section>
                    </div>
                    <section className="glass-card p-5 sm:p-6"><div className="flex flex-col sm:flex-row justify-between gap-3"><div><h3 className="font-bold text-lg">ผลกระทบและการช่วยเหลือประชาชน</h3><p className="text-xs text-slate-500 mt-1">เลือกตัวชี้วัดเพื่อเปรียบเทียบอำเภอและติดตามย้อนหลัง</p></div><div className="text-right"><p className="text-2xl font-bold" style={{color:metric.color}}>{fmt(impact.value)} <span className="text-sm">{metric.unit}</span></p><p className="text-[11px] text-slate-400">ยอดรวมที่มีข้อมูล • {impact.sources} อำเภอ</p></div></div>
                        <div className="flex flex-wrap gap-2 my-5" aria-label="เลือกตัวชี้วัดกราฟ">{D.metrics.map(item=><button key={item.key} type="button" aria-pressed={item.key===metricKey} onClick={()=>setMetricKey(item.key)} className="border rounded-full px-3 py-2 text-xs transition" style={{background:item.key===metricKey?item.color:'white',color:item.key===metricKey?'white':'#475569',borderColor:item.key===metricKey?item.color:'#e2e8f0'}}>{item.label}</button>)}</div>
                        <div className="grid lg:grid-cols-2 gap-8"><div><h4 className="text-sm font-semibold mb-4">เปรียบเทียบรายอำเภอ</h4><DashboardBars items={impactItems} color={metric.color} unit={metric.unit}/></div><div className="min-w-0"><h4 className="text-sm font-semibold">แนวโน้ม 7 วัน • {metric.label}</h4><p className="text-[11px] text-slate-500 mt-1">ยอดรายวันตามรายงาน • ไม่บวกสะสมข้ามวัน</p><DashboardTrend points={points} color={metric.color} unit={metric.unit}/><p className="text-[11px] text-slate-500 mt-3">จำนวนอำเภอที่มีตัวเลขอาจต่างกันในแต่ละวัน • เว้นช่วงวันที่ไม่มีข้อมูล จึงควรพิจารณาความครบถ้วนร่วมกับแนวโน้ม</p></div></div>
                        <p className="text-[11px] text-slate-500 mt-5 pt-4 border-t">แหล่งข้อมูล: DailyReports ในฐานข้อมูล Google Sheets • ใช้เฉพาะรายงานที่ส่งแล้วของวันนั้น • — คือยังไม่มีตัวเลข ส่วน 0 คือบันทึกยืนยันว่าไม่มี • ค่ารวมอาจยังไม่ครอบคลุมทุกอำเภอ</p>
                    </section>
                </>}
            </div>;
        }

const FLOOD_REPORT_PREFIX = 'TRANG_SAT_FLOOD_V1:';
function unpackFloodReport(record) {
 if(!record || typeof record.notes!=='string' || !record.notes.startsWith(FLOOD_REPORT_PREFIX))return record;
 try{const payload=JSON.parse(record.notes.slice(FLOOD_REPORT_PREFIX.length));return {...record,notes:payload.summary||'',floodReport:payload};}catch{return record;}
}
const floodColumn=(key,label,type='text')=>({key,label,type});
const FLOOD_TABLES={
 areas:[floodColumn('tambon','ตำบล'),floodColumn('villages','จำนวนหมู่บ้าน (แห่ง)','number'),floodColumn('households','จำนวนครัวเรือน (หลัง)','number'),floodColumn('people','ประชาชนที่ได้รับผลกระทบ (คน)','number'),floodColumn('notes','หมายเหตุ')],
 staff:[floodColumn('type','การเสียชีวิต / บาดเจ็บ'),floodColumn('count','รวม (ราย)','number'),floodColumn('detail','รายละเอียด'),floodColumn('families','ครอบครัวได้รับผลกระทบ','number'),floodColumn('homes','บ้านได้รับผลกระทบ (หลัง)','number')],
 population:[floodColumn('type','การเสียชีวิต / บาดเจ็บ / สูญหาย'),floodColumn('count','รวม (ราย)','number'),floodColumn('detail','รายละเอียด')],
 partial:[floodColumn('facility','สถานบริการ'),floodColumn('damage','ประมาณการความเสียหาย (บาท)','number'),floodColumn('detail','รายละเอียด')],
 closed:[floodColumn('facility','สถานบริการ'),floodColumn('damage','ประมาณการความเสียหาย (บาท)','number'),floodColumn('detail','รายละเอียด')],
 recovery:[floodColumn('facility','สถานบริการ'),floodColumn('detail','รายละเอียดการดำเนินการ'),floodColumn('budget','ประมาณการงบประมาณความเสียหาย (บาท)','number')],
 mobile:[floodColumn('unit','หน่วยแพทย์'),floodColumn('units','จำนวนหน่วยแพทย์','number'),floodColumn('visits','ครั้งที่ให้บริการ','number'),floodColumn('patients','ผู้รับบริการ (ราย)','number'),floodColumn('education','บริการสุขศึกษา (ราย)','number')],
 diseases:[floodColumn('communicable','โรคระบาด (ติดต่อ)'),floodColumn('noncommunicable','โรคไม่ติดต่อ'),floodColumn('specific','ผู้ป่วยเฉพาะ'),floodColumn('other','อื่น ๆ')],
 sanitation:[floodColumn('activity','กิจกรรมที่ดำเนินการ'),floodColumn('date','วันเดือนปี','date'),floodColumn('place','สถานที่ปฏิบัติงาน'),floodColumn('people','ผู้รับบริการ (ราย)','number')],
 medicine:[floodColumn('date','วัน / เดือน / ปี','date'),floodColumn('quantity','จำนวนชุด','number')],
 shelters:[floodColumn('activity','กิจกรรมที่ดำเนินการ'),floodColumn('date','วันเดือนปี','date'),floodColumn('place','สถานที่ปฏิบัติงาน'),floodColumn('people','ผู้รับบริการ (ราย)','number')],
 mentalAid:[floodColumn('activity','กิจกรรมที่ดำเนินการ'),floodColumn('date','วันเดือนปี','date'),floodColumn('place','สถานที่ปฏิบัติงาน'),floodColumn('people','ผู้รับบริการ (ราย)','number')],
 vulnerable:[{key:'type',label:'กลุ่มเปราะบาง (เลือกประเภท)',type:'select',options:['เด็กเล็ก','ผู้สูงอายุ','คนพิการ','ผู้ป่วยติดเตียง','หญิงตั้งครรภ์','ผู้ป่วยโรคเรื้อรัง','ผู้ป่วยจิตเวช','ผู้ป่วยฟอกไต']},floodColumn('count','จำนวน (ราย)','number'),floodColumn('unit','หน่วยบริการที่รับผิดชอบ')],
 support:[floodColumn('item','รายการ'),floodColumn('quantity','จำนวน','number'),floodColumn('unit','หน่วย'),floodColumn('notes','หมายเหตุ')]
};
const blankFloodReport=date=>({version:1,summary:'',asOfDate:date,asOfTime:'',areaDate:date,areaTime:'',facilityDate:date,aidStart:'',aidEnd:date,medicineStart:'',medicineEnd:date,supportDate:date,signatureDate:date,position:'',populationDetail:'',recommendations:'',normalHospitals:'',normalPcu:'',partialHospitals:'',partialPcu:'',closedCount:'',recoveryCount:'',assessed:'',highStress:'',depression:'',suicideRisk:'',ptsd:'',specialCare:'',areas:[{}],staff:[{type:'เสียชีวิต'},{type:'ได้รับบาดเจ็บ'}],population:[{type:'เสียชีวิต'},{type:'ได้รับบาดเจ็บ'},{type:'สูญหาย'}],partial:[{}],closed:[{}],recovery:[{}],mobile:[{}],diseases:[{}],sanitation:[{}],medicine:[{}],shelters:[{}],mentalAid:[{}],vulnerable:[{}],support:[{}]});
function FloodTable({name,title,value,onChange,disabled}) {
 const columns=FLOOD_TABLES[name],rows=value||[];
 const fixed=name==='staff'||name==='population';
 const update=(index,key,v)=>onChange(rows.map((row,i)=>i===index?{...row,[key]:v}:row));
 const sums=columns.filter(c=>c.type==='number');
 return <div className="space-y-3"><h4 className="font-bold text-lg">{title}</h4><div className="overflow-x-auto rounded-xl border border-slate-300"><table className="w-full text-base"><thead className="bg-blue-50"><tr><th className="p-3">ที่</th>{columns.map(c=><th className="p-3 min-w-[160px] text-left" key={c.key}>{c.label}</th>)}{!fixed&&<th className="p-3">จัดการ</th>}</tr></thead><tbody>{rows.map((row,index)=><tr key={index} className="border-t border-slate-200"><td className="p-3">{index+1}</td>{columns.map(c=><td className="p-2" key={c.key}>{fixed&&c.key==='type'?row.type:c.type==='select'?<select aria-label={`${title} แถว ${index+1} ${c.label}`} value={row[c.key]??''} disabled={disabled} onChange={e=>update(index,c.key,e.target.value)} className="w-full min-w-[160px] p-3 border rounded-lg bg-white text-base"><option value="">เลือกประเภท</option>{c.options.map(option=><option key={option} value={option}>{option}</option>)}</select>:<input aria-label={`${title} แถว ${index+1} ${c.label}`} type={c.type} min={c.type==='number'?0:undefined} step={c.type==='number'?(c.key==='damage'||c.key==='budget'?'0.01':'1'):undefined} value={row[c.key]??''} disabled={disabled} onChange={e=>update(index,c.key,e.target.value)} className="w-full min-w-[140px] p-3 border rounded-lg bg-white text-base"/>}</td>)}{!fixed&&<td className="p-2"><button type="button" disabled={disabled} onClick={()=>onChange(rows.filter((_,i)=>i!==index))} className="text-red-700 px-3 py-2" aria-label={`${title} ลบแถว ${index+1}`}>ลบ</button></td>}</tr>)}</tbody>{sums.length>0&&<tfoot className="bg-slate-50"><tr><th className="p-3">รวม</th>{columns.map(c=><td className="p-3 font-bold" key={c.key}>{c.type==='number'?(rows.some(r=>r[c.key]!==''&&r[c.key]!=null)?rows.reduce((sum,r)=>sum+Number(r[c.key]||0),0).toLocaleString('th-TH'):'—'):''}</td>)}{!fixed&&<td/>}</tr></tfoot>}</table></div>{!fixed&&<button type="button" disabled={disabled} onClick={()=>onChange([...rows,{}])} className="px-4 py-2 border border-blue-300 text-blue-800 rounded-lg">+ เพิ่มแถว</button>}</div>;
}
function DistrictReportView({districts,reports,setReports,showToast}) {
 const today=()=>new Date().toLocaleDateString('en-CA',{timeZone:'Asia/Bangkok'});
 const [selectedDistId,setSelectedDistId]=useState('d01'),[reportDate,setReportDate]=useState(today);
 const [form,setForm]=useState(()=>blankFloodReport(today()));
 const [base,setBase]=useState({status:'ปกติ',rain:'',waterLevel:'',trend:'',reporter:'',submitted:false});
 const [busy,setBusy]=useState(false),[loading,setLoading]=useState(true),[loaded,setLoaded]=useState(false),[error,setError]=useState(''),[reload,setReload]=useState(0);
 const district=districts.find(d=>d.id===selectedDistId);
 useEffect(()=>{
  let active=true;setLoading(true);setLoaded(false);setError('');setForm(blankFloodReport(reportDate));setBase({status:'ปกติ',rain:'',waterLevel:'',trend:'',reporter:'',submitted:false});
  DB.request({action:'list',table:'DailyReports',reportDate,districtId:selectedDistId}).then(rows=>{if(!active)return;const row=unpackFloodReport(rows[0]);if(row){const payload=row.floodReport||{};const populationTypes=['เสียชีวิต','ได้รับบาดเจ็บ','สูญหาย'];setBase({...row,rain:row.rain??''});setForm({...blankFloodReport(reportDate),...payload,population:populationTypes.map(type=>(payload.population||[]).find(person=>person.type===type)||{type}),vulnerable:payload.vulnerable||[{}],summary:row.notes||''});}setLoaded(true);}).catch(e=>{if(active)setError('โหลดรายงานไม่สำเร็จ: '+e.message);}).finally(()=>{if(active)setLoading(false);});
  return ()=>{active=false;};
 },[selectedDistId,reportDate,reload]);
 const change=(key,value)=>setForm(previous=>({...previous,[key]:value}));
 const input=(key,label,type='text')=><label className="block text-base space-y-1" key={key}><span>{label}</span><input type={type} min={type==='number'?0:undefined} step={type==='number'?'1':undefined} value={form[key]??''} onChange={e=>change(key,e.target.value)} disabled={busy||loading} className="w-full border border-slate-300 rounded-lg p-3 bg-white text-lg"/></label>;
 const table=(name,title)=><FloodTable name={name} title={title} value={form[name]} onChange={rows=>change(name,rows)} disabled={busy||loading}/>;
 const save=async submitted=>{
  if(busy||loading||!loaded)return;
  setError('');
  try{
   if(submitted&&(!form.summary.trim()||!base.reporter.trim()||!form.asOfTime||!form.position.trim()))throw new Error('กรุณากรอกสรุปสถานการณ์ เวลา ชื่อผู้รายงาน และตำแหน่งก่อนส่ง');
   for(const [name,columns] of Object.entries(FLOOD_TABLES))for(const row of form[name]||[])for(const c of columns.filter(c=>c.type==='number')){const value=row[c.key];if(value!==''&&value!=null&&(!Number.isFinite(Number(value))||Number(value)<0||(!['budget','damage'].includes(c.key)&&!Number.isInteger(Number(value)))))throw new Error('จำนวนต้องเป็นเลขไม่ติดลบ และจำนวนคน/หน่วยต้องเป็นจำนวนเต็ม');}
   for(const key of ['normalHospitals','normalPcu','partialHospitals','partialPcu','closedCount','recoveryCount','assessed','highStress','depression','suicideRisk','ptsd','specialCare']){const value=form[key];if(value!==''&&value!=null&&(!Number.isInteger(Number(value))||Number(value)<0))throw new Error('จำนวนต้องเป็นจำนวนเต็มที่ไม่ติดลบ');}
   for(const [start,end] of [['aidStart','aidEnd'],['medicineStart','medicineEnd']])if(form[start]&&form[end]&&form[start]>form[end])throw new Error('วันเริ่มต้นยอดสะสมต้องไม่อยู่หลังวันสิ้นสุด');
   const notes=FLOOD_REPORT_PREFIX+JSON.stringify({...form,asOfDate:reportDate});
   if(notes.length>20000)throw new Error('รายละเอียดเกินความจุ 20,000 ตัวอักษร กรุณาย่อข้อความก่อนบันทึก');
   setBusy(true);
   const updated=unpackFloodReport(await DB.request({action:'upsert',table:'DailyReports',record:{districtId:selectedDistId,districtName:district.thai,reportDate,status:base.status,submitted,rain:Number(base.rain||0),waterLevel:base.waterLevel||'',trend:base.trend||'',reporter:base.reporter||'',notes}}));
   if(!updated.floodReport||JSON.stringify(updated.floodReport)!==JSON.stringify({...form,asOfDate:reportDate}))throw new Error('ข้อมูลตอบกลับไม่ครบ กรุณาโหลดตรวจสอบก่อนส่งซ้ำ');
   setBase(updated);setReports(previous=>[...previous.filter(r=>!(r.districtId===selectedDistId&&r.reportDate===reportDate)),updated]);
   showToast(submitted?'ส่งรายงานครบตามแบบฟอร์มลง Google Sheets แล้ว':'บันทึกร่างครบทุกหัวข้อลง Google Sheets แล้ว');
  }catch(e){setError(e.message);showToast('บันทึกไม่สำเร็จ: '+e.message);}finally{setBusy(false);}
 };
 return <div className="space-y-6 text-lg"><section className="bg-white p-6 rounded-2xl border space-y-4"><h3 className="font-bold text-2xl">แบบรายงานสถานการณ์น้ำท่วม ระดับอำเภอ จังหวัดตรัง</h3><p>ครบตามแบบรายงาน ปี 2570 • ช่องว่างหมายถึงยังไม่มีข้อมูล กรอก 0 เมื่อยืนยันว่าไม่มี</p><div className="grid md:grid-cols-3 gap-4"><label>อำเภอ<select disabled={busy} value={selectedDistId} onChange={e=>{if(window.confirm('เปลี่ยนอำเภอ? ข้อมูลที่ยังไม่บันทึกจะไม่ถูกเก็บ'))setSelectedDistId(e.target.value);}} className="w-full p-3 border rounded-lg">{districts.map(d=><option key={d.id} value={d.id}>{d.thai}</option>)}</select></label><label>ข้อมูล ณ วันที่<input disabled={busy} type="date" value={reportDate} onChange={e=>{if(e.target.value&&window.confirm('เปลี่ยนวันที่? ข้อมูลที่ยังไม่บันทึกจะไม่ถูกเก็บ'))setReportDate(e.target.value);}} className="w-full p-3 border rounded-lg"/></label>{input('asOfTime','เวลา (ประเทศไทย)','time')}</div><p>สถานะ: {base.submitted?'ส่งรายงานแล้ว':'ร่าง / ยังไม่ส่ง'}</p><button disabled={busy||loading} onClick={()=>setReload(n=>n+1)} className="border rounded-lg px-4 py-2">โหลดรายงานที่บันทึกใหม่</button>{loading&&<p role="status">กำลังโหลดรายงานจาก Google Sheets…</p>}{error&&<p role="alert" className="bg-red-50 text-red-800 rounded-lg p-4">{error}</p>}</section>
 <section className="bg-white p-6 rounded-2xl border space-y-5"><h3 className="text-xl font-bold">1. สรุปสถานการณ์ทั่วไป</h3><label className="block">สรุปสถานการณ์<textarea value={form.summary} disabled={busy||loading} onChange={e=>change('summary',e.target.value)} rows={4} className="w-full border rounded-lg p-3 text-lg"/></label><div className="grid md:grid-cols-2 gap-4">{input('areaDate','1.1 ข้อมูลพื้นที่และประชาชน ณ วันที่','date')}{input('areaTime','เวลา (ประเทศไทย)','time')}</div>{table('areas','1.1 พื้นที่และประชาชนที่ได้รับความเสียหาย')}</section>
  <section className="bg-white p-6 rounded-2xl border space-y-5">{table('population','2. ประชาชนที่ได้รับผลกระทบ (ยอดสะสม)')}<label className="block">รายละเอียดเพิ่มเติม<textarea rows={3} disabled={busy||loading} value={form.populationDetail} onChange={e=>change('populationDetail',e.target.value)} className="w-full border rounded-lg p-3"/></label></section>
  <section className="bg-white p-6 rounded-2xl border space-y-5">{table('staff','3. บุคลากรสาธารณสุขที่ได้รับผลกระทบ (ยอดสะสม)')}</section>
  <section className="bg-white p-6 rounded-2xl border space-y-5"><h3 className="text-xl font-bold">4. สถานบริการที่ได้รับผลกระทบ</h3>{input('facilityDate','ข้อมูล ณ วันที่','date')}<div className="grid md:grid-cols-2 gap-4">{input('normalHospitals','4.1 โรงพยาบาลเปิดบริการปกติ (แห่ง)','number')}{input('normalPcu','4.1 รพ.สต. เปิดบริการปกติ (แห่ง)','number')}{input('partialHospitals','4.2 โรงพยาบาลเปิดบริการบางส่วน (แห่ง)','number')}{input('partialPcu','4.2 รพ.สต. เปิดบริการบางส่วน (แห่ง)','number')}</div>{table('partial','4.2 รายละเอียดสถานบริการที่เปิดได้บางส่วน')}{input('closedCount','4.3 ปิดให้บริการ (แห่ง)','number')}{table('closed','4.3 รายละเอียดสถานบริการที่ปิดให้บริการ')}</section>
  <section className="bg-white p-6 rounded-2xl border space-y-6"><h3 className="text-xl font-bold">5. การช่วยเหลือประชาชนด้านการสาธารณสุข</h3><div className="grid md:grid-cols-2 gap-4">{input('aidStart','ยอดสะสมตั้งแต่วันที่','date')}{input('aidEnd','ถึงวันที่','date')}</div>{table('vulnerable','5.1 การช่วยเหลือกลุ่มเปราะบาง (เลือกจาก 8 ประเภท)')}<h4 className="font-bold">5.2 การให้บริการรักษาพยาบาล</h4>{table('mobile','5.2.1 หน่วยแพทย์เคลื่อนที่ / หน่วยเคลื่อนที่')}{table('diseases','5.2.2 โรคที่พบบ่อยจากการออกหน่วยเคลื่อนที่')}<h4 className="text-lg font-bold">5.2.3 ปัญหาสุขภาพจิต</h4><div className="grid md:grid-cols-3 gap-4">{input('assessed','ประเมินปัญหาสุขภาพจิต (ราย)','number')}{input('highStress','เครียดสูง (ราย)','number')}{input('depression','ซึมเศร้า (ราย)','number')}{input('suicideRisk','เสี่ยงต่อการฆ่าตัวตาย (ราย)','number')}{input('ptsd','PTSD (ราย)','number')}{input('specialCare','ต้องติดตามดูแลพิเศษ (ราย)','number')}</div>{table('sanitation','5.2.4 การสุขาภิบาล / ป้องกันโรค')}<div className="grid md:grid-cols-2 gap-4">{input('medicineStart','แจกยาสะสมตั้งแต่วันที่','date')}{input('medicineEnd','ถึงวันที่','date')}</div>{table('medicine','5.2.5 การแจกยาชุดช่วยเหลือผู้ประสบอุทกภัย')}{table('shelters','5.3 การช่วยเหลือศูนย์พักพิง / ศูนย์อพยพ')}{table('mentalAid','5.4 การช่วยเหลือเยียวยาด้านจิตใจ (MACTT)')}</section>
  <section className="bg-white p-6 rounded-2xl border space-y-5">{input('supportDate','6. ข้อมูลความต้องการสนับสนุน ณ วันที่','date')}{table('support','6. ความต้องการสนับสนุนยาและเวชภัณฑ์ และอื่น ๆ')}<label className="block text-base space-y-1"><span>ข้อเสนอแนะ / คาดการณ์แนวโน้ม / การประเมินความเสี่ยงเพื่อพิจารณา</span><textarea rows={5} disabled={busy||loading} value={form.recommendations??''} onChange={e=>change('recommendations',e.target.value)} className="w-full border border-slate-300 rounded-lg p-3 bg-white text-lg"/></label></section>
 <section className="bg-white p-6 rounded-2xl border space-y-4"><h3 className="font-bold text-xl">ผู้รายงาน</h3><div className="grid md:grid-cols-3 gap-4"><label>ลงชื่อผู้รายงาน<input disabled={busy||loading} value={base.reporter||''} onChange={e=>setBase({...base,reporter:e.target.value})} className="w-full p-3 border rounded-lg"/></label>{input('position','ตำแหน่ง')}{input('signatureDate','วันที่รายงาน','date')}</div><p className="text-base text-slate-600">ชื่อผู้รายงานเป็นข้อมูลประกอบรายงาน ไม่ใช่ลายมือชื่อดิจิทัล</p><details><summary className="cursor-pointer">ข้อมูลติดตามเพิ่มเติมของระบบ</summary><div className="grid md:grid-cols-3 gap-4 pt-4"><label>ระดับความเสี่ยง<select value={base.status} onChange={e=>setBase({...base,status:e.target.value})} className="w-full p-3 border rounded-lg"><option>ปกติ</option><option>เฝ้าระวัง</option><option>เสี่ยงสูง</option></select></label><label>ปริมาณฝน (มม.)<input type="number" min="0" step="0.1" value={base.rain??''} onChange={e=>setBase({...base,rain:e.target.value})} className="w-full p-3 border rounded-lg"/></label><label>ระดับน้ำ<input value={base.waterLevel||''} onChange={e=>setBase({...base,waterLevel:e.target.value})} className="w-full p-3 border rounded-lg"/></label><label>แนวโน้ม<input value={base.trend||''} onChange={e=>setBase({...base,trend:e.target.value})} className="w-full p-3 border rounded-lg"/></label></div></details><DistrictPhotos key={selectedDistId+reportDate} districtId={selectedDistId} reportDate={reportDate} showToast={showToast}/><div className="flex flex-wrap gap-3"><button disabled={busy||loading} onClick={()=>save(false)} className="border rounded-xl px-6 py-3 bg-white disabled:opacity-50">{busy?'กำลังบันทึก…':'บันทึกร่าง'}</button><button disabled={busy||loading} onClick={()=>save(true)} className="rounded-xl px-6 py-3 bg-blue-700 text-white disabled:opacity-50">ส่งรายงานเข้า Google Sheets</button></div></section>
 </div>;
}

        const PHEOC_UPLOAD_GROUPS = ['กลุ่มภารกิจวางแผน (Planning Team)','กลุ่มภารกิจจิตตระหนักรู้สถานการณ์ (SAT)','กลุ่มภารกิจการเฝ้าระวังเชิงรุก (Active Surveillance)','กลุ่มภารกิจการจัดการและดูแลรักษาผู้ป่วย (Case Management)','กลุ่มภารกิจสื่อสารความเสี่ยง (Risk Communication)','กลุ่มภารกิจวิศวกรรมการแพทย์ (MSERT)','กลุ่มภารกิจปฏิบัติการช่วยเหลือเยียวยาจิตใจประชาชน (MCATT)','กลุ่มภารกิจปฏิบัติการฉุกเฉินทางการแพทย์ (MERT / mini MERT)','กลุ่มภารกิจบริหารจัดการและการบริการวัคซีน (Vaccine support team)','กลุ่มภารกิจปฏิบัติการด้านอนามัยสิ่งแวดล้อม (SEPRT)','กลุ่มภารกิจสำรองวัสดุ เวชภัณฑ์ และกำลังบำรุง (Logistics and Stockpiling)','กลุ่มภารกิจประสานงานและเลขานุการ (Liaison)','กลุ่มภารกิจการเงินและงบประมาณ/ธุรการ (Finance/Administration)','กลุ่มภารกิจด้านเทคโนโลยีดิจิทัล (Digital support)','กลุ่มภารกิจจัดสรรกำลังคนในภาวะฉุกเฉิน (Emergency Personnel Staffing)','กลุ่มภารกิจการจัดการศูนย์ปฏิบัติการฉุกเฉิน (EOC Management)'];
        function PheocView({ reports, setReports, showToast }) {
            const readinessOptions = ['พร้อมปฏิบัติการ', 'พร้อมบางส่วน', 'ไม่พร้อม', 'กำลังประเมิน'];
            const normalizeReadiness = value => {
                const text = String(value || '').trim();
                if (readinessOptions.includes(text)) return text;
                if (text.includes('ไม่พร้อม')) return 'ไม่พร้อม';
                if (text.includes('บางส่วน')) return 'พร้อมบางส่วน';
                if (text.includes('ประเมิน')) return 'กำลังประเมิน';
                if (text.includes('พร้อม')) return 'พร้อมปฏิบัติการ';
                return '';
            };
            const [reportDate, setReportDate] = useState(new Date(Date.now() + 7 * 60 * 60 * 1000).toISOString().slice(0, 10));
            const [dailyReports, setDailyReports] = useState(reports || []);
            const [loadingReports, setLoadingReports] = useState(true);
            const [savingGroup, setSavingGroup] = useState('');
            const [formMessage, setFormMessage] = useState('');
            const legacyGroups = [...new Set((reports || []).map(p => p.group).filter(Boolean))].filter(group => !PHEOC_UPLOAD_GROUPS.includes(group));
            const groups = [...PHEOC_UPLOAD_GROUPS, ...legacyGroups];
            useEffect(() => {
                let active = true;
                setLoadingReports(true);
                setFormMessage('');
                DB.request({ action: 'list', table: 'PHEOCReports', reportDate })
                    .then(rows => { if (active) setDailyReports(Array.isArray(rows) ? rows : []); })
                    .catch(error => { if (active) setFormMessage(`โหลดแบบฟอร์มไม่สำเร็จ: ${error.message}`); })
                    .finally(() => { if (active) setLoadingReports(false); });
                return () => { active = false; };
            }, [reportDate]);
            const saveGroup = async (group, groupIndex) => {
                const form = dailyReports.find(item => item.group === group) || {};
                setSavingGroup(group);
                setFormMessage('');
                try {
                    const record = {
                        id: form.id || `pheoc_${reportDate}_${String(groupIndex + 1).padStart(2, '0')}`,
                        reportDate, group,
                        actions: form.actions || '',
                        issues: form.issues || ''
                        
                    };
                    const saved = await DB.request({ action: 'upsert', table: 'PHEOCReports', record });
                    setDailyReports(current => [...current.filter(item => item.group !== group), saved]);
                    const today = new Date(Date.now() + 7 * 60 * 60 * 1000).toISOString().slice(0, 10);
                    if (reportDate === today) setReports(current => [...(current || []).filter(item => item.group !== group), saved]);
                    showToast(`บันทึกรายงานกลุ่ม ${group} แล้ว`);
                } catch (error) {
                    setFormMessage(`บันทึกแบบฟอร์มไม่สำเร็จ: ${error.message}`);
                } finally {
                    setSavingGroup('');
                }
            };
            const updateField = (group, key, value) => setDailyReports(current => {
                const existing = current.find(item => item.group === group) || { reportDate, group };
                return [...current.filter(item => item.group !== group), { ...existing, [key]: value }];
            });
            return (
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex justify-between items-center">
                        <div>
                            <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                                <i className="ph ph-users-three text-bluePrimary"></i>
                                <span>รายงานกลุ่มภารกิจ PHEOC จังหวัดตรัง</span>
                            </h3>
                            <p className="text-xs text-slate-500">รายงานการดำเนินงานและปัญหา/อุปสรรค พร้อมแนบไฟล์รายวันแยกตามกลุ่มลง Google Drive</p>
                        </div>
                    </div>

                    <div className="bg-white p-4 rounded-xl border flex items-center gap-3">
                        <label className="font-medium" htmlFor="pheoc-report-date">วันที่รายงาน</label>
                        <input id="pheoc-report-date" type="date" value={reportDate} onChange={e => setReportDate(e.target.value)} className="border rounded-lg p-2" />
                    </div>

                    {loadingReports && <p role="status" className="bg-slate-50 border rounded-lg p-3 text-sm">กำลังโหลดแบบฟอร์มความพร้อมจาก Google Sheets…</p>}
                    {formMessage && <p role="alert" className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm">{formMessage}</p>}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {groups.map((group, groupIndex) => {
                            const p = dailyReports.find(item => item.group === group) || { group, reportDate, actions: '', issues: '' };
                            const busy = savingGroup === group;
                            const field = (key, label, rows = 2) => <label className="block text-xs font-medium text-slate-700 space-y-1"><span>{label}</span><textarea value={p[key] || ''} disabled={loadingReports || busy} onChange={event => updateField(group, key, event.target.value)} rows={rows} maxLength={5000} className="w-full border border-slate-300 rounded-lg p-2.5 text-sm bg-white disabled:bg-slate-50" /></label>;
                            return <div key={group} className="glass-card p-5 space-y-4">
                                <div className="flex justify-between items-start gap-3">
                                    <h4 className="font-bold text-slate-800 text-base"><span className="inline-flex items-center justify-center w-7 h-7 mr-2 rounded-full bg-blue-100 text-blue-800 text-sm align-middle">{groupIndex < PHEOC_UPLOAD_GROUPS.length ? groupIndex + 1 : '•'}</span>{group}</h4>
                                    {normalizeReadiness(p?.readiness) && <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">{normalizeReadiness(p.readiness)}</span>}
                                </div>
                                {field('actions', 'การดำเนินงาน', 3)}
                                {field('issues', 'ปัญหา/อุปสรรค', 2)}
                                
                                <button type="button" disabled={loadingReports || busy} onClick={() => saveGroup(group, groupIndex)} className="rounded-lg bg-blue-700 text-white px-4 py-2 text-sm font-semibold disabled:opacity-50">{busy ? 'กำลังบันทึก…' : 'บันทึกรายงานกลุ่มภารกิจ'}</button>
                                <PheocDailyFiles key={group + reportDate} group={group} reportDate={reportDate} showToast={showToast} />
                            </div>;
                        })}
                    </div>
                </div>
            );
        }

        function PheocDailyFiles({ group, reportDate, showToast }) {
            const [files, setFiles] = useState([]), [busy, setBusy] = useState(false), [message, setMessage] = useState('กำลังโหลดไฟล์รายงาน');
            const fileInput = useRef(null), uploadIds = useRef(new WeakMap());
            const load = async () => {
                try {
                    const rows = await DB.request({ action: 'list', table: 'PHEOCFiles', reportDate });
                    setFiles(rows.filter(file => file.group === group));
                    setMessage(rows.some(file => file.group === group) ? 'ไฟล์ส่งรายงานของวันนี้' : 'ยังไม่มีไฟล์ส่งรายงานสำหรับวันนี้');
                } catch (e) {
                    setFiles([]);
                    setMessage(e.message === 'UNKNOWN_TABLE' ? 'ต้องอัปเดต Code.gs ใน Apps Script และรัน setupSystem() ก่อนใช้งาน' : e.message);
                }
            };
            useEffect(() => { setFiles([]); load(); }, [group, reportDate]);
            const upload = async () => {
                const selected = Array.from(fileInput.current?.files || []);
                if (!selected.length) { setMessage('กรุณาเลือกไฟล์รายงาน'); return; }
                if (selected.length > 5) { setMessage('เลือกได้ครั้งละไม่เกิน 5 ไฟล์'); return; }
                setBusy(true);
                try {
                    for (const original of selected) { const file = original.type.startsWith('image/') ? await optimizePhoto(original) : original;
                        if (!file.size || original.size > 12 * 1024 * 1024 || file.size > 2 * 1024 * 1024) throw new Error('ไฟล์ต้นฉบับไม่เกิน 12 MB และหลังปรับขนาดไม่เกิน 2 MB ต่อไฟล์');
                        if (!file.name || file.name.length > 180 || !['application/pdf','image/jpeg','image/png'].includes(file.type)) throw new Error('รองรับเฉพาะ PDF, JPG และ PNG');
                        if (!uploadIds.current.has(file)) uploadIds.current.set(file, 'pheoc_' + crypto.randomUUID());
                        const base64 = await new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result).split(',')[1]); reader.onerror = () => reject(new Error('อ่านไฟล์ไม่สำเร็จ')); reader.readAsDataURL(file); });
                        await DB.request({ action: 'uploadPheocFile', id: uploadIds.current.get(file), group, reportDate, fileName: file.name, mimeType: file.type, base64 });
                    }
                    if (fileInput.current) fileInput.current.value = '';
                    await load();
                    showToast('ส่งไฟล์รายงานลง Google Drive แล้ว');
                } catch (e) { setMessage('อัปโหลดไม่สำเร็จ: ' + e.message); } finally { setBusy(false); }
            };
            const download = async file => {
                setBusy(true);
                try {
                    const data = await DB.request({ action: 'getPheocFile', id: file.id });
                    const bytes = Uint8Array.from(atob(data.base64), c => c.charCodeAt(0));
                    const url = URL.createObjectURL(new Blob([bytes], { type: data.mimeType }));
                    const a = document.createElement('a'); a.href = url; a.download = data.fileName; a.click(); URL.revokeObjectURL(url);
                } catch (e) { setMessage('ดาวน์โหลดไม่สำเร็จ: ' + e.message); } finally { setBusy(false); }
            };
            return <section className="bg-blue-50 border border-blue-100 rounded-xl p-4 space-y-3">
                <p className="text-sm">ส่งได้สูงสุด 5 ไฟล์ต่อครั้ง รองรับเฉพาะ PDF, JPG และ PNG ขนาดไม่เกิน 2 MB ต่อไฟล์</p>
                <p className="text-xs text-amber-800">ระบบเปิดโดยไม่ต้องล็อกอิน ผู้เข้าถึงเว็บอาจดาวน์โหลดไฟล์ที่ส่งได้ กรุณาอย่าแนบข้อมูลผู้ป่วยหรือเอกสารลับ</p>
                <input ref={fileInput} type="file" multiple accept="application/pdf,image/jpeg,image/png,.pdf,.jpg,.jpeg,.png" disabled={busy} aria-label={'เลือกไฟล์รายงาน ' + group} className="block w-full" />
                <button type="button" disabled={busy} onClick={upload} className="bg-blue-700 text-white px-4 py-2 rounded disabled:opacity-50">{busy ? 'กำลังดำเนินการ…' : 'ส่งไฟล์รายวันเข้า Drive'}</button>
                <p role="status" className="text-sm">{message}</p>
                {files.length > 0 && <ul className="space-y-2">{files.map(file => <li key={file.id} className="bg-white rounded border p-2 flex items-center justify-between gap-3 text-sm"><span className="break-all">{file.fileName} <small className="text-slate-500">({(Number(file.sizeBytes) / 1024).toFixed(0)} KB)</small></span><button type="button" disabled={busy} onClick={() => download(file)} className="text-blue-700 underline shrink-0">ดาวน์โหลด</button></li>)}</ul>}
            </section>;
        }

        function IncidentView({ showToast }) {
            const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
            const [incidents, setIncidents] = useState([]);
            const [openForm, setOpenForm] = useState(false);
            const [busy, setBusy] = useState(false);
            const [message, setMessage] = useState('กำลังโหลดรายการเหตุการณ์');
            const [form, setForm] = useState({ reportDate: today, districtId: 'd01', type: '', severity: 'เร่งด่วน', description: '' });
            const load = async () => {
                try {
                    const rows = await DB.request({ action: 'list', table: 'Incidents' });
                    setIncidents(rows.sort((a, b) => String(b.updatedAt || b.reportDate).localeCompare(String(a.updatedAt || a.reportDate))));
                    setMessage(rows.length ? '' : 'ยังไม่มีการแจ้งเหตุ');
                } catch (error) { setMessage(`โหลดรายการไม่สำเร็จ: ${error.message}`); }
            };
            useEffect(() => { load(); }, []);
            const submit = async event => {
                event.preventDefault(); setBusy(true); setMessage('');
                try {
                    await DB.request({ action: 'upsert', table: 'Incidents', record: { ...form, status: 'รอการตรวจสอบ' } });
                    await load(); setForm({ reportDate: today, districtId: 'd01', type: '', severity: 'เร่งด่วน', description: '' }); setOpenForm(false);
                    showToast('บันทึกแจ้งเหตุเร่งด่วนแล้ว');
                } catch (error) { setMessage(`บันทึกไม่สำเร็จ: ${error.message}`); }
                finally { setBusy(false); }
            };
            const districtName = id => DISTRICTS.find(d => d.id === id)?.thai || id || 'ไม่ระบุ';
            return (
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex justify-between items-center gap-4">
                        <div>
                            <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2"><i className="ph ph-warning-octagon text-red-500"></i><span>ระบบแจ้งเหตุเร่งด่วน (Emergency Incident Reporting)</span></h3>
                            <p className="text-xs text-slate-500">บันทึกเหตุฉุกเฉิน น้ำท่วมฉับพลัน หรือภัยด้านสาธารณสุขให้ส่วนกลางติดตามได้</p>
                        </div>
                        <button type="button" onClick={() => setOpenForm(value => !value)} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 shadow shrink-0"><i className="ph ph-plus-circle text-base"></i><span>{openForm ? 'ปิดแบบฟอร์ม' : 'แจ้งเหตุเร่งด่วนใหม่'}</span></button>
                    </div>
                    {openForm && <form onSubmit={submit} className="bg-white p-6 rounded-2xl border border-red-200 shadow-sm space-y-4">
                        <h4 className="font-bold text-slate-800">รายละเอียดเหตุการณ์</h4>
                        <div className="grid md:grid-cols-3 gap-4">
                            <label className="text-sm space-y-1"><span>วันที่เกิดเหตุ</span><input required type="date" value={form.reportDate} onChange={e => setForm({...form, reportDate:e.target.value})} className="w-full border rounded-lg p-2" /></label>
                            <label className="text-sm space-y-1"><span>อำเภอ</span><select value={form.districtId} onChange={e => setForm({...form, districtId:e.target.value})} className="w-full border rounded-lg p-2">{DISTRICTS.map(d=><option key={d.id} value={d.id}>{d.thai}</option>)}</select></label>
                            <label className="text-sm space-y-1"><span>ระดับเหตุ</span><select value={form.severity} onChange={e => setForm({...form, severity:e.target.value})} className="w-full border rounded-lg p-2"><option>เร่งด่วน</option><option>วิกฤต</option><option>เฝ้าระวัง</option></select></label>
                        </div>
                        <label className="block text-sm space-y-1"><span>ประเภทเหตุการณ์</span><input required maxLength={200} value={form.type} onChange={e => setForm({...form, type:e.target.value})} placeholder="เช่น น้ำป่าไหลหลาก / หน่วยบริการได้รับผลกระทบ" className="w-full border rounded-lg p-2" /></label>
                        <label className="block text-sm space-y-1"><span>รายละเอียดและความช่วยเหลือเร่งด่วนที่ต้องการ</span><textarea required maxLength={5000} value={form.description} onChange={e => setForm({...form, description:e.target.value})} rows={3} className="w-full border rounded-lg p-2" /></label>
                        <div className="flex items-center gap-3"><button disabled={busy} className="bg-red-600 text-white px-4 py-2 rounded-lg disabled:opacity-50">{busy ? 'กำลังบันทึก…' : 'บันทึกแจ้งเหตุ'}</button><button type="button" disabled={busy} onClick={() => setOpenForm(false)} className="border px-4 py-2 rounded-lg">ยกเลิก</button><span role="status" className="text-sm text-red-700">{message}</span></div>
                    </form>}
                    <div className="glass-card p-6 overflow-x-auto">
                        <table className="w-full text-left text-xs"><thead><tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200"><th className="p-3">วันที่</th><th className="p-3">อำเภอ / พื้นที่</th><th className="p-3">ประเภทเหตุการณ์</th><th className="p-3">ระดับ</th><th className="p-3">รายละเอียด</th><th className="p-3">สถานะ</th></tr></thead>
                            <tbody className="divide-y divide-slate-100">{incidents.map((inc, index) => <tr key={inc.id || index} className="hover:bg-slate-50"><td className="p-3 text-slate-500">{inc.reportDate}</td><td className="p-3 font-medium">{districtName(inc.districtId)}</td><td className="p-3">{inc.type}</td><td className="p-3"><span className="text-red-700 font-semibold">{inc.severity}</span></td><td className="p-3 whitespace-pre-wrap">{inc.description}</td><td className="p-3">{inc.status}</td></tr>)}</tbody>
                        </table>
                        <p role="status" className="text-sm text-slate-500 mt-3">{message}</p>
                    </div>
                </div>
            );
        }

        function SupportView({ showToast }) {
            const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
            const [requests, setRequests] = useState([]);
            const [openForm, setOpenForm] = useState(false);
            const [busy, setBusy] = useState(false);
            const [message, setMessage] = useState('กำลังโหลดคำขอสนับสนุน');
            const [form, setForm] = useState({ reportDate: today, districtId: 'd01', item: '', quantity: '', unit: 'รายการ', reason: '' });
            const load = async () => {
                try {
                    const rows = await DB.request({ action: 'list', table: 'SupportRequests' });
                    setRequests(rows.sort((a, b) => String(b.updatedAt || b.reportDate).localeCompare(String(a.updatedAt || a.reportDate))));
                    setMessage(rows.length ? '' : 'ยังไม่มีคำขอสนับสนุน');
                } catch (error) { setMessage(`โหลดรายการไม่สำเร็จ: ${error.message}`); }
            };
            useEffect(() => { load(); }, []);
            const submit = async event => {
                event.preventDefault(); setBusy(true); setMessage('');
                try {
                    await DB.request({ action: 'upsert', table: 'SupportRequests', record: { ...form, quantity: Number(form.quantity), status: 'รอการพิจารณา' } });
                    await load(); setForm({ reportDate: today, districtId: 'd01', item: '', quantity: '', unit: 'รายการ', reason: '' }); setOpenForm(false);
                    showToast('บันทึกคำขอสนับสนุนแล้ว');
                } catch (error) { setMessage(`บันทึกไม่สำเร็จ: ${error.message}`); }
                finally { setBusy(false); }
            };
            const districtName = id => DISTRICTS.find(d => d.id === id)?.thai || id || 'ไม่ระบุ';
            return (
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex justify-between items-center gap-4">
                        <div><h3 className="font-bold text-slate-800 text-lg flex items-center gap-2"><i className="ph ph-hand-fist text-bluePrimary"></i><span>ระบบคำขอสนับสนุนเวชภัณฑ์และทรัพยากร (Support Requests)</span></h3><p className="text-xs text-slate-500">บันทึกและติดตามคำขอยา เวชภัณฑ์ อุปกรณ์ และกำลังสนับสนุนจากแต่ละอำเภอ</p></div>
                        <button type="button" onClick={() => setOpenForm(value => !value)} className="bg-bluePrimary hover:bg-blue-600 text-white px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 shadow shrink-0"><i className="ph ph-plus-circle text-base"></i><span>{openForm ? 'ปิดแบบฟอร์ม' : 'สร้างคำขอสนับสนุน'}</span></button>
                    </div>
                    {openForm && <form onSubmit={submit} className="bg-white p-6 rounded-2xl border border-blue-200 shadow-sm space-y-4">
                        <h4 className="font-bold text-slate-800">รายละเอียดคำขอ</h4>
                        <div className="grid md:grid-cols-3 gap-4">
                            <label className="text-sm space-y-1"><span>วันที่ขอ</span><input required type="date" value={form.reportDate} onChange={e => setForm({...form, reportDate:e.target.value})} className="w-full border rounded-lg p-2" /></label>
                            <label className="text-sm space-y-1"><span>อำเภอ</span><select value={form.districtId} onChange={e => setForm({...form, districtId:e.target.value})} className="w-full border rounded-lg p-2">{DISTRICTS.map(d=><option key={d.id} value={d.id}>{d.thai}</option>)}</select></label>
                            <label className="text-sm space-y-1"><span>จำนวน</span><input required type="number" min="0.01" step="any" value={form.quantity} onChange={e => setForm({...form, quantity:e.target.value})} className="w-full border rounded-lg p-2" /></label>
                        </div>
                        <div className="grid md:grid-cols-2 gap-4"><label className="text-sm space-y-1"><span>รายการที่ต้องการ</span><input required maxLength={200} value={form.item} onChange={e => setForm({...form, item:e.target.value})} placeholder="เช่น ชุดยาสามัญ / เรือท้องแบน" className="w-full border rounded-lg p-2" /></label><label className="text-sm space-y-1"><span>หน่วย</span><input required maxLength={50} value={form.unit} onChange={e => setForm({...form, unit:e.target.value})} className="w-full border rounded-lg p-2" /></label></div>
                        <label className="block text-sm space-y-1"><span>เหตุผล / พื้นที่ใช้งาน</span><textarea required maxLength={3000} value={form.reason} onChange={e => setForm({...form, reason:e.target.value})} rows={3} className="w-full border rounded-lg p-2" /></label>
                        <div className="flex items-center gap-3"><button disabled={busy} className="bg-bluePrimary text-white px-4 py-2 rounded-lg disabled:opacity-50">{busy ? 'กำลังบันทึก…' : 'ส่งคำขอ'}</button><button type="button" disabled={busy} onClick={() => setOpenForm(false)} className="border px-4 py-2 rounded-lg">ยกเลิก</button><span role="status" className="text-sm text-blue-700">{message}</span></div>
                    </form>}
                    <div className="glass-card p-6 overflow-x-auto"><table className="w-full text-left text-xs"><thead><tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200"><th className="p-3">วันที่</th><th className="p-3">อำเภอ</th><th className="p-3">รายการ</th><th className="p-3">จำนวน</th><th className="p-3">เหตุผล / พื้นที่ใช้งาน</th><th className="p-3">สถานะ</th></tr></thead><tbody className="divide-y divide-slate-100">{requests.map((request, index)=><tr key={request.id || index} className="hover:bg-slate-50"><td className="p-3">{request.reportDate}</td><td className="p-3 font-medium">{districtName(request.districtId)}</td><td className="p-3">{request.item}</td><td className="p-3">{request.quantity} {request.unit}</td><td className="p-3 whitespace-pre-wrap">{request.reason}</td><td className="p-3">{request.status}</td></tr>)}</tbody></table><p role="status" className="text-sm text-slate-500 mt-3">{message}</p></div>
                </div>
            );
        }

        function AutomationView({ showToast }) {
            return (
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                        <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                            <i className="ph ph-gear-six text-bluePrimary"></i>
                            <span>ศูนย์ Automation และงานเบื้องหลังฝั่ง Server (Scheduler & Job Queue)</span>
                        </h3>
                        <p className="text-xs text-slate-500 mt-1">ระบบทำงานอัตโนมัติประจำวัน (Asia/Bangkok) ส่งแจ้งเตือน LINE และเตรียมรายงานทางการ</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="glass-card p-6 space-y-4">
                            <h4 className="font-bold text-slate-800">รอบเวลาทำงานอัตโนมัติ (Automation Schedule)</h4>
                            <div className="space-y-3 text-xs">
                                <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-200">
                                    <div>
                                        <p className="font-bold text-slate-800">15.30 น.</p>
                                        <p className="text-slate-500">เตรียมร่างรายงานและแจ้งเตือนอำเภอ</p>
                                    </div>
                                    <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 font-bold">Active</span>
                                </div>
                                <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-200">
                                    <div>
                                        <p className="font-bold text-slate-800">18.00 น.</p>
                                        <p className="text-slate-500">เผยแพร่รายงานรอบเย็นอย่างเป็นทางการ</p>
                                    </div>
                                    <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 font-bold">Active</span>
                                </div>
                                <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-200">
                                    <div>
                                        <p className="font-bold text-slate-800">08.30 น.</p>
                                        <p className="text-slate-500">เผยแพร่สรุปจังหวัดรอบเช้า</p>
                                    </div>
                                    <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 font-bold">Active</span>
                                </div>
                            </div>
                        </div>

                        <div className="glass-card p-6 space-y-4">
                            <h4 className="font-bold text-slate-800">สถานะการเชื่อมต่อ LINE Messaging API & งานค้าง</h4>
                            <div className="space-y-3 text-xs">
                                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex justify-between items-center">
                                    <div>
                                        <p className="font-bold text-emerald-900">กลุ่ม LINE: SAT อุทกภัย สสจ.ตรัง</p>
                                        <p className="text-emerald-700">เชื่อมต่อสำเร็จ | ส่งข้อความอัตโนมัติล่าสุดเมื่อ 16.30 น.</p>
                                    </div>
                                    <i className="ph-fill ph-check-circle text-emerald-600 text-xl"></i>
                                </div>
                                <div className="p-3 bg-blue-50 rounded-xl border border-blue-200 flex justify-between items-center">
                                    <div>
                                        <p className="font-bold text-blue-900">กลุ่ม LINE: PHEOC อุทกภัย สสจ.ตรัง</p>
                                        <p className="text-blue-700">เชื่อมต่อสำเร็จ | สมาชิก 34 คน</p>
                                    </div>
                                    <i className="ph-fill ph-check-circle text-blue-600 text-xl"></i>
                                </div>
                            </div>
                            <button onClick={() => showToast("จำลองการทดสอบรัน Cron Job สำเร็จ!")} className="w-full bg-bluePrimary hover:bg-blue-600 text-white py-2.5 rounded-xl text-xs font-medium transition shadow">
                                ทดสอบรัน Automation งานรอบปัจจุบันทันที
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        ReactDOM.render(<App />, document.getElementById('root'));
    
