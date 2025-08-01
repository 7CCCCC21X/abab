// api/aspecta.js
// vercel serverless function
import fetch from 'node-fetch';

export const config = {
  api: { bodyParser: false }        // ★ 禁掉 Next.js 默认的 body 解析
};

export default async function handler(req, res) {
  if (req.method !== 'POST')
    return res.status(405).end('Method Not Allowed');

  try {
    // 1️⃣ 原样读取整个 multipart 流
    const chunks = [];
    for await (const c of req) chunks.push(c);
    const rawBody = Buffer.concat(chunks);

    // 2️⃣ 转发到 Aspecta
    const upstream = 'https://passport.aspecta.ai/api/passport/user-extra-info/';
    const upstreamRes = await fetch(upstream, {
      method : 'POST',
      headers: {
        // 复制原始 Content-Type（含 boundary）让表单保持完整
        'Content-Type' : req.headers['content-type'] || '',
        // 复制 Authorization
        'Authorization': req.headers.authorization || ''
      },
      body: rawBody
    });

    // 3️⃣ 把上游返回头和状态透传给浏览器
    upstreamRes.headers.forEach((v, k) => {
      if (k.toLowerCase() === 'content-type') res.setHeader(k, v);
    });
    res.status(upstreamRes.status);
    res.send(Buffer.from(await upstreamRes.arrayBuffer()));
  } catch (e) {
    res.status(502).json({ error: 'proxy failed', detail: e.message });
  }
}
