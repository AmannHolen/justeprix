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
    const session =
      req.method === 'GET' || req.method === 'DELETE'
        ? req.query.session
        : (req.body || {}).session;

    if (!session) return res.status(400).json({ error: 'session requis' });
    const hashKey = `players:${session}`;

    if (req.method === 'GET') {
      const all = await redis.hgetall(hashKey);
      return res.status(200).json({ players: all || {} });
    }

    if (req.method === 'POST') {
      const { playerId, doc } = req.body || {};
      if (!playerId) return res.status(400).json({ error: 'playerId requis' });
      await redis.hset(hashKey, { [playerId]: doc });
      return res.status(200).json({ ok: true });
    }

    if (req.method === 'DELETE') {
      await redis.del(hashKey);
      return res.status(200).json({ ok: true });
    }

    res.status(405).json({ error: 'méthode non supportée' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
