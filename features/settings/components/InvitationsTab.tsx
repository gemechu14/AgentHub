"use client";

import { useState } from "react";
import { ArrowUp } from "lucide-react";

export function InvitationsTab() {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("Member");

  const roles = ["Member", "Admin", "Viewer"];

  return (
    <div className="space-y-6 w-[65%]">
      {/* Invite Team Member Section */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8">
        <h2 className="text-lg font-semibold text-slate-900 mb-6">
          Invite Team Member
        </h2>

        <div className="flex items-end gap-3">
          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-900 mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@example.com"
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="w-32">
            <label className="block text-sm font-medium text-slate-900 mb-2">
              Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2012%2012%22%3E%3Cpath%20fill%3D%22%23475569%22%20d%3D%22M6%208L2%204h8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:12px] bg-[right_1rem_center] bg-no-repeat pr-10"
            >
              {roles.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            className="rounded-lg bg-blue-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-600 transition-colors flex items-center gap-2"
          >
            <ArrowUp className="w-4 h-4" />
            Send Invite
          </button>
        </div>
      </div>

      {/* Pending Invitations Section */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8">
        <h2 className="text-lg font-semibold text-slate-900 mb-6">
          Pending Invitations
        </h2>

        <div className="text-center py-12">
          <p className="text-sm text-slate-500">No pending invitations</p>
        </div>
      </div>
    </div>
  );
}

