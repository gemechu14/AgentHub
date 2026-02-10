"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Bot, Eye, EyeOff, AlertCircle, CheckCircle, XCircle } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { createAgent, getAccountId } from "@/services/agentsService";
import { testPowerBIConnection, getPowerBISchema } from "@/services/powerbiService";
import { mapConnectionTypeToAPI, mapModelTypeToAPI, buildPowerBIConfig, buildDBConfig } from "@/lib/agentHelpers";
import type { CreateAgentRequest } from "@/types/agent";
import type { ConnectionCheckResponse, SchemaResponse } from "@/types/powerbi";

type TabType = "basics" | "behavior" | "data-connection";

export function CreateAgentForm() {
  const router = useRouter();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>("basics");
  const [showApiKey, setShowApiKey] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<ConnectionCheckResponse | null>(null);
  const [schemaResult, setSchemaResult] = useState<SchemaResponse | null>(null);

  // Form state
  const [agentName, setAgentName] = useState("");
  const [description, setDescription] = useState("");
  const [agentType, setAgentType] = useState("Support Agent");
  const [status, setStatus] = useState<"draft" | "active">("draft");
  
  const [aiModel, setAiModel] = useState("OpenAI GPT-4");
  const [apiKey, setApiKey] = useState("");
  const [systemInstructions, setSystemInstructions] = useState("");
  
  const [connectionType, setConnectionType] = useState("None");
  // PowerBI fields
  const [workspaceId, setWorkspaceId] = useState("");
  const [datasetId, setDatasetId] = useState("");
  const [tenantId, setTenantId] = useState("");
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  // DB fields
  const [databaseType, setDatabaseType] = useState("PostgreSQL");
  const [connectionString, setConnectionString] = useState("");

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
    const payload: CreateAgentRequest = {
      name: agentName.trim(),
      description: description.trim() || undefined,
      status,
      model_type: mapModelTypeToAPI(aiModel),
      api_key: apiKey.trim() || undefined,
      system_instructions: systemInstructions.trim() || undefined,
      connection_type: apiConnectionType,
      connection_config: connectionConfig,
    };

    setIsLoading(true);

    try {
      const newAgent = await createAgent(accountId, payload);
      router.push(`/agents/${newAgent.id}`);
    } catch (err) {
      console.error("Failed to create agent:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to create agent. Please try again.";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Back to Agents Link */}
      <Link
        href="/agents"
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
                Create New Agent
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
            {isLoading ? "Creating..." : "Save Agent"}
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
            onClick={() => router.push("/agents")}
            className="rounded-lg border border-transparent px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

