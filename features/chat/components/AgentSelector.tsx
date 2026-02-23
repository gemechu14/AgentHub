"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import type { Agent } from "@/types/agent";

interface AgentSelectorProps {
  agents: Agent[];
  selectedAgent: Agent | null;
  onSelectAgent: (agent: Agent) => void;
  isLoading?: boolean;
}

export function AgentSelector({
  agents,
  selectedAgent,
  onSelectAgent,
  isLoading,
}: AgentSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50"
        disabled={isLoading}
      >
        <span>{selectedAgent?.name || "Select an agent"}</span>
        <ChevronDown
          className={`h-4 w-4 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full z-50 mt-1 max-h-60 w-64 overflow-auto rounded-lg border border-slate-200 bg-white shadow-lg">
          {(() => {
            const activeAgents = agents.filter((agent) => agent.status === "active");
            return activeAgents.length === 0 ? (
              <div className="px-4 py-2 text-sm text-slate-500">
                No active agents available
              </div>
            ) : (
              <div className="py-1">
                {activeAgents.map((agent) => (
                  <button
                    key={agent.id}
                    onClick={() => {
                      onSelectAgent(agent);
                      setIsOpen(false);
                    }}
                    className={`w-full px-4 py-2 text-left text-sm transition-colors ${
                      selectedAgent?.id === agent.id
                        ? "bg-blue-50 text-blue-600"
                        : "text-slate-900 hover:bg-slate-50"
                    }`}
                  >
                    {agent.name}
                  </button>
                ))}
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}

