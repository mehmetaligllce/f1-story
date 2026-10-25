// components/ModeGuard.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/src/store/gameStore';

interface ModeGuardProps {
  requiredMode: number;
  children: React.ReactNode;
  fallbackUrl?: string;
}

export default function ModeGuard({requiredMode,children,fallbackUrl = '/',}: ModeGuardProps) {
  const mode = useGameStore((state) => state.mode);
  const router = useRouter();

  useEffect(() => {
    if (mode !== requiredMode) {
      router.push(fallbackUrl);
    }
  }, [mode, requiredMode, fallbackUrl, router]);

  if (mode !== requiredMode) {
    return null; 
  }

  return <>{children}</>;
}