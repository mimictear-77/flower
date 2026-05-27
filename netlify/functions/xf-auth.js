// 讯飞 WebSocket 签名生成 —— 密钥只存在此处，前端只拿到签名后的 URL
const crypto = require('crypto');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: corsHeaders() };
  }

  const appId     = process.env.XF_APPID;
  const apiKey    = process.env.XF_APIKEY;
  const apiSecret = process.env.XF_APISECRET;

  if (!appId || !apiKey || !apiSecret) {
    return { statusCode: 500, body: JSON.stringify({ error: '讯飞环境变量未配置' }) };
  }

  const host    = 'iat-api.xfyun.cn';
  const date    = new Date().toUTCString();
  const signStr = `host: ${host}\ndate: ${date}\nGET /v2/iat HTTP/1.1`;

  const signature = crypto
    .createHmac('sha256', apiSecret)
    .update(signStr)
    .digest('base64');

  const authStr      = `api_key="${apiKey}", algorithm="hmac-sha256", headers="host date request-line", signature="${signature}"`;
  const authorization = Buffer.from(authStr).toString('base64');

  const wsUrl = `wss://${host}/v2/iat`
    + `?authorization=${encodeURIComponent(authorization)}`
    + `&date=${encodeURIComponent(date)}`
    + `&host=${host}`;

  return {
    statusCode: 200,
    headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: wsUrl, appId }),
  };
};

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
  };
}
