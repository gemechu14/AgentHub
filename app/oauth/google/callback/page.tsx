"use client";

import { useEffect, useState, Suspense, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { AlertCircle } from "lucide-react";
import { authService } from "@/services/authService";
import { useAuth } from "@/contexts/AuthContext";

function GoogleOAuthCallback() {
  const searchParams = useSearchParams();
  const { setAccessToken, setRefreshToken, setUser } = useAuth();
  const [error, setError] = useState("");
  const [isProcessing, setIsProcessing] = useState(true);
  
  // Use ref to track if callback has been processed (prevents duplicate calls in React StrictMode)
  const processedRef = useRef(false);

  useEffect(() => {
    // Prevent duplicate processing (React StrictMode can cause double calls)
    if (processedRef.current) {
      return;
    }

    const handleCallback = async () => {
      // Mark as processing immediately to prevent duplicate calls
      processedRef.current = true;

      const code = searchParams.get("code");
      const errorParam = searchParams.get("error");

      // Handle error from Google
      if (errorParam) {
        setError("Google authentication was cancelled or failed");
        setIsProcessing(false);
        setTimeout(() => {
          window.location.href = "/login?error=google_cancelled";
        }, 2000);
        return;
      }

      // Handle missing code
      if (!code) {
        setError("Invalid callback - missing authorization code");
        setIsProcessing(false);
        setTimeout(() => {
          window.location.href = "/login?error=no_code";
        }, 2000);
        return;
      }

      try {
        // Exchange code for tokens
        // This will automatically store tokens in localStorage
        const tokens = await authService.handleGoogleCallback(code);
        
        // Manually update context state immediately
        setAccessToken(tokens.access_token);
        setRefreshToken(tokens.refresh_token);
        
        // Fetch profile to update auth context
        const profile = await authService.getProfile();
        if (profile) {
          setUser(profile);
        }

        // Immediately redirect to dashboard - no loading page shown
        // Use window.location.replace for clean redirect (no back button history)
        const returnUrl = searchParams.get("state") || "/dashboard";
        window.location.replace(returnUrl ? decodeURIComponent(returnUrl) : "/dashboard");
      } catch (err) {
        console.error("OAuth callback error:", err);
        const errorMessage = err instanceof Error ? err.message : "Google sign-in failed";
        setError(errorMessage);
        setIsProcessing(false);
        processedRef.current = false; // Allow retry on error
        setTimeout(() => {
          window.location.href = "/login?error=google_signin_failed";
        }, 2000);
      }
    };

    handleCallback();
  }, [searchParams, setAccessToken, setRefreshToken, setUser]);

  // Show error state
  if (error && !isProcessing) {
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
              <p className="text-xs text-slate-500 mb-6">Redirecting to login...</p>
              
              <button
                onClick={() => window.location.href = "/login"}
                className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 transition-colors"
              >
                Go to Login
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show nothing while processing - redirect happens immediately
  // This prevents the "Completing sign-in..." page from showing
  return null;
}

export default function GoogleOAuthCallbackPage() {
  return (
    <Suspense fallback={null}>
      <GoogleOAuthCallback />
    </Suspense>
  );
}

