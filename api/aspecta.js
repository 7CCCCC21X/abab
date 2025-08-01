/**
 * POST /api/aspecta
 * 转发到 https://passport.aspecta.ai/api/passport/user-extra-info/
 * 保留 multipart/form-data 与 Authorization 头，解决浏览器 CORS 限制
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end('Method Not Allowed');

  try {
    const upstream = 'https://passport.aspecta.ai/api/passport/user-extra-info/';

    // 注意：Vercel 会自动处理 multipart，将 req.body 作为 Buffer 传递
    const proxyRes = await fetch(upstream, {
      method : 'POST',
      headers: {
        // 只转发必要头；Host / Content-Length 等由 fetch 处理
        'Authorization': req.headers.authorization || '',
      },
      body: req.body
    });

    // 透传关键响应头（可选）
    proxyRes.headers.forEach((v, k) => {
      if (k.toLowerCase() === 'content-type') res.setHeader(k, v);
    });

    const buf = Buffer.from(await proxyRes.arrayBuffer());
    res.status(proxyRes.status).send(buf);
  } catch (err) {
    res.status(502).json({ error: 'proxy failed', detail: err.message });
  }
}
