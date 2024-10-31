import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';

export function useRole() {
  const { userId } = useAuth();
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      fetch('/api/user')
        .then(res => res.json())
        .then(data => {
          
          setRole(data.role);
          setLoading(false);
        })
        .catch(error => {
          console.error('Error fetching user role:', error);
          setLoading(false);
        });
    }
  }, [userId]);

  return { role, loading, isAdmin: role === 'admin' };
}
