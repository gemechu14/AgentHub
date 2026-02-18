"use client";

import { useState, useEffect, useCallback } from "react";
import { Copy, Check, Key, Trash2, Plus, Eye, EyeOff, AlertCircle, X, RotateCw, RefreshCw, Link2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getAccountId } from "@/services/agentsService";
import { useAgents } from "@/hooks/useAgents";
import { createCredential, listCredentials, deleteCredential, regenerateCredentialSecret } from "@/services/credentialsService";
import { launchEmbed } from "@/services/embedService";
import type { Credential, CreateCredentialResponse } from "@/types/credential";

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
      <div className="flex items-center gap-2 bg-slate-900 rounded-lg p-3 pr-10">
        <code className="flex-1 text-sm font-mono text-slate-100 break-all">
          {code}
        </code>
        <button
          onClick={handleCopy}
          className="absolute right-3 p-1.5 rounded-md bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white transition-colors"
          title="Copy"
        >
          {isCopied ? (
            <Check className="w-4 h-4" />
          ) : (
            <Copy className="w-4 h-4" />
          )}
        </button>
      </div>
    </div>
  );
}

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText: string;
  cancelText?: string;
  onConfirm: () => void;
  onClose: () => void;
  isLoading?: boolean;
  variant?: "danger" | "default";
}

function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText,
  cancelText = "Cancel",
  onConfirm,
  onClose,
  isLoading = false,
  variant = "danger",
}: ConfirmModalProps) {
  if (!isOpen) return null;

  const confirmButtonClass =
    variant === "danger"
      ? "rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-600 disabled:opacity-50"
      : "rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-600 disabled:opacity-50";

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/50"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="relative w-full max-w-md rounded-2xl bg-white shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Content */}
          <div className="px-6 pt-6 pb-4">
            <h2 className="mb-2 text-lg font-semibold text-slate-900">
              {title}
            </h2>
            <p className="mb-0 text-sm text-slate-600">
              {message}
            </p>
          </div>

          {/* Divider */}
          <div className="border-t border-slate-200"></div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 px-6 py-4">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className={confirmButtonClass}
            >
              {isLoading ? "Processing..." : confirmText}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

interface CredentialCardProps {
  credential: Credential;
  agentId: string;
  onDelete: (id: string) => void;
  onRegenerate: (id: string) => void;
  onGenerateEmbed: (credential: Credential) => void;
  isDeleting: boolean;
  isRegenerating: boolean;
  isGeneratingEmbed: boolean;
}

