const crypto = require('crypto');

async function readRawBody(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 1024 * 1024) throw new Error('BODY_TOO_LARGE');
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'METHOD_NOT_ALLOWED' });
  const channelSecret = process.env.LINE_CHANNEL_SECRET;
  if (!channelSecret) return res.status(503).json({ ok: false, error: 'LINE_CHANNEL_SECRET_NOT_CONFIGURED' });
  try {
    const raw = await readRawBody(req);
    const supplied = req.headers['x-line-signature'] || '';
    const expected = crypto.createHmac('sha256', channelSecret).update(raw).digest('base64');
    const left = Buffer.from(String(supplied));
    const right = Buffer.from(expected);
    if (left.length !== right.length || !crypto.timingSafeEqual(left, right)) return res.status(401).json({ ok: false, error: 'INVALID_SIGNATURE' });

    const payload = JSON.parse(raw.toString('utf8'));
    const groups = [...new Set((Array.isArray(payload.events) ? payload.events : [])
      .filter(event => event?.source?.type === 'group' && typeof event.source.groupId === 'string')
      .map(event => event.source.groupId))];
    if (groups.length) console.info('Verified LINE group IDs:', JSON.stringify(groups));
    return res.status(200).json({ ok: true });
  } catch {
    return res.status(400).json({ ok: false, error: 'INVALID_WEBHOOK' });
  }
};

module.exports.config = { api: { bodyParser: false } };
