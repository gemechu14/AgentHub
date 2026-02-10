"use client";

import { AgentsTable } from "./AgentsTable";
import { useAgents } from "@/hooks/useAgents";

export function AgentsSection() {
  const { data: agents, isLoading, error } = useAgents();

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-blue-500 border-r-transparent" />
        <p className="mt-2 text-sm text-slate-500">Loading agents...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-red-600">Failed to load agents: {error.message}</p>
      </div>
    );
  }

  if (!agents || agents.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-slate-500">No agents yet. Create your first agent to get started.</p>
      </div>
    );
  }

  return <AgentsTable agents={agents} />;
}

