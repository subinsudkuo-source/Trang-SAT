const crypto = require('crypto');

const FLOOD_REPORT_PREFIX = 'TRANG_SAT_FLOOD_V1:';
const districtsSeed = [
  ['d01', 'เมืองตรัง'], ['d02', 'กันตัง'], ['d03', 'ย่านตาขาว'], ['d04', 'ปะเหลียน'],
  ['d05', 'สิเกา'], ['d06', 'ห้วยยอด'], ['d07', 'วังวิเศษ'], ['d08', 'นาโยง'],
  ['d09', 'รัษฎา'], ['d10', 'หาดสำราญ']
];

function safeEqual(a, b) {
  const left = Buffer.from(String(a || ''));
  const right = Buffer.from(String(b || ''));
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

function parseFloodReport(report) {
  if (report?.floodReport) return report;
  if (typeof report?.notes !== 'string' || !report.notes.startsWith(FLOOD_REPORT_PREFIX)) return report || {};
  try {
    const floodReport = JSON.parse(report.notes.slice(FLOOD_REPORT_PREFIX.length));
    return { ...report, notes: floodReport.summary || '', floodReport };
  } catch {
    return report;
  }
}

function reportedCount(rows, predicate, key) {
  const matches = (Array.isArray(rows) ? rows : []).filter(row => predicate(row) && row[key] !== '' && row[key] !== null && row[key] !== undefined && Number.isFinite(Number(row[key])));
  return { reported: matches.length > 0, total: matches.reduce((sum, row) => sum + Math.max(0, Number(row[key]) || 0), 0) };
}

function impactTotals(report) {
  const flood = report.floodReport || {};
  const population = Array.isArray(flood.population) ? flood.population : [];
  const areas = Array.isArray(flood.areas) ? flood.areas : [];
  const deaths = reportedCount(population, row => String(row.type || '').includes('เสียชีวิต'), 'count');
  const injuries = reportedCount(population, row => String(row.type || '').includes('บาดเจ็บ'), 'count');
  const affected = reportedCount(areas, () => true, 'people');
  return { deaths, injuries, affected };
}

function formatCount(value) {
  return Number(value || 0).toLocaleString('th-TH');
}

function makeSummary(data, reportDate) {
  const reports = (Array.isArray(data.reports) ? data.reports : []).map(parseFloodReport);
  const submitted = reports.filter(row => row.submitted === true || row.submitted === 'true' || row.submitted === 'TRUE');
  const byDistrict = new Map(submitted.map(row => [row.districtId, row]));
  const districtList = Array.isArray(data.districts) && data.districts.length ? data.districts.map(row => [row.id, row.thai]) : districtsSeed;
  const pending = districtList.filter(([id]) => !byDistrict.has(id)).map(([, name]) => name);
  const risk = submitted.filter(row => ['เสี่ยงสูง', 'วิกฤต'].some(level => String(row.status || '').includes(level))).map(row => row.districtName || districtList.find(([id]) => id === row.districtId)?.[1]).filter(Boolean);
  const watch = submitted.filter(row => String(row.status || '').includes('เฝ้าระวัง')).map(row => row.districtName || districtList.find(([id]) => id === row.districtId)?.[1]).filter(Boolean);
  const totals = submitted.reduce((sum, row) => {
    const value = impactTotals(row);
    sum.affected += value.affected.total;
    sum.deaths += value.deaths.total;
    sum.injuries += value.injuries.total;
    sum.affectedReported ||= value.affected.reported;
    sum.deathsReported ||= value.deaths.reported;
    sum.injuriesReported ||= value.injuries.reported;
    return sum;
  }, { affected: 0, deaths: 0, injuries: 0, affectedReported: false, deathsReported: false, injuriesReported: false });
  const pheoc = Array.isArray(data.pheoc) ? data.pheoc : [];
  const dateLabel = new Date(`${reportDate}T00:00:00+07:00`).toLocaleDateString('th-TH', { timeZone: 'Asia/Bangkok', dateStyle: 'long' });
  const deterministic = [
    `สรุปสถานการณ์อุทกภัยจังหวัดตรัง • ${dateLabel}`,
    `รายงานอำเภอ ${submitted.length}/${districtList.length} แห่ง`,
    `เสี่ยงสูง/วิกฤต: ${risk.length ? risk.join(', ') : 'ไม่พบในรายงานที่ส่ง'}`,
    `เฝ้าระวัง: ${watch.length ? watch.join(', ') : 'ไม่พบในรายงานที่ส่ง'}`,
    `ได้รับผลกระทบ: ${totals.affectedReported ? `${formatCount(totals.affected)} คน` : 'ยังไม่มีข้อมูล'} | เสียชีวิต: ${totals.deathsReported ? `${formatCount(totals.deaths)} ราย` : 'ยังไม่มีข้อมูล'} | บาดเจ็บ: ${totals.injuriesReported ? `${formatCount(totals.injuries)} ราย` : 'ยังไม่มีข้อมูล'}`,
    `รายงาน PHEOC ${pheoc.length} กลุ่ม: ${pheoc.length ? pheoc.map(item => `${item.group || 'ไม่ระบุกลุ่ม'} (ความพร้อม ${item.readiness || 'ไม่ระบุ'}, บุคลากรพร้อมปฏิบัติงาน ${item.personnelCount ?? 'ไม่ระบุ'} คน${item.nextPlan ? `, แผนถัดไป ${item.nextPlan}` : ''})`).join(' • ') : 'ยังไม่มีรายงาน'}`,
    pending.length ? `อำเภอที่ยังไม่ส่ง: ${pending.join(', ')}` : 'ส่งรายงานครบทุกอำเภอ'
  ].join('\n');

  const aiInput = {
    reportDate,
    districts: submitted.map(row => {
      const counts = impactTotals(row);
      return {
        districtName: row.districtName || districtList.find(([id]) => id === row.districtId)?.[1] || 'ไม่ระบุอำเภอ',
        status: row.status || '', rain: row.rain ?? '', waterLevel: row.waterLevel || '', trend: row.trend || '',
        summary: row.floodReport?.summary || row.notes || '',
        affected: counts.affected.reported ? counts.affected.total : null,
        deaths: counts.deaths.reported ? counts.deaths.total : null,
        injuries: counts.injuries.reported ? counts.injuries.total : null
      };
    }),
    pheoc: pheoc.map(row => ({ group: row.group || '', readiness: row.readiness || '', personnelCount: row.personnelCount ?? '', nextPlan: row.nextPlan || '' })),
    missingDistricts: pending
  };
  return { deterministic, aiInput };
}

async function summarizeWithGemini(input) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  try {
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: 'สรุปสถานการณ์อุทกภัยและสาธารณสุขจังหวัดตรังเป็นภาษาไทยสำหรับส่งกลุ่มปฏิบัติงาน กระชับ เป็นทางการ ยึดเฉพาะข้อมูล JSON ที่ได้รับ ห้ามอนุมานหรือแต่งตัวเลข หากไม่มีข้อมูลให้ระบุว่าไม่มีข้อมูล แยกข้อมูลรายงานกับข้อเสนอแนะให้ชัดเจน' }] },
        contents: [{ role: 'user', parts: [{ text: JSON.stringify(input).slice(0, 24000) }] }],
        generationConfig: { temperature: 0.2, maxOutputTokens: 1400 }
      }),
      signal: AbortSignal.timeout(25000)
    });
    if (!response.ok) return null;
    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.map(part => part.text || '').join('').trim();
    return text || null;
  } catch {
    return null;
  }
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'METHOD_NOT_ALLOWED' });
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || !safeEqual(req.headers.authorization, `Bearer ${cronSecret}`)) return res.status(401).json({ ok: false, error: 'UNAUTHORIZED' });

  const { APPS_SCRIPT_URL, APPS_SCRIPT_TOKEN, LINE_CHANNEL_ACCESS_TOKEN, LINE_GROUP_ID } = process.env;
  if (!APPS_SCRIPT_URL || !APPS_SCRIPT_TOKEN || !LINE_CHANNEL_ACCESS_TOKEN || !LINE_GROUP_ID) {
    return res.status(503).json({ ok: false, error: 'LINE_OR_DATABASE_NOT_CONFIGURED' });
  }
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const reportDate = body.reportDate || new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok' }).format(new Date());
    if (!/^\d{4}-\d{2}-\d{2}$/.test(reportDate) || !Number.isFinite(Date.parse(`${reportDate}T00:00:00Z`))) return res.status(400).json({ ok: false, error: 'INVALID_DATE' });

    const dbResponse = await fetch(APPS_SCRIPT_URL, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'bootstrap', reportDate, token: APPS_SCRIPT_TOKEN }),
      signal: AbortSignal.timeout(25000)
    });
    if (!dbResponse.ok) return res.status(502).json({ ok: false, error: 'DATABASE_UNAVAILABLE' });
    const dbResult = await dbResponse.json();
    if (!dbResult.ok || !dbResult.data) return res.status(502).json({ ok: false, error: 'DATABASE_UNAVAILABLE' });

    const { deterministic, aiInput } = makeSummary(dbResult.data, reportDate);
    const message = (await summarizeWithGemini(aiInput)) || deterministic;
    const text = message.length > 4900 ? `${message.slice(0, 4880)}\n…(ตัดข้อความให้พอดีกับ LINE)` : message;
    const slot = String(body.slot || 'manual');
    const digest = crypto.createHash('sha256').update(`${reportDate}:${slot}`).digest('hex').slice(0, 32).split('');
    digest[12] = '4';
    digest[16] = ((parseInt(digest[16], 16) & 3) | 8).toString(16);
    const hex = digest.join('');
    const retryKey = `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
    const lineResponse = await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: { Authorization: `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`, 'Content-Type': 'application/json', 'X-Line-Retry-Key': retryKey },
      body: JSON.stringify({ to: LINE_GROUP_ID, messages: [{ type: 'text', text }] }),
      signal: AbortSignal.timeout(20000)
    });
    if (lineResponse.status === 409) return res.status(200).json({ ok: true, duplicate: true, reportDate });
    if (!lineResponse.ok) return res.status(502).json({ ok: false, error: 'LINE_SEND_FAILED' });
    return res.status(200).json({ ok: true, reportDate, source: process.env.GEMINI_API_KEY ? 'gemini-or-fallback' : 'data-summary' });
  } catch {
    return res.status(502).json({ ok: false, error: 'SUMMARY_SEND_FAILED' });
  }
};
