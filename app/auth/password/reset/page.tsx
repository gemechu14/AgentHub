"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function PasswordResetRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  useEffect(() => {
    // Redirect to the actual reset password page with the token preserved
    if (token) {
      router.replace(`/reset-password?token=${encodeURIComponent(token)}`);
    } else {
      // If no token, redirect to forgot password page
      router.replace("/forgot-password");
    }
  }, [token, router]);

  // Show loading state while redirecting
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-lg p-8 md:p-10">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-slate-900 border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2 mt-4">
              Redirecting...
            </h1>
            <p className="text-sm text-slate-600">
              Please wait while we redirect you to the password reset page.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PasswordResetPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-lg p-8 md:p-10">
            <div className="text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-slate-900 border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2 mt-4">
                Loading...
              </h1>
            </div>
          </div>
        </div>
      </div>
    }>
      <PasswordResetRedirect />
    </Suspense>
  );
}


