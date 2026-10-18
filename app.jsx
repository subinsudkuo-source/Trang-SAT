
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

        
const DB = {
 async request(input) {
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
 try{for(const file of files){
 if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>2*1024*1024||!file.size)throw new Error('รองรับ JPG / PNG / WEBP ขนาดไม่เกิน 2 MB ต่อภาพ');
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
                                    <p className="text-xs text-slate-300">สำนักงานสาธารณสุขจังหวัดตรัง | geoBoundaries ADM2 & TMD Integrated</p>
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
                                { id: 'pheoc', label: 'กลุ่มภารกิจ PHEOC', icon: 'ph-users-three' },
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
                        {activeTab === 'dashboard' && <DashboardView districts={DISTRICTS} reports={districtReports} />}
                        {activeTab === 'district' && <DistrictReportView districts={DISTRICTS} reports={districtReports} setReports={setDistrictReports} showToast={showToast} />}
                        {activeTab === 'pheoc' && <PheocView reports={pheocReports} setReports={setPheocReports} showToast={showToast} />}
                        {activeTab === 'incident' && <IncidentView showToast={showToast} />}
                        {activeTab === 'support' && <SupportView showToast={showToast} />}
                        {activeTab === 'automation' && <AutomationView showToast={showToast} />}
                    </main>

                    {/* Footer */}
                    <footer className="bg-white border-t border-slate-200 py-4 mt-8">
                        <p className="max-w-7xl mx-auto px-4 pb-3 text-sm text-slate-500">รายงานอำเภอและ PHEOC ดึงจากข้อมูลที่บันทึกในระบบ • Gemini Flash ต้องตั้งค่า GEMINI_API_KEY ใน Vercel • LINE, SMS และ Automation ยังเป็นต้นแบบ</p>
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
            const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' });
            const reportDate = districtReports.find(r => r.reportDate)?.reportDate || today;
            const reportDateLabel = new Date(reportDate + 'T00:00:00+07:00').toLocaleDateString('th-TH', { timeZone: 'Asia/Bangkok', dateStyle: 'long' });
            const byId = new Map((districtReports || []).map(r => [r.districtId, r]));
            const daily = districts.map(d => byId.get(d.id) || { districtId:d.id, districtName:d.thai, submitted:false, status:'ยังไม่ส่ง', rain:'', waterLevel:'', trend:'', notes:'' });
            const submitted = daily.filter(r => r.submitted);
            const risk = submitted.filter(r => ['เสี่ยงสูง','วิกฤต'].some(x => String(r.status||'').includes(x)));
            const watch = submitted.filter(r => String(r.status||'').includes('เฝ้าระวัง'));
            const pheoc = Array.isArray(pheocReports) ? pheocReports : [];
            const totals = submitted.reduce((s,r) => { const t=getAffectedPopulationTotals(r); s.affected+=t.affected; s.deaths+=t.deaths; s.injuries+=t.injuries; return s; }, {affected:0,deaths:0,injuries:0});
            const impactSources = submitted.filter(r => getAffectedPopulationTotals(r).affectedReported).length;
            const deathSources = submitted.filter(r => getAffectedPopulationTotals(r).deathsReported).length;
            const injurySources = submitted.filter(r => getAffectedPopulationTotals(r).injuriesReported).length;
            const fmt = n => Number(n||0).toLocaleString('th-TH');
            const localSummary = () => {
                const missing=daily.filter(r=>!r.submitted).map(r=>r.districtName);
                const ptext=pheoc.length ? pheoc.map(p=>'• '+p.group+': ความพร้อม '+(p.readiness||'ไม่ระบุ')+'; ดำเนินงาน '+(p.actions||'ไม่ระบุ')+'; ปัญหา '+(p.issues||'ไม่ระบุ')+'; แผนถัดไป '+(p.nextPlan||'ไม่ระบุ')).join('\n') : 'ยังไม่มีรายงานกลุ่มภารกิจ PHEOC';
                return 'สรุปสถานการณ์จังหวัดตรังประจำวันที่ '+reportDateLabel+'\n\nรับรายงาน '+submitted.length+' จาก '+districts.length+' อำเภอ. '+(risk.length?'พื้นที่เสี่ยงสูง/วิกฤต: '+risk.map(r=>r.districtName).join(', ')+'.':'ยังไม่มีอำเภอที่ระบุสถานะเสี่ยงสูงหรือวิกฤตในรายงานที่ส่ง.')+' '+(watch.length?'พื้นที่เฝ้าระวัง: '+watch.map(r=>r.districtName).join(', ')+'.':'ไม่มีอำเภอที่ระบุสถานะเฝ้าระวังในรายงานที่ส่ง.')+'\n\nยอดรวมจากช่องที่มีการกรอก: ประชาชนได้รับผลกระทบ '+(impactSources?fmt(totals.affected)+' คน':'ยังไม่มีข้อมูล')+', เสียชีวิต '+(deathSources?fmt(totals.deaths)+' ราย':'ยังไม่มีข้อมูล')+', บาดเจ็บ '+(injurySources?fmt(totals.injuries)+' ราย':'ยังไม่มีข้อมูล')+'.\n\nรายงาน PHEOC ('+pheoc.length+' กลุ่ม):\n'+ptext+'\n\n'+(missing.length?'ติดตามรายงานที่ยังขาด: '+missing.join(', ')+'.':'ได้รับรายงานครบทุกอำเภอ.');
            };
            const [aiSummary,setAiSummary]=useState('');
            useEffect(()=>{setAiSummary(localSummary());},[reportDate,districtReports,pheocReports]);
            const generate=async()=>{
                setIsAiLoading(true);
                const payload={reportDate,districts:daily.map(r=>{const t=getAffectedPopulationTotals(r);return {districtName:r.districtName,submitted:!!r.submitted,status:r.status||'',rain:r.rain??'',waterLevel:r.waterLevel||'',trend:r.trend||'',notes:r.notes||'',summary:r.floodReport?.summary||'',affected:t.affected,deaths:t.deaths,injuries:t.injuries};}),pheoc:pheoc.map(p=>({group:p.group,readiness:p.readiness,personnel:p.personnel,actions:p.actions,issues:p.issues,nextPlan:p.nextPlan}))};
                const prompt='สังเคราะห์ข้อมูล JSON นี้เป็นรายงานภาษาไทยทางการสำหรับผู้บริหาร ระบุวันที่ จำนวนอำเภอส่ง/ขาด พื้นที่เสี่ยงและเฝ้าระวัง ยอดผลกระทบ/เสียชีวิต/บาดเจ็บ และงาน/ปัญหา/แผนของทุกกลุ่ม PHEOC พร้อมข้อเสนอแนะ ห้ามแต่งข้อมูล และบอกเมื่อข้อมูลขาด:\n'+JSON.stringify(payload);
                const result=await callGeminiAI(prompt);
                if(result){setAiSummary(result);showToast('Gemini Flash สรุปข้อมูลรายวันสำเร็จ');}
                else{setAiSummary(localSummary()+'\n\nหมายเหตุ: ยังไม่ได้ตั้งค่า GEMINI_API_KEY ใน Vercel จึงแสดงสรุปจากข้อมูลจริงอัตโนมัติ');showToast('ยังไม่ได้ตั้งค่า Gemini; แสดงสรุปข้อมูลจริงแทน');}
                setIsAiLoading(false);
            };
            return <div id="provincial-report" className="space-y-6">
                <header className="bg-gradient-to-r from-navy to-bluePrimary text-white p-6 rounded-2xl shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4"><div><p className="text-cyan-300 text-xs mb-1">รายงานจังหวัดตรัง • รายงานอำเภอและ PHEOC</p><h2 className="text-2xl font-bold">สรุปสถานการณ์อุทกภัยและรายงานประจำวัน</h2><p className="text-slate-200 text-xs mt-1">ประจำวันที่ {reportDateLabel} | ข้อมูลที่บันทึกในระบบ</p></div><button type="button" onClick={()=>window.print()} className="no-print bg-white/10 border border-white/20 px-4 py-2 rounded-xl text-xs"><i className="ph ph-printer mr-2"></i>พิมพ์ / บันทึกเป็น PDF</button></header>
                <section className="glass-card p-6 border-l-4 border-l-bluePrimary"><div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-3"><h3 className="font-bold text-slate-800">วิเคราะห์และสังเคราะห์สถานการณ์ประจำวันโดย AI (Gemini Flash) จากรายงานอำเภอและ PHEOC</h3><button type="button" onClick={generate} disabled={isAiLoading} className="no-print bg-bluePrimary text-white px-3.5 py-1.5 rounded-lg text-xs disabled:opacity-50">{isAiLoading?'กำลังสรุป...':'ให้ AI สรุปข้อมูลวันนี้'}</button></div><p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line bg-white p-4 rounded-xl border">{aiSummary||localSummary()}</p></section>
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">{[['อำเภอส่งรายงาน',submitted.length+' / '+districts.length],['เสี่ยงสูง / วิกฤต',risk.length+' อำเภอ'],['เฝ้าระวัง',watch.length+' อำเภอ'],['ได้รับผลกระทบ',impactSources?fmt(totals.affected)+' คน':'ยังไม่มีข้อมูล'],['เสียชีวิต / บาดเจ็บ',(deathSources?fmt(totals.deaths):'—')+' / '+(injurySources?fmt(totals.injuries):'—')+' ราย']].map(([l,v])=><div key={l} className="glass-card p-4 text-center"><p className="text-xs text-slate-500">{l}</p><p className="text-xl font-bold mt-1 text-blue-700">{v}</p></div>)}</div>
                <section className="glass-card p-5 space-y-3"><div className="flex justify-between"><h3 className="font-bold">สถานการณ์รายอำเภอ (ครบทั้ง {districts.length} อำเภอ)</h3><button type="button" onClick={()=>setActiveTab('district')} className="no-print text-xs text-bluePrimary">เปิดรายงานอำเภอ</button></div><p className="text-xs text-slate-500">ยอดสะสมรวมเฉพาะช่องที่กรอก; ช่องว่างหมายถึงไม่มีข้อมูล ไม่ใช่ยอดศูนย์</p><div className="overflow-x-auto"><table className="w-full text-left text-xs min-w-[760px]"><thead><tr className="bg-slate-100"><th className="p-2">อำเภอ</th><th className="p-2">สถานะ</th><th className="p-2">ฝน</th><th className="p-2">ระดับน้ำ / แนวโน้ม</th><th className="p-2">ผลกระทบ</th><th className="p-2">เสียชีวิต / บาดเจ็บ</th><th className="p-2">รายละเอียด</th></tr></thead><tbody className="divide-y">{daily.map(r=>{const t=getAffectedPopulationTotals(r);return <tr key={r.districtId} className="align-top"><td className="p-2 font-semibold">{r.districtName}</td><td className="p-2">{r.submitted?(r.status||'ส่งแล้ว'):'ยังไม่ส่ง'}</td><td className="p-2">{r.rain===''||r.rain==null?'—':r.rain+' มม.'}</td><td className="p-2">{[r.waterLevel,r.trend].filter(Boolean).join(' • ')||'—'}</td><td className="p-2">{t.affectedReported?fmt(t.affected)+' คน':'—'}</td><td className="p-2">{t.deathsReported?fmt(t.deaths):'—'} / {t.injuriesReported?fmt(t.injuries):'—'}</td><td className="p-2 whitespace-pre-line">{r.submitted?(r.notes||r.floodReport?.summary||'ส่งรายงานแล้ว (ไม่มีบันทึกเพิ่มเติม)'):'รอข้อมูลจาก สสอ.'}</td></tr>;})}</tbody></table></div></section>
                <section className="glass-card p-6 space-y-4"><h3 className="font-bold">สรุปการดำเนินงานกลุ่มภารกิจ PHEOC จังหวัดประจำวัน</h3>{pheoc.length?<div className="grid grid-cols-1 md:grid-cols-2 gap-4">{pheoc.map((p,i)=><article key={p.id||p.group||i} className="bg-slate-50 p-4 rounded-xl border space-y-2 break-inside-avoid"><div className="flex justify-between"><h4 className="font-bold text-sm">{p.group||'กลุ่มภารกิจ'}</h4><span className="text-xs">{p.readiness||'ความพร้อมไม่ระบุ'}</span></div><p className="text-xs"><b>บุคลากร:</b> {p.personnel||'ไม่ระบุ'}</p><p className="text-xs"><b>ดำเนินงาน:</b> {p.actions||'ไม่ระบุ'}</p><p className="text-xs"><b>ปัญหา/อุปสรรค:</b> {p.issues||'ไม่ระบุ'}</p><p className="text-xs"><b>แผนถัดไป:</b> {p.nextPlan||'ไม่ระบุ'}</p></article>)}</div>:<p className="text-sm bg-amber-50 p-3">วันนี้ยังไม่มีรายงานกลุ่มภารกิจ PHEOC ในฐานข้อมูล</p>}</section>
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
                DB.request({action:'getPhoto', id:current.id}).then(data => {
                    if (active) setImage({id:current.id, src:'data:'+data.mimeType+';base64,'+data.base64});
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
                DB.request({action, id:current.id}).then(data => {
                    if (active) setImage({id:current.id, src:'data:'+data.mimeType+';base64,'+data.base64});
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
            const totals = rows.reduce((totals, row) => {
                const count = Number(row.count);
                if (!Number.isFinite(count) || count <= 0) return totals;
                if (String(row.type || '').includes('เสียชีวิต')) totals.deaths += count;
                else if (String(row.type || '').includes('บาดเจ็บ')) totals.injuries += count;
                return totals;
            }, { deaths: 0, injuries: 0 });
            totals.deathsReported = rows.some(row => String(row.type || '').includes('เสียชีวิต') && hasValue(row.count));
            totals.injuriesReported = rows.some(row => String(row.type || '').includes('บาดเจ็บ') && hasValue(row.count));
            const areaRows = report?.floodReport?.areas || [];
            totals.affectedReported = areaRows.some(row => hasValue(row.people));
            totals.affected = areaRows.reduce((sum, row) => {
                const count = Number(row.people);
                return Number.isFinite(count) && count > 0 ? sum + count : sum;
            }, 0);
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

            useEffect(() => {
                let active = true;
                const loadCasualtyReports = async () => {
                    try {
                        const rows = await DB.request({action:'list', table:'DailyReports'});
                        if (!active) return;
                        const latestByDistrict = new Map();
                        rows.filter(row => row?.districtId && (
                            (Array.isArray(row?.floodReport?.population) && row.floodReport.population.some(item =>
                                (String(item.type || '').includes('เสียชีวิต') || String(item.type || '').includes('บาดเจ็บ')) && item.count !== '' && item.count != null
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
                                                    const report = casualtyReports.find(r => r.districtId === districtId) || districtReports.find(r => r.districtId === districtId);
                                                    const { deaths, injuries, affected } = getAffectedPopulationTotals(report);
                                                    const hasPopulationData = deaths > 0 || injuries > 0 || affected > 0;
                                                    return (
                                                        <g key={'l-' + districtId} textAnchor="middle">
                                                            <text x={x} y={y} className="map-label" dominantBaseline="middle" fontSize="14" fontWeight="700" fill="#17324d" paintOrder="stroke" stroke="#ffffff" strokeWidth="3" strokeLinejoin="round">
                                                                {thaiName}
                                                            </text>
                                                            {hasPopulationData && <g aria-label={`อำเภอ${thaiName} เสียชีวิต ${deaths} ราย บาดเจ็บ ${injuries} ราย ประสบภัย ${affected} คน`}>
                                                                <title>{`อำเภอ${thaiName} • เสียชีวิต ${deaths.toLocaleString('th-TH')} ราย • บาดเจ็บ ${injuries.toLocaleString('th-TH')} ราย • ประชาชนประสบภัย ${affected.toLocaleString('th-TH')} คน (ยอดสะสม)`}</title>
                                                                <text x={x - 35} y={y + 27} fontSize="10" fontWeight="800" fill="#7f1d1d" stroke="#ffffff" strokeWidth="2.5" strokeLinejoin="round" paintOrder="stroke">🪦 {deaths.toLocaleString('th-TH')}</text>
                                                                <text x={x} y={y + 27} fontSize="10" fontWeight="800" fill="#1e3a8a" stroke="#ffffff" strokeWidth="2.5" strokeLinejoin="round" paintOrder="stroke">🩹 {injuries.toLocaleString('th-TH')}</text>
                                                                <text x={x + 38} y={y + 27} fontSize="10" fontWeight="800" fill="#14532d" stroke="#ffffff" strokeWidth="2.5" strokeLinejoin="round" paintOrder="stroke">👥 {affected.toLocaleString('th-TH')}</text>
                                                            </g>}
                                                        </g>
                                                    );
                                                })}
                                            </g>
                                        </svg>
                                    </div>
                                    <p className="text-sm text-slate-600">แผนที่แสดงขอบเขตการปกครอง สีใช้แยกอำเภอ ไม่ใช่พื้นที่น้ำท่วมหรือระดับความเสี่ยง • เมื่อมีข้อมูล จะแสดง 🪦 ผู้เสียชีวิต 🩹 ผู้บาดเจ็บ และ 👥 ประชาชนประสบภัย (ยอดสะสม) ใต้ชื่ออำเภอ</p>
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

                            <div className="bg-[#EDF4F8] p-4 rounded-xl border border-slate-200 space-y-2 mt-4">
                                <h4 className="font-bold text-slate-800 text-sm">
                                    {selectedDistObj ? `อำเภอ${selectedDistObj.thai} (${selectedDistObj.english})` : 'จังหวัดตรัง'}
                                </h4>
                                {selectedDistObj && (
                                    <div className="space-y-1 text-xs text-slate-600">
                                        <p><strong>สถานะ:</strong> <span className={`font-bold ${selectedDistObj.status === 'เสี่ยงสูง' ? 'text-red-600' : selectedDistObj.status === 'เฝ้าระวัง' ? 'text-amber-600' : 'text-emerald-600'}`}>{selectedDistObj.status}</span></p>
                                        <p><strong>ฝนสะสม:</strong> {selectedDistObj.rain} มม.</p>
                                        <p><strong>ระดับน้ำ:</strong> {selectedDistObj.water}</p>
                                        <p><strong>แนวโน้ม:</strong> {selectedDistObj.trend}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        function DashboardView({ districts, reports }) {
            const highRiskCount = reports.filter(r => r.status === 'เสี่ยงสูง').length;
            const warningCount = reports.filter(r => r.status === 'เฝ้าระวัง').length;
            const submittedCount = reports.filter(r => r.submitted).length;

            return (
                <div className="space-y-6">
                    <div className="bg-gradient-to-r from-navy via-slate-800 to-bluePrimary text-white p-6 rounded-2xl shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <span className="bg-blue-500/30 text-cyan-300 text-xs px-3 py-1 rounded-full font-semibold border border-blue-400/30">
                                ศูนย์ปฏิบัติการฉุกเฉินด้านการแพทย์และสาธารณสุข (PHEOC) จ.ตรัง
                            </span>
                            <h2 className="text-2xl md:text-3xl font-bold mt-2">Dashboard ภาพรวมอุทกภัยจังหวัดตรัง</h2>
                            <p className="text-slate-300 text-xs md:text-sm mt-1">ติดตามสถานการณ์น้ำท่วม ข้อมูลกรมอุตุฯ (TMD) และความพร้อมของ 10 อำเภอแบบเรียลไทม์</p>
                        </div>
                        <div className="text-right hidden sm:block">
                            <p className="text-xs text-slate-300">อัปเดตข้อมูลล่าสุด</p>
                            <p className="text-sm font-bold text-cyan-300">{getCurrentBKKTime()}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="glass-card p-5 border-l-4 border-l-emerald-500 flex items-center justify-between">
                            <div>
                                <p className="text-xs text-slate-500 font-medium">อำเภอส่งรายงานแล้ว</p>
                                <h3 className="text-2xl font-bold text-slate-800 mt-1">{submittedCount} <span className="text-xs font-normal text-slate-400">/ 10</span></h3>
                                <p className="text-[11px] text-emerald-600 font-medium mt-1">✓ ครบตามรอบกำหนด</p>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-2xl">
                                <i className="ph ph-check-square-offset"></i>
                            </div>
                        </div>

                        <div className="glass-card p-5 border-l-4 border-l-red-500 flex items-center justify-between">
                            <div>
                                <p className="text-xs text-slate-500 font-medium">พื้นที่เสี่ยงสูง / วิกฤต</p>
                                <h3 className="text-2xl font-bold text-red-600 mt-1">{highRiskCount} <span className="text-xs font-normal text-slate-400">อำเภอ</span></h3>
                                <p className="text-[11px] text-red-500 font-medium mt-1">⚠️ อำเภอนาโยง</p>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center text-2xl">
                                <i className="ph ph-warning-circle"></i>
                            </div>
                        </div>

                        <div className="glass-card p-5 border-l-4 border-l-amber-500 flex items-center justify-between">
                            <div>
                                <p className="text-xs text-slate-500 font-medium">พื้นที่เฝ้าระวัง</p>
                                <h3 className="text-2xl font-bold text-amber-600 mt-1">{warningCount} <span className="text-xs font-normal text-slate-400">อำเภอ</span></h3>
                                <p className="text-[11px] text-amber-500 font-medium mt-1">⚡ เมืองตรัง, ห้วยยอด</p>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-2xl">
                                <i className="ph ph-cloud-rain"></i>
                            </div>
                        </div>

                        <div className="glass-card p-5 border-l-4 border-l-bluePrimary flex items-center justify-between">
                            <div>
                                <p className="text-xs text-slate-500 font-medium">หน่วยบริการเสี่ยง</p>
                                <h3 className="text-2xl font-bold text-blue-600 mt-1">2 <span className="text-xs font-normal text-slate-400">แห่ง</span></h3>
                                <p className="text-[11px] text-blue-500 font-medium mt-1">🛡️ เตรียมกระสอบทรายแล้ว</p>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-blue-50 text-bluePrimary flex items-center justify-center text-2xl">
                                <i className="ph ph-hospital"></i>
                            </div>
                        </div>
                    </div>

                    <div className="glass-card p-6 bg-gradient-to-r from-blueLight/60 to-white">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-bluePrimary text-white flex items-center justify-center text-xl shadow">
                                    <i className="ph ph-cloud-sun"></i>
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800">ข้อมูลกรมอุตุนิยมวิทยา (TMD) — จังหวัดตรัง</h3>
                                    <p className="text-xs text-slate-500">เชื่อมต่ออัตโนมัติผ่าน API กรมอุตุนิยมวิทยา (อัปเดตทุก 1 ชั่วโมง)</p>
                                </div>
                            </div>
                            <span className="bg-emerald-100 text-emerald-800 text-xs px-3 py-1 rounded-full font-semibold flex items-center gap-1">
                                <i className="ph-fill ph-check-circle"></i> เชื่อมต่อสำเร็จ (Live API)
                            </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                <p className="text-xs text-slate-500">สภาพอากาศภาพรวม</p>
                                <p className="text-lg font-bold text-slate-800 mt-1">มีฝนฟ้าคะนอง 60% ของพื้นที่</p>
                                <p className="text-[11px] text-slate-400 mt-1">ลมมรสุมตะวันตกเฉียงใต้กำลังแรง</p>
                            </div>
                            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                <p className="text-xs text-slate-500">ปริมาณฝนสะสม 24 ชม.</p>
                                <p className="text-lg font-bold text-blue-600 mt-1">68.0 มม. (อ.นาโยง)</p>
                                <p className="text-[11px] text-slate-400 mt-1">เกินเกณฑ์เฝ้าระวัง 50 มม.</p>
                            </div>
                            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                <p className="text-xs text-slate-500">ระดับน้ำแม่น้ำตรัง (สถานี X.74)</p>
                                <p className="text-lg font-bold text-amber-600 mt-1">3.45 เมตร (วิกฤต)</p>
                                <p className="text-[11px] text-amber-600 mt-1">แนวโน้ม: เพิ่มขึ้นต่อเนื่อง</p>
                            </div>
                            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                <p className="text-xs text-slate-500">คำเตือนภัยธรรมชาติ</p>
                                <p className="text-lg font-bold text-red-600 mt-1">ประกาศฉบับที่ 3/2569</p>
                                <p className="text-[11px] text-red-500 mt-1">ระวังน้ำป่าไหลหลาก 13-15 ต.ค.</p>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

const FLOOD_REPORT_PREFIX = 'TRANG_SAT_FLOOD_V1:';
function unpackFloodReport(record) {
 if(!record || typeof record.notes!=='string' || !record.notes.startsWith(FLOOD_REPORT_PREFIX))return record;
 try{const payload=JSON.parse(record.notes.slice(FLOOD_REPORT_PREFIX.length));return {...record,notes:payload.summary||'',floodReport:payload};}catch{return record;}
}
const floodColumn=(key,label,type='text')=>({key,label,type});
const FLOOD_TABLES={
 areas:[floodColumn('tambon','ตำบล'),floodColumn('villages','หมู่บ้าน','number'),floodColumn('households','ครัวเรือน','number'),floodColumn('people','ประชาชนที่ได้รับผลกระทบ (คน)','number'),floodColumn('notes','หมายเหตุ')],
 staff:[floodColumn('type','การเสียชีวิต / บาดเจ็บ'),floodColumn('count','รวม (ราย)','number'),floodColumn('detail','รายละเอียด'),floodColumn('families','ครอบครัวได้รับผลกระทบ','number'),floodColumn('homes','บ้านได้รับผลกระทบ (หลัง)','number')],
 population:[floodColumn('type','การเสียชีวิต / บาดเจ็บ'),floodColumn('count','รวม (ราย)','number'),floodColumn('detail','รายละเอียด'),floodColumn('ems','การส่งผู้ป่วยผ่านระบบ EMS')],
 partial:[floodColumn('facility','สถานบริการ'),floodColumn('damage','ประมาณการความเสียหาย (บาท)','number'),floodColumn('detail','รายละเอียด')],
 closed:[floodColumn('facility','สถานบริการ'),floodColumn('damage','ประมาณการความเสียหาย (บาท)','number'),floodColumn('detail','รายละเอียด')],
 recovery:[floodColumn('facility','สถานบริการ'),floodColumn('detail','รายละเอียดการดำเนินการ'),floodColumn('budget','ประมาณการงบประมาณความเสียหาย (บาท)','number')],
 mobile:[floodColumn('unit','หน่วยแพทย์'),floodColumn('units','จำนวนหน่วยแพทย์','number'),floodColumn('visits','ครั้งที่ให้บริการ','number'),floodColumn('patients','ผู้รับบริการ (ราย)','number'),floodColumn('education','บริการสุขศึกษา (ราย)','number')],
 diseases:[floodColumn('communicable','โรคระบาด (ติดต่อ)'),floodColumn('noncommunicable','โรคไม่ติดต่อ'),floodColumn('specific','ผู้ป่วยเฉพาะ'),floodColumn('other','อื่น ๆ')],
 sanitation:[floodColumn('activity','กิจกรรมที่ดำเนินการ'),floodColumn('date','วันเดือนปี','date'),floodColumn('place','สถานที่ปฏิบัติงาน'),floodColumn('people','ผู้รับบริการ (ราย)','number')],
 medicine:[floodColumn('date','วัน / เดือน / ปี','date'),floodColumn('quantity','จำนวนชุด','number')],
 shelters:[floodColumn('activity','กิจกรรมที่ดำเนินการ'),floodColumn('date','วันเดือนปี','date'),floodColumn('place','สถานที่ปฏิบัติงาน'),floodColumn('people','ผู้รับบริการ (ราย)','number')],
 mentalAid:[floodColumn('activity','กิจกรรมที่ดำเนินการ'),floodColumn('date','วันเดือนปี','date'),floodColumn('place','สถานที่ปฏิบัติงาน'),floodColumn('people','ผู้รับบริการ (ราย)','number')],
 support:[floodColumn('item','รายการ'),floodColumn('quantity','จำนวน','number'),floodColumn('unit','หน่วย'),floodColumn('notes','หมายเหตุ')]
};
const blankFloodReport=date=>({version:1,summary:'',asOfDate:date,asOfTime:'',areaDate:date,facilityDate:date,aidStart:'',aidEnd:date,medicineStart:'',medicineEnd:date,supportDate:date,signatureDate:date,position:'',populationDetail:'',normalHospitals:'',normalPcu:'',partialHospitals:'',partialPcu:'',closedCount:'',recoveryCount:'',assessed:'',highStress:'',depression:'',suicideRisk:'',ptsd:'',specialCare:'',areas:[{}],staff:[{type:'เสียชีวิต'},{type:'ได้รับบาดเจ็บ'}],population:[{type:'เสียชีวิต'},{type:'ได้รับบาดเจ็บ'}],partial:[{}],closed:[{}],recovery:[{}],mobile:[{}],diseases:[{}],sanitation:[{}],medicine:[{}],shelters:[{}],mentalAid:[{}],support:[{}]});
function FloodTable({name,title,value,onChange,disabled}) {
 const columns=FLOOD_TABLES[name],rows=value||[];
 const fixed=name==='staff'||name==='population';
 const update=(index,key,v)=>onChange(rows.map((row,i)=>i===index?{...row,[key]:v}:row));
 const sums=columns.filter(c=>c.type==='number');
 return <div className="space-y-3"><h4 className="font-bold text-lg">{title}</h4><div className="overflow-x-auto rounded-xl border border-slate-300"><table className="w-full text-base"><thead className="bg-blue-50"><tr><th className="p-3">ที่</th>{columns.map(c=><th className="p-3 min-w-[160px] text-left" key={c.key}>{c.label}</th>)}{!fixed&&<th className="p-3">จัดการ</th>}</tr></thead><tbody>{rows.map((row,index)=><tr key={index} className="border-t border-slate-200"><td className="p-3">{index+1}</td>{columns.map(c=><td className="p-2" key={c.key}>{fixed&&c.key==='type'?row.type:<input aria-label={`${title} แถว ${index+1} ${c.label}`} type={c.type} min={c.type==='number'?0:undefined} step={c.type==='number'?(c.key==='damage'||c.key==='budget'?'0.01':'1'):undefined} value={row[c.key]??''} disabled={disabled} onChange={e=>update(index,c.key,e.target.value)} className="w-full min-w-[140px] p-3 border rounded-lg bg-white text-base"/>}</td>)}{!fixed&&<td className="p-2"><button type="button" disabled={disabled} onClick={()=>onChange(rows.filter((_,i)=>i!==index))} className="text-red-700 px-3 py-2" aria-label={`${title} ลบแถว ${index+1}`}>ลบ</button></td>}</tr>)}</tbody>{sums.length>0&&<tfoot className="bg-slate-50"><tr><th className="p-3">รวม</th>{columns.map(c=><td className="p-3 font-bold" key={c.key}>{c.type==='number'?(rows.some(r=>r[c.key]!==''&&r[c.key]!=null)?rows.reduce((sum,r)=>sum+Number(r[c.key]||0),0).toLocaleString('th-TH'):'—'):''}</td>)}{!fixed&&<td/>}</tr></tfoot>}</table></div>{!fixed&&<button type="button" disabled={disabled} onClick={()=>onChange([...rows,{}])} className="px-4 py-2 border border-blue-300 text-blue-800 rounded-lg">+ เพิ่มแถว</button>}</div>;
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
  DB.request({action:'list',table:'DailyReports',reportDate,districtId:selectedDistId}).then(rows=>{if(!active)return;const row=unpackFloodReport(rows[0]);if(row){setBase({...row,rain:row.rain??''});setForm({...blankFloodReport(reportDate),...(row.floodReport||{}),summary:row.notes||''});}setLoaded(true);}).catch(e=>{if(active)setError('โหลดรายงานไม่สำเร็จ: '+e.message);}).finally(()=>{if(active)setLoading(false);});
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
 <section className="bg-white p-6 rounded-2xl border space-y-5"><h3 className="text-xl font-bold">1. สรุปสถานการณ์ทั่วไป</h3><label className="block">สรุปสถานการณ์<textarea value={form.summary} disabled={busy||loading} onChange={e=>change('summary',e.target.value)} rows={4} className="w-full border rounded-lg p-3 text-lg"/></label>{input('areaDate','1.1 ข้อมูลพื้นที่และประชาชน ณ วันที่','date')}{table('areas','1.1 พื้นที่และประชาชนที่ได้รับความเสียหาย')}</section>
 <section className="bg-white p-6 rounded-2xl border space-y-5">{table('staff','2. บุคลากรสาธารณสุขที่ได้รับผลกระทบ (ยอดสะสม)')}</section>
 <section className="bg-white p-6 rounded-2xl border space-y-5">{table('population','3. ประชากรที่ได้รับผลกระทบ (ยอดสะสม)')}<label className="block">รายละเอียดเพิ่มเติม<textarea rows={3} disabled={busy||loading} value={form.populationDetail} onChange={e=>change('populationDetail',e.target.value)} className="w-full border rounded-lg p-3"/></label></section>
 <section className="bg-white p-6 rounded-2xl border space-y-5"><h3 className="text-xl font-bold">4. สถานบริการที่ได้รับความเสียหาย</h3>{input('facilityDate','ข้อมูล ณ วันที่','date')}<div className="grid md:grid-cols-2 gap-4">{input('normalHospitals','4.1 โรงพยาบาลเปิดบริการปกติ (แห่ง)','number')}{input('normalPcu','4.1 รพ.สต. เปิดบริการปกติ (แห่ง)','number')}{input('partialHospitals','4.2 โรงพยาบาลเปิดบริการบางส่วน (แห่ง)','number')}{input('partialPcu','4.2 รพ.สต. เปิดบริการบางส่วน (แห่ง)','number')}</div>{table('partial','4.2 รายละเอียดสถานบริการที่เปิดได้บางส่วน')}{input('closedCount','4.3 ปิดให้บริการ (แห่ง)','number')}{table('closed','4.3 รายละเอียดสถานบริการที่ปิดให้บริการ')}{input('recoveryCount','4.4 สถานบริการที่ฟื้นฟู (แห่ง)','number')}{table('recovery','4.4 การฟื้นฟูสถานบริการที่ได้รับผลกระทบ')}</section>
 <section className="bg-white p-6 rounded-2xl border space-y-6"><h3 className="text-xl font-bold">5. การช่วยเหลือประชาชนด้านการสาธารณสุข</h3><div className="grid md:grid-cols-2 gap-4">{input('aidStart','ยอดสะสมตั้งแต่วันที่','date')}{input('aidEnd','ถึงวันที่','date')}</div><h4 className="font-bold">5.1 การให้บริการรักษาพยาบาล</h4>{table('mobile','5.1.1 หน่วยแพทย์เคลื่อนที่ / หน่วยเคลื่อนที่')}{table('diseases','5.1.2 โรคที่พบบ่อยจากการออกหน่วยเคลื่อนที่')}<h4 className="text-lg font-bold">5.1.3 ปัญหาสุขภาพจิต</h4><div className="grid md:grid-cols-3 gap-4">{input('assessed','ประเมินปัญหาสุขภาพจิต (ราย)','number')}{input('highStress','เครียดสูง (ราย)','number')}{input('depression','ซึมเศร้า (ราย)','number')}{input('suicideRisk','เสี่ยงต่อการฆ่าตัวตาย (ราย)','number')}{input('ptsd','PTSD (ราย)','number')}{input('specialCare','ต้องติดตามดูแลพิเศษ (ราย)','number')}</div>{table('sanitation','5.1.4 การสุขาภิบาล / ป้องกันโรค')}<div className="grid md:grid-cols-2 gap-4">{input('medicineStart','แจกยาสะสมตั้งแต่วันที่','date')}{input('medicineEnd','ถึงวันที่','date')}</div>{table('medicine','5.1.5 การแจกยาชุดช่วยเหลือผู้ประสบอุทกภัย')}{table('shelters','5.2 การช่วยเหลือศูนย์พักพิง / ศูนย์อพยพ')}{table('mentalAid','5.3 การช่วยเหลือเยียวยาด้านจิตใจ')}</section>
 <section className="bg-white p-6 rounded-2xl border space-y-5">{input('supportDate','6. ข้อมูลความต้องการสนับสนุน ณ วันที่','date')}{table('support','6. ความต้องการสนับสนุนยาและเวชภัณฑ์ และอื่น ๆ')}</section>
 <section className="bg-white p-6 rounded-2xl border space-y-4"><h3 className="font-bold text-xl">ผู้รายงาน</h3><div className="grid md:grid-cols-3 gap-4"><label>ลงชื่อผู้รายงาน<input disabled={busy||loading} value={base.reporter||''} onChange={e=>setBase({...base,reporter:e.target.value})} className="w-full p-3 border rounded-lg"/></label>{input('position','ตำแหน่ง')}{input('signatureDate','วันที่รายงาน','date')}</div><p className="text-base text-slate-600">ชื่อผู้รายงานเป็นข้อมูลประกอบรายงาน ไม่ใช่ลายมือชื่อดิจิทัล</p><details><summary className="cursor-pointer">ข้อมูลติดตามเพิ่มเติมของระบบ</summary><div className="grid md:grid-cols-3 gap-4 pt-4"><label>ระดับความเสี่ยง<select value={base.status} onChange={e=>setBase({...base,status:e.target.value})} className="w-full p-3 border rounded-lg"><option>ปกติ</option><option>เฝ้าระวัง</option><option>เสี่ยงสูง</option></select></label><label>ปริมาณฝน (มม.)<input type="number" min="0" step="0.1" value={base.rain??''} onChange={e=>setBase({...base,rain:e.target.value})} className="w-full p-3 border rounded-lg"/></label><label>ระดับน้ำ<input value={base.waterLevel||''} onChange={e=>setBase({...base,waterLevel:e.target.value})} className="w-full p-3 border rounded-lg"/></label><label>แนวโน้ม<input value={base.trend||''} onChange={e=>setBase({...base,trend:e.target.value})} className="w-full p-3 border rounded-lg"/></label></div></details><DistrictPhotos key={selectedDistId+reportDate} districtId={selectedDistId} reportDate={reportDate} showToast={showToast}/><div className="flex flex-wrap gap-3"><button disabled={busy||loading} onClick={()=>save(false)} className="border rounded-xl px-6 py-3 bg-white disabled:opacity-50">{busy?'กำลังบันทึก…':'บันทึกร่าง'}</button><button disabled={busy||loading} onClick={()=>save(true)} className="rounded-xl px-6 py-3 bg-blue-700 text-white disabled:opacity-50">ส่งรายงานเข้า Google Sheets</button></div></section>
 </div>;
}

        const PHEOC_UPLOAD_GROUPS = [
            'ทีมปฏิบัติการฉุกเฉินทางการแพทย์ (MERT / EMT)',
            'กลุ่มอนามัยสิ่งแวดล้อมและควบคุมโรค',
            'กลุ่มสนับสนุนทรัพยากรและเวชภัณฑ์'
        ];
        function PheocView({ reports, setReports, showToast }) {
            const [reportDate, setReportDate] = useState(new Date(Date.now() + 7 * 60 * 60 * 1000).toISOString().slice(0, 10));
            const groups = [...new Set([...(reports || []).map(p => p.group).filter(Boolean), ...PHEOC_UPLOAD_GROUPS])];
            return (
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex justify-between items-center">
                        <div>
                            <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                                <i className="ph ph-users-three text-bluePrimary"></i>
                                <span>รายงานความพร้อมกลุ่มภารกิจ PHEOC จังหวัดตรัง</span>
                            </h3>
                            <p className="text-xs text-slate-500">เลือกวันที่ แล้วแนบไฟล์รายงานของแต่ละกลุ่ม ระบบจัดเก็บลง Google Drive แยกโฟลเดอร์ตามกลุ่ม</p>
                        </div>
                    </div>

                    <div className="bg-white p-4 rounded-xl border flex items-center gap-3">
                        <label className="font-medium" htmlFor="pheoc-report-date">วันที่รายงาน</label>
                        <input id="pheoc-report-date" type="date" value={reportDate} onChange={e => setReportDate(e.target.value)} className="border rounded-lg p-2" />
                    </div>

                    {!reports?.length && <p className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm">ยังไม่มีข้อมูลความพร้อมในชีต แต่สามารถส่งไฟล์รายวันของแต่ละกลุ่มได้</p>}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {groups.map(group => {
                            const p = (reports || []).find(item => item.group === group);
                            return <div key={group} className="glass-card p-5 space-y-4">
                                <div className="flex justify-between items-start gap-3">
                                    <h4 className="font-bold text-slate-800 text-base">{group}</h4>
                                    {p?.readiness && <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">{p.readiness}</span>}
                                </div>
                                {p && <div className="space-y-2 text-xs text-slate-600">
                                    <p><strong>บุคลากร:</strong> {p.personnel}</p>
                                    <p><strong>การดำเนินการแล้ว:</strong> {p.actions}</p>
                                    <p><strong>ปัญหา/อุปสรรค:</strong> <span className="text-amber-600 font-medium">{p.issues}</span></p>
                                    <p><strong>แผนงานถัดไป:</strong> {p.nextPlan}</p>
                                </div>}
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
                    for (const file of selected) {
                        if (!file.size || file.size > 2 * 1024 * 1024) throw new Error('ไฟล์ต้องมีขนาดไม่เกิน 2 MB ต่อไฟล์');
                        if (!file.name || file.name.length > 180 || !['application/pdf','text/csv','text/plain','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','application/vnd.ms-excel','application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/msword','image/jpeg','image/png'].includes(file.type)) throw new Error('รองรับ PDF, Word, Excel, CSV, TXT, JPG และ PNG');
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
                <p className="text-sm">ส่งได้สูงสุด 5 ไฟล์ต่อครั้ง รองรับ PDF, Word, Excel, CSV, TXT, JPG, PNG ขนาดไม่เกิน 2 MB ต่อไฟล์</p>
                <p className="text-xs text-amber-800">ระบบเปิดโดยไม่ต้องล็อกอิน ผู้เข้าถึงเว็บอาจดาวน์โหลดไฟล์ที่ส่งได้ กรุณาอย่าแนบข้อมูลผู้ป่วยหรือเอกสารลับ</p>
                <input ref={fileInput} type="file" multiple accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.jpg,.jpeg,.png" disabled={busy} aria-label={'เลือกไฟล์รายงาน ' + group} className="block w-full" />
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
    
