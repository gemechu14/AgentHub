"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import React, { useState, useEffect, useRef } from "react";
import { ArrowLeft, Send, ChevronDown, ChevronRight, Database, Sparkles, AlertCircle, Info, X } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { useAuth } from "@/contexts/AuthContext";
import { getAgent, getAccountId } from "@/services/agentsService";
import { usePowerBIChat } from "@/hooks/usePowerBIChat";
import { mapConnectionTypeFromAPI, mapModelTypeFromAPI } from "@/lib/agentHelpers";
import type { Agent } from "@/types/agent";

export default function TestAgentPage() {
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const agentId = searchParams.get("id") as string | null;
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [agent, setAgent] = useState<Agent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [systemInstructionsOpen, setSystemInstructionsOpen] = useState(false);
  const [accountId, setAccountId] = useState<string | null>(null);

  // Initialize chat hook
  const chat = usePowerBIChat({
    accountId: accountId || "",
    agentId: agentId || "",
  });

  useEffect(() => {
    const loadAgent = async () => {
      const id = getAccountId(user);
      if (!id) {
        setError("No account ID found. Please ensure you are part of an account.");
        setIsLoading(false);
        return;
      }

      setAccountId(id);

      try {
        if (!agentId) {
          setError("No agent id provided");
          setIsLoading(false);
          return;
        }
        const agentData = await getAgent(id, agentId);
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

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat.messages]);

  if (isLoading) {
    return (
      <AppShell title="Agent">
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
          <Link href="/agents" className="text-blue-500 hover:text-blue-600 mt-4 inline-block">
            Back to Agents
          </Link>
        </div>
      </AppShell>
    );
  }

  const isActive = agent.status === "active";
  const isDraft = agent.status === "draft";
  const hasApiKeyExpired = false;

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }
    
    if (!message.trim() || chat.loading || !accountId) {
      return;
    }

    const question = message.trim();
    setMessage("");

    try {
      await chat.sendMessage(question);
    } catch (err) {
      console.error("Failed to send message:", err);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const suggestedQuestions = agent?.connection_type === "POWERBI" 
    ? [
        "What tables are in this dataset?",
        "Show me the total sales",
        "What columns are in the Sales table?",
        "List the top 10 products by revenue",
        "How many customers do we have?",
      ]
    : [
        "Summarize agent purpose",
        "Show example insights",
        "What KPIs should I track?",
      ];

  return (
    <AppShell title="Test Agent">
      <div className="space-y-6">
        <Link
          href="/agents"
          className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Agents</span>
        </Link>

        {isDraft && hasApiKeyExpired && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start gap-3 mb-3">
              <div className="flex h-5 w-5 items-center justify-center rounded-full border border-amber-700 flex-shrink-0 mt-0.5">
                <span className="text-amber-700 text-xs font-bold">!</span>
              </div>
              <div className="flex-grow">
                <h3 className="text-sm font-bold text-amber-900">
                  API Key Expired
                </h3>
              </div>
            </div>
            <p className="text-sm text-amber-900 mb-3 ml-8">
              Your API key has expired. Please update it to continue using this agent.
            </p>
            <div className="ml-8">
              <Link
                href={`/agents/edit?id=${agent.id}`}
                className="inline-block rounded-lg border border-yellow-200 bg-white px-4 py-2 text-sm font-semibold text-amber-900 hover:bg-yellow-50 transition-colors"
              >
                Update API Key
              </Link>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{agent.name}</h1>
              <div className="mt-3 flex items-center gap-2">
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
                    isActive
                      ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                      : "bg-slate-100 text-slate-700 ring-1 ring-slate-200"
                  }`}
                >
                  {isActive ? "Active" : "Draft"}
                </span>
                <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium bg-slate-100 text-slate-700 ring-1 ring-slate-200">
                  {mapConnectionTypeFromAPI(agent.connection_type)}
                </span>
              </div>
            </div>
            <Link
              href={`/agents/edit?id=${agent.id}`}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition-colors"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
              Edit Agent
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
              <div className="border-b border-slate-200 px-6 py-4 flex items-center justify-between">
                <h2 className="text-base font-semibold text-slate-900">Chat</h2>
                {chat.messages.length > 0 && (
                  <button
                    onClick={chat.clearMessages}
                    className="text-xs text-slate-500 hover:text-slate-700 transition-colors"
                  >
                    Clear Chat
                  </button>
                )}
              </div>

              <div className="p-6 min-h-[400px] max-h-[600px] overflow-y-auto">
                {chat.messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center">
                    <div className="text-4xl mb-4">💬</div>
                    <h3 className="text-base font-semibold text-slate-900 mb-2">
                      Start a Conversation
                    </h3>
                    <p className="text-sm text-slate-500 mb-6">
                      {agent?.connection_type === "POWERBI"
                        ? "Ask questions about your Power BI data in natural language"
                        : "Start chatting with your agent"}
                    </p>
                    {agent?.connection_type === "POWERBI" && (
                      <div className="text-left max-w-md">
                        <p className="text-xs font-medium text-slate-700 mb-2">Example questions:</p>
                        <ul className="text-xs text-slate-500 space-y-1 list-disc list-inside">
                          <li>"What tables are in this dataset?"</li>
                          <li>"Show me the total sales"</li>
                          <li>"What columns are in the Sales table?"</li>
                          <li>"List the top 10 products by revenue"</li>
                          <li>"How many customers do we have?"</li>
                        </ul>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-6">
                    {chat.messages.map((msg) => (
                      <div key={msg.id} className="space-y-3">
                        <div className="flex justify-end">
                          <div className="max-w-[80%] rounded-lg bg-slate-900 px-4 py-3 text-sm text-white">
                            <div className="text-xs font-medium opacity-90 mb-1">You</div>
                            <div className="whitespace-pre-wrap">{msg.question}</div>
                          </div>
                        </div>

                        <div className="flex justify-start">
                          <div className="max-w-[80%] rounded-lg bg-white border border-slate-200 px-4 py-3 text-sm text-slate-900 shadow-sm">
                            <div className="text-xs font-medium text-slate-500 mb-2">AI Assistant</div>
                            {msg.response.resolution_note && (
                              <div className="mb-3 p-2 rounded-md bg-amber-50 border border-amber-200 text-xs text-amber-900">
                                <Info className="w-3 h-3 inline mr-1" />
                                {msg.response.resolution_note}
                              </div>
                            )}

                            <div className="whitespace-pre-wrap leading-relaxed mb-2">
                              {msg.response.answer}
                            </div>

                            {msg.response.action === "QUERY" && msg.response.final_dax && (
                              <details className="mt-3">
                                <summary className="cursor-pointer text-xs font-medium text-blue-600 hover:text-blue-700 select-none">
                                  📊 View DAX Query
                                </summary>
                                <pre className="mt-2 p-3 rounded-md bg-slate-50 border border-slate-200 overflow-x-auto text-xs font-mono">
                                  {msg.response.final_dax}
                                </pre>
                              </details>
                            )}

                            {msg.response.error && (
                              <div className="mt-3 p-2 rounded-md bg-red-50 border border-red-200 text-xs text-red-900">
                                <AlertCircle className="w-3 h-3 inline mr-1" />
                                Error: {msg.response.error}
                              </div>
                            )}

                            <div className="mt-2 text-xs text-slate-400">
                              {msg.response.action === "DESCRIBE" && "📋 Answered from schema"}
                              {msg.response.action === "QUERY" && "🔍 Executed DAX query"}
                              {msg.response.action === "ERROR" && "❌ Error occurred"}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>

              {chat.error && (
                <div className="mx-6 mb-4 p-3 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-red-900">Error</p>
                    <p className="text-sm text-red-700">{chat.error}</p>
                  </div>
                  <button
                    onClick={() => chat.clearMessages()}
                    className="text-red-600 hover:text-red-800"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              <div className="border-t border-slate-200 px-6 py-4">
                <p className="text-xs font-medium text-slate-500 mb-3">Try asking:</p>
                <div className="flex flex-wrap gap-2">
                  {suggestedQuestions.map((question, index) => (
                    <button
                      key={index}
                      onClick={() => setMessage(question)}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50 transition-colors"
                    >
                      {question}
                    </button>
                  ))}
                </div>
              </div>

              <div className="border-t border-slate-200 px-6 py-4">
                <form onSubmit={handleSendMessage} className="flex items-center gap-3">
                  <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={
                      chat.loading
                        ? "Processing..."
                        : agent?.connection_type === "POWERBI"
                        ? "Ask a question about your Power BI data..."
                        : "Type a message..."
                    }
                    disabled={chat.loading || !accountId || agent?.connection_type !== "POWERBI"}
                    className="flex-grow rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-slate-50 disabled:cursor-not-allowed"
                  />
                  <button
                    type="submit"
                    disabled={!message.trim() || chat.loading || !accountId || agent?.connection_type !== "POWERBI"}
                    className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500 text-white shadow-sm hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {chat.loading ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </button>
                </form>
                {agent?.connection_type !== "POWERBI" && (
                  <p className="mt-2 text-xs text-slate-500">
                    Chat is only available for Power BI agents
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-slate-900 mb-2">AGENT INFO</h3>
                <p className="text-sm text-slate-600">{agent.description}</p>
              </div>

              <div className="border-t border-slate-200 pt-6">
                <button
                  onClick={() => setSystemInstructionsOpen(!systemInstructionsOpen)}
                  className="flex w-full items-center justify-between text-sm font-semibold text-slate-900 hover:text-slate-700"
                >
                  <span>System Instructions</span>
                  {systemInstructionsOpen ? (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  )}
                </button>
                {systemInstructionsOpen && (
                  <p className="mt-3 text-sm text-slate-600">
                    {agent.system_instructions || "No instructions provided"}
                  </p>
                )}
              </div>

              <div className="border-t border-slate-200 pt-6">
                <div className="flex items-center gap-2 mb-2">
                  <Database className="w-4 h-4 text-slate-500" />
                  <h4 className="text-sm font-semibold text-slate-900">Data Connection</h4>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <div className={`flex h-2 w-2 items-center justify-center rounded-full flex-shrink-0 ${
                    agent.connection_type !== "NONE" ? "bg-emerald-500" : "bg-slate-300"
                  }`} />
                  <p className="text-sm text-slate-600">
                    {agent.connection_type !== "NONE"
                      ? `Connected: ${mapConnectionTypeFromAPI(agent.connection_type)}`
                      : "No data connection configured"}
                  </p>
                </div>
              </div>

              <div className="border-t border-slate-200 pt-6">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-4 h-4 text-slate-500" />
                  <h4 className="text-sm font-semibold text-slate-900">AI Model</h4>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Model:</span>
                    <span className="font-medium text-slate-900">{mapModelTypeFromAPI(agent.model_type)}</span>
                  </div>
                  {hasApiKeyExpired && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500">API Key:</span>
                      <span className="flex items-center gap-1 text-red-600 text-xs font-medium">Expired</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t border-slate-200 pt-6">
                <p className="text-xs text-slate-500">
                  {agent.updated_at
                    ? `Last updated: ${new Date(agent.updated_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
                    : agent.created_at
                    ? `Created: ${new Date(agent.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
                    : "Last updated: Unknown"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
