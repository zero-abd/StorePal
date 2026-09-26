// Product search over the WinMart catalog (public/inventory.json), all in the browser.
// Keyword search needs no key. Semantic search uses the visitor's own OpenAI key,
// sent with each request through the stateless /api/embeddings route and never stored.

const STOPWORDS = new Set(
  (
    'a an and any are aisle at buy can carry could do does find for get got have hello help hey hi i ' +
    'in is it item items looking locate located me my need of on or please product products sell ' +
    'show some store the there they this to want what whats where wheres which with would you your ' +
    'im id get find kind something anything stuff thing things good best'
  ).split(' ')
);

export function stem(word) {
  if (word.length > 4 && word.endsWith('ies')) return word.slice(0, -3) + 'y';
  if (word.length > 4 && /(s|x|z|ch|sh)es$/.test(word)) return word.slice(0, -2);
  if (word.length > 3 && word.endsWith('s') && !word.endsWith('ss')) return word.slice(0, -1);
  return word;
}

function words(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9%\s-]/g, ' ')
    .split(/[\s-]+/)
    .filter(Boolean);
}

export function queryTerms(query) {
  return words(query.replace(/'s\b/g, ''))
    .filter((w) => !STOPWORDS.has(w))
    .map(stem);
}

// Adds stemmed word lists and inverse document frequencies, so rare words
// ("almond") count for more than common ones ("milk").
export function prepareCatalog(items) {
  const prepared = items.map((item) => ({
    ...item,
    nameStems: words(item.name).map(stem),
    categoryStems: words(item.category).map(stem),
    descStems: words(item.description).map(stem),
  }));
  const df = new Map();
  for (const item of prepared) {
    for (const w of new Set([...item.nameStems, ...item.categoryStems, ...item.descStems])) {
      df.set(w, (df.get(w) || 0) + 1);
    }
  }
  const idf = (w) => 1 + Math.log(prepared.length / (1 + (df.get(w) || 0)));
  prepared.idf = idf;
  return prepared;
}

let catalogPromise = null;
export function loadCatalog() {
  if (!catalogPromise) {
    catalogPromise = fetch(`${process.env.PUBLIC_URL}/inventory.json`)
      .then((r) => {
        if (!r.ok) throw new Error(`Could not load the product catalog (${r.status})`);
        return r.json();
      })
      .then(prepareCatalog)
      .catch((err) => {
        catalogPromise = null;
        throw err;
      });
  }
  return catalogPromise;
}

function keywordScore(item, terms, idf) {
  if (!terms.length) return { score: 0, coverage: 0 };
  let score = 0;
  let matched = 0;
  let inName = 0;
  for (const t of terms) {
    let s = 0;
    if (item.nameStems.includes(t)) s = 3;
    else if (t.length >= 3 && item.nameStems.some((w) => w.startsWith(t))) s = 2;
    else if (item.categoryStems.includes(t)) s = 1.5;
    else if (item.descStems.includes(t)) s = 1;
    if (s > 0) matched += 1;
    if (s >= 2) inName += 1;
    score += s * idf(t);
  }
  if (!matched) return { score: 0, coverage: 0 };
  const coverage = matched / terms.length;
  // Reward items that match every word the shopper said, and prefer names
  // with fewer unrelated words ("Peanut Butter Creamy" over "Cookies Peanut Butter").
  const nameText = item.nameStems.join(' ');
  const phrase = terms.join(' ');
  let bonus = 0;
  if (terms.length > 1) {
    if (nameText.includes(phrase)) bonus += 1;
    if (nameText.startsWith(phrase)) bonus += 0.5;
    for (let i = 0; i + 1 < terms.length; i++) {
      if (nameText.includes(`${terms[i]} ${terms[i + 1]}`)) bonus += 0.5;
    }
  } else {
    // English product names put the noun last: "Organic Bananas", not "Banana Chips".
    const n = item.nameStems;
    if (n[n.length - 1] === terms[0]) bonus += 0.7;
    else if (n[n.length - 2] === terms[0]) bonus += 0.4;
  }
  bonus -= 0.1 * Math.max(0, item.nameStems.length - inName);
  return { score: score * coverage + bonus, coverage };
}

export function keywordSearch(catalog, query, limit = 5) {
  const terms = queryTerms(query);
  if (!terms.length) return [];
  const scored = catalog
    .map((item) => ({ item, ...keywordScore(item, terms, catalog.idf) }))
    .filter((r) => r.coverage > 0)
    .sort((a, b) => b.coverage - a.coverage || b.score - a.score);
  if (!scored.length) return [];
  const best = scored[0];
  return scored
    .filter((r) => r.coverage === best.coverage && r.score >= best.score * 0.6)
    .slice(0, limit);
}

// ---------- Semantic search with the visitor's OpenAI key ----------

let catalogVectors = null; // embeddings of the public catalog only (no key material)

function decodeBase64Floats(b64) {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Float32Array(bytes.buffer);
}

async function embed(apiKey, inputs) {
  // Goes through this site's stateless /api/embeddings route (see api/embeddings.js),
  // which forwards the key to OpenAI with this one request and keeps nothing.
  const res = await fetch('/api/embeddings', {
    method: 'POST',
    headers: {
      'x-openai-key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ input: inputs }),
  });
  if (!res.ok) {
    let msg = `OpenAI returned ${res.status}`;
    try {
      const body = await res.json();
      if (body?.error?.message) msg = `OpenAI: ${body.error.message}`;
    } catch (_) {}
    throw new Error(msg);
  }
  const body = await res.json();
  return body.data
    .sort((a, b) => a.index - b.index)
    .map((d) => decodeBase64Floats(d.embedding));
}

function cosine(a, b) {
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb) || 1);
}

export function isCatalogIndexed() {
  return catalogVectors !== null;
}

export async function semanticSearch(apiKey, catalog, query, limit = 5) {
  if (!catalogVectors) {
    const texts = catalog.map((i) => `${i.name}. ${i.category}. ${i.description}`);
    catalogVectors = await embed(apiKey, texts);
  }
  const [q] = await embed(apiKey, [query]);
  const terms = queryTerms(query);
  const scored = catalog
    .map((item, idx) => ({
      item,
      similarity: cosine(q, catalogVectors[idx]),
      kw: keywordScore(item, terms, catalog.idf),
    }))
    .map((r) => ({
      ...r,
      coverage: 1,
      score: r.similarity + 0.05 * r.kw.coverage,
    }))
    .sort((a, b) => b.score - a.score);
  const best = scored[0];
  if (!best || best.similarity < 0.3) return [];
  return scored.filter((r) => r.score >= best.score - 0.08).slice(0, limit);
}

// ---------- Turning results into an answer ----------

export function answerFor(query, results) {
  if (!queryTerms(query).length) {
    return {
      text: "Ask me where something is, like \"Where can I find almond milk?\" and I'll point it out on the map.",
      aisles: [],
    };
  }
  if (!results.length) {
    return {
      text: "Sorry, I couldn't find that in WinMart's catalog. Try another name for it, like \"peanut butter\" or \"dog food\".",
      aisles: [],
    };
  }
  const [top, ...rest] = results.map((r) => r.item);
  const exact = results[0].coverage === undefined || results[0].coverage >= 1;
  let text = exact ? '' : "I couldn't find an exact match. The closest thing I have: ";
  text += `${top.name} is in aisle ${top.aisle} (${top.category}).`;
  if (rest.length) {
    const others = rest.map((i) => `${i.name} in ${i.aisle}`);
    text += ` I also found ${others.slice(0, -1).join(', ')}${others.length > 1 ? ' and ' : ''}${others[others.length - 1]}.`;
  }
  const aisles = [...new Set(results.map((r) => r.item.aisle))];
  return { text, aisles };
}
