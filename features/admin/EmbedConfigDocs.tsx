
"use client";

import { useState, useEffect, useRef } from "react";
import { Copy, Check, AlertCircle, X, RefreshCw, Link2, AlertTriangle, Palette, Save, RotateCcw, ChevronDown, ChevronUp, Bot } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getAccountId } from "@/services/agentsService";
import { useAgents } from "@/hooks/useAgents";
import { listCredentials, toggleEmbedStatus } from "@/services/credentialsService";
import { launchEmbed, updateCredentialTheme } from "@/services/embedService";
import type { Credential } from "@/types/credential";
import { DEFAULT_THEME, type EmbedTheme } from "@/types/theme";

interface CodeBlockProps {
  code: string;
  label?: string;
  copyValue?: string; // Optional value to copy (useful for masked secrets)
}

function CodeBlock({ code, label, copyValue }: CodeBlockProps) {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = async () => {
    try {
      const valueToCopy = copyValue || code;
      await navigator.clipboard.writeText(valueToCopy);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <div className="relative group">
      {label && (
        <label className="block text-xs font-medium text-slate-700 mb-1.5">
          {label}
        </label>
      )}
      <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg p-2 md:p-3 pr-8 md:pr-10">
        <code className="flex-1 text-xs md:text-sm font-mono text-slate-900 break-all">
          {code}
        </code>
        <button
          onClick={handleCopy}
          className="absolute right-2 md:right-3 p-1 md:p-1.5 rounded-md bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 hover:text-slate-900 transition-colors"
          title="Copy"
        >
          {isCopied ? (
            <Check className="w-3.5 h-3.5 md:w-4 md:h-4" />
          ) : (
            <Copy className="w-3.5 h-3.5 md:w-4 md:h-4" />
          )}
        </button>
      </div>
    </div>
  );
}


export function EmbedConfigDocs() {
  const { user } = useAuth();
  const { data: agents, isLoading: isLoadingAgents } = useAgents();
  const [selectedAgentId, setSelectedAgentId] = useState<string>("");
  const [credential, setCredential] = useState<Credential | null>(null);
  const [isLoadingCredential, setIsLoadingCredential] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [embedUrl, setEmbedUrl] = useState<string | null>(null);
  const [isGeneratingEmbed, setIsGeneratingEmbed] = useState(false);
  const [showRegenerateWarning, setShowRegenerateWarning] = useState(false);
  const [theme, setTheme] = useState<EmbedTheme>(DEFAULT_THEME);
  const [isSavingTheme, setIsSavingTheme] = useState(false);
  const [themeError, setThemeError] = useState<string | null>(null);
  const [themeSuccess, setThemeSuccess] = useState(false);
  const [isThemeOpen, setIsThemeOpen] = useState(false);

  const accountId = user ? getAccountId(user) : null;
  const loadingRef = useRef(false);

  // Always fetch fresh data from backend - no caching
  const loadCredential = async () => {
    if (!selectedAgentId || !accountId) {
      setCredential(null);
      setEmbedUrl(null);
      return;
    }

    // Prevent duplicate calls
    if (loadingRef.current) {
      return;
    }

    loadingRef.current = true;
    setIsLoadingCredential(true);
    setError(null);
    try {
      // Always fetch fresh from backend
      const data = await listCredentials(accountId, selectedAgentId);
      // Get the first credential (should only be one per agent)
      const cred = data.length > 0 ? data[0] : null;
      setCredential(cred);
      
      // Set theme from credential or use default
      if (cred?.theme) {
        setTheme(cred.theme);
      } else {
        setTheme(DEFAULT_THEME);
      }
      
      // If credential has embed_url or embed_token, use it
      if (cred) {
        if (cred.embed_url) {
          setEmbedUrl(cred.embed_url);
        } else if (cred.embed_token) {
          // Construct embed URL from token
          const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
          const widgetUrl = `${origin}/embed/widget?token=${cred.embed_token}`;
          setEmbedUrl(widgetUrl);
        } else {
          // No embed_url or embed_token, clear embedUrl
          setEmbedUrl(null);
        }
      } else {
        // No credential exists, clear embedUrl
        setEmbedUrl(null);
      }
    } catch (err) {
      console.error("Failed to load credential:", err);
      setError(err instanceof Error ? err.message : "Failed to load credential");
      setCredential(null);
      setEmbedUrl(null); // Clear embed URL when credential fails to load
    } finally {
      setIsLoadingCredential(false);
      loadingRef.current = false;
    }
  };

  // Always load fresh data from backend when agent is selected or component mounts
  useEffect(() => {
    if (selectedAgentId && accountId) {
      // Load credential only once - it includes embed_url/embed_token
      loadCredential();
    } else {
      setCredential(null);
      setEmbedUrl(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAgentId, accountId]); // Always refetch when agent or account changes

  const handleGenerateEmbed = async () => {
    if (!selectedAgentId || !accountId) {
      setError("Please select an agent first");
      return;
    }

    // Show warning if regenerating
    if (embedUrl) {
      setShowRegenerateWarning(true);
      return;
    }

    setIsGeneratingEmbed(true);
    setError(null);

    try {
      const response = await launchEmbed({
        agent_id: selectedAgentId,
      });
      // Convert chatbot URL to widget URL format
      const url = new URL(response.frontend_url);
      const token = url.hash.substring(1);
      if (token) {
        const widgetUrl = `${url.origin}/embed/widget?token=${token}`;
        setEmbedUrl(widgetUrl);
      } else {
        setEmbedUrl(response.frontend_url);
      }
      
      // Reload credential to get updated embed_url/embed_token from backend
      await loadCredential();
    } catch (err: any) {
      console.error("Failed to generate embed URL:", err);
      // Handle 403 errors specifically
      if (err?.response?.status === 403 || err?.status === 403) {
        const errorMessage = err?.response?.data?.detail || err?.message || "Embed credentials not found for this agent. Please create credentials first.";
        setError(errorMessage);
      } else {
        setError(err instanceof Error ? err.message : "Failed to generate embed URL.");
      }
    } finally {
      setIsGeneratingEmbed(false);
    }
  };

  const handleConfirmRegenerate = async () => {
    setShowRegenerateWarning(false);
    setIsGeneratingEmbed(true);
    setError(null);

    try {
      const response = await launchEmbed({
        agent_id: selectedAgentId!,
      });
      // Convert chatbot URL to widget URL format
      const url = new URL(response.frontend_url);
      const token = url.hash.substring(1);
      if (token) {
        const widgetUrl = `${url.origin}/embed/widget?token=${token}`;
        setEmbedUrl(widgetUrl);
      } else {
        setEmbedUrl(response.frontend_url);
      }
      
      // Reload credential to get updated embed_url/embed_token from backend
      await loadCredential();
    } catch (err: any) {
      console.error("Failed to regenerate embed URL:", err);
      // Handle 403 errors specifically
      if (err?.response?.status === 403 || err?.status === 403) {
        const errorMessage = err?.response?.data?.detail || err?.message || "Embed credentials not found for this agent. Please create credentials first.";
        setError(errorMessage);
      } else {
        setError(err instanceof Error ? err.message : "Failed to regenerate embed URL.");
      }
    } finally {
      setIsGeneratingEmbed(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!selectedAgentId || !accountId || !credential) return;

    setIsToggling(true);
    setError(null);

    try {
      const updatedCredential = await toggleEmbedStatus(accountId, selectedAgentId, credential.id, !credential.is_active);
      setCredential(updatedCredential);
    } catch (err) {
      console.error("Failed to toggle embed status:", err);
      setError(err instanceof Error ? err.message : "Failed to toggle embed status");
    } finally {
      setIsToggling(false);
    }
  };

  const handleSaveTheme = async () => {
    if (!selectedAgentId || !accountId || !credential) return;

    setIsSavingTheme(true);
    setThemeError(null);
    setThemeSuccess(false);

    try {
      await updateCredentialTheme(accountId, selectedAgentId, credential.id, theme);
      setThemeSuccess(true);
      // Reload credential to get updated theme
      await loadCredential();
      setTimeout(() => setThemeSuccess(false), 3000);
    } catch (err) {
      console.error("Failed to update theme:", err);
      setThemeError(err instanceof Error ? err.message : "Failed to update theme");
    } finally {
      setIsSavingTheme(false);
    }
  };

  const handleResetTheme = () => {
    setTheme(DEFAULT_THEME);
  };

  const selectedAgent = agents?.find((a) => a.id === selectedAgentId);

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h2 className="text-xl md:text-2xl font-bold text-slate-900">
          Embed Configuration
        </h2>
        <p className="text-xs md:text-sm text-slate-600">
          Generate embed code to add the chatbot to your website.
        </p>
      </div>

      {/* Agent Selection */}
      <div className="bg-white rounded-lg border border-slate-200 p-3 md:p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <label className="block text-sm font-semibold text-slate-900">
            Select Agent
          </label>
          {/* Toggle button - show if credential exists (allows enabling even when disabled) */}
          {credential && !isLoadingCredential && (
            <button
              onClick={handleToggleStatus}
              disabled={isToggling}
              className={`inline-flex items-center justify-center gap-2 px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-semibold text-white transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto ${
                credential.is_active
                  ? 'bg-slate-600 hover:bg-slate-700'
                  : 'bg-blue-500 hover:bg-blue-400'
              }`}
              title={credential.is_active ? "Disable embed" : "Enable embed"}
            >
              <RefreshCw className={`w-4 h-4 ${isToggling ? 'animate-spin' : ''}`} />
              <span>{isToggling ? 'Updating...' : credential.is_active ? 'Disable Embed' : 'Enable Embed'}</span>
            </button>
          )}
        </div>
        {isLoadingAgents ? (
          <div className="text-sm text-slate-500">Loading agents...</div>
        ) : !agents || agents.length === 0 ? (
          <div className="text-sm text-slate-500">No agents available. Create an agent first.</div>
        ) : agents.filter((agent) => agent.status === "active").length === 0 ? (
          <div className="text-sm text-slate-500">No active agents available.</div>
        ) : (
          <>
            <select
              value={selectedAgentId}
              onChange={(e) => {
                const newAgentId = e.target.value;
                setSelectedAgentId(newAgentId);
                setShowRegenerateWarning(false); // Clear warning when agent changes
                setEmbedUrl(null); // Clear embed URL when agent changes - will be loaded fresh from backend
              }}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">-- Select an agent --</option>
              {agents
                .filter((agent) => agent.status === "active")
                .map((agent) => (
                  <option key={agent.id} value={agent.id}>
                    {agent.name}
                  </option>
                ))}
            </select>
            {selectedAgentId && (
              <div className="mt-2">
                <CodeBlock code={selectedAgentId} label="Agent ID" />
              </div>
            )}
          </>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-900">Error</p>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
          <button
            onClick={() => setError(null)}
            className="p-1 rounded-md text-red-600 hover:bg-red-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Generate Embed URL Button - Only show when no embed URL exists */}
      {selectedAgentId && !embedUrl && (
        <div className="bg-white rounded-lg border border-slate-200 p-3 md:p-4">
          <button
            onClick={handleGenerateEmbed}
            disabled={isGeneratingEmbed || isToggling || (credential ? !credential.is_active : false)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs md:text-sm font-semibold text-white bg-slate-600 hover:bg-slate-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
            title={credential && !credential.is_active ? "Enable embed first to generate URL" : "Generate embed URL"}
          >
            <Link2 className={`w-4 h-4 ${isGeneratingEmbed ? 'animate-pulse' : ''}`} />
            <span>{isGeneratingEmbed ? 'Generating...' : 'Generate Embed URL'}</span>
          </button>
        </div>
      )}

      {/* Regenerate Warning Modal */}
      {showRegenerateWarning && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-50 bg-black/50"
            onClick={() => setShowRegenerateWarning(false)}
          />
          
          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="relative w-full max-w-md rounded-xl md:rounded-2xl bg-white shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Content */}
              <div className="px-4 md:px-6 pt-4 md:pt-6 pb-3 md:pb-4">
                <h2 className="mb-2 text-base md:text-lg font-semibold text-slate-900">
                  Regenerating Embed URL
                </h2>
                <p className="mb-1 text-xs md:text-sm text-slate-600">
                  The previous token will stop working.
                </p>
                <p className="mb-0 text-xs text-slate-500">
                  You must update the embed code on your website with the new token.
                </p>
              </div>

              {/* Divider */}
              <div className="border-t border-slate-200"></div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-3 px-4 md:px-6 py-3 md:py-4">
                <button
                  onClick={() => setShowRegenerateWarning(false)}
                  disabled={isGeneratingEmbed}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs md:text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmRegenerate}
                  disabled={isGeneratingEmbed}
                  className="rounded-lg bg-slate-600 px-4 py-2 text-xs md:text-sm font-medium text-white transition-colors hover:bg-slate-700 disabled:opacity-50"
                >
                  {isGeneratingEmbed ? "Regenerating..." : "Yes, Regenerate"}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Warning - Outside the embed code box */}
      {/* {embedUrl && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-yellow-800">
            <strong>Important:</strong> If you regenerate the embed URL, the previous token will stop working. Make sure to update the embed code on your website with the new token.
          </p>
        </div>
      )} */}

      {/* Theme Customization Section */}
      {credential && (
        <div className="bg-gradient-to-br from-white to-slate-50 rounded-xl border border-slate-200 shadow-lg overflow-hidden">
          {/* Header - Toggle Button */}
          <button
            onClick={() => setIsThemeOpen(!isThemeOpen)}
            className="w-full flex items-center justify-between p-4 md:p-6 hover:bg-gradient-to-r hover:from-slate-50 hover:to-white transition-all duration-200 group"
          >
            <div className="flex items-center gap-2 md:gap-4">
              <div className="p-2 md:p-3 rounded-lg md:rounded-xl bg-slate-600 shadow-md group-hover:bg-slate-900 group-hover:shadow-lg transition-all">
                <Palette className="w-5 h-5 md:w-6 md:h-6 text-white" />
              </div>
              <div className="text-left">
                <h3 className="text-base md:text-xl font-bold text-slate-900 group-hover:text-black transition-colors">Theme Customization</h3>
                <p className="text-xs md:text-sm text-slate-600 mt-0.5">Customize the appearance of your embed widget</p>
              </div>
            </div>
            <div className="p-2 rounded-lg bg-slate-100 group-hover:bg-slate-200 transition-colors">
              {isThemeOpen ? (
                <ChevronUp className="w-5 h-5 text-slate-600" />
              ) : (
                <ChevronDown className="w-5 h-5 text-slate-600" />
              )}
            </div>
          </button>

          {/* Collapsible Content */}
          {isThemeOpen && (
            <div className="px-4 md:px-6 pb-4 md:pb-6 space-y-4 md:space-y-6 border-t border-slate-200 bg-white">
              {/* Theme Success Message */}
              {themeSuccess && (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-3 flex items-center gap-2 shadow-sm">
                  <Check className="w-4 h-4 text-green-600" />
                  <p className="text-sm text-green-800 font-medium">Theme updated successfully!</p>
                </div>
              )}

              {/* Theme Error Message */}
              {themeError && (
                <div className="bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 rounded-lg p-3 flex items-center gap-2 shadow-sm">
                  <AlertCircle className="w-4 h-4 text-red-600" />
                  <p className="text-sm text-red-800 font-medium">{themeError}</p>
                  <button
                    onClick={() => setThemeError(null)}
                    className="ml-auto p-1 rounded-md text-red-600 hover:bg-red-100 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Main Layout: Controls on Left, Preview on Right */}
              <div className="flex flex-col lg:flex-row lg:gap-16 xl:gap-32 gap-6">
                {/* Left Side - Color Controls */}
                <div className="lg:flex-[0_0_50%] space-y-2">
                  <div className="mb-2 mt-2 md:mt-4">
                    <h4 className="text-xs md:text-sm font-bold text-slate-900">Color Settings</h4>
                  </div>
                  
                  {/* Theme Color Picker Grid */}
                  <div className="space-y-2">
                    {/* Primary */}
                    <div className="space-y-1.5 p-2.5 rounded-lg bg-slate-50 border border-slate-200 hover:border-purple-300 transition-colors">
                      <label className="block text-xs font-semibold text-slate-800">
                        Primary
                        <span className="ml-1.5 text-xs font-normal text-slate-500">(Header, Messages)</span>
                      </label>
                      <div className="flex items-center gap-2">
                        <div className="relative">
                          <input
                            type="color"
                            value={theme.primary}
                            onChange={(e) => setTheme({ ...theme, primary: e.target.value })}
                            className="w-12 h-10 rounded-lg border-2 border-slate-300 cursor-pointer shadow-sm hover:shadow-md transition-shadow"
                          />
                        </div>
                        <div className="flex-1">
                          <input
                            type="text"
                            value={theme.primary}
                            onChange={(e) => setTheme({ ...theme, primary: e.target.value })}
                            className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
                            placeholder="#0F172A"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Accent */}
                    <div className="space-y-1.5 p-2.5 rounded-lg bg-slate-50 border border-slate-200 hover:border-purple-300 transition-colors">
                      <label className="block text-xs font-semibold text-slate-800">
                        Accent
                        <span className="ml-1.5 text-xs font-normal text-slate-500">(Buttons, Interactive)</span>
                      </label>
                      <div className="flex items-center gap-2">
                        <div className="relative">
                          <input
                            type="color"
                            value={theme.accent}
                            onChange={(e) => setTheme({ ...theme, accent: e.target.value })}
                            className="w-12 h-10 rounded-lg border-2 border-slate-300 cursor-pointer shadow-sm hover:shadow-md transition-shadow"
                          />
                        </div>
                        <div className="flex-1">
                          <input
                            type="text"
                            value={theme.accent}
                            onChange={(e) => setTheme({ ...theme, accent: e.target.value })}
                            className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
                            placeholder="#3B82F6"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Background */}
                    <div className="space-y-1.5 p-2.5 rounded-lg bg-slate-50 border border-slate-200 hover:border-purple-300 transition-colors">
                      <label className="block text-xs font-semibold text-slate-800">
                        Background
                        <span className="ml-1.5 text-xs font-normal text-slate-500">(Chat Body)</span>
                      </label>
                      <div className="flex items-center gap-2">
                        <div className="relative">
                          <input
                            type="color"
                            value={theme.background}
                            onChange={(e) => setTheme({ ...theme, background: e.target.value })}
                            className="w-12 h-10 rounded-lg border-2 border-slate-300 cursor-pointer shadow-sm hover:shadow-md transition-shadow"
                          />
                        </div>
                        <div className="flex-1">
                          <input
                            type="text"
                            value={theme.background}
                            onChange={(e) => setTheme({ ...theme, background: e.target.value })}
                            className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
                            placeholder="#F8FAFC"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Surface */}
                    <div className="space-y-1.5 p-2.5 rounded-lg bg-slate-50 border border-slate-200 hover:border-purple-300 transition-colors">
                      <label className="block text-xs font-semibold text-slate-800">
                        Surface
                        <span className="ml-1.5 text-xs font-normal text-slate-500">(Cards, Input)</span>
                      </label>
                      <div className="flex items-center gap-2">
                        <div className="relative">
                          <input
                            type="color"
                            value={theme.surface}
                            onChange={(e) => setTheme({ ...theme, surface: e.target.value })}
                            className="w-12 h-10 rounded-lg border-2 border-slate-300 cursor-pointer shadow-sm hover:shadow-md transition-shadow"
                          />
                        </div>
                        <div className="flex-1">
                          <input
                            type="text"
                            value={theme.surface}
                            onChange={(e) => setTheme({ ...theme, surface: e.target.value })}
                            className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
                            placeholder="#FFFFFF"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Text Primary */}
                    <div className="space-y-1.5 p-2.5 rounded-lg bg-slate-50 border border-slate-200 hover:border-purple-300 transition-colors">
                      <label className="block text-xs font-semibold text-slate-800">
                        Text Primary
                        <span className="ml-1.5 text-xs font-normal text-slate-500">(All Text)</span>
                      </label>
                      <div className="flex items-center gap-2">
                        <div className="relative">
                          <input
                            type="color"
                            value={theme.textPrimary}
                            onChange={(e) => setTheme({ ...theme, textPrimary: e.target.value })}
                            className="w-12 h-10 rounded-lg border-2 border-slate-300 cursor-pointer shadow-sm hover:shadow-md transition-shadow"
                          />
                        </div>
                        <div className="flex-1">
                          <input
                            type="text"
                            value={theme.textPrimary}
                            onChange={(e) => setTheme({ ...theme, textPrimary: e.target.value })}
                            className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
                            placeholder="#0F172A"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Border */}
                    <div className="space-y-1.5 p-2.5 rounded-lg bg-slate-50 border border-slate-200 hover:border-purple-300 transition-colors">
                      <label className="block text-xs font-semibold text-slate-800">
                        Border
                        <span className="ml-1.5 text-xs font-normal text-slate-500">(Dividers, Borders)</span>
                      </label>
                      <div className="flex items-center gap-2">
                        <div className="relative">
                          <input
                            type="color"
                            value={theme.border}
                            onChange={(e) => setTheme({ ...theme, border: e.target.value })}
                            className="w-12 h-10 rounded-lg border-2 border-slate-300 cursor-pointer shadow-sm hover:shadow-md transition-shadow"
                          />
                        </div>
                        <div className="flex-1">
                          <input
                            type="text"
                            value={theme.border}
                            onChange={(e) => setTheme({ ...theme, border: e.target.value })}
                            className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
                            placeholder="#E2E8F0"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Success */}
                    <div className="space-y-1.5 p-2.5 rounded-lg bg-slate-50 border border-slate-200 hover:border-purple-300 transition-colors">
                      <label className="block text-xs font-semibold text-slate-800">
                        Success
                        <span className="ml-1.5 text-xs font-normal text-slate-500">(Online Status)</span>
                      </label>
                      <div className="flex items-center gap-2">
                        <div className="relative">
                          <input
                            type="color"
                            value={theme.success}
                            onChange={(e) => setTheme({ ...theme, success: e.target.value })}
                            className="w-12 h-10 rounded-lg border-2 border-slate-300 cursor-pointer shadow-sm hover:shadow-md transition-shadow"
                          />
                        </div>
                        <div className="flex-1">
                          <input
                            type="text"
                            value={theme.success}
                            onChange={(e) => setTheme({ ...theme, success: e.target.value })}
                            className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
                            placeholder="#22C55E"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Side - Live Preview */}
                <div className="lg:flex-[0_0_50%] lg:sticky lg:top-6 lg:self-start">
                  <div className="flex flex-col items-start lg:items-start">
                    {/* Title outside widget */}
                    <div className="mb-2 mt-2 md:mt-4 text-left w-full max-w-full lg:max-w-[400px]">
                      <h4 className="text-sm md:text-base font-bold text-slate-900 mb-0.5">Live Preview</h4>
                      <p className="text-xs text-slate-500">See your changes in real-time</p>
                    </div>
                    {/* Chat Widget Container */}
                    <div 
                      className="w-full max-w-full lg:max-w-[400px] h-[500px] md:h-[600px] flex flex-col overflow-hidden rounded-xl md:rounded-2xl shadow-xl md:shadow-2xl border-2"
                      style={{ 
                        backgroundColor: theme.surface,
                        borderColor: theme.border,
                      }}
                    >
                    {/* Header */}
                    <div
                      className="flex items-center justify-between px-4 py-3 flex-shrink-0 border-b"
                      style={{ 
                        backgroundColor: theme.primary,
                        borderColor: theme.border,
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: theme.accent, color: theme.surface }}
                        >
                          <Bot className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold" style={{ color: theme.surface }}>
                            Agent Name
                          </p>
                          <p className="text-xs flex items-center gap-1" style={{ color: theme.success }}>
                            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: theme.success }}></span>
                            Online
                          </p>
                        </div>
                      </div>
                      <button
                        className="p-1 rounded transition-opacity"
                        style={{ color: theme.surface }}
                        disabled
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Messages Area */}
                    <div 
                      className="flex-1 overflow-y-auto px-4 py-4 space-y-4 min-h-0"
                      style={{ backgroundColor: theme.background }}
                    >
                      {/* User Message */}
                      <div className="flex justify-end">
                        <div
                          className="rounded-2xl rounded-br-sm px-4 py-3 max-w-[80%]"
                          style={{ backgroundColor: theme.primary }}
                        >
                          <p className="text-sm leading-relaxed whitespace-pre-wrap break-words" style={{ color: theme.surface }}>
                            Hello! How can I help you today?
                          </p>
                        </div>
                      </div>

                      {/* Assistant Message */}
                      <div className="flex justify-start">
                        <div
                          className="rounded-2xl rounded-bl-sm px-4 py-3 max-w-[80%]"
                          style={{ 
                            backgroundColor: theme.surface, 
                            borderColor: theme.border, 
                            borderWidth: "1px",
                            borderStyle: "solid",
                          }}
                        >
                          <p className="text-sm leading-relaxed whitespace-pre-wrap break-words" style={{ color: theme.textPrimary }}>
                            Hi there! I'm here to assist you with any questions you might have. What would you like to know?
                          </p>
                        </div>
                      </div>

                      {/* User Message 2 */}
                      <div className="flex justify-end">
                        <div
                          className="rounded-2xl rounded-br-sm px-4 py-3 max-w-[80%]"
                          style={{ backgroundColor: theme.primary }}
                        >
                          <p className="text-sm leading-relaxed whitespace-pre-wrap break-words" style={{ color: theme.surface }}>
                            What are your features?
                          </p>
                        </div>
                      </div>

                      {/* Assistant Message 2 */}
                      <div className="flex justify-start">
                        <div
                          className="rounded-2xl rounded-bl-sm px-4 py-3 max-w-[80%]"
                          style={{ 
                            backgroundColor: theme.surface, 
                            borderColor: theme.border, 
                            borderWidth: "1px",
                            borderStyle: "solid",
                          }}
                        >
                          <p className="text-sm leading-relaxed whitespace-pre-wrap break-words" style={{ color: theme.textPrimary }}>
                            We offer a wide range of features including real-time chat, custom theming, and seamless integration with your website.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Input Area */}
                    <div 
                      className="border-t px-4 py-4 flex-shrink-0"
                      style={{ 
                        borderColor: theme.border,
                        backgroundColor: theme.background,
                      }}
                    >
                      <div 
                        className="flex items-end gap-2 rounded-lg border"
                        style={{ 
                          borderColor: theme.border,
                          backgroundColor: theme.background,
                        }}
                      >
                        <textarea
                          placeholder="Ask a question..."
                          disabled
                          rows={1}
                          className="flex-1 resize-none border-0 bg-transparent px-4 py-3 text-sm focus:outline-none disabled:cursor-not-allowed"
                          style={{ 
                            color: theme.textPrimary,
                            minHeight: "48px",
                            maxHeight: "120px",
                          }}
                        />
                        <button
                          className="mb-2 mr-2 flex h-8 w-8 items-center justify-center rounded-lg transition-opacity"
                          style={{ backgroundColor: theme.accent, color: theme.surface }}
                          disabled
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                          </svg>
                        </button>
                      </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-4 border-t border-slate-200">
                <button
                  onClick={handleResetTheme}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs md:text-sm font-semibold text-slate-700 bg-white border-2 border-slate-300 hover:border-slate-400 hover:bg-slate-50 transition-all shadow-sm hover:shadow-md"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span className="whitespace-nowrap">Reset to Default</span>
                </button>
                <button
                  onClick={handleSaveTheme}
                  disabled={isSavingTheme}
                  className="inline-flex items-center justify-center gap-2 px-4 md:px-6 py-2 rounded-lg text-xs md:text-sm font-semibold text-white bg-slate-600 hover:bg-slate-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className={`w-4 h-4 ${isSavingTheme ? 'animate-pulse' : ''}`} />
                  <span>{isSavingTheme ? 'Saving...' : 'Save Theme'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Embed URL Success - Only show if credential exists and embedUrl is set */}
      {embedUrl && credential && (
        <div className="bg-white border border-slate-200 rounded-lg p-4 md:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-slate-100 rounded-lg text-slate-700">
                <Link2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900">
                  Embed Code Generated Successfully!
                </h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  Add this script tag to your website to embed the chatbot as a floating circle icon.
                </p>
              </div>
            </div>
          </div>
          <div className="space-y-3">
            {/* Embed Script Snippet */}
            {(() => {
              const urlObj = new URL(embedUrl);
              const tokenValue = urlObj.searchParams.get("token") || "";
              const embedScript = `<script src="${urlObj.origin}/embed.js" data-token="${tokenValue}"></script>`;
              return (
                <CodeBlock
                  code={embedScript}
                  label="Embed Code (add before closing </body> tag)"
                  copyValue={embedScript}
                />
              );
            })()}
            {/* Also show direct URL */}
            <CodeBlock code={embedUrl} label="Direct Widget URL (for testing)" />
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  window.open(embedUrl, '_blank');
                }}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs md:text-sm font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition-colors w-full sm:w-auto"
              >
                <Link2 className="w-4 h-4" />
                <span>Test in New Tab</span>
              </button>
            </div>
          </div>
        </div>
      )}
    {embedUrl && credential && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-yellow-800">
            <strong>Important:</strong> If you regenerate the embed URL, the previous token will stop working. Make sure to update the embed code on your website with the new token.
          </p>
        </div>
      )}
      {/* Regenerate Button - Below the embed code container */}
      {embedUrl && credential && (
        <div className="flex items-center gap-2">
          <button
            onClick={handleGenerateEmbed}
            disabled={isGeneratingEmbed || isToggling || (credential ? !credential.is_active : false)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs md:text-sm font-semibold text-white bg-slate-600 hover:bg-slate-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
            title={credential && !credential.is_active ? "Enable embed first to regenerate URL" : "Regenerate embed URL"}
          >
            <RefreshCw className={`w-4 h-4 ${isGeneratingEmbed ? 'animate-spin' : ''}`} />
            <span>{isGeneratingEmbed ? 'Regenerating...' : 'Regenerate Embed URL'}</span>
          </button>
        </div>
      )}

      {/* Info Banner */}
      {!selectedAgentId && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-700">
            Select an agent above to generate embed code.
          </p>
        </div>
      )}
    </div>
  );
}
