"use client";

import { useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";

/**
 * Redirect component for /auth/signup to /signup
 * Preserves query parameters (invite token and email)
 */
function AuthSignupRedirectHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Get all query parameters
    const invite = searchParams.get("invite");
    const email = searchParams.get("email");
    
    // Build redirect URL with query parameters
    const params = new URLSearchParams();
    if (invite) params.set("invite", invite);
    if (email) params.set("email", email);
    
    const queryString = params.toString();
    const redirectUrl = `/signup${queryString ? `?${queryString}` : ""}`;
    
    // Redirect to actual signup page
    router.replace(redirectUrl);
  }, [router, searchParams]);

  // Show loading while redirecting
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-slate-900 border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
        <p className="mt-4 text-slate-600 text-sm">Redirecting...</p>
      </div>
    </div>
  );
}

/**
 * Redirect page for /auth/signup to /signup
 * Preserves query parameters (invite token and email)
 */
export default function AuthSignupRedirect() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-slate-900 border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
            <p className="mt-4 text-slate-600 text-sm">Loading...</p>
          </div>
        </div>
      }
    >
      <AuthSignupRedirectHandler />
    </Suspense>
  );
}

