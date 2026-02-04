// app/(app)/useUserRole.ts
'use client';

// Utility to decode JWT and extract roles from the access_token cookie
export function getUserRole(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/access_token=([^;]+)/);
  if (!match) return null;
  const token = match[1];
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    // Adapt this if your JWT structure is different
    if (payload && payload.roles && Array.isArray(payload.roles)) {
      // Return first role or join if multiple
      return payload.roles[0] || null;
    }
    if (payload && payload.role) {
      return payload.role;
    }
    return null;
  } catch (e) {
    return null;
  }
}
