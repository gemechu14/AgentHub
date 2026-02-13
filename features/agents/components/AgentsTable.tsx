import type { Agent } from "@/types/agent";
import { Badge } from "@/components/common/Badge";

interface AgentsTableProps {
  agents: Agent[];
}

function getIntegrationLabel(connectionType: Agent["connection_type"]): string {
  switch (connectionType) {
    case "POWERBI":
      return "Power BI";
    case "DB":
      return "Database";
    case "NONE":
    default:
      return "None";
  }
}

export function AgentsTable({ agents }: AgentsTableProps) {
  if (agents.length === 0) {
    return (
      <p className="text-sm text-slate-500">
        No agents yet. Create your first agent to get started.
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="overflow-x-auto">
        <table className="min-w-full border-separate border-spacing-0 text-sm">
          <thead>
            <tr className="bg-slate-50 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              <th className="px-4 py-3">Agent Name</th>
              <th className="px-4 py-3">Integration</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Created</th>
            </tr>
          </thead>
          <tbody>
            {agents.map((agent) => {
              const isActive = agent.status === "active";
              return (
                <tr key={agent.id} className="border-t border-slate-200">
                  <td className="px-4 py-4 align-top">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                        <span className="text-xs font-semibold">A</span>
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-slate-900">
                          {agent.name}
                        </p>
                        <p className="line-clamp-1 text-xs text-slate-500">
                          {agent.description}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 align-top">
                    <Badge variant="default">{getIntegrationLabel(agent.connection_type)}</Badge>
                  </td>
                  <td className="px-4 py-4 align-top">
                    <Badge variant={isActive ? "success" : "warning"}>
                      {isActive ? "Active" : agent.status === "draft" ? "Draft" : "Inactive"}
                    </Badge>
                  </td>
                  <td className="px-4 py-4 align-top text-slate-600">
                    {new Date(agent.created_at).toLocaleDateString()}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}


