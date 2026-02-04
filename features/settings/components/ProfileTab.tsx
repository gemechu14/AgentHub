"use client";

import { useState } from "react";

export function ProfileTab() {
  const [fullName, setFullName] = useState("Gemechu Bulti");
  const email = "gemechubulti11@gmail.com"; // Read-only

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 w-[65%]">
      <h2 className="text-lg font-semibold text-slate-900 mb-6">
        Profile Settings
      </h2>

      <div className="space-y-6">
        {/* Full Name */}
        <div>
          <label className="block text-sm font-medium text-slate-900 mb-2">
            Full Name
          </label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
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
            type="button"
            className="rounded-lg bg-blue-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-600 transition-colors"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

