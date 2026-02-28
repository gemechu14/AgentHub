"use client";

import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { AdminAgentsTable } from "@/features/admin/AdminAgentsTable";
import { EmbedConfigDocs } from "@/features/admin/EmbedConfigDocs";
import { useAgents } from "@/hooks/useAgents";
import Link from "next/link";
import { Plus } from "lucide-react";

type TabType = "agents" | "embed-config";

export default function AdminPortalPage() {
  const [activeTab, setActiveTab] = useState<TabType>("agents");
  const { data: agents, isLoading } = useAgents();

  return (
    <AppShell title="Admin Portal">
      <div className="space-y-4 md:space-y-6">
        {/* Tabs */}
        <div className="flex gap-2 md:gap-6 border-b border-slate-200 -mb-[1px] overflow-x-auto">
          <button
            onClick={() => setActiveTab("agents")}
            className={`flex items-center gap-2 pb-3 text-xs md:text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
              activeTab === "agents"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            <span>Agents</span>
          </button>
          <button
            onClick={() => setActiveTab("embed-config")}
            className={`flex items-center gap-2 pb-3 text-xs md:text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
              activeTab === "embed-config"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            <span>Embed Configuration</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="mt-4 md:mt-6">
          {activeTab === "agents" && (
            <div className="space-y-3 md:space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <h2 className="text-sm md:text-base font-semibold text-slate-900">All Agents</h2>
                <Link
                  href="/agents/new"
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-500 px-3 md:px-4 py-2 text-xs md:text-sm font-semibold text-white shadow-sm hover:bg-blue-400 transition-colors w-full sm:w-auto"
                >
                  <Plus className="w-3.5 h-3.5 md:w-4 md:h-4" />
                  <span>Add Agent</span>
                </Link>
              </div>
              {isLoading ? (
                <div className="text-center py-12">
                  <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-slate-900 border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
                  <p className="mt-4 text-slate-600 text-sm">Loading agents...</p>
                </div>
              ) : (
                <AdminAgentsTable agents={agents || []} />
              )}
            </div>
          )}
          {activeTab === "embed-config" && (
            <EmbedConfigDocs />
          )}
        </div>
      </div>
    </AppShell>
  );
}

