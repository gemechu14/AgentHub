"use client";

import { useAuth } from "@/contexts/AuthContext";
import { User, UserMembership } from "@/types/auth";

/**
 * Convenience hook for accessing user data and related utilities
 */
export function useUser() {
  const { user, isAuthenticated, isLoading } = useAuth();

  /**
   * Check if user has a specific role in any workspace
   */
  const hasRole = (role: string): boolean => {
    if (!user) return false;
    return user.memberships.some((m) => m.role === role);
  };

  /**
   * Check if user has a specific role in a specific workspace
   */
  const hasRoleInWorkspace = (workspaceId: string, role: string): boolean => {
    if (!user) return false;
    return user.memberships.some(
      (m) => m.workspace_id === workspaceId && m.role === role
    );
  };

  /**
   * Get user's role in a specific workspace
   */
  const getRoleInWorkspace = (workspaceId: string): string | null => {
    if (!user) return null;
    const membership = user.memberships.find(
      (m) => m.workspace_id === workspaceId
    );
    return membership?.role || null;
  };

  /**
   * Get all workspaces where user has a specific role
   */
  const getWorkspacesByRole = (role: string): UserMembership[] => {
    if (!user) return [];
    return user.memberships.filter((m) => m.role === role);
  };

  /**
   * Check if user is a member of a specific workspace
   */
  const isMemberOfWorkspace = (workspaceId: string): boolean => {
    if (!user) return false;
    return user.memberships.some((m) => m.workspace_id === workspaceId);
  };

  /**
   * Get user's full name
   */
  const fullName = user ? `${user.first_name} ${user.last_name}` : "";

  /**
   * Get user's initials
   */
  const initials = user
    ? `${user.first_name.charAt(0)}${user.last_name.charAt(0)}`.toUpperCase()
    : "";

  /**
   * Check if user is subscribed
   */
  const isSubscribed = user?.is_subscribed ?? false;

  /**
   * Check if user is active
   */
  const isActive = user?.is_active ?? false;

  /**
   * Get total number of workspaces
   */
  const workspaceCount = user?.memberships.length ?? 0;

  return {
    // User data
    user: user as User | null,
    isAuthenticated,
    isLoading,

    // User properties
    fullName,
    initials,
    isSubscribed,
    isActive,
    workspaceCount,

    // Role checking
    hasRole,
    hasRoleInWorkspace,
    getRoleInWorkspace,
    getWorkspacesByRole,
    isMemberOfWorkspace,
  };
}


