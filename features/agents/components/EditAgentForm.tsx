"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Bot, Eye, EyeOff, AlertCircle, CheckCircle, XCircle } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { updateAgent, getAccountId } from "@/services/agentsService";
import { testPowerBIConnection, getPowerBISchema } from "@/services/powerbiService";
import { 
  mapConnectionTypeToAPI, 
  mapConnectionTypeFromAPI, 
  mapModelTypeToAPI, 
  mapModelTypeFromAPI,
  mapDatabaseTypeFromAPI,
  buildPowerBIConfig, 
  buildDBConfig 
} from "@/lib/agentHelpers";
import type { Agent, UpdateAgentRequest, PowerBIConnectionConfig, DBConnectionConfig } from "@/types/agent";
import type { ConnectionCheckResponse, SchemaResponse } from "@/types/powerbi";

type TabType = "basics" | "behavior" | "data-connection";

interface EditAgentFormProps {
  agent: Agent;
}

export function EditAgentForm({ agent }: EditAgentFormProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>("basics");
  const [showApiKey, setShowApiKey] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<ConnectionCheckResponse | null>(null);
  const [schemaResult, setSchemaResult] = useState<SchemaResponse | null>(null);

  // Form state initialized with agent data
  const [agentName, setAgentName] = useState(agent.name);
  const [description, setDescription] = useState(agent.description || "");
  const [status, setStatus] = useState<"draft" | "active">(
    agent.status === "inactive" ? "draft" : agent.status
  );
  
  const [aiModel, setAiModel] = useState(mapModelTypeFromAPI(agent.model_type));
  const [apiKey, setApiKey] = useState(""); // Don't show existing API key for security
  const [systemInstructions, setSystemInstructions] = useState(agent.system_instructions || "");
  // Custom tone fields — default enabled, initialize from agent data
  const [customToneEnabled, setCustomToneEnabled] = useState<boolean>(
    agent.custom_tone_schema_enabled || agent.custom_tone_rows_enabled || true
  );
  const [customToneSchemaEnabled, setCustomToneSchemaEnabled] = useState(agent.custom_tone_schema_enabled || false);
  const [customToneRowsEnabled, setCustomToneRowsEnabled] = useState(agent.custom_tone_rows_enabled || false);
  const [customToneSchema, setCustomToneSchema] = useState(agent.custom_tone_schema || "");
  const [customToneRows, setCustomToneRows] = useState(agent.custom_tone_rows || "");
  
  const [connectionType, setConnectionType] = useState(mapConnectionTypeFromAPI(agent.connection_type));
  // PowerBI fields
  const [workspaceId, setWorkspaceId] = useState("");
  const [datasetId, setDatasetId] = useState("");
  const [tenantId, setTenantId] = useState("");
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  // DB fields
  const [databaseType, setDatabaseType] = useState("PostgreSQL");
  const [connectionString, setConnectionString] = useState("");

  // Initialize form fields from agent connection_config
  useEffect(() => {
    if (agent.connection_config) {
      if (agent.connection_type === "POWERBI") {
        const config = agent.connection_config as PowerBIConnectionConfig;
        setTenantId(config.tenant_id || "");
        setClientId(config.client_id || "");
        setClientSecret(config.client_secret || "");
        setWorkspaceId(config.workspace_id || "");
        setDatasetId(config.dataset_id || "");
      } else if (agent.connection_type === "DB") {
        const config = agent.connection_config as DBConnectionConfig;
        setDatabaseType(mapDatabaseTypeFromAPI(config.database_type));
        // Reconstruct connection string from config
        setConnectionString(
          `${config.database_type}://${config.username}:${config.password}@${config.host}:${config.port}/${config.database}`
        );
      }
    }
  }, [agent]);

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

  const handleTest = async () => {
    setError(null);
    setTestResult(null);
    setSchemaResult(null);

    // Only test Power BI connections for now
    if (connectionType !== "Power BI Semantic Model") {
      setError("Testing is only available for Power BI connections");
      return;
    }

    // Validate Power BI fields
    if (!tenantId || !clientId || !workspaceId || !datasetId || !clientSecret) {
      setError("Please fill in all Power BI connection fields before testing");
      return;
    }

    setIsTesting(true);

    try {
      const credentials = {
        tenant_id: tenantId,
        client_id: clientId,
        workspace_id: workspaceId,
        dataset_id: datasetId,
        client_secret: clientSecret,
      };

      // Test connection
      const connectionResult = await testPowerBIConnection(credentials);
      setTestResult(connectionResult);

      // If connection successful, also get schema
      if (connectionResult.connected) {
        try {
          const schema = await getPowerBISchema(credentials);
          setSchemaResult(schema);
        } catch (schemaError) {
          console.error("Failed to get schema:", schemaError);
          // Don't show error if connection worked but schema failed
        }
      }
    } catch (err) {
      console.error("Test error:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to test connection";
      setError(errorMessage);
      setTestResult({
        connected: false,
        message: errorMessage,
        error: errorMessage,
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSubmit = async () => {
    setError(null);

    // Validation
    if (!agentName.trim()) {
      setError("Agent name is required");
      return;
    }

    const accountId = getAccountId(user);
    if (!accountId) {
      setError("No account ID found. Please ensure you are part of an account.");
      return;
    }

    // Build connection config based on connection type
    let connectionConfig = undefined;
    const apiConnectionType = mapConnectionTypeToAPI(connectionType);

    if (apiConnectionType === "POWERBI") {
      if (!workspaceId || !datasetId) {
        setError("Workspace ID and Dataset ID are required for Power BI connections");
        return;
      }
      connectionConfig = buildPowerBIConfig(workspaceId, datasetId, tenantId, clientId, clientSecret);
      if (!connectionConfig) {
        setError("Invalid Power BI configuration");
        return;
      }
    } else if (apiConnectionType === "DB") {
      if (!connectionString) {
        setError("Connection string is required for database connections");
        return;
      }
      connectionConfig = buildDBConfig(connectionString, databaseType);
      if (!connectionConfig) {
        setError("Invalid connection string format. Expected: postgresql://user:password@host:port/database");
        return;
      }
    }

    // Build request payload
    const payload: UpdateAgentRequest = {
      name: agentName.trim(),
      description: description.trim() || undefined,
      status,
      model_type: mapModelTypeToAPI(aiModel),
      api_key: apiKey.trim() || undefined, // Only send if changed
      system_instructions: systemInstructions.trim() || undefined,
      connection_type: apiConnectionType,
      connection_config: connectionConfig,
      // Custom tone fields
      custom_tone_schema_enabled: customToneEnabled && customToneSchemaEnabled,
      custom_tone_rows_enabled: customToneEnabled && customToneRowsEnabled,
      custom_tone_schema: customToneEnabled && customToneSchemaEnabled ? customToneSchema.trim() || undefined : undefined,
      custom_tone_rows: customToneEnabled && customToneRowsEnabled ? customToneRows.trim() || undefined : undefined,
    };

    setIsLoading(true);

    try {
      await updateAgent(accountId, agent.id, payload);
      router.push("/admin");
    } catch (err) {
      console.error("Failed to update agent:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to update agent. Please try again.";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Back to Agents Link */}
      <Link
        href="/admin"
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
          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Test Results */}
          {testResult && (
            <div className={`mb-6 p-4 rounded-lg border flex items-start gap-2 ${
              testResult.connected
                ? "bg-green-50 border-green-200"
                : "bg-red-50 border-red-200"
            }`}>
              {testResult.connected ? (
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <p className={`text-sm font-medium ${
                  testResult.connected ? "text-green-900" : "text-red-900"
                }`}>
                  {testResult.connected ? "✅ Connection Successful" : "❌ Connection Failed"}
                </p>
                <p className={`text-sm mt-1 ${
                  testResult.connected ? "text-green-700" : "text-red-700"
                }`}>
                  {testResult.message}
                </p>
                {testResult.table_count !== undefined && (
                  <p className="text-sm mt-1 text-green-700">
                    Tables found: {testResult.table_count}
                  </p>
                )}
                {testResult.error && (
                  <p className="text-sm mt-1 text-red-700">
                    Error: {testResult.error}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Schema Results */}
          {schemaResult && schemaResult.success && schemaResult.data && (
            <div className="mb-6 p-4 rounded-lg bg-blue-50 border border-blue-200">
              <p className="text-sm font-medium text-blue-900 mb-2">
                📊 Schema Information
              </p>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="font-medium text-blue-800">Tables:</span>{" "}
                  <span className="text-blue-700">{schemaResult.data.tables?.length || 0}</span>
                </div>
                <div>
                  <span className="font-medium text-blue-800">Columns:</span>{" "}
                  <span className="text-blue-700">{schemaResult.data.columns?.length || 0}</span>
                </div>
                <div>
                  <span className="font-medium text-blue-800">Measures:</span>{" "}
                  <span className="text-blue-700">{schemaResult.data.measures?.length || 0}</span>
                </div>
                <div>
                  <span className="font-medium text-blue-800">Relationships:</span>{" "}
                  <span className="text-blue-700">{schemaResult.data.relationships?.length || 0}</span>
                </div>
              </div>
            </div>
          )}

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

              {/* Custom Tone */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/50 overflow-hidden">
                {/* Custom Tone Header */}
                <div className="flex items-center justify-between px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-100">
                      <svg className="w-4.5 h-4.5 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">Custom Tone</p>
                      <p className="text-xs text-slate-500">Override default response tone with custom schema and data</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCustomToneEnabled(!customToneEnabled)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                      customToneEnabled ? "bg-blue-500" : "bg-slate-300"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
                        customToneEnabled ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>

                {/* Custom Tone Options */}
                {customToneEnabled && (
                  <div className="border-t border-slate-200 px-5 py-4 space-y-4">
                    {/* Custom Tone Schema Toggle */}
                    <div className="rounded-lg border border-slate-200 bg-white">
                      <div className="flex items-center justify-between px-4 py-3">
                        <div>
                          <p className="text-sm font-medium text-slate-800">Custom Tone Schema</p>
                          <p className="text-xs text-slate-500 mt-0.5">Define the structure/schema for your custom tone</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setCustomToneSchemaEnabled(!customToneSchemaEnabled)}
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ${
                            customToneSchemaEnabled ? "bg-blue-500" : "bg-slate-300"
                          }`}
                        >
                          <span
                            className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm transition-transform ${
                              customToneSchemaEnabled ? "translate-x-4" : "translate-x-0.5"
                            }`}
                          />
                        </button>
                      </div>
                      {customToneSchemaEnabled && (
                        <div className="px-4 pb-4">
                          <textarea
                            value={customToneSchema}
                            onChange={(e) => setCustomToneSchema(e.target.value)}
                            placeholder='e.g. {"tone": "professional", "style": "concise", "vocabulary_level": "advanced"}'
                            rows={4}
                            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none font-mono"
                          />
                        </div>
                      )}
                    </div>

                    {/* Custom Tone Rows Toggle */}
                    <div className="rounded-lg border border-slate-200 bg-white">
                      <div className="flex items-center justify-between px-4 py-3">
                        <div>
                          <p className="text-sm font-medium text-slate-800">Custom Tone Rows</p>
                          <p className="text-xs text-slate-500 mt-0.5">Provide sample data rows for tone calibration</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setCustomToneRowsEnabled(!customToneRowsEnabled)}
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ${
                            customToneRowsEnabled ? "bg-blue-500" : "bg-slate-300"
                          }`}
                        >
                          <span
                            className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm transition-transform ${
                              customToneRowsEnabled ? "translate-x-4" : "translate-x-0.5"
                            }`}
                          />
                        </button>
                      </div>
                      {customToneRowsEnabled && (
                        <div className="px-4 pb-4">
                          <textarea
                            value={customToneRows}
                            onChange={(e) => setCustomToneRows(e.target.value)}
                            placeholder='e.g. "Thank you for reaching out! I&#39;d be happy to help you with that."&#10;"Let me look into this for you right away."'
                            rows={4}
                            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none font-mono"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* System Instructions - hidden for now */}
              {/* <div>
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
              </div> */}
            </div>
          )}

          {/* Data Connection Tab */}
          {activeTab === "data-connection" && (
            <div className="space-y-6">
              {/* Connection Type */}
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-2">
                  Connection Type
                </label>
                <select
                  value={connectionType}
                  onChange={(e) => setConnectionType(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2012%2012%22%3E%3Cpath%20fill%3D%22%23475569%22%20d%3D%22M6%208L2%204h8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:12px] bg-[right_1rem_center] bg-no-repeat pr-10"
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
                <div className="space-y-6">
                  {/* Tenant ID */}
                  <div>
                    <label className="block text-sm font-medium text-slate-900 mb-2">
                      Tenant ID <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={tenantId}
                      onChange={(e) => setTenantId(e.target.value)}
                      placeholder="Enter Azure AD tenant ID"
                      className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  {/* Client ID */}
                  <div>
                    <label className="block text-sm font-medium text-slate-900 mb-2">
                      Client ID <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={clientId}
                      onChange={(e) => setClientId(e.target.value)}
                      placeholder="Enter Azure AD application (client) ID"
                      className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  {/* Client Secret */}
                  <div>
                    <label className="block text-sm font-medium text-slate-900 mb-2">
                      Client Secret <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      value={clientSecret}
                      onChange={(e) => setClientSecret(e.target.value)}
                      placeholder="Enter Azure AD client secret"
                      className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  {/* Workspace ID */}
                  <div>
                    <label className="block text-sm font-medium text-slate-900 mb-2">
                      Workspace ID <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={workspaceId}
                      onChange={(e) => setWorkspaceId(e.target.value)}
                      placeholder="Enter Power BI workspace ID"
                      className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  {/* Dataset ID */}
                  <div>
                    <label className="block text-sm font-medium text-slate-900 mb-2">
                      Dataset ID (Semantic Model) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={datasetId}
                      onChange={(e) => setDatasetId(e.target.value)}
                      placeholder="Enter Power BI dataset ID"
                      className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}

              {/* SQL Database Fields */}
              {connectionType === "SQL Database" && (
                <div className="space-y-6">
                  {/* Database Type */}
                  <div>
                    <label className="block text-sm font-medium text-slate-900 mb-2">
                      Database Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={databaseType}
                      onChange={(e) => setDatabaseType(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2012%2012%22%3E%3Cpath%20fill%3D%22%23475569%22%20d%3D%22M6%208L2%204h8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:12px] bg-[right_1rem_center] bg-no-repeat pr-10"
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
                    <label className="block text-sm font-medium text-slate-900 mb-2">
                      Connection String <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={connectionString}
                      onChange={(e) => setConnectionString(e.target.value)}
                      placeholder="postgresql://user:password@host:port/database"
                      className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <p className="mt-2 text-xs text-slate-500">
                      Format: postgresql://username:password@host:port/database
                    </p>
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
            onClick={handleSubmit}
            disabled={isLoading}
            className="rounded-lg bg-blue-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Saving..." : "Save Agent"}
          </button>
          <button
            type="button"
            onClick={handleTest}
            disabled={isTesting || connectionType !== "Power BI Semantic Model"}
            className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isTesting ? "Testing..." : "Test"}
          </button>
          <button
            type="button"
            onClick={() => router.push(`/agents/view?id=${agent.id}`)}
            className="rounded-lg border border-transparent px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

