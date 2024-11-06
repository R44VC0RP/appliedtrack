import { clerkMiddleware } from "@clerk/nextjs/server";
import { EdgeLogger } from "@/lib/edge-logger";

export default clerkMiddleware(async (auth, req) => {
  // Log the request without blocking
  const ignoreRoutes = ['/api/log', '/api/auth', '/api/admin/logs'];

  for (const route of ignoreRoutes) {
    if (req.url.includes(route)) {
      return;
    }
  }

  // EdgeLogger.info('clerkMiddleware', {
  //   url: req.url,
  //   method: req.method,
  //   auth: auth.userId ? { userId: auth.userId } : { status: 'unauthorized' }
  // });
});

export const config = {
  matcher: [
    '/((?!.+\\.[\\w]+$|_next).*)',
    '/',
    '/(api|trpc)(.*)',
    '/api/log'
  ]
};
