# TRANG SAT — Google Sheets + Apps Script + Vercel

## สิ่งที่ตรวจสอบ
ไฟล์ db.xlsx ที่แนบมีแท็บ ชีต1 ว่าง ไม่มีข้อมูล/หัวคอลัมน์ ชุดนี้เตรียม schema ใหม่สำหรับโปรเจกต์ TRANG SAT โดยไม่แก้ไฟล์แนบหรือชีตต้นฉบับจากระยะไกล และไม่ใส่รายงานเหตุการณ์จำลองลงฐานข้อมูลจริง

## ติดตั้ง Apps Script ในชีตเดิม
1. เปิด db ต้นฉบับใน Google Sheets หากยังเป็น Excel ให้แปลงเป็น Google Sheets ก่อน
2. เปิด ส่วนขยาย → Apps Script วาง apps-script/Code.gs ทั้งหมดใน Code.gs
3. รัน setupSystem() จากตัวแก้ไข และอนุญาตการเข้าถึงชีตตามคำขอ Google
4. ฟังก์ชันบันทึก ID ชีตนี้โดยอัตโนมัติ เพิ่ม Districts (10 อำเภอ), DailyReports, PHEOCReports, Incidents และ SupportRequests ไม่ลบ ชีต1 ไม่ลบข้อมูลเดิม รันซ้ำไม่เพิ่มอำเภอซ้ำ หากตารางชื่อเดียวกันมีหัวคอลัมน์ต่างกัน จะหยุดแจ้งข้อผิดพลาด
5. Project Settings → Script Properties: คัดลอกค่า API_TOKEN ไปไว้ฝั่ง server เท่านั้น ไม่วางใน app.jsx, HTML หรือ GitHub
6. Deploy → New deployment → Web app → Execute as: Me → Who has access: Anyone → Deploy คัดลอก URL ลงท้าย /exec
   API นี้ตรวจ token ทุกคำขอที่อ่าน/เขียนข้อมูล หากนโยบายหน่วยงานไม่อนุญาต Anyone ต้องใช้การเชื่อมผ่าน Google OAuth เพิ่มเติม ไม่ใช้ขั้นตอนนี้
7. เมื่อต้องแก้โค้ดหลังเผยแพร่ เลือก Manage deployments → Edit → New version → Deploy

## GitHub / Vercel
อัปโหลดทุกไฟล์ในโฟลเดอร์นี้เข้า repository ใหม่ (แนะนำ private) แล้ว import repository เข้า Vercel
Framework Preset: Other; ไม่ต้องตั้ง build command; root directory เป็นโฟลเดอร์ที่มี index.html
ตั้ง Environment Variables จาก .env.example ทั้ง 4 ค่า:
- APPS_SCRIPT_URL: URL /exec
- APPS_SCRIPT_TOKEN: API_TOKEN จาก Script Properties
- APP_USERNAME และ APP_PASSWORD: ชื่อผู้ใช้และรหัสผ่านสำหรับผู้ได้รับอนุญาตใช้งานฐานข้อมูล เลือกรหัสผ่านยาวและไม่ใช้ซ้ำ
จากนั้น deploy หรือ redeploy แล้วกรอกชื่อผู้ใช้/รหัสผ่านในแถบ ฐานข้อมูล Google Sheets ด้านบนแอป
ใช้ HTTPS ของ Vercel เท่านั้น API server ตรวจ credentials ก่อนส่งคำขอไป Apps Script และไม่ส่ง API_TOKEN ให้ browser
รุ่นนี้ใช้บัญชีร่วมสำหรับผู้มีสิทธิทั้งหมด ยังไม่มีการแยกสิทธิรายอำเภอ/บุคคล ตัวเลือกสิทธิบนหน้าเดิมเป็นองค์ประกอบ UI ไม่ใช่การควบคุมสิทธิ server

## ทดสอบหลังติดตั้ง
- เข้าแอป กดเข้าสู่ฐานข้อมูล: ตารางที่ว่างจะได้แถวเริ่มต้นสำหรับ 10 อำเภอ ไม่มีการสร้างรายงานจำลองในชีต
- เปิดรายงานประจำวันอำเภอ กรอกฝน/น้ำ/สถานะ/หมายเหตุ แล้วบันทึกร่าง ตรวจแถว DailyReports ในชีต
- กดส่งรายงาน: อัปเดตแถวเดิมของอำเภอในวันเดียวกัน submitted=true ไม่เพิ่มซ้ำ
- โหลดหน้าใหม่และเข้าสู่ระบบอีกครั้ง: ข้อมูลของวันนี้ต้องตรงกับชีต
- รหัสผ่านผิดหรือ token ผิดต้องไม่อ่าน/เขียนข้อมูล
- API รองรับ list/upsert ของ PHEOCReports, Incidents และ SupportRequests แล้ว แต่หน้า UI เดิมของสามส่วนนี้ยังไม่ได้ผูกฟอร์มเขียนข้อมูล

