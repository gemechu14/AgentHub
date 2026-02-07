"use client";

import { useAuth } from "@/contexts/AuthContext";
import { LogOut, User } from "lucide-react";

export function UserProfile() {
  const { user, logout, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-full bg-slate-200 animate-pulse" />
        <div className="h-4 w-24 bg-slate-200 rounded animate-pulse" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex items-center gap-3">
      {/* User Info */}
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-700">
          <User className="h-4 w-4" />
        </div>
        <div className="hidden sm:block">
          <p className="text-sm font-medium text-slate-900">
            {user.first_name} {user.last_name}
          </p>
          <p className="text-xs text-slate-500">{user.email}</p>
        </div>
      </div>

      {/* Logout Button */}
      <button
        onClick={(e) => {
          e.preventDefault();
          logout();
        }}
        className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
        title="Logout"
      >
        <LogOut className="h-4 w-4" />
        <span className="hidden sm:inline">Logout</span>
      </button>
    </div>
  );
}

