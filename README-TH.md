# TRANG SAT — Google Sheets + Apps Script + Vercel

## สิ่งที่ตรวจสอบ
ไฟล์ db.xlsx ที่แนบมีแท็บ ชีต1 ว่าง ไม่มีข้อมูล/หัวคอลัมน์ ชุดนี้เตรียม schema ใหม่สำหรับโปรเจกต์ TRANG SAT โดยไม่แก้ไฟล์แนบหรือชีตต้นฉบับจากระยะไกล และไม่ใส่รายงานเหตุการณ์จำลองลงฐานข้อมูลจริง

## ติดตั้ง Apps Script ในชีตเดิม
1. เปิด db ต้นฉบับใน Google Sheets หากยังเป็น Excel ให้แปลงเป็น Google Sheets ก่อน
2. เปิด ส่วนขยาย → Apps Script วาง apps-script/Code.gs ทั้งหมดใน Code.gs
3. รัน setupSystem() จากตัวแก้ไข และอนุญาตการเข้าถึงชีต/Drive ตามคำขอ Google
4. ฟังก์ชันบันทึก ID ชีตนี้โดยอัตโนมัติ เพิ่ม Districts (10 อำเภอ), DailyReports, PHEOCReports, PHEOCFiles, Photos, Incidents และ SupportRequests ไม่ลบ ชีต1 ไม่ลบข้อมูลเดิม รันซ้ำไม่เพิ่มอำเภอซ้ำ หากตารางชื่อเดียวกันมีหัวคอลัมน์ต่างกัน จะหยุดแจ้งข้อผิดพลาด
5. Project Settings → Script Properties: คัดลอกค่า API_TOKEN ไปไว้ฝั่ง server เท่านั้น ไม่วางใน app.jsx, HTML หรือ GitHub
6. Deploy → New deployment → Web app → Execute as: Me → Who has access: Anyone → Deploy คัดลอก URL ลงท้าย /exec
   API นี้ตรวจ token ทุกคำขอที่อ่าน/เขียนข้อมูล หากนโยบายหน่วยงานไม่อนุญาต Anyone ต้องใช้การเชื่อมผ่าน Google OAuth เพิ่มเติม ไม่ใช้ขั้นตอนนี้
7. เมื่อต้องแก้โค้ดหลังเผยแพร่ เลือก Manage deployments → Edit → New version → Deploy ทุกครั้ง รวมถึงหลังเพิ่ม PHEOCFiles

## GitHub / Vercel
อัปโหลดทุกไฟล์ในโฟลเดอร์นี้เข้า repository ใหม่ (แนะนำ private) แล้ว import repository เข้า Vercel
Framework Preset: Other; ไม่ต้องตั้ง build command; root directory เป็นโฟลเดอร์ที่มี index.html
ตั้ง Environment Variables จาก .env.example 2 ค่า:
- APPS_SCRIPT_URL: URL /exec
- APPS_SCRIPT_TOKEN: API_TOKEN จาก Script Properties
จากนั้น deploy หรือ redeploy ระบบจะโหลดฐานข้อมูลโดยไม่ถาม username/password
คำเตือน: เมื่อเปิดเว็บสาธารณะ ผู้ที่มี URL สามารถอ่านและแก้ข้อมูลในชีต รวมถึงอัปโหลดภาพได้ อย่าใช้กับข้อมูลส่วนบุคคลหรือข้อมูลที่ต้องจำกัดสิทธิ
API_TOKEN ยังเก็บฝั่ง server และไม่ส่งให้ browser แต่ API ของเว็บเปิดให้ผู้เข้าชมเรียกใช้งานได้ ผู้ที่มี URL สามารถอ่าน/ดาวน์โหลดไฟล์ PHEOC และอัปโหลดไฟล์ได้ ห้ามอัปโหลดข้อมูลส่วนบุคคลหรือเอกสารลับ

## ทดสอบหลังติดตั้ง
- เข้าแอป กดเข้าสู่ฐานข้อมูล: ตารางที่ว่างจะได้แถวเริ่มต้นสำหรับ 10 อำเภอ ไม่มีการสร้างรายงานจำลองในชีต
- เปิดรายงานประจำวันอำเภอ กรอกฝน/น้ำ/สถานะ/หมายเหตุ แล้วบันทึกร่าง ตรวจแถว DailyReports ในชีต
- กดส่งรายงาน: อัปเดตแถวเดิมของอำเภอในวันเดียวกัน submitted=true ไม่เพิ่มซ้ำ
- โหลดหน้าใหม่: ข้อมูลของวันนี้ต้องตรงกับชีต โดยไม่ต้องเข้าสู่ระบบ
- token ผิดต้องไม่อ่าน/เขียนข้อมูลจาก Apps Script
- ฟอร์มกลุ่มภารกิจ PHEOC บันทึกสถานะความพร้อม จำนวนบุคลากรที่พร้อมปฏิบัติงาน และแผนงานถัดไปลง PHEOCReports แยกตามกลุ่มและวันที่; `setupSystem()` จะย้ายชีตเดิมเป็นหัวคอลัมน์ใหม่ และสำรองข้อมูลเดิมไว้ในชีต `PHEOCReports_Legacy_*`
- หลังอัปเดต Apps Script ให้รัน `setupSystem()` หนึ่งครั้งจากชีตฐานข้อมูล แล้วเผยแพร่ Apps Script เป็นรุ่นใหม่

