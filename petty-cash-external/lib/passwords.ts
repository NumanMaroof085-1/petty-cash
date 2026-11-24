import { createHash, randomBytes, scrypt, timingSafeEqual } from 'node:crypto';

const options = { N: 32768, r: 8, p: 3, maxmem: 64 * 1024 * 1024 };
const dummySalt = Buffer.alloc(16, 0x8a);

function derive(password: string, salt: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, 32, options, (error, result) => error ? reject(error) : resolve(result));
  });
}

export async function hashPassword(password: string) {
  const salt = randomBytes(16);
  const derived = await derive(password, salt);
  return ['scrypt-v1', salt.toString('hex'), derived.toString('hex')].join(':');
}

export async function verifyPassword(password: string, stored?: string) {
  const match = /^scrypt-v1:([0-9a-f]{32}):([0-9a-f]{64})$/.exec(stored ?? '');
  const derived = await derive(password, match ? Buffer.from(match[1], 'hex') : dummySalt);
  return match !== null && timingSafeEqual(derived, Buffer.from(match[2], 'hex'));
}

export function tokenDigest(token: string) {
  return createHash('sha256').update(token).digest('hex');
}
