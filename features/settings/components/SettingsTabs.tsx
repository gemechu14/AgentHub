"use client";

import { useState } from "react";
import { User, Users, Mail, Palette } from "lucide-react";
import { ProfileTab } from "./ProfileTab";
import { MembersTab } from "./MembersTab";
import { InvitationsTab } from "./InvitationsTab";
import { ThemeTab } from "./ThemeTab";

type TabType = "profile" | "members" | "invitations" | "theme";

export function SettingsTabs() {
  const [activeTab, setActiveTab] = useState<TabType>("profile");

  const tabs = [
    { id: "profile", label: "Profile", icon: User },
    { id: "members", label: "Members", icon: Users },
    { id: "invitations", label: "Invitations", icon: Mail },
    { id: "theme", label: "Theme", icon: Palette },
  ] as const;

  return (
    <div className="space-y-6">
      {/* Tabs Navigation */}
      <div className="flex gap-6 border-b border-slate-200 -mb-[1px]">
        {tabs.map((tab) => {
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
        {activeTab === "members" && <MembersTab />}
        {activeTab === "invitations" && <InvitationsTab />}
        {activeTab === "theme" && <ThemeTab />}
      </div>
    </div>
  );
}

