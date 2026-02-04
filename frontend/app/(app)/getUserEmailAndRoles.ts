// app/(app)/getUserEmailAndRoles.ts
'use client';

// Utility to decode JWT and extract email and roles from the access_token cookie
export function getUserEmailAndRoles(): { email: string | null, roles: string[] } {
  if (typeof document === 'undefined') return { email: null, roles: [] };
  const match = document.cookie.match(/access_token=([^;]+)/);
  if (!match) return { email: null, roles: [] };
  const token = match[1];
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const email = payload?.email || null;
    let roles: string[] = [];
    if (payload && payload.roles && Array.isArray(payload.roles)) {
      roles = payload.roles;
    } else if (payload && payload.role) {
      roles = [payload.role];
    }
    return { email, roles };
  } catch (e) {
    return { email: null, roles: [] };
  }
}
