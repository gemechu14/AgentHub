"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Bot, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import type { Agent } from "@/types/agent";

type TabType = "basics" | "behavior" | "data-connection";

interface EditAgentFormProps {
  agent: Agent;
}

export function EditAgentForm({ agent }: EditAgentFormProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>("basics");
  const [showApiKey, setShowApiKey] = useState(false);

  // Form state initialized with agent data
  const [agentName, setAgentName] = useState(agent.name);
  const [description, setDescription] = useState(agent.description);
  const [agentType, setAgentType] = useState(
    agent.type.replace(/_/g, " ").charAt(0).toUpperCase() +
      agent.type.replace(/_/g, " ").slice(1)
  );
  const [status, setStatus] = useState<"draft" | "active">(agent.status);
  
  const [aiModel, setAiModel] = useState(
    agent.name === "Data Analyst" ? "Google Gemini Pro" : "OpenAI GPT-4"
  );
  const [apiKey, setApiKey] = useState("");
  const [systemInstructions, setSystemInstructions] = useState(
    agent.name === "Data Analyst"
      ? "You are a data analyst that helps interpret business metrics and create insights."
      : ""
  );
  
  const [connectionType, setConnectionType] = useState(
    agent.name === "CRE Chatbot" ? "Power BI Semantic Model" : "None"
  );
  const [workspaceId, setWorkspaceId] = useState("");
  const [datasetId, setDatasetId] = useState("");
  const [tablesContext, setTablesContext] = useState("");
  const [measuresContext, setMeasuresContext] = useState("");
  const [notesBusinessRules, setNotesBusinessRules] = useState("");
  const [databaseType, setDatabaseType] = useState("PostgreSQL");
  const [connectionString, setConnectionString] = useState("");
  const [notesContext, setNotesContext] = useState("");

  const tabs = [
    { id: "basics", label: "Basics" },
    { id: "behavior", label: "Behavior" },
    { id: "data-connection", label: "Data Connection" },
  ] as const;

  const agentTypes = [
    "Support Agent",
    "Sales Agent",
    "Analyst Agent",
    "Custom Agent",
  ];

  const aiModels = [
    "OpenAI GPT-4",
    "OpenAI GPT-3.5",
    "Claude 3 Opus",
    "Claude 3 Sonnet",
    "Google Gemini Pro",
  ];

  const connectionTypes = ["None", "Power BI Semantic Model", "SQL Database"];

  const databaseTypes = ["PostgreSQL", "MySQL", "SQL Server", "Oracle"];

  return (
    <div className="space-y-6">
      {/* Back to Agents Link */}
      <Link
        href={`/agents/${agent.id}`}
        className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Agents</span>
      </Link>

      {/* Main Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm max-w-4xl">
        {/* Card Header */}
        <div className="px-8 py-6 border-b border-slate-200">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50 flex-shrink-0">
              <Bot className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Edit Agent
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Configure your AI agent
              </p>
            </div>
          </div>

          {/* Tabs */}
          <div className="mt-6 flex gap-6 border-b border-slate-200 -mb-[1px]">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`pb-3 text-sm font-medium transition-colors border-b-2 ${
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Form Content */}
        <div className="px-8 py-6">
          {/* Basics Tab */}
          {activeTab === "basics" && (
            <div className="space-y-6">
              {/* Agent Name */}
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-2">
                  Agent Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={agentName}
                  onChange={(e) => setAgentName(e.target.value)}
                  placeholder="e.g., Customer Support Bot"
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-2">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe what this agent does..."
                  rows={4}
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                />
              </div>

              {/* Type */}
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-2">
                  Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={agentType}
                  onChange={(e) => setAgentType(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2012%2012%22%3E%3Cpath%20fill%3D%22%23475569%22%20d%3D%22M6%208L2%204h8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:12px] bg-[right_1rem_center] bg-no-repeat pr-10"
                >
                  {agentTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-3">
                  Status
                </label>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-slate-500">
                    Agent is in {status} mode
                  </p>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setStatus("draft")}
                      className={`px-4 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                        status === "draft"
                          ? "bg-slate-200 text-slate-900"
                          : "bg-transparent text-slate-500 hover:text-slate-700"
                      }`}
                    >
                      Draft
                    </button>
                    <div
                      onClick={() =>
                        setStatus((prev) => (prev === "draft" ? "active" : "draft"))
                      }
                      className={`relative inline-flex h-6 w-11 cursor-pointer items-center rounded-full transition-colors ${
                        status === "active" ? "bg-blue-500" : "bg-slate-300"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          status === "active" ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setStatus("active")}
                      className={`px-4 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                        status === "active"
                          ? "bg-slate-200 text-slate-900"
                          : "bg-transparent text-slate-500 hover:text-slate-700"
                      }`}
                    >
                      Active
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Behavior Tab */}
          {activeTab === "behavior" && (
            <div className="space-y-6">
              {/* AI Model */}
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-2">
                  AI Model <span className="text-red-500">*</span>
                </label>
                <p className="text-xs text-slate-500 mb-3">
                  Select the AI model to power this agent
                </p>
                <select
                  value={aiModel}
                  onChange={(e) => setAiModel(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2012%2012%22%3E%3Cpath%20fill%3D%22%23475569%22%20d%3D%22M6%208L2%204h8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:12px] bg-[right_1rem_center] bg-no-repeat pr-10"
                >
                  {aiModels.map((model) => (
                    <option key={model} value={model}>
                      {model}
                    </option>
                  ))}
                </select>
              </div>

              {/* API Key */}
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-2">
                  API Key <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showApiKey ? "text" : "password"}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Enter your OpenAI API key"
                    className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 pr-10 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showApiKey ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  Your API key is encrypted and stored securely. Get your key from
                  platform.openai.com
                </p>
              </div>

              {/* System Instructions */}
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-2">
                  System Instructions
                </label>
                <p className="text-xs text-slate-500 mb-3">
                  Define how the agent should respond and what tone to use.
                </p>
                <textarea
                  value={systemInstructions}
                  onChange={(e) => setSystemInstructions(e.target.value)}
                  placeholder="You are a helpful assistant that..."
                  rows={8}
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                />
              </div>
            </div>
          )}

          {/* Data Connection Tab */}
          {activeTab === "data-connection" && (
            <div className="space-y-6">
              {/* Connection Type */}
              <div>
                <label className="block text-sm font-medium text-slate-500 mb-3">
                  Connection Type
                </label>
                <select
                  value={connectionType}
                  onChange={(e) => setConnectionType(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-slate-800 text-white px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2012%2012%22%3E%3Cpath%20fill%3D%22%23ffffff%22%20d%3D%22M6%208L2%204h8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:12px] bg-[right_1rem_center] bg-no-repeat pr-10"
                >
                  {connectionTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              {/* Power BI Semantic Model Fields */}
              {connectionType === "Power BI Semantic Model" && (
                <div className="space-y-6 rounded-lg bg-slate-800 p-6">
                  {/* Workspace ID */}
                  <div>
                    <label className="block text-sm font-medium text-white mb-3">
                      Workspace ID
                    </label>
                    <input
                      type="text"
                      value={workspaceId}
                      onChange={(e) => setWorkspaceId(e.target.value)}
                      className="w-full rounded-lg border border-slate-600 bg-slate-700 px-4 py-2.5 text-sm text-white placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  {/* Dataset ID */}
                  <div>
                    <label className="block text-sm font-medium text-white mb-3">
                      Dataset ID (Semantic Model)
                    </label>
                    <input
                      type="text"
                      value={datasetId}
                      onChange={(e) => setDatasetId(e.target.value)}
                      className="w-full rounded-lg border border-slate-600 bg-slate-700 px-4 py-2.5 text-sm text-white placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  {/* Tables Context */}
                  <div>
                    <label className="block text-sm font-medium text-white mb-3">
                      Tables Context
                    </label>
                    <textarea
                      value={tablesContext}
                      onChange={(e) => setTablesContext(e.target.value)}
                      placeholder="Describe the tables available..."
                      rows={5}
                      className="w-full rounded-lg border border-slate-600 bg-slate-700 px-4 py-2.5 text-sm text-white placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                    />
                  </div>

                  {/* Measures Context */}
                  <div>
                    <label className="block text-sm font-medium text-white mb-3">
                      Measures Context
                    </label>
                    <textarea
                      value={measuresContext}
                      onChange={(e) => setMeasuresContext(e.target.value)}
                      placeholder="Describe the measures available..."
                      rows={5}
                      className="w-full rounded-lg border border-slate-600 bg-slate-700 px-4 py-2.5 text-sm text-white placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                    />
                  </div>

                  {/* Notes / Business Rules */}
                  <div>
                    <label className="block text-sm font-medium text-white mb-3">
                      Notes / Business Rules
                    </label>
                    <textarea
                      value={notesBusinessRules}
                      onChange={(e) => setNotesBusinessRules(e.target.value)}
                      placeholder="Any business rules or notes..."
                      rows={5}
                      className="w-full rounded-lg border border-slate-600 bg-slate-700 px-4 py-2.5 text-sm text-white placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                    />
                  </div>
                </div>
              )}

              {/* SQL Database Fields */}
              {connectionType === "SQL Database" && (
                <div className="space-y-6 rounded-lg bg-slate-800 p-6">
                  {/* Database Type */}
                  <div>
                    <label className="block text-sm font-medium text-white mb-3">
                      Database Type
                    </label>
                    <select
                      value={databaseType}
                      onChange={(e) => setDatabaseType(e.target.value)}
                      className="w-full rounded-lg border border-slate-600 bg-slate-700 text-white px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2012%2012%22%3E%3Cpath%20fill%3D%22%23ffffff%22%20d%3D%22M6%208L2%204h8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:12px] bg-[right_1rem_center] bg-no-repeat pr-10"
                    >
                      {databaseTypes.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Connection String */}
                  <div>
                    <label className="block text-sm font-medium text-white mb-3">
                      Connection String
                    </label>
                    <input
                      type="text"
                      value={connectionString}
                      onChange={(e) => setConnectionString(e.target.value)}
                      placeholder="postgresql://user:password@host:port/database"
                      className="w-full rounded-lg border border-slate-600 bg-slate-700 px-4 py-2.5 text-sm text-white placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  {/* Notes Context */}
                  <div>
                    <label className="block text-sm font-medium text-white mb-3">
                      Notes Context
                    </label>
                    <textarea
                      value={notesContext}
                      onChange={(e) => setNotesContext(e.target.value)}
                      placeholder="Describe the database schema..."
                      rows={5}
                      className="w-full rounded-lg border border-slate-600 bg-slate-700 px-4 py-2.5 text-sm text-white placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Form Actions */}
        <div className="px-8 py-6 border-t border-slate-200 flex items-center gap-3">
          <button
            type="button"
            className="rounded-lg bg-blue-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-600 transition-colors"
          >
            Save Agent
          </button>
          <button
            type="button"
            disabled
            className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-400 shadow-sm cursor-not-allowed"
          >
            Save & Test
          </button>
          <button
            type="button"
            onClick={() => router.push(`/agents/${agent.id}`)}
            className="rounded-lg border border-transparent px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

