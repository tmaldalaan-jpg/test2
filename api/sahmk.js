// api/sahmk.js — Vercel Serverless Function
// Proxy بين الـ frontend وـ sahmk.sa API
// يحمي الـ API key ويحل مشكلة CORS

const API_KEY  = process.env.SAHMK_API_KEY;
const BASE_URL = 'https://app.sahmk.sa/api/v1';

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (!API_KEY) {
    return res.status(500).json({ error: 'SAHMK_API_KEY غير مضبوط في Environment Variables' });
  }

  // المسار المطلوب مثل /stocks أو /stocks/2222/indicators
  const { path = 'stocks', ...queryParams } = req.query;

  // بناء URL الكامل
  const url = new URL(`${BASE_URL}/${path}`);
  Object.entries(queryParams).forEach(([k, v]) => url.searchParams.set(k, v));

  try {
    const response = await fetch(url.toString(), {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    const data = await response.json();

    // cache 5 دقائق لتقليل الطلبات
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=60');
    return res.status(response.status).json(data);

  } catch (err) {
    return res.status(502).json({ error: 'فشل الاتصال بـ sahmk.sa', details: err.message });
  }
}
