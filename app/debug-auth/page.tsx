"use client";

import { useEffect, useState } from "react";
import { tokenStore } from "@/lib/tokenStore";
import { useAuth } from "@/contexts/AuthContext";

export default function DebugAuthPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [tokens, setTokens] = useState({ access: "", refresh: "" });

  useEffect(() => {
    setTokens({
      access: tokenStore.getAccessToken() || "MISSING",
      refresh: tokenStore.getRefreshToken() || "MISSING",
    });
  }, []);

  const clearTokens = () => {
    tokenStore.clearTokens();
    setTokens({
      access: tokenStore.getAccessToken() || "MISSING",
      refresh: tokenStore.getRefreshToken() || "MISSING",
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold">Authentication Debug</h1>

        <div className="bg-white p-6 rounded-lg shadow space-y-4">
          <h2 className="text-lg font-semibold">Auth Context State</h2>
          <div className="space-y-2 font-mono text-sm">
            <p>
              <span className="font-bold">isLoading:</span>{" "}
              {isLoading ? "true" : "false"}
            </p>
            <p>
              <span className="font-bold">isAuthenticated:</span>{" "}
              {isAuthenticated ? "true" : "false"}
            </p>
            <p>
              <span className="font-bold">user:</span>{" "}
              {user ? JSON.stringify(user) : "null"}
            </p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow space-y-4">
          <h2 className="text-lg font-semibold">Session Storage Tokens</h2>
          <div className="space-y-2 font-mono text-sm break-all">
            <p>
              <span className="font-bold">access_token:</span>{" "}
              <span className={tokens.access === "MISSING" ? "text-red-600" : "text-green-600"}>
                {tokens.access}
              </span>
            </p>
            <p>
              <span className="font-bold">refresh_token:</span>{" "}
              <span className={tokens.refresh === "MISSING" ? "text-red-600" : "text-green-600"}>
                {tokens.refresh}
              </span>
            </p>
          </div>
          <button
            onClick={clearTokens}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Clear Tokens
          </button>
        </div>

        <div className="bg-white p-6 rounded-lg shadow space-y-4">
          <h2 className="text-lg font-semibold">Test Actions</h2>
          <div className="space-y-2">
            <button
              onClick={() => window.location.href = "/dashboard"}
              className="block w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Navigate to Dashboard
            </button>
            <button
              onClick={() => window.location.href = "/login"}
              className="block w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Navigate to Login
            </button>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
          <p className="text-sm text-yellow-800">
            <strong>Expected Behavior:</strong> If you clear tokens and click "Navigate to Dashboard",
            AuthGuard should redirect you to /login immediately.
          </p>
        </div>
      </div>
    </div>
  );
}


