"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

/**
 * This page handles the typo URL from backend: /oauth/google/callbacall
 * It redirects to the correct callback URL with the same query parameters
 */
function TypoRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Get all query parameters
    const params = new URLSearchParams();
    searchParams.forEach((value, key) => {
      params.append(key, value);
    });

    // Redirect to correct callback URL with same params
    const queryString = params.toString();
    router.replace(`/oauth/google/callback${queryString ? `?${queryString}` : ""}`);
  }, [router, searchParams]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-slate-900 border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
        <p className="mt-4 text-slate-600 text-sm">Redirecting...</p>
      </div>
    </div>
  );
}

export default function TypoRedirectPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-slate-900 border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
          <p className="mt-4 text-slate-600 text-sm">Loading...</p>
        </div>
      </div>
    }>
      <TypoRedirect />
    </Suspense>
  );
}


