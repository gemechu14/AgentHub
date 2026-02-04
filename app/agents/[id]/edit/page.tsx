"use client";

import { useParams, useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { EditAgentForm } from "@/features/agents/components/EditAgentForm";
import { mockAgents } from "@/features/dashboard/mockAgents";

export default function EditAgentPage() {
  const params = useParams();
  const router = useRouter();
  const agentId = params.id as string;
  
  const agent = mockAgents.find((a) => a.id === agentId);

  if (!agent) {
    return (
      <AppShell title="Agent Not Found">
        <div className="text-center py-12">
          <p className="text-slate-500">Agent not found</p>
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

