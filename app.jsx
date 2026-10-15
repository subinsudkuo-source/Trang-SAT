
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
            const apiKey = "";
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`;
            
            const payload = {
                contents: [{ role: "user", parts: [{ text: prompt }] }],
                systemInstruction: { parts: [{ text: systemInstruction }] }
            };

            try {
                const response = await fetch(apiUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                const data = await response.json();
                if (data.candidates && data.candidates[0].content.parts[0].text) {
                    return data.candidates[0].content.parts[0].text;
                }
                throw new Error("Invalid response");
            } catch (err) {
                console.warn("Gemini API fallback simulation:", err);
                return null;
            }
        };

        
const DB = {
 credentials: '',
 async request(input) {
   const headers={'Content-Type':'application/json'};
   if(this.credentials)headers.Authorization=this.credentials;
   const response = await fetch('/api/db', {method:'POST', credentials:'same-origin', headers,body:JSON.stringify(input)});
   const result = await response.json();
   if(!result.ok){const error=new Error(result.error || 'บันทึกไม่สำเร็จ');error.status=response.status;throw error;}
   return result.data;
 }
};
function DatabasePanel({onLoaded}) {
 const [username,setUsername]=useState(''); const [password,setPassword]=useState('');
 const [message,setMessage]=useState('กำลังเชื่อมฐานข้อมูลอัตโนมัติ…');
 const [busy,setBusy]=useState(true),[needsLogin,setNeedsLogin]=useState(false);
 const connect=async(login=false)=>{setBusy(true);try{
   if(login)DB.credentials='Basic '+btoa(unescape(encodeURIComponent(username+':'+password)));
   const data=await DB.request({action:'bootstrap'});onLoaded(data);setPassword('');setNeedsLogin(false);setMessage('เชื่อมฐานข้อมูลแล้ว • วันที่ '+data.reportDate);
 }catch(e){setNeedsLogin(e.status===401);setMessage(e.message);}finally{DB.credentials='';setBusy(false);}};
 useEffect(()=>{connect();},[]);
 return <section className="bg-white p-4 border-b flex flex-wrap gap-2 items-center">
 <strong>ฐานข้อมูล Google Sheets</strong>{needsLogin&&<><input aria-label="ชื่อผู้ใช้ฐานข้อมูล" autoComplete="username" placeholder="ชื่อผู้ใช้ (ครั้งแรก)" value={username} onChange={e=>setUsername(e.target.value)} className="border p-2 rounded"/>
 <input aria-label="รหัสผ่านฐานข้อมูล" autoComplete="current-password" placeholder="รหัสผ่าน (ครั้งแรก)" type="password" value={password} onChange={e=>setPassword(e.target.value)} className="border p-2 rounded"/></>}
 <button disabled={busy} onClick={()=>connect(needsLogin)} className="bg-blue-700 text-white p-2 rounded">{busy?'กำลังโหลด…':needsLogin?'เชื่อมต่อและจำการเข้าสู่ระบบ':'โหลดข้อมูลใหม่'}</button><span role="status">{message}</span>
 </section>;
}


function DistrictPhotos({districtId,reportDate,showToast}) {
 const [photos,setPhotos]=useState([]),[busy,setBusy]=useState(false),[caption,setCaption]=useState(''),[message,setMessage]=useState('เข้าสู่ฐานข้อมูลก่อนโหลดหรืออัปโหลดภาพ');
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
 <div className="bg-amber-50 text-amber-900 px-4 py-2 text-sm">หน้าตัวอย่างเดิมบางส่วนมีข้อมูลจำลอง • การเชื่อม Sheets รุ่นนี้บันทึกรายงานอำเภอจริง ส่วน AI, LINE, SMS และ Automation ยังเป็นต้นแบบ</div>
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
                                    onClick={() => showToast("บันทึกการตั้งค่าแจ้งเตือนเรียบร้อยแล้ว")}
                                    className="bg-bluePrimary hover:bg-blue-600 text-white px-3.5 py-2 rounded-xl text-xs font-medium flex items-center gap-1.5 transition shadow"
                                >
                                    <i className="ph ph-bell-ringing text-sm"></i>
                                    <span className="hidden sm:inline">แจ้งเตือนด่วน</span>
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
            const [aiSummary, setAiSummary] = useState(
                "สรุปสถานการณ์อุทกภัยจังหวัดตรัง รอบประจำวันที่ 13 ตุลาคม 2569 เวลา 16.30 น. รวบรวมจาก 10 อำเภอและกลุ่มภารกิจ PHEOC พบว่า อำเภอนาโยงอยู่ในภาวะเสี่ยงสูง (ฝนสะสม 68.0 มม. ระดับน้ำ 3.45 ม.) มีน้ำป่าไหลหลากเข้าท่วมพื้นที่ลุ่มต่ำ 2 หมู่บ้าน ขณะที่อำเภอเมืองตรังและห้วยยอดอยู่ในเกณฑ์เฝ้าระวัง ทีมปฏิบัติการฉุกเฉิน MERT และอนามัยสิ่งแวดล้อมมีความพร้อม 95-100% สสจ.ตรัง สั่งการให้เตรียมสำรองยาและเวชภัณฑ์ชุดน้ำท่วมพร้อมแจกจ่าย"
            );

            const handleGenerateAISummary = async () => {
                setIsAiLoading(true);
                showToast("กำลังให้ Gemini AI สังเคราะห์ข้อมูลรายวัน...");
                
                const prompt = `จากข้อมูลรายงานอุทกภัยจังหวัดตรัง 10 อำเภอและกลุ่มภารกิจ PHEOC ประจำวันที่ 13 ต.ค. 2569:
                - อำเภอเสี่ยงสูง: นาโยง (ฝน 68 มม., น้ำ 3.45ม.)
                - อำเภอเฝ้าระวัง: เมืองตรัง, ห้วยยอด
                - กลุ่มภารกิจ PHEOC: MERT พร้อม 100%, อนามัยสิ่งแวดล้อมพร้อม 95%
                กรุณาสรุปสถานการณ์ภาพรวมจังหวัดประจำวันสำหรับผู้บริหารในรูปแบบทางการ กระชับ เป็นมืออาชีพ พร้อมระบุประเด็นเร่งด่วนและข้อเสนอแนะในการปฏิบัติการ`;

                const result = await callGeminiAI(prompt);
                if (result) {
                    setAiSummary(result);
                    showToast("สร้างสรุปสถานการณ์ด้วย AI สำเร็จ!");
                } else {
                    setAiSummary("สรุปสถานการณ์อุทกภัยจังหวัดตรัง: พบพื้นที่เสี่ยงสูงบริเวณอำเภอนาโยงและห้วยยอด ทีม PHEOC ทุกกลุ่มมีความพร้อมสูง สสจ.ตรัง สั่งการให้เตรียมสำรองเวชภัณฑ์และออกหน่วยแพทย์เคลื่อนที่ช่วยเหลือผู้ประสบภัยทันที");
                }
                setIsAiLoading(false);
            };

            const submittedCount = districtReports.filter(r => r.submitted).length;

            return (
                <div className="space-y-6">
                    <div className="bg-gradient-to-r from-navy to-bluePrimary text-white p-6 rounded-2xl shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <div className="flex items-center gap-2 text-cyan-300 text-xs font-semibold uppercase tracking-wider mb-1">
                                <i className="ph ph-newspaper"></i>
                                <span>รายงานทางการจังหวัดตรัง (Provincial Daily Report & PHEOC Integration)</span>
                            </div>
                            <h2 className="text-2xl font-bold">สรุปสถานการณ์อุทกภัยและรายงานประจำวัน</h2>
                            <p className="text-slate-200 text-xs mt-1">ประจำรอบวันที่ 13 ตุลาคม 2569 | เวลาตัดยอดข้อมูล 16.30 น. | ดึงข้อมูลอัตโนมัติจาก 10 อำเภอและกลุ่มภารกิจ</p>
                        </div>
                        <div className="flex gap-2">
                            <button 
                                onClick={() => window.print()}
                                className="bg-white/10 hover:bg-white/20 text-white border border-white/20 px-4 py-2 rounded-xl text-xs font-medium flex items-center gap-2 transition"
                            >
                                <i className="ph ph-printer text-base"></i>
                                <span>พิมพ์ / ส่งออก PDF</span>
                            </button>
                            <button 
                                onClick={() => showToast("คัดลอกข้อความสรุปสำหรับส่งเข้ากลุ่ม LINE OA สำเร็จ!")}
                                className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl text-xs font-medium flex items-center gap-2 transition shadow"
                            >
                                <i className="ph ph-share-network text-base"></i>
                                <span>แชร์เข้า LINE OA</span>
                            </button>
                        </div>
                    </div>

                    {/* AI Summary Card */}
                    <div className="glass-card p-6 border-l-4 border-l-bluePrimary bg-gradient-to-br from-white to-blueLight/30">
                        <div className="flex justify-between items-center mb-3">
                            <div className="flex items-center gap-2">
                                <i className="ph-fill ph-sparkle text-blue-600 text-xl"></i>
                                <h3 className="font-bold text-slate-800">วิเคราะห์และสังเคราะห์สถานการณ์ประจำวันโดย AI (Gemini Flash) จากรายงานอำเภอและ PHEOC</h3>
                            </div>
                            <button
                                onClick={handleGenerateAISummary}
                                disabled={isAiLoading}
                                className="bg-bluePrimary hover:bg-blue-600 text-white px-3.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition shadow disabled:opacity-50"
                            >
                                <i className={`ph ph-arrows-clockwise ${isAiLoading ? 'animate-spin' : ''}`}></i>
                                <span>{isAiLoading ? 'กำลังประมวลผล...' : 'สังเคราะห์ข้อมูลใหม่'}</span>
                            </button>
                        </div>
                        <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line bg-white/80 p-4 rounded-xl border border-blue-100">
                            {aiSummary}
                        </p>
                    </div>

                    {/* Grid Section: Overview & Photos */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="glass-card p-6 lg:col-span-2 space-y-4">
                            <div className="flex justify-between items-center">
                                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                    <i className="ph ph-chart-bar text-bluePrimary text-lg"></i>
                                    <span>สถานะการส่งรายงานและสรุป 10 อำเภอ</span>
                                </h3>
                                <button 
                                    onClick={() => setActiveTab('map')}
                                    className="text-xs text-bluePrimary font-semibold hover:underline flex items-center gap-1"
                                >
                                    <span>เปิดแผนที่ geoBoundaries</span> <i className="ph ph-arrow-right"></i>
                                </button>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center">
                                    <p className="text-xs text-slate-500">รายงานส่งแล้ว</p>
                                    <p className="text-2xl font-bold text-emerald-600 mt-1">{submittedCount} / 10</p>
                                    <p className="text-[10px] text-emerald-600 font-medium mt-1">ครบตามกำหนดรอบ</p>
                                </div>
                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center">
                                    <p className="text-xs text-slate-500">พื้นที่เสี่ยงสูง</p>
                                    <p className="text-2xl font-bold text-red-600 mt-1">1 อำเภอ</p>
                                    <p className="text-[10px] text-red-600 font-medium mt-1">อำเภอนาโยง</p>
                                </div>
                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center">
                                    <p className="text-xs text-slate-500">เฝ้าระวัง</p>
                                    <p className="text-2xl font-bold text-amber-600 mt-1">2 อำเภอ</p>
                                    <p className="text-[10px] text-amber-600 font-medium mt-1">เมืองตรัง, ห้วยยอด</p>
                                </div>
                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center">
                                    <p className="text-xs text-slate-500">กลุ่ม PHEOC</p>
                                    <p className="text-2xl font-bold text-blue-600 mt-1">3 กลุ่ม</p>
                                    <p className="text-[10px] text-blue-600 font-medium mt-1">พร้อมปฏิบัติการ</p>
                                </div>
                            </div>

                            <div className="mt-4 overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                    <thead>
                                        <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                                            <th className="p-2.5 rounded-l-lg">อำเภอ</th>
                                            <th className="p-2.5">สถานะ</th>
                                            <th className="p-2.5">ปริมาณฝน</th>
                                            <th className="p-2.5">ระดับน้ำ / แนวโน้ม</th>
                                            <th className="p-2.5 rounded-r-lg">รายงาน</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {districtReports.map(r => (
                                            <tr key={r.districtId} className="hover:bg-slate-50">
                                                <td className="p-2.5 font-medium text-slate-800">{r.districtName}</td>
                                                <td className="p-2.5">
                                                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                                                        r.status === 'เสี่ยงสูง' ? 'bg-red-100 text-red-700' :
                                                        r.status === 'เฝ้าระวัง' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                                                    }`}>
                                                        {r.status}
                                                    </span>
                                                </td>
                                                <td className="p-2.5 text-slate-600">{r.rain} มม.</td>
                                                <td className="p-2.5 text-slate-600">{r.waterLevel}</td>
                                                <td className="p-2.5">
                                                    <span className={`text-[11px] font-medium ${r.submitted ? 'text-emerald-600' : 'text-amber-600'}`}>
                                                        {r.submitted ? '✓ ส่งแล้ว' : '⏳ รอส่ง'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="glass-card p-6 space-y-4">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                <i className="ph ph-image text-bluePrimary text-lg"></i>
                                <span>ภาพถ่ายสถานการณ์ประจำวัน</span>
                            </h3>

                            <div className="space-y-3">
                                <div className="group relative rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-slate-100">
                                    <img 
                                        src="https://placehold.co/600x350/102D50/FFFFFF?text=Trang+Flood+Situation+NaYong" 
                                        alt="ภาพสถานการณ์อุทกภัยอำเภอนาโยง" 
                                        className="w-full h-40 object-cover group-hover:scale-105 transition duration-300"
                                        onError={(e)=>{e.target.src='https://placehold.co/600x350/102D50/FFFFFF?text=Image+Unavailable';}}
                                    />
                                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3 text-white">
                                        <p className="text-xs font-bold">อ.นาโยง (จุดเสี่ยงน้ำป่าหลาก)</p>
                                        <p className="text-[10px] text-slate-300">ถ่ายเมื่อ 13 ต.ค. 2569 14:15 น.</p>
                                    </div>
                                </div>

                                <div className="group relative rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-slate-100">
                                    <img 
                                        src="https://placehold.co/600x350/258DCE/FFFFFF?text=Medical+Team+Deployment" 
                                        alt="ภาพทีมแพทย์เคลื่อนที่ MERT" 
                                        className="w-full h-40 object-cover group-hover:scale-105 transition duration-300"
                                        onError={(e)=>{e.target.src='https://placehold.co/600x350/258DCE/FFFFFF?text=Image+Unavailable';}}
                                    />
                                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3 text-white">
                                        <p className="text-xs font-bold">ทีม MERT สสจ.ตรัง ลงพื้นที่เยี่ยมผู้ป่วย</p>
                                        <p className="text-[10px] text-slate-300">ถ่ายเมื่อ 13 ต.ค. 2569 11:30 น.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="glass-card p-6 space-y-4">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2">
                            <i className="ph ph-users-three text-bluePrimary text-lg"></i>
                            <span>สรุปการดำเนินงานกลุ่มภารกิจ PHEOC จังหวัดประจำวัน</span>
                        </h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {pheocReports.map(p => (
                                <div key={p.id} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                                    <div className="flex justify-between items-start">
                                        <h4 className="font-bold text-sm text-slate-800">{p.group}</h4>
                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">{p.readiness}</span>
                                    </div>
                                    <p className="text-xs text-slate-600"><strong>บุคลากร:</strong> {p.personnel}</p>
                                    <p className="text-xs text-slate-600"><strong>การดำเนินงาน:</strong> {p.actions}</p>
                                    <p className="text-xs text-slate-600"><strong>แผนงานถัดไป:</strong> {p.nextPlan}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            );
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
                        const downloadURL = metadata.simplifiedGeometryGeoJSON || metadata.gjDownloadURL;
                        if (!downloadURL) throw new Error('ไม่พบลิงก์ดาวน์โหลด GeoJSON');
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
                                                    return (
                                                        <text key={'l-' + districtId} x={x} y={y} className="map-label" textAnchor="middle" dominantBaseline="middle">
                                                            {thaiName}
                                                        </text>
                                                    );
                                                })}
                                            </g>
                                        </svg>
                                    </div>
                                    <p className="text-sm text-slate-600">แผนที่แสดงขอบเขตการปกครอง สีใช้แยกอำเภอ ไม่ใช่พื้นที่น้ำท่วมหรือระดับความเสี่ยง</p>
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

        function DistrictReportView({ districts, reports, setReports, showToast }) {
            const [selectedDistId, setSelectedDistId] = useState('d01');
            const currentDist = districts.find(d => d.id === selectedDistId);
            const currentReport = reports.find(r => r.districtId === selectedDistId) || {
                districtId: selectedDistId,
                districtName: currentDist.thai,
                status: currentDist.status,
                submitted: false,
                rain: currentDist.rain,
                waterLevel: currentDist.water,
                trend: currentDist.trend,
                notes: ''
            };

            const [formData, setFormData] = useState(currentReport);

            useEffect(() => {
                const rep = reports.find(r => r.districtId === selectedDistId);
                const dist = districts.find(d => d.id === selectedDistId);
                setFormData(rep || {
                    districtId: selectedDistId,
                    districtName: dist.thai,
                    status: dist.status,
                    submitted: false,
                    rain: dist.rain,
                    waterLevel: dist.water,
                    trend: dist.trend,
                    notes: ''
                });
            }, [selectedDistId, reports, districts]);

            const handleSave = async (isSubmit = false) => {
 try {
 const reportDate=formData.reportDate || new Date().toLocaleDateString('en-CA',{timeZone:'Asia/Bangkok'});
 const record={districtId:formData.districtId,districtName:formData.districtName,reportDate,status:formData.status,submitted:isSubmit,rain:Number(formData.rain),waterLevel:formData.waterLevel||'',trend:formData.trend||'',reporter:formData.reporter||'',notes:formData.notes||''};
 const updated=await DB.request({action:'upsert',table:'DailyReports',record});
 setReports(previous=>previous.some(r=>r.districtId===selectedDistId)?previous.map(r=>r.districtId===selectedDistId?updated:r):[...previous,updated]);
 showToast(isSubmit?'ส่งรายงานเข้า Google Sheets แล้ว':'บันทึกร่างใน Google Sheets แล้ว');
 }catch(e){showToast('บันทึกไม่สำเร็จ: '+e.message);}
 };

            return (
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                                <i className="ph ph-clipboard-text text-bluePrimary"></i>
                                <span>แบบรายงานประจำวันอุทกภัยระดับอำเภอ (ตามแบบฟอร์ม สสจ.ตรัง)</span>
                            </h3>
                            <p className="text-xs text-slate-500">กรอกข้อมูลสถานการณ์น้ำ ฝน พื้นที่เสี่ยง และหน่วยบริการประจำรอบเวลา</p>
                        </div>
                        <div className="flex items-center gap-2 w-full md:w-auto">
                            <label className="text-xs font-medium text-slate-600">เลือกอำเภอ:</label>
                            <select 
                                value={selectedDistId} 
                                onChange={(e) => setSelectedDistId(e.target.value)}
                                className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-bluePrimary"
                            >
                                {districts.map(d => (
                                    <option key={d.id} value={d.id}>อำเภอ{d.thai}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="glass-card p-6 space-y-6">
                        <div className="flex justify-between items-center border-b border-slate-200 pb-4">
                            <div>
                                <h4 className="font-bold text-slate-800 text-base">รายงานสถานการณ์ อ. {currentDist.thai}</h4>
                                <p className="text-xs text-slate-500">สถานะรายงานปัจจุบัน: <span className={formData.submitted ? 'text-emerald-600 font-bold' : 'text-amber-600 font-bold'}>{formData.submitted ? 'ส่งแล้ว (Submitted)' : 'ยังไม่ส่ง (Draft)'}</span></p>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                formData.status === 'เสี่ยงสูง' ? 'bg-red-100 text-red-700' :
                                formData.status === 'เฝ้าระวัง' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                            }`}>
                                ระดับความเสี่ยง: {formData.status}
                            </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label className="block text-xs font-medium text-slate-700 mb-1">สถานะความเสี่ยงอำเภอ</label>
                                <select 
                                    value={formData.status}
                                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-bluePrimary"
                                >
                                    <option value="ปกติ">ปกติ (Normal)</option>
                                    <option value="เฝ้าระวัง">เฝ้าระวัง (Warning)</option>
                                    <option value="เสี่ยงสูง">เสี่ยงสูง / วิกฤต (High Risk)</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-slate-700 mb-1">ปริมาณฝนสะสม (มม.)</label>
                                <input 
                                    type="number" 
                                    value={formData.rain}
                                    onChange={(e) => setFormData({...formData, rain: parseFloat(e.target.value) || 0})}
                                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-bluePrimary"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-slate-700 mb-1">ระดับน้ำและแนวโน้ม</label>
                                <input 
                                    type="text" 
                                    value={formData.waterLevel}
                                    onChange={(e) => setFormData({...formData, waterLevel: e.target.value})}
                                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-bluePrimary"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-slate-700 mb-1">หมายเหตุ / สรุปสถานการณ์ในพื้นที่ / ความต้องการสนับสนุนด่วน</label>
                            <textarea 
                                rows="4"
                                value={formData.notes}
                                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                                placeholder="ระบุรายละเอียดผลกระทบ หน่วยบริการที่เสี่ยง หรือสิ่งที่ต้องการให้จังหวัดสนับสนุน..."
                                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-bluePrimary"
                            ></textarea>
                        </div>

                        <DistrictPhotos key={selectedDistId} districtId={selectedDistId} reportDate={formData.reportDate || new Date().toLocaleDateString("en-CA",{timeZone:"Asia/Bangkok"})} showToast={showToast} />
                        <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                            <button
                                onClick={() => handleSave(false)}
                                className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-5 py-2.5 rounded-xl text-xs font-semibold transition flex items-center gap-2"
                            >
                                <i className="ph ph-floppy-disk"></i>
                                <span>บันทึกร่าง (Draft)</span>
                            </button>
                            <button
                                onClick={() => handleSave(true)}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl text-xs font-semibold transition flex items-center gap-2 shadow-lg shadow-emerald-600/20"
                            >
                                <i className="ph ph-paper-plane-tilt"></i>
                                <span>ยืนยันและส่งรายงานจังหวัด</span>
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        function PheocView({ reports, setReports, showToast }) {
            return (
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex justify-between items-center">
                        <div>
                            <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                                <i className="ph ph-users-three text-bluePrimary"></i>
                                <span>รายงานความพร้อมกลุ่มภารกิจ PHEOC จังหวัดตรัง</span>
                            </h3>
                            <p className="text-xs text-slate-500">ติดตามความพร้อมทรัพยากร บุคลากร และแผนปฏิบัติการฉุกเฉินทางการแพทย์</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {reports.map((p) => (
                            <div key={p.id} className="glass-card p-6 space-y-4">
                                <div className="flex justify-between items-start">
                                    <h4 className="font-bold text-slate-800 text-base">{p.group}</h4>
                                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">{p.readiness}</span>
                                </div>
                                <div className="space-y-2 text-xs text-slate-600">
                                    <p><strong>บุคลากร:</strong> {p.personnel}</p>
                                    <p><strong>การดำเนินการแล้ว:</strong> {p.actions}</p>
                                    <p><strong>ปัญหา/อุปสรรค:</strong> <span className="text-amber-600 font-medium">{p.issues}</span></p>
                                    <p><strong>แผนงานถัดไป:</strong> {p.nextPlan}</p>
                                </div>
                                <button
                                    onClick={() => showToast(`อัปเดตข้อมูลกลุ่ม ${p.group} เรียบร้อย`)}
                                    className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 rounded-xl text-xs font-medium transition"
                                >
                                    แก้ไขรายงานกลุ่มภารกิจ
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            );
        }

        function IncidentView({ showToast }) {
            const [incidents] = useState([
                { id: 'INC-01', dist: 'นาโยง', type: 'น้ำป่าไหลหลากเข้าบ้านเรือน', time: '13 ต.ค. 2569 13:20 น.', status: 'ดำเนินการแล้ว' },
                { id: 'INC-02', dist: 'ห้วยยอด', type: 'ดินสไลด์ปิดทับเส้นทาง รพ.สต.', time: '13 ต.ค. 2569 10:15 น.', status: 'รอการตรวจสอบ' }
            ]);

            return (
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex justify-between items-center">
                        <div>
                            <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                                <i className="ph ph-warning-octagon text-red-500"></i>
                                <span>ระบบแจ้งเหตุเร่งด่วน (Emergency Incident Reporting)</span>
                            </h3>
                            <p className="text-xs text-slate-500">แจ้งเหตุฉุกเฉิน น้ำท่วมเฉียบพลัน หรือภัยพิบัติด้านสาธารณสุขได้ตลอด 24 ชม.</p>
                        </div>
                        <button
                            onClick={() => showToast("บันทึกการแจ้งเหตุเร่งด่วนและส่ง SMS แจ้งเตือนผู้บริหารแล้ว!")}
                            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 shadow"
                        >
                            <i className="ph ph-plus-circle text-base"></i>
                            <span>แจ้งเหตุเร่งด่วนใหม่</span>
                        </button>
                    </div>

                    <div className="glass-card p-6 overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead>
                                <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                                    <th className="p-3 rounded-l-lg">รหัสเหตุการณ์</th>
                                    <th className="p-3">อำเภอ / พื้นที่</th>
                                    <th className="p-3">ประเภทเหตุการณ์</th>
                                    <th className="p-3">เวลาที่เกิดเหตุ</th>
                                    <th className="p-3">สถานะ</th>
                                    <th className="p-3 rounded-r-lg">จัดการ</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {incidents.map(inc => (
                                    <tr key={inc.id} className="hover:bg-slate-50">
                                        <td className="p-3 font-bold text-slate-800">{inc.id}</td>
                                        <td className="p-3 font-medium text-slate-700">{inc.dist}</td>
                                        <td className="p-3 text-slate-600">{inc.type}</td>
                                        <td className="p-3 text-slate-500">{inc.time}</td>
                                        <td className="p-3">
                                            <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-700">
                                                {inc.status}
                                            </span>
                                        </td>
                                        <td className="p-3">
                                            <button onClick={() => showToast(`เปิดดูรายละเอียด ${inc.id}`)} className="text-bluePrimary hover:underline font-medium">ดูรายละเอียด</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            );
        }

        function SupportView({ showToast }) {
            return (
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex justify-between items-center">
                        <div>
                            <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                                <i className="ph ph-hand-fist text-bluePrimary"></i>
                                <span>ระบบคำขอสนับสนุนเวชภัณฑ์และทรัพยากร (Support Requests)</span>
                            </h3>
                            <p className="text-xs text-slate-500">ติดตามคำขอ ยารักษาโรค ชุดน้ำท่วม และกำลังพลสนับสนุนจากอำเภอต่างๆ</p>
                        </div>
                        <button onClick={() => showToast("เปิดฟอร์มสร้างคำขอสนับสนุนใหม่")} className="bg-bluePrimary hover:bg-blue-600 text-white px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 shadow">
                            <i className="ph ph-plus-circle text-base"></i>
                            <span>สร้างคำขอสนับสนุน</span>
                        </button>
                    </div>

                    <div className="glass-card p-6">
                        <div className="space-y-4">
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-slate-800 text-sm">REQ-2569-01 (อ.นาโยง)</span>
                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700">รอการจัดส่ง</span>
                                    </div>
                                    <p className="text-xs text-slate-600 mt-1"><strong>สิ่งที่ต้องการ:</strong> ยารักษาโรคและชุดน้ำท่วม 500 ชุด สำหรับแจกจ่ายผู้ประสบภัยในพื้นที่ลุ่มต่ำ</p>
                                    <p className="text-[11px] text-slate-400 mt-1">ผู้ประสานงาน: นพ.สมชาย สาธารณสุขอำเภอนาโยง | วันที่ขอ: 13 ต.ค. 2569</p>
                                </div>
                                <button onClick={() => showToast("อนุมัติและมอบหมายให้กลุ่มสนับสนุนทรัพยากรจัดส่งแล้ว")} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-semibold transition">
                                    อนุมัติและจัดส่ง
                                </button>
                            </div>
                        </div>
                    </div>
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
    
