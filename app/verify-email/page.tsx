"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";

function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "gemechubulti13341@gmail.com";
  
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleCodeChange = (index: number, value: string) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    // Handle backspace
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").slice(0, 6);
    if (/^\d+$/.test(pastedData)) {
      const newCode = [...code];
      pastedData.split("").forEach((digit, index) => {
        if (index < 6) {
          newCode[index] = digit;
        }
      });
      setCode(newCode);
      // Focus the next empty input or the last one
      const nextIndex = Math.min(pastedData.length, 5);
      inputRefs.current[nextIndex]?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const verificationCode = code.join("");
    
    if (verificationCode.length !== 6) {
      return;
    }

    setIsLoading(true);
    // Simulate verification
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsLoading(false);
    
    // Redirect to dashboard after successful verification
    router.push("/");
  };

  // Focus first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Verify Email Card */}
        <div className="bg-white rounded-2xl shadow-lg p-8 md:p-10">
          {/* Back to Sign In Link */}
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to sign in</span>
          </Link>

          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-50">
              <ShieldCheck className="h-8 w-8 text-blue-600" />
            </div>
          </div>

          {/* Title */}
          <div className="text-center mb-4">
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">
              Verify your email
            </h1>
            <p className="text-sm text-slate-600">
              We&apos;ve sent a 6-digit code to{" "}
              <span className="font-semibold text-slate-900">{email}</span>
            </p>
          </div>

          {/* Verification Code Form */}
          <form onSubmit={handleSubmit} className="mt-8">
            {/* Code Input Fields */}
            <div className="flex justify-center gap-3 mb-4">
              {code.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => { inputRefs.current[index] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleCodeChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={index === 0 ? handlePaste : undefined}
                  className="w-12 h-14 text-center text-lg font-semibold rounded-lg border-2 border-slate-300 bg-white text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors"
                />
              ))}
            </div>

            {/* Helper Text */}
            <p className="text-center text-xs text-slate-500 mb-6">
              Enter the verification code sent to your email
            </p>

            {/* Verify Email Button */}
            <button
              type="submit"
              disabled={isLoading || code.join("").length !== 6}
              className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Verifying..." : "Verify email"}
            </button>
          </form>

          {/* Resend Link */}
          <div className="mt-6 text-center text-sm text-slate-500">
            Didn&apos;t receive the code?{" "}
            <button
              type="button"
              className="text-slate-900 hover:text-slate-700 font-medium"
            >
              Resend
            </button>
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
            <div className="text-center">
              <div className="flex justify-center mb-6">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-50">
                  <ShieldCheck className="h-8 w-8 text-blue-600" />
                </div>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">
                Verify your email
              </h1>
              <p className="text-sm text-slate-600">Loading...</p>
            </div>
          </div>
        </div>
      </div>
    }>
      <VerifyEmailForm />
    </Suspense>
  );
}

