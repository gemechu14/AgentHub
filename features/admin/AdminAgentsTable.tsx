"use client";

import type { Agent } from "@/types/agent";
import { Badge } from "@/components/common/Badge";
import { Pencil, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { deleteAgent, getAccountId } from "@/services/agentsService";
import { useAuth } from "@/contexts/AuthContext";
import { DeleteAgentModal } from "./DeleteAgentModal";

interface AdminAgentsTableProps {
  agents: Agent[];
}

// Extended Agent type to include optional type field from mock data
interface ExtendedAgent extends Agent {
  type?: string;
}

function getTypeLabel(type?: string): string {
  if (!type) return "Custom";
  
  switch (type) {
    case "custom":
      return "Custom";
    case "analyst":
    case "analyst_agent":
      return "Analyst Agent";
    case "support":
    case "support_agent":
      return "Support Agent";
    case "sales":
    case "sales_agent":
      return "Sales Agent";
    default:
      return type.charAt(0).toUpperCase() + type.slice(1);
  }
}

function getIntegrationLabel(connectionType: Agent["connection_type"]): string {
  switch (connectionType) {
    case "POWERBI":
      return "Power BI Semantic Model";
    case "DB":
      return "Database";
    case "NONE":
    default:
      return "None";
  }
}

export function AdminAgentsTable({ agents }: AdminAgentsTableProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteModalState, setDeleteModalState] = useState<{
    isOpen: boolean;
    agentId: string | null;
    agentName: string;
  }>({
    isOpen: false,
    agentId: null,
    agentName: "",
  });

  if (agents.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">
        <p className="text-sm text-slate-500">No agents yet. Create your first agent to get started.</p>
      </div>
    );
  }

  const handleEdit = (agentId: string) => {
    router.push(`/agents/edit?id=${agentId}`);
  };

  const handleDelete = (agentId: string) => {
    // Find the agent to get its name
    const agent = agents.find((a) => a.id === agentId);
    if (agent) {
      setDeleteModalState({
        isOpen: true,
        agentId,
        agentName: agent.name,
      });
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteModalState.agentId) return;

    const accountId = getAccountId(user);
    if (!accountId) {
      alert("No account ID found. Please ensure you are part of an account.");
      setDeleteModalState({ isOpen: false, agentId: null, agentName: "" });
      return;
    }

    setDeletingId(deleteModalState.agentId);
    try {
      await deleteAgent(accountId, deleteModalState.agentId);
      // Refresh the page or update the agents list
      window.location.reload();
    } catch (error) {
      console.error("Failed to delete agent:", error);
      alert(error instanceof Error ? error.message : "Failed to delete agent. Please try again.");
    } finally {
      setDeletingId(null);
      setDeleteModalState({ isOpen: false, agentId: null, agentName: "" });
    }
  };

  const handleCloseDeleteModal = () => {
    if (!deletingId) {
      setDeleteModalState({ isOpen: false, agentId: null, agentName: "" });
    }
  };

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="overflow-x-auto">
        <table className="min-w-full border-separate border-spacing-0 text-sm">
          <thead>
            <tr className="bg-slate-50 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Integration</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {agents.map((agent) => {
              const extendedAgent = agent as ExtendedAgent;
              const isActive = agent.status === "active";
              const isDeleting = deletingId === agent.id;
              
              return (
                <tr key={agent.id} className="border-t border-slate-200 hover:bg-slate-50/50">
                  <td className="px-4 py-4 align-top">
                    <span className="font-semibold text-slate-900">{agent.name}</span>
                  </td>
                  <td className="px-4 py-4 align-top">
                    <Badge variant="default">{getTypeLabel(extendedAgent.type)}</Badge>
                  </td>
                  <td className="px-4 py-4 align-top">
                    <Badge variant={isActive ? "success" : "default"}>
                      {isActive ? "Active" : agent.status === "draft" ? "Draft" : "Inactive"}
                    </Badge>
                  </td>
                  <td className="px-4 py-4 align-top text-slate-600">
                    {getIntegrationLabel(agent.connection_type)}
                  </td>
                  <td className="px-4 py-4 align-top">
                    <div className="flex items-center justify-end gap-3">
                      <button
                        onClick={() => handleEdit(agent.id)}
                        className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                        title="Edit agent"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(agent.id)}
                        disabled={isDeleting}
                        className="p-1.5 rounded-lg text-slate-600 hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Delete agent"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <DeleteAgentModal
        isOpen={deleteModalState.isOpen}
        agentName={deleteModalState.agentName}
        onClose={handleCloseDeleteModal}
        onConfirm={handleConfirmDelete}
        isDeleting={!!deletingId}
      />
    </div>
  );
}

