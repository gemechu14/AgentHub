import Link from "next/link";
import { Card } from "@/components/common/Card";
import { Badge } from "@/components/common/Badge";
import { Bot } from "lucide-react";
import type { Agent } from "@/types/agent";

interface AgentCardProps {
  agent: Agent;
}

export function AgentCard({ agent }: AgentCardProps) {
  const isActive = agent.status === "active";
  const connectionLabel = agent.connection_type === "POWERBI" 
    ? "Power BI" 
    : agent.connection_type === "DB" 
    ? "Database" 
    : "None";

  return (
    <Link href={`/agents/${agent.id}`} className="block hover:scale-[1.02] transition-transform">
      <Card>
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-blue-50">
            <Bot className="h-5 w-5 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-slate-900 mb-2">
              {agent.name}
            </h3>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <Badge variant="default">{connectionLabel}</Badge>
              <Badge variant={isActive ? "success" : "default"}>
                {isActive ? "Active" : agent.status === "draft" ? "Draft" : "Inactive"}
              </Badge>
            </div>
            <p className="text-xs text-slate-500 line-clamp-2">
              {agent.description || "No description"}
            </p>
          </div>
        </div>
      </Card>
    </Link>
  );
}


