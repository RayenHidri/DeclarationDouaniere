'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

export function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      router.push('/auth/login');
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleLogout}
      disabled={loading}
      className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
    >
      {loading ? 'Déconnexion…' : 'Déconnexion'}
    </Button>
  );
}