## รูปแบบ API ฝั่ง server
POST /api/db พร้อม Authorization: Basic ของ APP_USERNAME:APP_PASSWORD
body: {"action":"bootstrap","reportDate":"2026-10-13"}
body: {"action":"list","table":"DailyReports","reportDate":"2026-10-13"}
body: {"action":"upsert","table":"DailyReports","record":{"reportDate":"2026-10-13","districtId":"d01","status":"เฝ้าระวัง","submitted":true,"rain":45.5,"waterLevel":"2.15 ม.","trend":"เพิ่มขึ้น","reporter":"SAT อำเภอ","notes":"รายงานพื้นที่"}}
วันที่เก็บเป็น ค.ศ. yyyy-MM-dd; เวลาไทย Asia/Bangkok; DailyReports ใช้ ID วัน+อำเภอ; เขียนภายใต้ ScriptLock
ไม่รองรับการลบข้อมูลหรือแก้ master อำเภอจาก API

## ข้อจำกัดที่ยังไม่ทดสอบสด
ตรวจ syntax และจำลอง API/proxy แล้ว แต่ยังไม่ได้รันบน Apps Script จริง ยังไม่มี repository หรือ deployment ใหม่
หน้า Gemini เป็นต้นแบบ มีเนื้อหาและปุ่มสาธิต การเชื่อม Sheets รุ่นนี้ผูกโหลดข้อมูลรายงานอำเภอ/PHEOC และบันทึกรายงานอำเภอ ส่วน AI, LINE, SMS, งานตามเวลา และข้อมูลสถานการณ์ส่วนอื่นยังไม่ใช่บริการจริง
คู่มือ Google: https://developers.google.com/apps-script/guides/web


## ภาพสถานการณ์อำเภอ (รุ่น 1.1)
โฟลเดอร์ปลายทาง: Trang SAT — 1TMxlpDlhdhxxilLHaH85qcYmGT-zR3jH
แทนที่ Code.gs ด้วย apps-script/Code.gs รุ่นล่าสุด แล้วรัน setupSystem() เพิ่มตาราง Photos โดยไม่ลบตารางเดิม
รัน checkPhotoFolder() เพื่ออนุญาตสิทธิ Drive และตรวจว่าบัญชีเจ้าของ deployment เข้าถึงโฟลเดอร์ได้ จากนั้น Deploy → Manage deployments → Edit → New version → Deploy โดยใช้ URL เดิมและ API_TOKEN เดิม
หน้าเว็บ: เข้าสู่ฐานข้อมูล → รายงานประจำวันอำเภอ → เลือกอำเภอ → เลือกภาพ → กรอกคำอธิบาย → อัปโหลดภาพลง Drive
รองรับ JPG PNG WEBP ขนาดไม่เกิน 2 MB ต่อภาพ ครั้งละไม่เกิน 5 ภาพ อัปโหลดทีละไฟล์เพื่อไม่เกินข้อจำกัด request
เก็บไฟล์ภาพในโฟลเดอร์ที่ระบุโดยตรง ชื่อไฟล์ประกอบด้วยวันที่ อำเภอ และ upload ID; Photos เก็บ fileId, driveUrl, districtId, reportDate, caption, uploadedAt
API getPhoto ส่งภาพให้ผู้เข้าสู่ระบบโดยตรวจ fileId จาก Photos และโฟลเดอร์ปลายทาง ห้ามส่ง fileId อิสระเพื่ออ่านไฟล์อื่น
ไม่เปิดภาพเป็นสาธารณะ ไม่เปลี่ยนสิทธิแชร์ของโฟลเดอร์ ผู้ใช้ปุ่มเปิด Drive ต้องมีสิทธิ Drive ของไฟล์นั้น ส่วนดูภาพในแอปใช้สิทธิผ่าน API
ยังใช้บัญชีร่วมตามระบบเดิม ไม่มีการจำกัดสิทธิภาพตามอำเภอรายบุคคล
ถ้ากดอัปโหลดซ้ำหลัง request timeout จะใช้ upload ID เดิม ไม่เพิ่มไฟล์/แถวซ้ำ; หากบันทึก metadata ไม่สำเร็จ ไฟล์ใหม่จะถูกส่งไปถังขยะเพื่อไม่ทิ้งไฟล์ค้าง
