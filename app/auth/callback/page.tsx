"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ShieldCheck, AlertCircle } from "lucide-react";
import { authService } from "@/services/authService";
import { useAuth } from "@/contexts/AuthContext";

function GoogleCallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshUser } = useAuth();
  const [error, setError] = useState("");

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get("code");
      const errorParam = searchParams.get("error");

      // Handle error from Google
      if (errorParam) {
        setError("Google authentication was cancelled or failed");
        setTimeout(() => {
          router.push("/login");
        }, 3000);
        return;
      }

      // Handle missing code
      if (!code) {
        setError("Invalid callback - missing authorization code");
        setTimeout(() => {
          router.push("/login");
        }, 3000);
        return;
      }

      try {
        // Exchange code for tokens
        await authService.handleGoogleCallback(code);
        
        // Fetch user data
        await refreshUser();

        // Redirect to dashboard
        router.push("/dashboard");
      } catch (err) {
        console.error("Google callback error:", err);
        const errorMessage = err instanceof Error ? err.message : "Google authentication failed";
        setError(errorMessage);
        setTimeout(() => {
          router.push("/login");
        }, 3000);
      }
    };

    handleCallback();
  }, [searchParams, router, refreshUser]);

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-lg p-8 md:p-10">
            <div className="flex justify-center mb-6">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
            </div>

            <div className="text-center">
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">
                Authentication Failed
              </h1>
              <p className="text-sm text-slate-600 mb-4">{error}</p>
              <p className="text-xs text-slate-500">Redirecting to login...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-lg p-8 md:p-10">
          <div className="flex justify-center mb-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-50">
              <ShieldCheck className="h-8 w-8 text-blue-600 animate-pulse" />
            </div>
          </div>

          <div className="text-center">
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">
              Signing you in...
            </h1>
            <p className="text-sm text-slate-600">
              Please wait while we complete your Google sign-in.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function GoogleCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-lg p-8 md:p-10">
            <div className="flex justify-center mb-6">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-50">
                <ShieldCheck className="h-8 w-8 text-blue-600 animate-pulse" />
              </div>
            </div>
            <div className="text-center">
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">
                Loading...
              </h1>
            </div>
          </div>
        </div>
      </div>
    }>
      <GoogleCallbackHandler />
    </Suspense>
  );
}

