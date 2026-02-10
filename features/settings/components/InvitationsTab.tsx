"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { teamService } from "@/services/teamService";
import { TeamMember } from "@/types/team";
import { ArrowUp, AlertCircle } from "lucide-react";
import { ToastContainer, useToast } from "@/components/ui/Toast";

export function InvitationsTab() {
  const { user } = useAuth();
  const { toasts, showToast, removeToast } = useToast();

  // Invitation form state
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("MEMBER");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);

  // Pending invitations
  const [pendingMembers, setPendingMembers] = useState<TeamMember[]>([]);
  const [pendingLoading, setPendingLoading] = useState(true);

  // Get account ID from user profile
  const getAccountId = (): string | null => {
    if (!user || !user.memberships || user.memberships.length === 0) {
      return null;
    }

    const membership = user.memberships[0];
    // Handle all possible account ID locations
    if (membership.account_id) {
      return membership.account_id;
    }
    if (membership.account?.id) {
      return membership.account.id;
    }
    if (membership.workspace_id) {
      return membership.workspace_id;
    }
    return null;
  };

  // Load pending invitations
  useEffect(() => {
    const loadPendingInvitations = async () => {
      const accountId = getAccountId();
      if (!accountId) {
        setPendingLoading(false);
        return;
      }

      try {
        const teamMembers = await teamService.listTeamMembers(accountId);
        // Filter for pending members
        const pending = teamMembers.filter((m) => m.status === "pending");
        setPendingMembers(pending);
      } catch (error) {
        console.error("Failed to load pending invitations:", error);
      } finally {
        setPendingLoading(false);
      }
    };

    loadPendingInvitations();
  }, [user]);

  // Handle send invitation
  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteError(null);

    // Validate email
    if (!inviteEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inviteEmail)) {
      setInviteError("Please enter a valid email address");
      return;
    }

    const accountId = getAccountId();
    if (!accountId) {
      setInviteError("No account found");
      return;
    }

    setInviteLoading(true);

    try {
      await teamService.inviteMember(accountId, {
        email: inviteEmail,
        role: inviteRole.toUpperCase(),
      });

      // Add new member to pending list
      const newMember: TeamMember = {
        email: inviteEmail,
        role: inviteRole.toUpperCase(),
        status: "pending",
      };
      setPendingMembers((prev) => [...prev, newMember]);

      // Reset form
      setInviteEmail("");
      setInviteRole("MEMBER");
      showToast("Invitation sent successfully", "success");
    } catch (error) {
      console.error("Failed to send invitation:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to send invitation";
      setInviteError(errorMessage);
      showToast(errorMessage, "error");
    } finally {
      setInviteLoading(false);
    }
  };

  return (
    <>
      <ToastContainer toasts={toasts} onClose={removeToast} />
      
      <div className="space-y-6 w-[65%]">
        {/* Invite Team Member Section */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8">
          <h2 className="text-lg font-semibold text-slate-900 mb-6">
            Invite Team Member
          </h2>

          <form onSubmit={handleInvite} className="space-y-4">
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <label className="block text-sm font-medium text-slate-900 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => {
                    setInviteEmail(e.target.value);
                    if (inviteError) setInviteError(null);
                  }}
                  placeholder="email@example.com"
                  required
                  className={`w-full rounded-lg border bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 ${
                    inviteError
                      ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                      : "border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                  }`}
                />
              </div>

              <div className="w-32">
                <label className="block text-sm font-medium text-slate-900 mb-2">
                  Role
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                >
                  <option value="MEMBER">Member</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={inviteLoading}
                className="rounded-lg bg-blue-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <ArrowUp className="w-4 h-4" />
                {inviteLoading ? "Sending..." : "Send Invite"}
              </button>
            </div>

            {inviteError && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {inviteError}
              </p>
            )}
          </form>
        </div>

        {/* Pending Invitations Section */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8">
          <h2 className="text-lg font-semibold text-slate-900 mb-6">
            Pending Invitations
          </h2>

          {pendingLoading ? (
            <div className="text-center py-12">
              <p className="text-sm text-slate-500">Loading...</p>
            </div>
          ) : pendingMembers.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-sm text-slate-500">No pending invitations</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {pendingMembers.map((member, index) => (
                    <tr key={member.email || index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                        {member.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {member.role === "ADMIN" ? "Admin" : "Member"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                          Pending
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
