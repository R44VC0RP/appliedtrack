import { useRole } from '@/hooks/useRole';
import React from 'react';

interface TierOnlyProps {
  children: React.ReactNode;
  tier: string; // Comma-separated list of allowed tiers
  fallback?: React.ReactNode;
}

export function TierOnly({ children, tier, fallback = null }: TierOnlyProps) {
  const { tier: userTier, loading } = useRole();

  if (loading) {
    return null;
  }

  // Split the tier prop into an array and check if user's tier is included
  const allowedTiers = tier.split(',').map(t => t.trim().toLowerCase());

  console.log(userTier);
  
  if (!userTier || !allowedTiers.includes(userTier.toLowerCase())) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

// Usage example:
// <TierOnly tier="pro,enterprise">
//   <PremiumFeature />
// </TierOnly>
