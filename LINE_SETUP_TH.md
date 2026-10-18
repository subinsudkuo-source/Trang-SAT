# ตั้งค่าบอต LINE สำหรับ TRANG SAT

ระบบส่งสรุปรายงานอำเภอและ PHEOC ไปยังกลุ่ม LINE เวลา 08:00 และ 18:00 น. ตามเวลา Asia/Bangkok โดยอ่านข้อมูลจาก Google Sheets เดิม ใช้ Gemini สรุปเมื่อมี `GEMINI_API_KEY` และมีสรุปจากข้อมูลจริงเป็นทางเลือกสำรอง

## 1. สร้าง Messaging API channel

1. สร้าง LINE Official Account ที่ [LINE Official Account Manager](https://manager.line.biz/)
2. เปิดใช้ Messaging API ในการตั้งค่าบัญชี แล้วเลือก provider ที่เหมาะสม บัญชีหนึ่งจะผูก provider ได้และเปลี่ยนภายหลังไม่ได้
3. เปิด Messaging API channel ใน [LINE Developers Console](https://developers.line.biz/console/)
4. ในแท็บ Messaging API เปิด **Allow bot to join group chats** แล้วออก Channel access token
5. ในแท็บ Basic settings คัดลอก Channel secret

## 2. ตั้งค่า webhook และเพิ่มบอตเข้ากลุ่ม

1. ในแท็บ Messaging API ตั้ง Webhook URL เป็น `https://trang-sat.vercel.app/api/line-webhook`
2. เปิด Use webhook
3. เชิญ LINE Official Account ที่สร้างไว้เข้ากลุ่ม **PHEOC อุทกภัย สสจ.ตรัง** แล้วส่งข้อความในกลุ่มหนึ่งครั้งเพื่อให้ LINE ส่ง group ID มาที่ webhook
4. เปิด Vercel → Project `trang-sat` → Logs แล้วกรองคำขอ `/api/line-webhook` คัดลอก group ID จากบรรทัด `Verified LINE group IDs`

## 3. เก็บค่าเชื่อมต่อเป็น secrets

ใน Vercel → Settings → Environment Variables เพิ่ม Production values:

- `LINE_CHANNEL_ACCESS_TOKEN` — Channel access token
- `LINE_CHANNEL_SECRET` — Channel secret สำหรับตรวจ webhook
- `LINE_GROUP_ID` — group ID ที่อ่านจาก Logs
- `CRON_SECRET` — สร้างข้อความสุ่มที่ยาวอย่างน้อย 32 ตัวอักษร

จาก GitHub repository → Settings → Secrets and variables → Actions เพิ่ม repository secret ชื่อ `TRANG_SAT_CRON_SECRET` โดยใช้ค่าเดียวกับ `CRON_SECRET` ใน Vercel

จาก GitHub repository → Settings → Secrets and variables → Actions → Variables เพิ่ม repository variable ชื่อ `LINE_DAILY_SEND_ENABLED` ค่า `true` เพื่อเปิดการส่งตามกำหนด ระบบจะยังไม่ส่งระหว่างที่ตัวแปรนี้ไม่มีค่า `true`

หลังเพิ่มหรือแก้ environment variables ให้ redeploy Vercel เพื่อให้ function ใช้ค่าใหม่ได้

## หมายเหตุ

- อย่าส่ง Channel access token, Channel secret หรือ `CRON_SECRET` ลงในแชตหรือ commit เข้า repository
- GitHub Actions ตั้งรอบเวลา 08:00 และ 18:00 น. ตามเวลาไทย แต่อาจเริ่มช้ากว่าเวลาเป้าหมายเมื่อคิวงานหนาแน่น
- สำหรับ repository สาธารณะ GitHub อาจปิด scheduled workflows หลังไม่มี activity 60 วัน ให้ตรวจแท็บ Actions เป็นระยะ
- endpoint ป้องกันด้วย `CRON_SECRET`; webhook ตรวจลายเซ็น LINE ด้วย `LINE_CHANNEL_SECRET`
