import crypto from 'crypto';

const SECRET = process.env.SESSION_SECRET || 'smpn43surabayasupersecretgradkey2026';

export interface AdminSession {
  username: string;
}

export function createToken(username: string): string {
  const payload = {
    username,
    exp: Date.now() + 2 * 60 * 60 * 1000, // 2 Jam Token Sesi
  };
  const dataStr = JSON.stringify(payload);
  const base64Data = Buffer.from(dataStr).toString('base64');
  const signature = crypto.createHmac('sha256', SECRET).update(dataStr).digest('hex');
  return `${base64Data}.${signature}`;
}

export function verifyToken(token: string): AdminSession | null {
  if (!token) return null;
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return null;
    const [base64Data, signature] = parts;
    const dataStr = Buffer.from(base64Data, 'base64').toString('utf8');
    const expectedSignature = crypto.createHmac('sha256', SECRET).update(dataStr).digest('hex');
    
    // Verifikasi tanda tangan hmac
    if (signature !== expectedSignature) return null;
    
    const payload = JSON.parse(dataStr);
    // Verifikasi kedaluwarsa
    if (payload.exp < Date.now()) {
      return null;
    }
    
    return { username: payload.username };
  } catch (error) {
    return null;
  }
}
