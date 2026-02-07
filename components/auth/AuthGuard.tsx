"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { tokenStore } from "@/lib/tokenStore";

/**
 * Public routes that don't require authentication
 * These are the ONLY routes accessible without tokens
 */
const publicRoutes = [
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
  "/auth/verify",
  "/oauth/google/callback",
  "/oauth/google/callbacall", // Handle backend typo
  "/debug-auth", // Debug page
];

interface AuthGuardProps {
  children: React.ReactNode;
}

/**
 * AuthGuard - Protects all routes except authentication pages
 * ALL routes require authentication tokens except public routes listed above
 * 
 * STRICT RULE: If no tokens exist in storage, user MUST be on a public route or will be redirected to login
 */
export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isLoading } = useAuth();

  // Check if current route is public
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route));

  // Synchronous token check (client-side only) - blocks rendering immediately
  let hasTokensInStorage = false;
  if (typeof window !== "undefined") {
    hasTokensInStorage = tokenStore.hasTokens();
  }

  useEffect(() => {
    // Immediate check on mount - don't wait for loading
    if (typeof window === "undefined") return;

    // STRICT CHECK: Verify tokens exist in storage (source of truth)
    const tokensExist = tokenStore.hasTokens();
    
    // Debug logging
    console.log("[AuthGuard] Route:", pathname);
    console.log("[AuthGuard] Is public route:", isPublicRoute);
    console.log("[AuthGuard] Has tokens:", tokensExist);
    console.log("[AuthGuard] Access token:", tokenStore.getAccessToken() ? "EXISTS" : "MISSING");
    console.log("[AuthGuard] Refresh token:", tokenStore.getRefreshToken() ? "EXISTS" : "MISSING");

    // CRITICAL: If no tokens exist, user is NOT authenticated
    if (!tokensExist) {
      if (!isPublicRoute) {
        // No tokens and not on public route → MUST redirect to login IMMEDIATELY
        console.log("[AuthGuard] ❌ No tokens found on protected route, redirecting to login immediately");
        window.location.replace("/login");
        return;
      }
      // No tokens but on public route → allow access
      console.log("[AuthGuard] ✅ No tokens but on public route, allowing access");
      return;
    }
    
    console.log("[AuthGuard] ✅ Tokens exist, allowing access");

    // Wait for auth context to finish loading before other checks
    if (isLoading) return;

    // Tokens exist - check if context state is also authenticated
    if (!isAuthenticated) {
      // Tokens exist but context not authenticated yet (still loading user)
      // This is OK - allow access, context will update soon
      return;
    }

    // Fully authenticated - if on login/signup, redirect to dashboard
    if (pathname === "/login" || pathname === "/signup") {
      router.replace("/dashboard");
    }
  }, [isAuthenticated, isLoading, pathname, router, isPublicRoute]);

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-slate-900 border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
          <p className="mt-4 text-slate-600 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  // CRITICAL: Block rendering if no tokens and not on public route
  // This prevents protected content from flashing before redirect
  if (typeof window !== "undefined") {
    if (!hasTokensInStorage && !isPublicRoute) {
      // Don't render anything - redirect is happening
      return null;
    }
  }

  return <>{children}</>;
}

