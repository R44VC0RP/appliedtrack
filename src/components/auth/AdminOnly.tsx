import { useRole } from '@/hooks/useRole';
import React from 'react';

interface AdminOnlyProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function AdminOnly({ children, fallback = null }: AdminOnlyProps) {
  const { isAdmin, loading } = useRole();

  if (loading) {
    return null; // Or return a loading spinner if you prefer
  }

  if (!isAdmin) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