## รูปแบบ API ฝั่ง server
POST /api/db (ไม่ต้องใช้ Authorization)
body: {"action":"bootstrap","reportDate":"2026-10-13"}
body: {"action":"list","table":"DailyReports","reportDate":"2026-10-13"}
body: {"action":"upsert","table":"DailyReports","record":{"reportDate":"2026-10-13","districtId":"d01","status":"เฝ้าระวัง","submitted":true,"rain":45.5,"waterLevel":"2.15 ม.","trend":"เพิ่มขึ้น","reporter":"SAT อำเภอ","notes":"รายงานพื้นที่"}}
วันที่เก็บเป็น ค.ศ. yyyy-MM-dd; เวลาไทย Asia/Bangkok; DailyReports ใช้ ID วัน+อำเภอ; เขียนภายใต้ ScriptLock
ไม่รองรับการลบข้อมูลหรือแก้ master อำเภอจาก API

## ข้อจำกัดที่ยังไม่ทดสอบสด
ตรวจ syntax และจำลอง API/proxy แล้ว แต่ยังไม่ได้รันบน Apps Script จริง ยังไม่มี repository หรือ deployment ใหม่
ระบบเชื่อม Sheets สำหรับรายงานอำเภอ แบบฟอร์มความพร้อม PHEOC และรายการไฟล์อัปโหลด ส่วน AI, LINE, SMS, งานตามเวลา และข้อมูลสถานการณ์ส่วนอื่นยังไม่ใช่บริการจริง
คู่มือ Google: https://developers.google.com/apps-script/guides/web


## ภาพสถานการณ์อำเภอ (รุ่น 1.1)
โฟลเดอร์ปลายทาง: Trang SAT — 1TMxlpDlhdhxxilLHaH85qcYmGT-zR3jH
แทนที่ Code.gs ด้วย apps-script/Code.gs รุ่นล่าสุด แล้วรัน setupSystem() เพิ่มตาราง Photos โดยไม่ลบตารางเดิม
รัน checkPhotoFolder() เพื่ออนุญาตสิทธิ Drive และตรวจว่าบัญชีเจ้าของ deployment เข้าถึงโฟลเดอร์ได้ จากนั้น Deploy → Manage deployments → Edit → New version → Deploy โดยใช้ URL เดิมและ API_TOKEN เดิม
หน้าเว็บ: เข้าสู่ฐานข้อมูล → รายงานประจำวันอำเภอ → เลือกอำเภอ → เลือกภาพ → กรอกคำอธิบาย → อัปโหลดภาพลง Drive
รองรับ JPG PNG WEBP ขนาดไม่เกิน 2 MB ต่อภาพ ครั้งละไม่เกิน 5 ภาพ อัปโหลดทีละไฟล์เพื่อไม่เกินข้อจำกัด request
เก็บไฟล์ภาพในโฟลเดอร์ที่ระบุโดยตรง ชื่อไฟล์ประกอบด้วยวันที่ อำเภอ และ upload ID; Photos เก็บ fileId, driveUrl, districtId, reportDate, caption, uploadedAt
API getPhoto ส่งภาพเมื่อ fileId อยู่ใน Photos และไฟล์อยู่ในโฟลเดอร์ปลายทาง เนื่องจากเว็บไม่ใช้ล็อกอิน ผู้เข้าชมเว็บอาจอ่านภาพที่มีรายการใน Photos ได้
ไม่เปิดภาพเป็นสาธารณะ ไม่เปลี่ยนสิทธิแชร์ของโฟลเดอร์ ผู้ใช้ปุ่มเปิด Drive ต้องมีสิทธิ Drive ของไฟล์นั้น ส่วนดูภาพในแอปใช้สิทธิผ่าน API
ยังใช้บัญชีร่วมตามระบบเดิม ไม่มีการจำกัดสิทธิภาพตามอำเภอรายบุคคล

## ส่งไฟล์รายวันกลุ่มภารกิจ PHEOC
หลังแก้ apps-script/Code.gs ให้เปิด Apps Script ของชีตเดิม รัน setupSystem() เพื่อสร้าง PHEOCFiles แล้วเลือก Deploy → Manage deployments → Edit → New version → Deploy
ในหน้าเว็บเปิด “กลุ่มภารกิจ PHEOC” เลือกวันที่ แล้วเลือกไฟล์ในกลุ่ม ระบบบันทึกไฟล์ลงโฟลเดอร์ย่อยแยกตามชื่อกลุ่มใต้โฟลเดอร์ Trang SAT และบันทึกข้อมูลอ้างอิงลงชีต PHEOCFiles สามารถดาวน์โหลดไฟล์กลับจากหน้าเว็บได้
รองรับ PDF, Word, Excel, CSV, TXT, JPG และ PNG ขนาดไม่เกิน 2 MB ต่อไฟล์ เลือกได้สูงสุด 5 ไฟล์ต่อครั้ง ชื่อไฟล์เติมวันที่รายงานไว้ด้านหน้า
ถ้ากดอัปโหลดซ้ำหลัง request timeout จะใช้ upload ID เดิม ไม่เพิ่มไฟล์/แถวซ้ำ; หากบันทึก metadata ไม่สำเร็จ ไฟล์ใหม่จะถูกส่งไปถังขยะเพื่อไม่ทิ้งไฟล์ค้าง
