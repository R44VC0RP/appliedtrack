import { useUser } from "@clerk/nextjs";
import { useState, useEffect } from "react";
import { srv_getUserRole } from "@/app/actions/server/job-board/primary";

interface UserRole {
  isAdmin: boolean;
  tier: string;
  loading: boolean;
}

export function useRole(): UserRole {
  const { user, isLoaded } = useUser();
  const [role, setRole] = useState<UserRole>({
    isAdmin: false,
    tier: 'free',
    loading: true
  });

  useEffect(() => {
    const fetchRole = async () => {
      if (!isLoaded || !user) {
        setRole({ isAdmin: false, tier: 'free', loading: false });
        return;
      }

      try {
        const data = await srv_getUserRole();
        setRole({
          isAdmin: data.role === 'admin',
          tier: data.tier,
          loading: false
        });
      } catch (error) {
        console.error('Error fetching user role:', error);
        setRole({ isAdmin: false, tier: 'free', loading: false });
      }
    };

    fetchRole();
  }, [user, isLoaded]);

  return role;
}
