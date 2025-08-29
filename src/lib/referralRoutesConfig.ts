export const REFERRAL_PROTECTED_ROUTES = [
  '/referral-management',
  // Exemple futur : '/admin/vaults', '/dashboard'
] as const;

export type ProtectedRoute = typeof REFERRAL_PROTECTED_ROUTES[number];

export function isReferralProtectedRoute(path: string): path is ProtectedRoute {
  return (REFERRAL_PROTECTED_ROUTES as readonly string[]).includes(path);
}
