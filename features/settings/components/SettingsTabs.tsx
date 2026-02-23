"use client";

import { useState, useEffect, useMemo } from "react";
import { User, Users, Mail, Palette } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { ProfileTab } from "./ProfileTab";
import { MembersTab } from "./MembersTab";
import { InvitationsTab } from "./InvitationsTab";
// import { ThemeTab } from "./ThemeTab";

type TabType = "profile" | "members" | "invitations"; // | "theme";

export function SettingsTabs() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>("profile");

  // Get user's role from memberships
  const userRole = useMemo(() => {
    if (!user || !user.memberships || user.memberships.length === 0) {
      return null;
    }
    return user.memberships[0]?.role?.toUpperCase() || null;
  }, [user]);

  // Check if user is MEMBER role
  const isMember = userRole === "MEMBER";

  // Filter tabs based on role
  const availableTabs = useMemo(() => {
    const allTabs = [
      { id: "profile" as const, label: "Profile", icon: User },
      { id: "members" as const, label: "Members", icon: Users },
      { id: "invitations" as const, label: "Invitations", icon: Mail },
      // { id: "theme" as const, label: "Theme", icon: Palette },
    ];

    // If user is MEMBER, only show Profile tab
    if (isMember) {
      return allTabs.filter((tab) => tab.id === "profile");
    }

    // For ADMIN/OWNER, show all tabs
    return allTabs;
  }, [isMember]);

  // Ensure activeTab is valid for user's role
  useEffect(() => {
    if (isMember && activeTab !== "profile") {
      setActiveTab("profile");
    }
  }, [isMember, activeTab]);

  return (
    <div className="space-y-6">
      {/* Tabs Navigation */}
      <div className="flex gap-6 border-b border-slate-200 -mb-[1px]">
        {availableTabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 pb-3 text-sm font-medium transition-colors border-b-2 ${
                activeTab === tab.id
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === "profile" && <ProfileTab />}
        {activeTab === "members" && !isMember && <MembersTab />}
        {activeTab === "invitations" && !isMember && <InvitationsTab />}
        {/* {activeTab === "theme" && !isMember && <ThemeTab />} */}
      </div>
    </div>
  );
}

