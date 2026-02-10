"use client";

import { useAgents } from "@/hooks/useAgents";
import { AgentCard } from "./AgentCard";

export function AgentsGrid() {
  const { data: agents, isLoading, error } = useAgents();

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-500 border-r-transparent" />
        <p className="mt-4 text-sm text-slate-500">Loading agents...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-red-600">Failed to load agents: {error.message}</p>
      </div>
    );
  }

  if (!agents || agents.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-slate-500 mb-4">No agents yet.</p>
        <p className="text-sm text-slate-400">Create your first agent to get started.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {agents.map((agent) => (
        <AgentCard key={agent.id} agent={agent} />
      ))}
    </div>
  );
}

