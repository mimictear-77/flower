// AI 对话代理 —— API key 只存在此处，前端不可见
exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: corsHeaders() };
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  let body;
  try { body = JSON.parse(event.body); }
  catch (e) { return { statusCode: 400, body: 'Invalid JSON' }; }

  const { messages, apiType } = body;
  if (!messages || !Array.isArray(messages)) {
    return { statusCode: 400, body: 'Missing messages' };
  }

  let apiBase, apiKey, model;
  if (apiType === 'gm') {
    apiBase = process.env.GM_BASE;
    apiKey  = process.env.GM_KEY;
    model   = 'gemini-2.5-pro';
  } else {
    apiBase = 'https://api.deepseek.com';
    apiKey  = process.env.DEEPSEEK_KEY;
    model   = 'deepseek-chat';
  }

  try {
    const resp = await fetch(`${apiBase}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ model, max_tokens: 2048, messages }),
    });

    const data = await resp.json();
    return {
      statusCode: resp.status,
      headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    };
  } catch (e) {
    return {
      statusCode: 500,
      headers: corsHeaders(),
      body: JSON.stringify({ error: { message: e.message } }),
    };
  }
};

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
}
