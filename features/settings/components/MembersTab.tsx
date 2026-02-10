"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { teamService } from "@/services/teamService";
import { TeamMember } from "@/types/team";
import { X, Check, AlertCircle } from "lucide-react";
import { ToastContainer, useToast } from "@/components/ui/Toast";
import { KebabMenu } from "@/components/ui/KebabMenu";

export function MembersTab() {
  const { user } = useAuth();
  const { toasts, showToast, removeToast } = useToast();

  // State
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [membersLoading, setMembersLoading] = useState(true);
  const [membersError, setMembersError] = useState<string | null>(null);

  // Edit state
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [editRole, setEditRole] = useState("MEMBER");
  const [updateLoading, setUpdateLoading] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);

  // Delete confirmation
  const [deletingMember, setDeletingMember] = useState<TeamMember | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Get account ID from user profile
  const getAccountId = (): string | null => {
    if (!user || !user.memberships || user.memberships.length === 0) {
      return null;
    }

    const membership = user.memberships[0];
    // Handle all possible account ID locations (as per requirements)
    // Priority: account_id > account.id > workspace_id
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

  // Load members on mount
  useEffect(() => {
    const loadMembers = async () => {
      const accountId = getAccountId();
      if (!accountId) {
        setMembersError("No account found. Please ensure you have an active membership.");
        setMembersLoading(false);
        return;
      }

      try {
        setMembersError(null);
        const teamMembers = await teamService.listTeamMembers(accountId);
        setMembers(teamMembers);
      } catch (error) {
        console.error("Failed to load members:", error);
        setMembersError(
          error instanceof Error ? error.message : "Failed to load team members"
        );
      } finally {
        setMembersLoading(false);
      }
    };

    loadMembers();
  }, [user]);

  // Reload members
  const reloadMembers = async () => {
    const accountId = getAccountId();
    if (!accountId) return;

    try {
      const teamMembers = await teamService.listTeamMembers(accountId);
      setMembers(teamMembers);
    } catch (error) {
      console.error("Failed to reload members:", error);
    }
  };

  // Handle edit member
  const handleStartEdit = (member: TeamMember) => {
    setEditingMember(member);
    setEditRole(member.role);
    setUpdateError(null);
  };

  const handleCancelEdit = () => {
    setEditingMember(null);
    setEditRole("MEMBER");
    setUpdateError(null);
  };

  const handleUpdateMember = async () => {
    if (!editingMember) return;

    setUpdateError(null);
    const accountId = getAccountId();
    if (!accountId) {
      setUpdateError("No account found");
      return;
    }

    setUpdateLoading(true);

    try {
      const payload: { email?: string; user_id?: string; role: string } = {
        role: editRole.toUpperCase(),
      };

      // Use email or user_id based on what's available
      if (editingMember.email) {
        payload.email = editingMember.email;
      }
      if (editingMember.user_id) {
        payload.user_id = editingMember.user_id;
      }

      await teamService.updateMemberPermissions(accountId, payload);

      // Reload members list
      await reloadMembers();

      // Reset edit state
      setEditingMember(null);
      setEditRole("MEMBER");
      showToast("Member updated successfully", "success");
    } catch (error) {
      console.error("Failed to update member:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to update member";
      setUpdateError(errorMessage);
      showToast(errorMessage, "error");
    } finally {
      setUpdateLoading(false);
    }
  };

  // Handle delete member
  const handleDeleteClick = (member: TeamMember) => {
    setDeletingMember(member);
  };

  const handleCancelDelete = () => {
    setDeletingMember(null);
  };

  const handleConfirmDelete = async () => {
    if (!deletingMember) return;

    const accountId = getAccountId();
    if (!accountId) {
      showToast("No account found", "error");
      return;
    }

    setDeleteLoading(true);

    try {
      await teamService.deleteUser(accountId, {
        email: deletingMember.email,
      });

      // Remove from members list
      setMembers((prev) =>
        prev.filter((m) => m.email !== deletingMember.email)
      );

      setDeletingMember(null);
      showToast("Member removed successfully", "success");
    } catch (error) {
      console.error("Failed to delete member:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to delete member";
      showToast(errorMessage, "error");
    } finally {
      setDeleteLoading(false);
    }
  };

  // Format role for display
  const formatRole = (role: string): string => {
    if (role === "ADMIN") return "Admin";
    if (role === "MEMBER") return "Member";
    return role.charAt(0) + role.slice(1).toLowerCase();
  };

  return (
    <>
      <ToastContainer toasts={toasts} onClose={removeToast} />
      
      <div className="w-[65%] mb-8">
        {/* Members Table Section */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 mb-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-6">
            Team Members
          </h2>

          {membersLoading ? (
            <div className="text-center py-12">
              <p className="text-sm text-slate-500">Loading members...</p>
            </div>
          ) : membersError ? (
            <div className="rounded-lg bg-red-50 border border-red-200 p-4 flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-600">{membersError}</p>
            </div>
          ) : members.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-sm text-slate-500">No team members found</p>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-8 px-8 pb-6">
              <div className="inline-block min-w-full align-middle">
                <div className="overflow-hidden rounded-lg">
                  <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
                          Email
                        </th>
                        <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
                          Role
                        </th>
                        <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
                          Status
                        </th>
                        <th className="px-6 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-slate-600">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white">
                      {members.map((member, index) => (
                        <tr
                          key={member.email || index}
                          className="hover:bg-slate-50 transition-colors"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-slate-900">
                              {member.email}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {editingMember?.email === member.email ? (
                              <div className="flex items-center gap-2">
                                <select
                                  value={editRole}
                                  onChange={(e) => setEditRole(e.target.value)}
                                  className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                                  disabled={updateLoading}
                                >
                                  <option value="MEMBER">Member</option>
                                  <option value="ADMIN">Admin</option>
                                </select>
                                <button
                                  onClick={handleUpdateMember}
                                  disabled={updateLoading}
                                  className="p-1.5 text-green-600 hover:text-green-700 hover:bg-green-50 rounded transition-colors disabled:opacity-50"
                                  title="Save"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={handleCancelEdit}
                                  disabled={updateLoading}
                                  className="p-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                                  title="Cancel"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {formatRole(member.role)}
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                                member.status === "active"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-amber-100 text-amber-800"
                              }`}
                            >
                              {member.status === "active" ? "Active" : "Pending"}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            {editingMember?.email === member.email ? (
                              updateError && (
                                <span className="text-xs text-red-600">
                                  {updateError}
                                </span>
                              )
                            ) : (
                              <div className="flex justify-end">
                                <KebabMenu
                                  onEdit={() => handleStartEdit(member)}
                                  onDelete={() => handleDeleteClick(member)}
                                />
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deletingMember && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              Remove Team Member
            </h3>
            <p className="text-sm text-slate-600 mb-6">
              Are you sure you want to remove <strong>{deletingMember.email}</strong> from
              your team? This action cannot be undone.
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={handleConfirmDelete}
                disabled={deleteLoading}
                className="flex-1 rounded-lg bg-red-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleteLoading ? "Removing..." : "Remove"}
              </button>
              <button
                onClick={handleCancelDelete}
                disabled={deleteLoading}
                className="flex-1 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
