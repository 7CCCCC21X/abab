// api/aspecta.js
export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end('Method Not Allowed');

  try {
    const chunks = [];
    for await (const c of req) chunks.push(c);
    const rawBody = Buffer.concat(chunks);

    const upstream = 'https://passport.aspecta.ai/api/passport/user-extra-info/';
    const r = await fetch(upstream, {          // ← 直接全局 fetch
      method : 'POST',
      headers: {
        'Content-Type' : req.headers['content-type'] || '',
        'Authorization': req.headers.authorization || ''
      },
      body: rawBody
    });

    const buf = Buffer.from(await r.arrayBuffer());
    r.headers.forEach((v,k)=>{ if(k==='content-type') res.setHeader(k,v); });
    res.status(r.status).send(buf);

  } catch (err) {
    console.error(err);
    res.status(502).json({ error:'proxy failed', detail:err.message });
  }
}
