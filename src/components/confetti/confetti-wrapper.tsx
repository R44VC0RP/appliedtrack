'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import Confetti from './index';
import { devLog } from '@/lib/devLog';

export function ConfettiWrapper() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const showConfetti = searchParams.get('celebrate') === 'true';
  devLog.info('ConfettiWrapper', { showConfetti });

  if (showConfetti) {
    const nextSearchParams = new URLSearchParams(searchParams.toString());
    nextSearchParams.delete('celebrate');
    router.replace(`${pathname}?${nextSearchParams}`);
    return <Confetti />;
  }

  return null;
}
