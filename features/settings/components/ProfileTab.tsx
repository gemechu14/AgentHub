"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { authService } from "@/services/authService";
import { AlertCircle } from "lucide-react";
import { ToastContainer, useToast } from "@/components/ui/Toast";

export function ProfileTab() {
  const { user, isLoading: authLoading, refreshProfile } = useAuth();
  const { toasts, showToast, removeToast } = useToast();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [originalFirstName, setOriginalFirstName] = useState("");
  const [originalLastName, setOriginalLastName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize form fields from user data
  useEffect(() => {
    if (user) {
      const userFirstName = user.first_name || "";
      const userLastName = user.last_name || "";
      setFirstName(userFirstName);
      setLastName(userLastName);
      setOriginalFirstName(userFirstName);
      setOriginalLastName(userLastName);
    }
  }, [user]);

  // Get email from user data
  const email = user?.email || "";

  // Check if form values have changed
  const hasChanges = useMemo(() => {
    return (
      firstName.trim() !== originalFirstName.trim() ||
      lastName.trim() !== originalLastName.trim()
    );
  }, [firstName, lastName, originalFirstName, originalLastName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!user) {
      showToast("User data not available", "error");
      return;
    }

    if (!hasChanges) {
      return; // No changes to save
    }

    setIsSaving(true);

    try {
      // Build payload with only changed fields
      const payload: { first_name?: string; last_name?: string } = {};
      
      if (firstName.trim() !== originalFirstName.trim()) {
        payload.first_name = firstName.trim() || "";
      }
      
      if (lastName.trim() !== originalLastName.trim()) {
        payload.last_name = lastName.trim() || "";
      }

      // Call API to update name
      await authService.changeName(payload);

      // Refresh user profile to get updated data
      await refreshProfile();

      // Update original values to match new values
      setOriginalFirstName(firstName.trim());
      setOriginalLastName(lastName.trim());

      // Show success toast
      showToast("Profile updated successfully", "success");
    } catch (err) {
      console.error("Profile update error:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to update profile";
      setError(errorMessage);
      showToast(errorMessage, "error");
    } finally {
      setIsSaving(false);
    }
  };

  if (authLoading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 w-[65%]">
        <div className="text-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-slate-900 border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
          <p className="mt-4 text-slate-600 text-sm">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 w-[65%]">
        <div className="text-center py-12">
          <p className="text-sm text-slate-500">Unable to load profile data</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <ToastContainer toasts={toasts} onClose={removeToast} />
      
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 w-[65%]">
        <h2 className="text-lg font-semibold text-slate-900 mb-6">
          Profile Settings
        </h2>

        {/* Error Message (only for form validation errors) */}
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* First Name */}
        <div>
          <label className="block text-sm font-medium text-slate-900 mb-2">
            First Name
          </label>
          <input
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Enter your first name"
            required
          />
        </div>

        {/* Last Name */}
        <div>
          <label className="block text-sm font-medium text-slate-900 mb-2">
            Last Name
          </label>
          <input
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Enter your last name"
            required
          />
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-slate-900 mb-2">
            Email
          </label>
          <input
            type="email"
            value={email}
            disabled
            className="w-full rounded-lg border border-slate-300 bg-slate-50 px-4 py-2.5 text-sm text-slate-500 cursor-not-allowed"
          />
          <p className="mt-2 text-xs text-slate-500">
            Email cannot be changed
          </p>
        </div>

        {/* Save Changes Button */}
        <div className="pt-4">
          <button
            type="submit"
            disabled={isSaving || !hasChanges}
            className="rounded-lg bg-blue-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
      </div>
    </>
  );
}

