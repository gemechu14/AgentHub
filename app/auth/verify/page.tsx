"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ShieldCheck, CheckCircle, AlertCircle, ArrowLeft } from "lucide-react";
import { authService } from "@/services/authService";

function VerifyEmailHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [isVerifying, setIsVerifying] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setError("Invalid verification link - missing token");
        setIsVerifying(false);
        return;
      }

      try {
        await authService.verifyEmail(token);
        setSuccess(true);
        // Redirect to login after 2 seconds
        setTimeout(() => {
          router.push("/login");
        }, 2000);
      } catch (err) {
        console.error("Verification error:", err);
        const errorMessage = err instanceof Error ? err.message : "Email verification failed";
        setError(errorMessage);
      } finally {
        setIsVerifying(false);
      }
    };

    verifyToken();
  }, [token, router]);

  // Show success state
  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-lg p-8 md:p-10">
            <div className="flex justify-center mb-6">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-50">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <div className="text-center">
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">
                Email Verified!
              </h1>
              <p className="text-sm text-slate-600 mb-4">
                Your email has been successfully verified. Redirecting to login...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show verifying state
  if (isVerifying) {
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
                Verifying...
              </h1>
              <p className="text-sm text-slate-600">Please wait while we verify your email.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-lg p-8 md:p-10">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to sign in</span>
          </Link>

          <div className="flex justify-center mb-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
          </div>

          <div className="text-center mb-4">
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">
              Verification Failed
            </h1>
            <p className="text-sm text-slate-600 mb-4">{error}</p>
            <p className="text-xs text-slate-500">
              The verification link may have expired or is invalid.
            </p>
          </div>

          <div className="mt-6 space-y-3">
            <Link
              href="/login"
              className="block w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 transition-colors text-center"
            >
              Go to Login
            </Link>
            <Link
              href="/forgot-password"
              className="block w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 transition-colors text-center"
            >
              Request New Verification Email
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
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
              <p className="text-sm text-slate-600">Please wait...</p>
            </div>
          </div>
        </div>
      </div>
    }>
      <VerifyEmailHandler />
    </Suspense>
  );
}


