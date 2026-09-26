// Stateless relay for OpenAI embeddings, used only for semantic product search.
// OpenAI omits CORS headers on error responses, so a browser calling it directly
// sees "Failed to fetch" for a bad key. This route forwards the visitor's own key
// with the one request and returns OpenAI's answer. The key is never logged or stored,
// and the route can only call the embeddings endpoint with a fixed model.

const MAX_INPUTS = 1100;
const MAX_CHARS = 600;

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: { message: 'Use POST' } });
  }

  const apiKey = req.headers['x-openai-key'];
  if (typeof apiKey !== 'string' || !apiKey.trim() || apiKey.length > 300) {
    return res.status(400).json({ error: { message: 'Missing OpenAI key' } });
  }

  const input = req.body && req.body.input;
  if (
    !Array.isArray(input) ||
    input.length === 0 ||
    input.length > MAX_INPUTS ||
    !input.every((s) => typeof s === 'string' && s.length > 0 && s.length <= MAX_CHARS)
  ) {
    return res.status(400).json({ error: { message: 'input must be a list of short strings' } });
  }

  try {
    const upstream = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey.trim()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input,
        dimensions: 256,
        encoding_format: 'base64',
      }),
    });
    const body = await upstream.text();
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Content-Type', 'application/json');
    return res.status(upstream.status).send(body);
  } catch (_) {
    return res.status(502).json({ error: { message: 'Could not reach OpenAI' } });
  }
};
