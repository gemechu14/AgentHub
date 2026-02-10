"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { EditAgentForm } from "@/features/agents/components/EditAgentForm";
import { useAuth } from "@/contexts/AuthContext";
import { getAgent, getAccountId } from "@/services/agentsService";
import type { Agent } from "@/types/agent";

export default function EditAgentPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const agentId = params.id as string;
  
  const [agent, setAgent] = useState<Agent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadAgent = async () => {
      const accountId = getAccountId(user);
      if (!accountId) {
        setError("No account ID found. Please ensure you are part of an account.");
        setIsLoading(false);
        return;
      }

      try {
        const agentData = await getAgent(accountId, agentId);
        setAgent(agentData);
      } catch (err) {
        console.error("Failed to load agent:", err);
        setError(err instanceof Error ? err.message : "Failed to load agent");
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      loadAgent();
    }
  }, [user, agentId]);

  if (isLoading) {
    return (
      <AppShell title="Edit Agent">
        <div className="text-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-slate-900 border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
          <p className="mt-4 text-slate-600 text-sm">Loading agent...</p>
        </div>
      </AppShell>
    );
  }

  if (error || !agent) {
    return (
      <AppShell title="Agent Not Found">
        <div className="text-center py-12">
          <p className="text-slate-500">{error || "Agent not found"}</p>
          <button
            onClick={() => router.push("/agents")}
            className="text-blue-500 hover:text-blue-600 mt-4 inline-block"
          >
            Back to Agents
          </button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="Edit Agent">
      <EditAgentForm agent={agent} />
    </AppShell>
  );
}

