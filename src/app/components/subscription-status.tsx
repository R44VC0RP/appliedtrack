import { CompleteUserProfile } from "@/lib/useUser";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

interface SubscriptionStatusProps {
  user: CompleteUserProfile;
}

export function SubscriptionStatus({ user }: SubscriptionStatusProps) {
  const router = useRouter();
  
  if (!user.currentPeriodEnd || !user.tier || user.tier === 'free') {
    return null;
  }

  const endDate = new Date(user.currentPeriodEnd);
  const now = new Date();
  const daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (!user.cancelAtPeriodEnd) {
    return null;
  }

  return (
    <div className="rounded-lg bg-yellow-50 p-4 mt-4">
      <div className="flex">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3 flex-grow">
          <h3 className="text-sm font-medium text-yellow-800">
            Subscription Cancellation Notice
          </h3>
          <div className="mt-2 text-sm text-yellow-700">
            <p>
              Your {user.tier} subscription has been cancelled and will end on {endDate.toLocaleDateString()}. 
              {daysRemaining > 0 ? ` You have ${daysRemaining} days remaining of premium access.` : ''}
            </p>
            <p className="mt-2">
              After this date, your account will be converted to a free tier. Don't lose your premium features!
            </p>
          </div>
          <div className="mt-4">
            <Button
              onClick={() => router.push('/settings?tab=subscription')}
              className="bg-yellow-600 hover:bg-yellow-700 text-white"
            >
              Manage Subscription
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
