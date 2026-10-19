module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'METHOD_NOT_ALLOWED' });
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(503).json({ ok: false, error: 'AI_NOT_CONFIGURED' });
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    if (!body || typeof body.prompt !== 'string' || body.prompt.length > 30000) {
      return res.status(400).json({ ok: false, error: 'INVALID_REQUEST' });
    }
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: String(body.systemInstruction || 'สรุปข้อมูลสถานการณ์สาธารณสุขอย่างเป็นทางการ โดยยึดเฉพาะข้อมูลที่ให้มา ห้ามแต่งข้อเท็จจริง') }] },
        contents: [{ role: 'user', parts: [{ text: body.prompt }] }],
        generationConfig: {
          thinkingConfig: { thinkingLevel: 'low' },
          maxOutputTokens: 1800
        }
      }),
      signal: AbortSignal.timeout(55000)
    });
    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.map(part => part.text || '').join('').trim();
    if (!response.ok || !text) return res.status(502).json({ ok: false, error: 'AI_UNAVAILABLE' });
    return res.status(200).json({ ok: true, text });
  } catch {
    return res.status(502).json({ ok: false, error: 'AI_UNAVAILABLE' });
  }
};
