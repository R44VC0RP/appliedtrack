export type UserTier = 'free' | 'pro' | 'power';

export interface SubscriptionStatus {
  isActive: boolean;
  currentTier: UserTier;
  willCancelAtPeriodEnd: boolean;
  currentPeriodEnd?: Date;
}

export interface QuotaNotification {
  type: 'warning' | 'exceeded';
  quotaKey: string;
  currentUsage: number;
  limit: number;
  message: string;
}

export interface SubscriptionChange {
  fromTier: UserTier;
  toTier: UserTier;
  effectiveDate: Date;
  isUpgrade: boolean;
}

export interface StripeCheckoutOptions {
  customerId?: string;
  targetTier: Exclude<UserTier, 'free'>;
  returnUrl: string;
  priceId: string;
}

export interface QuotaResetOptions {
  userId: string;
  tier: UserTier;
  resetDate: Date;
}
