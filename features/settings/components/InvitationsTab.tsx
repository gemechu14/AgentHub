"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useAgents } from "@/hooks/useAgents";
import { teamService } from "@/services/teamService";
import { TeamMember } from "@/types/team";
import { ArrowUp, AlertCircle } from "lucide-react";
import { ToastContainer, useToast } from "@/components/ui/Toast";

export function InvitationsTab() {
  const { user } = useAuth();
  const { toasts, showToast, removeToast } = useToast();
  const { data: agents, isLoading: agentsLoading } = useAgents();

  // Invitation form state
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("MEMBER");
  const [selectedAgentIds, setSelectedAgentIds] = useState<string[]>([]);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);

  // Pending invitations
  const [pendingMembers, setPendingMembers] = useState<TeamMember[]>([]);
  const [pendingLoading, setPendingLoading] = useState(true);

  // Check if agents exist
  const hasAgents = useMemo(() => {
    return agents && agents.length > 0;
  }, [agents]);

  // Reset selected agents when role changes
  useEffect(() => {
    if (inviteRole !== "MEMBER") {
      setSelectedAgentIds([]);
    }
  }, [inviteRole]);

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

    // Validate MEMBER role requirements
    if (inviteRole.toUpperCase() === "MEMBER") {
      // Check if agents exist
      if (!hasAgents) {
        setInviteError("Cannot invite members: No agents available. Please create at least one agent first.");
        return;
      }

      // Check if at least one agent is selected
      if (selectedAgentIds.length === 0) {
        setInviteError("Please select at least one agent for the member");
        return;
      }
    }

    setInviteLoading(true);

    try {
      // Build payload conditionally
      const payload: {
        email: string;
        role: string;
        manage_agent_ids?: string[];
      } = {
        email: inviteEmail,
        role: inviteRole.toUpperCase(),
      };

      // Only include manage_agent_ids if role is MEMBER
      if (inviteRole.toUpperCase() === "MEMBER") {
        payload.manage_agent_ids = selectedAgentIds;
      }

      await teamService.inviteMember(accountId, payload);

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
      setSelectedAgentIds([]);
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
                disabled={inviteLoading || (inviteRole === "MEMBER" && !hasAgents)}
                className="rounded-lg bg-blue-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <ArrowUp className="w-4 h-4" />
                {inviteLoading ? "Sending..." : "Send Invite"}
              </button>
            </div>

            {/* Agent Selection - Only show for MEMBER role */}
            {inviteRole === "MEMBER" && (
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-2">
                  Assign Agents <span className="text-red-500">*</span>
                </label>
                {agentsLoading ? (
                  <p className="text-sm text-slate-500">Loading agents...</p>
                ) : !hasAgents ? (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                    <p className="text-sm text-amber-800">
                      No agents available. Please create at least one agent before inviting members.
                    </p>
                  </div>
                ) : (
                  <div className="rounded-lg border border-slate-300 bg-white p-4 max-h-48 overflow-y-auto">
                    <div className="space-y-2">
                      {agents?.map((agent) => (
                        <label
                          key={agent.id}
                          className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 p-2 rounded"
                        >
                          <input
                            type="checkbox"
                            checked={selectedAgentIds.includes(agent.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedAgentIds((prev) => [...prev, agent.id]);
                              } else {
                                setSelectedAgentIds((prev) =>
                                  prev.filter((id) => id !== agent.id)
                                );
                              }
                            }}
                            className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                          />
                          <span className="text-sm text-slate-900">{agent.name}</span>
                        </label>
                      ))}
                    </div>
                    {selectedAgentIds.length === 0 && (
                      <p className="text-xs text-red-600 mt-2">
                        Please select at least one agent
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

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
