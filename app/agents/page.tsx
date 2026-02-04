"use client";

import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { AgentsGrid } from "@/features/agents/components/AgentsGrid";

export default function AgentsPage() {
  return (
    <AppShell title="Agents">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">
            Select an agent from the sidebar to test it, or create a new one.
          </p>
          <Link
            href="/agents/new"
            className="inline-flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-400 transition-colors"
          >
            <span className="text-lg leading-none">+</span>
            <span>Add Agent</span>
          </Link>
        </div>
        <AgentsGrid />
      </div>
    </AppShell>
  );
}

