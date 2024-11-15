import { useRole } from './useRole';
import { ReactNode } from 'react';

interface AdminOnlyProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function AdminOnly({ children, fallback }: AdminOnlyProps) {
  const { isAdmin, loading } = useRole();

  if (loading) {
    return null;
  }

  if (!isAdmin) {
    return fallback || null;
  }

  return (<>{children}</>);
}