function CredentialCard({ credential, agentId, onDelete, onRegenerate, onGenerateEmbed, isDeleting, isRegenerating, isGeneratingEmbed }: CredentialCardProps) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3 flex-1">
          <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
            <Key className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            {credential.name && (
              <h4 className="text-sm font-semibold text-slate-900 mb-1">
                {credential.name}
              </h4>
            )}
            <CodeBlock code={credential.client_id} label="Client ID" />
            <div className="mt-3 flex flex-col gap-2">
              <button
                onClick={() => onRegenerate(credential.id)}
                disabled={isRegenerating || isDeleting || isGeneratingEmbed}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-sm hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-sm"
                title="Regenerate secret"
              >
                <RefreshCw className={`w-4 h-4 ${isRegenerating ? 'animate-spin' : ''}`} />
                <span>Regenerate Secret</span>
              </button>
              <button
                onClick={() => onGenerateEmbed(credential)}
                disabled={isRegenerating || isDeleting || isGeneratingEmbed}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-sm hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-sm"
                title="Generate embed URL"
              >
                <Link2 className={`w-4 h-4 ${isGeneratingEmbed ? 'animate-pulse' : ''}`} />
                <span>{isGeneratingEmbed ? 'Generating...' : 'Generate Embed URL'}</span>
              </button>
            </div>
            <div className="mt-2">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span>Created: {new Date(credential.created_at).toLocaleDateString()}</span>
                <span>•</span>
                <span className={credential.is_active ? "text-green-600" : "text-slate-400"}>
                  {credential.is_active ? "Active" : "Inactive"}
                </span>
              </div>
            </div>
          </div>
        </div>
        <button
          onClick={() => onDelete(credential.id)}
          disabled={isDeleting || isRegenerating || isGeneratingEmbed}
          className="p-2 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Delete credential"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export function EmbedConfigDocs() {
  const { user } = useAuth();
  const { data: agents, isLoading: isLoadingAgents } = useAgents();
  const [selectedAgentId, setSelectedAgentId] = useState<string>("");
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [isLoadingCredentials, setIsLoadingCredentials] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isRegenerating, setIsRegenerating] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [newCredential, setNewCredential] = useState<CreateCredentialResponse | null>(null);
  const [regeneratedCredential, setRegeneratedCredential] = useState<CreateCredentialResponse | null>(null);
  const [showSecret, setShowSecret] = useState(false);
  const [showRegeneratedSecret, setShowRegeneratedSecret] = useState(false);
  const [credentialName, setCredentialName] = useState("");
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; credentialId: string | null }>({
    isOpen: false,
    credentialId: null,
  });
  const [regenerateModal, setRegenerateModal] = useState<{ isOpen: boolean; credentialId: string | null }>({
    isOpen: false,
    credentialId: null,
  });
  const [embedUrl, setEmbedUrl] = useState<string | null>(null);
  const [isGeneratingEmbed, setIsGeneratingEmbed] = useState(false);
  const [selectedCredentialForEmbed, setSelectedCredentialForEmbed] = useState<Credential | null>(null);
  const [storedSecrets, setStoredSecrets] = useState<Record<string, string>>({}); // Store secrets temporarily

  const accountId = user ? getAccountId(user) : null;

  const loadCredentials = useCallback(async () => {
    if (!selectedAgentId || !accountId) return;

    setIsLoadingCredentials(true);
    setError(null);
    try {
      const data = await listCredentials(accountId, selectedAgentId);
      setCredentials(data);
    } catch (err) {
      console.error("Failed to load credentials:", err);
      setError(err instanceof Error ? err.message : "Failed to load credentials");
    } finally {
      setIsLoadingCredentials(false);
    }
  }, [selectedAgentId, accountId]);

  // Load credentials when agent is selected
  useEffect(() => {
    if (selectedAgentId && accountId) {
      loadCredentials();
    } else {
      setCredentials([]);
    }
  }, [selectedAgentId, accountId, loadCredentials]);

  const handleCreateCredential = async () => {
    if (!selectedAgentId || !accountId) {
      setError("Please select an agent first");
      return;
    }

    setIsCreating(true);
    setError(null);
    setNewCredential(null);

    try {
      const response = await createCredential(accountId, selectedAgentId, {
        agent_id: selectedAgentId,
        name: credentialName.trim() || undefined,
      });
      setNewCredential(response);
      // Store the secret temporarily
      if (response.client_secret) {
        setStoredSecrets(prev => ({ ...prev, [response.id]: response.client_secret }));
      }
      setCredentialName("");
      // Reload credentials list
      await loadCredentials();
    } catch (err) {
      console.error("Failed to create credential:", err);
      setError(err instanceof Error ? err.message : "Failed to create credential");
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteClick = (credentialId: string) => {
    setDeleteModal({ isOpen: true, credentialId });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModal.credentialId || !selectedAgentId || !accountId) return;

    const credentialId = deleteModal.credentialId;
    setIsDeleting(credentialId);
    setError(null);
    setDeleteModal({ isOpen: false, credentialId: null });

    try {
      await deleteCredential(accountId, selectedAgentId, credentialId);
      // Remove from list
      setCredentials(credentials.filter((c) => c.id !== credentialId));
      // Clear new credential if it was the one deleted
      if (newCredential?.id === credentialId) {
        setNewCredential(null);
      }
      if (regeneratedCredential?.id === credentialId) {
        setRegeneratedCredential(null);
      }
    } catch (err) {
      console.error("Failed to delete credential:", err);
      setError(err instanceof Error ? err.message : "Failed to delete credential");
    } finally {
      setIsDeleting(null);
    }
  };

  const handleRegenerateClick = (credentialId: string) => {
    setRegenerateModal({ isOpen: true, credentialId });
  };

  const handleRegenerateConfirm = async () => {
    if (!regenerateModal.credentialId || !selectedAgentId || !accountId) return;

    const credentialId = regenerateModal.credentialId;
    setIsRegenerating(credentialId);
    setError(null);
    setRegeneratedCredential(null);
    setShowRegeneratedSecret(false);
    setRegenerateModal({ isOpen: false, credentialId: null });

    try {
      const response = await regenerateCredentialSecret(accountId, selectedAgentId, credentialId);
      setRegeneratedCredential(response);
      // Store the new secret temporarily
      if (response.client_secret) {
        setStoredSecrets(prev => ({ ...prev, [response.id]: response.client_secret }));
      }
      // Reload credentials list
      await loadCredentials();
    } catch (err) {
      console.error("Failed to regenerate secret:", err);
      setError(err instanceof Error ? err.message : "Failed to regenerate secret");
    } finally {
      setIsRegenerating(null);
    }
  };

  const handleGenerateEmbed = async (credential: Credential) => {
    if (!selectedAgentId) {
      setError("Please select an agent first");
      return;
    }

    // Get the stored secret or use the one from credential (if available)
    const clientSecret = storedSecrets[credential.id] || credential.client_secret;
    
    if (!clientSecret) {
      setError("Client secret is required. Please regenerate the secret first to get a new one, then generate the embed URL.");
      return;
    }

    setIsGeneratingEmbed(true);
    setError(null);
    setEmbedUrl(null);
    setSelectedCredentialForEmbed(credential);

    try {
      const response = await launchEmbed({
        client_id: credential.client_id,
        client_secret: clientSecret,
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
    } catch (err) {
      console.error("Failed to generate embed URL:", err);
      setError(err instanceof Error ? err.message : "Failed to generate embed URL. Make sure you have the client secret.");
    } finally {
      setIsGeneratingEmbed(false);
    }
  };

  const selectedAgent = agents?.find((a) => a.id === selectedAgentId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-slate-900">
          Client Credentials Management
        </h2>
        <p className="text-sm text-slate-600">
          Create and manage client credentials for embedding agents. Use these credentials to generate launch tokens.
        </p>
      </div>

      {/* Agent Selection */}
      <div className="bg-white rounded-lg border border-slate-200 p-4 space-y-3">
        <label className="block text-sm font-semibold text-slate-900">
          Select Agent
        </label>
        {isLoadingAgents ? (
          <div className="text-sm text-slate-500">Loading agents...</div>
        ) : !agents || agents.length === 0 ? (
          <div className="text-sm text-slate-500">No agents available. Create an agent first.</div>
        ) : (
          <>
            <select
              value={selectedAgentId}
              onChange={(e) => setSelectedAgentId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">-- Select an agent --</option>
              {agents.map((agent) => (
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

      {/* New Credential Success */}
      {newCredential && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-green-100 rounded-lg text-green-600">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-green-900">
                  Credential Created Successfully!
                </h3>
                <p className="text-xs text-green-700 mt-0.5">
                  Save these credentials securely. The secret will not be shown again.
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setNewCredential(null);
                setShowSecret(false);
              }}
              className="p-1 rounded-md text-green-600 hover:bg-green-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-3">
            <CodeBlock code={newCredential.client_id} label="Client ID" />
            <div className="relative">
              <CodeBlock 
                code={showSecret ? newCredential.client_secret : "••••••••••••••••••••••••••••••••"} 
                label="Client Secret"
                copyValue={newCredential.client_secret}
              />
              <button
                onClick={() => setShowSecret(!showSecret)}
                className="absolute right-3 top-8 p-1.5 rounded-md bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white transition-colors"
                title={showSecret ? "Hide secret" : "Show secret"}
              >
                {showSecret ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Regenerated Secret Success */}
      {regeneratedCredential && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                <RotateCw className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-blue-900">
                  Secret Regenerated Successfully!
                </h3>
                <p className="text-xs text-blue-700 mt-0.5">
                  Save the new secret securely. The old secret is no longer valid.
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setRegeneratedCredential(null);
                setShowRegeneratedSecret(false);
              }}
              className="p-1 rounded-md text-blue-600 hover:bg-blue-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-3">
            <CodeBlock code={regeneratedCredential.client_id} label="Client ID" />
            <div className="relative">
              <CodeBlock 
                code={showRegeneratedSecret ? regeneratedCredential.client_secret : "••••••••••••••••••••••••••••••••"} 
                label="New Client Secret"
                copyValue={regeneratedCredential.client_secret}
              />
              <button
                onClick={() => setShowRegeneratedSecret(!showRegeneratedSecret)}
                className="absolute right-3 top-8 p-1.5 rounded-md bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white transition-colors"
                title={showRegeneratedSecret ? "Hide secret" : "Show secret"}
              >
                {showRegeneratedSecret ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Embed URL Success */}
      {embedUrl && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-green-100 rounded-lg text-green-600">
                <Link2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-green-900">
                  Embed Code Generated Successfully!
                </h3>
                <p className="text-xs text-green-700 mt-0.5">
                  Add this script tag to your website to embed the chatbot as a floating circle icon.
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setEmbedUrl(null);
                setSelectedCredentialForEmbed(null);
              }}
              className="p-1 rounded-md text-green-600 hover:bg-green-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
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
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-sm hover:shadow-md transition-all duration-200"
              >
                <Link2 className="w-4 h-4" />
                <span>Test in New Tab</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Credential Form - Only show if no credentials exist */}
      {selectedAgentId && credentials.length === 0 && !isLoadingCredentials && (
        <div className="bg-white rounded-lg border border-slate-200 p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-slate-900">
              Create New Credential
            </h3>
            {selectedAgent && (
              <span className="text-xs text-slate-500">
                for {selectedAgent.name}
              </span>
            )}
          </div>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Credential Name (Optional)
              </label>
              <input
                type="text"
                value={credentialName}
                onChange={(e) => setCredentialName(e.target.value)}
                placeholder="e.g., Production Credential"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={handleCreateCredential}
              disabled={isCreating}
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCreating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Create Credential</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Existing Credentials */}
      {selectedAgentId && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-slate-900">
              Existing Credentials
            </h3>
            <button
              onClick={loadCredentials}
              disabled={isLoadingCredentials}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50"
            >
              {isLoadingCredentials ? "Loading..." : "Refresh"}
            </button>
          </div>
          {isLoadingCredentials ? (
            <div className="text-center py-8">
              <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-blue-500 border-r-transparent" />
              <p className="mt-2 text-sm text-slate-500">Loading credentials...</p>
            </div>
          ) : credentials.length === 0 ? (
            <div className="bg-slate-50 rounded-lg border border-slate-200 p-8 text-center">
              <Key className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-sm text-slate-500">No credentials found. Create your first credential above.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {credentials.map((credential) => (
                <CredentialCard
                  key={credential.id}
                  credential={credential}
                  agentId={selectedAgentId}
                  onDelete={handleDeleteClick}
                  onRegenerate={handleRegenerateClick}
                  onGenerateEmbed={handleGenerateEmbed}
                  isDeleting={isDeleting === credential.id}
                  isRegenerating={isRegenerating === credential.id}
                  isGeneratingEmbed={isGeneratingEmbed && selectedCredentialForEmbed?.id === credential.id}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Info Banner */}
      {!selectedAgentId && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-700">
            Select an agent above to create and manage client credentials.
          </p>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModal.isOpen}
        title="Delete Credential?"
        message="Are you sure you want to delete this credential? This action cannot be undone."
        confirmText="Delete"
        onConfirm={handleDeleteConfirm}
        onClose={() => setDeleteModal({ isOpen: false, credentialId: null })}
        isLoading={!!isDeleting}
        variant="danger"
      />

      {/* Regenerate Confirmation Modal */}
      <ConfirmModal
        isOpen={regenerateModal.isOpen}
        title="Regenerate Secret?"
        message="Are you sure you want to regenerate the secret? The old secret will no longer work and you'll need to update it in all places where it's used."
        confirmText="Regenerate"
        onConfirm={handleRegenerateConfirm}
        onClose={() => setRegenerateModal({ isOpen: false, credentialId: null })}
        isLoading={!!isRegenerating}
        variant="default"
      />
    </div>
  );
}
