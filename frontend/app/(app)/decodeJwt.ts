// app/(app)/decodeJwt.ts
import jwt from 'jsonwebtoken';

export function decodeJwt(token: string): { email: string | null, roles: string[] } {
  try {
    const payload = jwt.decode(token) as any;
    const email = payload?.email ?? null;
    let roles: string[] = [];
    if (payload && payload.roles && Array.isArray(payload.roles)) {
      roles = payload.roles;
    } else if (payload && payload.role) {
      roles = [payload.role];
    }
    return { email, roles };
  } catch {
    return { email: null, roles: [] };
  }
}
