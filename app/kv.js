const { Redis } = require('@upstash/redis');

function getRedis() {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    throw new Error(
      "Variables d'environnement Redis manquantes. Connecte une base Upstash Redis à ce projet depuis l'onglet Storage de Vercel."
    );
  }
  return new Redis({ url, token });
}

module.exports = async (req, res) => {
  try {
    const redis = getRedis();

    if (req.method === 'GET') {
      const key = req.query.key;
      if (!key) return res.status(400).json({ error: 'key requis' });
      const value = await redis.get(key);
      return res.status(200).json({ value: value === undefined ? null : value });
    }

    if (req.method === 'POST') {
      const { key, value } = req.body || {};
      if (!key) return res.status(400).json({ error: 'key requis' });
      await redis.set(key, value);
      return res.status(200).json({ ok: true });
    }

    if (req.method === 'DELETE') {
      const key = req.query.key;
      if (!key) return res.status(400).json({ error: 'key requis' });
      await redis.del(key);
      return res.status(200).json({ ok: true });
    }

    res.status(405).json({ error: 'méthode non supportée' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
