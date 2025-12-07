import Redis from 'ioredis';

let redis: Redis | null = null;

export function getRedisClient(): Redis {
  if (!redis) {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    redis = new Redis(redisUrl);
    
    redis.on('error', (err) => {
      console.error('Redis Client Error:', err);
    });
  }
  
  return redis;
}

export async function getChatSession(sessionId: string): Promise<unknown> {
  const client = getRedisClient();
  const data = await client.get(`chat:${sessionId}`);
  return data ? JSON.parse(data) : null;
}

export async function setChatSession(sessionId: string, data: unknown, ttl = 3600): Promise<void> {
  const client = getRedisClient();
  await client.setex(`chat:${sessionId}`, ttl, JSON.stringify(data));
}

export async function deleteChatSession(sessionId: string): Promise<void> {
  const client = getRedisClient();
  await client.del(`chat:${sessionId}`);
}

