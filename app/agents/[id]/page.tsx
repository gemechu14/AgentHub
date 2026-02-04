"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, Send, ChevronDown, ChevronRight, Database, Sparkles } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { mockAgents } from "@/features/dashboard/mockAgents";

export default function TestAgentPage() {
  const params = useParams();
  const agentId = params.id as string;
  
  const agent = mockAgents.find((a) => a.id === agentId);
  const [message, setMessage] = useState("");
  const [systemInstructionsOpen, setSystemInstructionsOpen] = useState(false);

  if (!agent) {
    return (
      <AppShell title="Agent Not Found">
        <div className="text-center py-12">
          <p className="text-slate-500">Agent not found</p>
          <Link href="/agents" className="text-blue-500 hover:text-blue-600 mt-4 inline-block">
            Back to Agents
          </Link>
        </div>
      </AppShell>
    );
  }

  const isActive = agent.status === "active";
  const isDraft = agent.status === "draft";
  const hasApiKeyExpired = agent.name === "Data Analyst"; // Mock condition

  const handleSendMessage = () => {
    if (message.trim()) {
      // Handle send message
      setMessage("");
    }
  };

  const suggestedQuestions = [
    "Summarize agent purpose",
    "Show example insights",
    "What KPIs should I track?",
  ];

  return (
    <AppShell title="Test Agent">
      <div className="space-y-6">
        {/* Back to Agents Link */}
        <Link
          href="/agents"
          className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Agents</span>
        </Link>

        {/* API Key Expired Alert (only for draft/expired agents) */}
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
                href={`/agents/${agent.id}/edit`}
                className="inline-block rounded-lg border border-yellow-200 bg-white px-4 py-2 text-sm font-semibold text-amber-900 hover:bg-yellow-50 transition-colors"
              >
                Update API Key
              </Link>
            </div>
          </div>
        )}

        {/* Agent Header */}
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
                  {agent.type.replace(/_/g, " ")}
                </span>
              </div>
            </div>
            <Link
              href={`/agents/${agent.id}/edit`}
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

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chat Section */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
              <div className="border-b border-slate-200 px-6 py-4">
                <h2 className="text-base font-semibold text-slate-900">Chat</h2>
              </div>
              
              {/* Chat Messages Area */}
              <div className="p-6 min-h-[400px] flex items-center justify-center">
                <p className="text-sm text-slate-400">
                  Start a conversation with your agent
                </p>
              </div>

              {/* Suggested Questions */}
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

              {/* Message Input */}
              <div className="border-t border-slate-200 px-6 py-4">
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                    placeholder="Type a message..."
                    className="flex-grow rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!message.trim()}
                    className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500 text-white shadow-sm hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Agent Info Sidebar */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-slate-900 mb-2">
                  AGENT INFO
                </h3>
                <p className="text-sm text-slate-600">{agent.description}</p>
              </div>

              {/* System Instructions */}
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
                    {agent.name === "Data Analyst"
                      ? "You are a data analyst that helps interpret business metrics and create insights."
                      : "No instructions provided"}
                  </p>
                )}
              </div>

              {/* Data Connection */}
              <div className="border-t border-slate-200 pt-6">
                <div className="flex items-center gap-2 mb-2">
                  <Database className="w-4 h-4 text-slate-500" />
                  <h4 className="text-sm font-semibold text-slate-900">
                    Data Connection
                  </h4>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex h-2 w-2 items-center justify-center rounded-full bg-emerald-500 flex-shrink-0" />
                  <p className="text-sm text-slate-600">
                    {agent.name === "CRE Chatbot"
                      ? "Connected: Power BI Semantic Model"
                      : "No data connection configured"}
                  </p>
                </div>
              </div>

              {/* AI Model */}
              <div className="border-t border-slate-200 pt-6">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-4 h-4 text-slate-500" />
                  <h4 className="text-sm font-semibold text-slate-900">AI Model</h4>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Model:</span>
                    <span className="font-medium text-slate-900">
                      {agent.name === "Data Analyst" ? "Google Gemini Pro" : "OpenAI GPT-4"}
                    </span>
                  </div>
                  {hasApiKeyExpired && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500">API Key:</span>
                      <span className="flex items-center gap-1 text-red-600 text-xs font-medium">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Expired
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Last Updated */}
              <div className="border-t border-slate-200 pt-6">
                <p className="text-xs text-slate-500">Last updated: Feb 2, 2026</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

