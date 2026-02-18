// "use client";

// import { useState, useEffect } from "react";
// import { Copy, Check, AlertCircle, X, RefreshCw, Link2, AlertTriangle } from "lucide-react";
// import { useAuth } from "@/contexts/AuthContext";
// import { getAccountId } from "@/services/agentsService";
// import { useAgents } from "@/hooks/useAgents";
// import { listCredentials, toggleEmbedStatus } from "@/services/credentialsService";
// import { launchEmbed, getEmbedUrl } from "@/services/embedService";
// import type { Credential } from "@/types/credential";

// interface CodeBlockProps {
//   code: string;
//   label?: string;
//   copyValue?: string; // Optional value to copy (useful for masked secrets)
// }

// function CodeBlock({ code, label, copyValue }: CodeBlockProps) {
//   const [isCopied, setIsCopied] = useState(false);

//   const handleCopy = async () => {
//     try {
//       const valueToCopy = copyValue || code;
//       await navigator.clipboard.writeText(valueToCopy);
//       setIsCopied(true);
//       setTimeout(() => setIsCopied(false), 2000);
//     } catch (err) {
//       console.error("Failed to copy:", err);
//     }
//   };

//   return (
//     <div className="relative group">
//       {label && (
//         <label className="block text-xs font-medium text-slate-700 mb-1.5">
//           {label}
//         </label>
//       )}
//       <div className="flex items-center gap-2 bg-slate-900 rounded-lg p-3 pr-10">
//         <code className="flex-1 text-sm font-mono text-slate-100 break-all">
//           {code}
//         </code>
//         <button
//           onClick={handleCopy}
//           className="absolute right-3 p-1.5 rounded-md bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white transition-colors"
//           title="Copy"
//         >
//           {isCopied ? (
//             <Check className="w-4 h-4" />
//           ) : (
//             <Copy className="w-4 h-4" />
//           )}
//         </button>
//       </div>
//     </div>
//   );
// }


// export function EmbedConfigDocs() {
//   const { user } = useAuth();
//   const { data: agents, isLoading: isLoadingAgents } = useAgents();
//   const [selectedAgentId, setSelectedAgentId] = useState<string>("");
//   const [credential, setCredential] = useState<Credential | null>(null);
//   const [isLoadingCredential, setIsLoadingCredential] = useState(false);
//   const [isToggling, setIsToggling] = useState(false);
//   const [error, setError] = useState<string | null>(null);
//   const [embedUrl, setEmbedUrl] = useState<string | null>(null);
//   const [isGeneratingEmbed, setIsGeneratingEmbed] = useState(false);
//   const [showRegenerateWarning, setShowRegenerateWarning] = useState(false);

//   const accountId = user ? getAccountId(user) : null;

//   // Helper functions for localStorage
//   const getStoredEmbedUrl = (agentId: string): string | null => {
//     if (typeof window === 'undefined') return null;
//     try {
//       return localStorage.getItem(`embedUrl_${agentId}`);
//     } catch {
//       return null;
//     }
//   };

//   const setStoredEmbedUrl = (agentId: string, url: string) => {
//     if (typeof window === 'undefined') return;
//     try {
//       localStorage.setItem(`embedUrl_${agentId}`, url);
//     } catch {
//       // Ignore localStorage errors
//     }
//   };

//   const loadCredential = async () => {
//     if (!selectedAgentId || !accountId) {
//       setCredential(null);
//       return;
//     }

//     setIsLoadingCredential(true);
//     setError(null);
//     try {
//       const data = await listCredentials(accountId, selectedAgentId);
//       // Get the first credential (should only be one per agent)
//       const cred = data.length > 0 ? data[0] : null;
//       setCredential(cred);
      
//       // If credential has embed_url or embed_token, use it
//       if (cred) {
//         if (cred.embed_url) {
//           setEmbedUrl(cred.embed_url);
//           setStoredEmbedUrl(selectedAgentId, cred.embed_url);
//         } else if (cred.embed_token) {
//           // Construct embed URL from token
//           const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
//           const widgetUrl = `${origin}/embed/widget?token=${cred.embed_token}`;
//           setEmbedUrl(widgetUrl);
//           setStoredEmbedUrl(selectedAgentId, widgetUrl);
//         }
//       }
//     } catch (err) {
//       console.error("Failed to load credential:", err);
//       setError(err instanceof Error ? err.message : "Failed to load credential");
//       setCredential(null);
//     } finally {
//       setIsLoadingCredential(false);
//     }
//   };

//   const loadEmbedUrl = async () => {
//     if (!selectedAgentId || !accountId) {
//       return; // Don't clear, let loadCredential handle it
//     }

//     // First try localStorage (for quick display)
//     const storedUrl = getStoredEmbedUrl(selectedAgentId);
//     if (storedUrl) {
//       setEmbedUrl(storedUrl);
//     }

//     // Then fetch from backend to get the current token (only if credential didn't already provide it)
//     try {
//       const response = await getEmbedUrl(accountId, selectedAgentId);
//       if (response) {
//         // Convert chatbot URL to widget URL format
//         const url = new URL(response.frontend_url);
//         const token = url.hash.substring(1);
//         if (token) {
//           const widgetUrl = `${url.origin}/embed/widget?token=${token}`;
//           setEmbedUrl(widgetUrl);
//           // Update localStorage with the fetched URL
//           setStoredEmbedUrl(selectedAgentId, widgetUrl);
//         } else {
//           setEmbedUrl(response.frontend_url);
//           // Update localStorage with the fetched URL
//           setStoredEmbedUrl(selectedAgentId, response.frontend_url);
//         }
//       }
//       // If response is null, keep stored URL if it exists
//     } catch (err: any) {
//       // Only clear embed URL for specific errors
//       const status = err?.response?.status || err?.status;
      
//       // If 404, endpoint doesn't exist - keep stored URL (backend might not have this endpoint yet)
//       if (status === 404) {
//         // Keep the stored URL, don't clear it
//         console.log("Embed URL endpoint not found, using stored URL or credential data");
//         return;
//       }
      
//       // If 403, no credential or embed is disabled - clear embed URL
//       if (status === 403) {
//         // Only clear if we don't have a stored URL
//         if (!storedUrl) {
//           setEmbedUrl(null);
//         }
//         // Clear localStorage if credential doesn't exist or is disabled
//         if (typeof window !== 'undefined') {
//           try {
//             localStorage.removeItem(`embedUrl_${selectedAgentId}`);
//           } catch {
//             // Ignore localStorage errors
//           }
//         }
//       } else {
//         // For other errors (network, 500, etc.), keep the stored URL if it exists
//         console.error("Failed to load embed URL from backend, using stored URL:", err);
//         // Don't clear the URL, keep what we have from localStorage
//       }
//     }
//   };

//   // Load credential and embed URL when agent is selected
//   useEffect(() => {
//     if (selectedAgentId && accountId) {
//       // Load credential first (it might include embed_url/embed_token)
//       loadCredential().then(() => {
//         // Then try to load embed URL from dedicated endpoint
//         // This will only update if credential didn't already provide it
//         loadEmbedUrl();
//       });
//     } else {
//       setCredential(null);
//       setEmbedUrl(null);
//     }
//   }, [selectedAgentId, accountId]);

//   const handleGenerateEmbed = async () => {
//     if (!selectedAgentId || !accountId) {
//       setError("Please select an agent first");
//       return;
//     }

//     // Show warning if regenerating
//     if (embedUrl) {
//       setShowRegenerateWarning(true);
//       return;
//     }

//     setIsGeneratingEmbed(true);
//     setError(null);

//     try {
//       const response = await launchEmbed({
//         agent_id: selectedAgentId,
//       });
//       // Convert chatbot URL to widget URL format
//       const url = new URL(response.frontend_url);
//       const token = url.hash.substring(1);
//       if (token) {
//         const widgetUrl = `${url.origin}/embed/widget?token=${token}`;
//         setEmbedUrl(widgetUrl);
//         // Store in localStorage for persistence
//         setStoredEmbedUrl(selectedAgentId, widgetUrl);
//       } else {
//         setEmbedUrl(response.frontend_url);
//         // Store in localStorage for persistence
//         setStoredEmbedUrl(selectedAgentId, response.frontend_url);
//       }
//     } catch (err: any) {
//       console.error("Failed to generate embed URL:", err);
//       // Handle 403 errors specifically
//       if (err?.response?.status === 403 || err?.status === 403) {
//         const errorMessage = err?.response?.data?.detail || err?.message || "Embed credentials not found for this agent. Please create credentials first.";
//         setError(errorMessage);
//       } else {
//         setError(err instanceof Error ? err.message : "Failed to generate embed URL.");
//       }
//     } finally {
//       setIsGeneratingEmbed(false);
//     }
//   };

//   const handleConfirmRegenerate = async () => {
//     setShowRegenerateWarning(false);
//     setIsGeneratingEmbed(true);
//     setError(null);

//     try {
//       const response = await launchEmbed({
//         agent_id: selectedAgentId!,
//       });
//       // Convert chatbot URL to widget URL format
//       const url = new URL(response.frontend_url);
//       const token = url.hash.substring(1);
//       if (token) {
//         const widgetUrl = `${url.origin}/embed/widget?token=${token}`;
//         setEmbedUrl(widgetUrl);
//         // Store in localStorage for persistence
//         setStoredEmbedUrl(selectedAgentId!, widgetUrl);
//       } else {
//         setEmbedUrl(response.frontend_url);
//         // Store in localStorage for persistence
//         setStoredEmbedUrl(selectedAgentId!, response.frontend_url);
//       }
//     } catch (err: any) {
//       console.error("Failed to regenerate embed URL:", err);
//       // Handle 403 errors specifically
//       if (err?.response?.status === 403 || err?.status === 403) {
//         const errorMessage = err?.response?.data?.detail || err?.message || "Embed credentials not found for this agent. Please create credentials first.";
//         setError(errorMessage);
//       } else {
//         setError(err instanceof Error ? err.message : "Failed to regenerate embed URL.");
//       }
//     } finally {
//       setIsGeneratingEmbed(false);
//     }
//   };

//   const handleToggleStatus = async () => {
//     if (!selectedAgentId || !accountId || !credential) return;

//     setIsToggling(true);
//     setError(null);

//     try {
//       const updatedCredential = await toggleEmbedStatus(accountId, selectedAgentId, credential.id, !credential.is_active);
//       setCredential(updatedCredential);
//     } catch (err) {
//       console.error("Failed to toggle embed status:", err);
//       setError(err instanceof Error ? err.message : "Failed to toggle embed status");
//     } finally {
//       setIsToggling(false);
//     }
//   };

//   const selectedAgent = agents?.find((a) => a.id === selectedAgentId);

//   return (
//     <div className="space-y-6">
//       {/* Header */}
//       <div className="space-y-2">
//         <h2 className="text-2xl font-bold text-slate-900">
//           Embed Configuration
//         </h2>
//         <p className="text-sm text-slate-600">
//           Generate embed code to add the chatbot to your website.
//         </p>
//       </div>

//       {/* Agent Selection */}
//       <div className="bg-white rounded-lg border border-slate-200 p-4 space-y-3">
//         <div className="flex items-center justify-between">
//           <label className="block text-sm font-semibold text-slate-900">
//             Select Agent
//           </label>
//           {/* Toggle button - show if credential exists (allows enabling even when disabled) */}
//           {credential && !isLoadingCredential && (
//             <button
//               onClick={handleToggleStatus}
//               disabled={isToggling}
//               className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white shadow-sm hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
//                 credential.is_active
//                   ? "bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
//                   : "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
//               }`}
//               title={credential.is_active ? "Disable embed" : "Enable embed"}
//             >
//               <RefreshCw className={`w-4 h-4 ${isToggling ? 'animate-spin' : ''}`} />
//               <span>{isToggling ? 'Updating...' : credential.is_active ? 'Disable Embed' : 'Enable Embed'}</span>
//             </button>
//           )}
//         </div>
//         {isLoadingAgents ? (
//           <div className="text-sm text-slate-500">Loading agents...</div>
//         ) : !agents || agents.length === 0 ? (
//           <div className="text-sm text-slate-500">No agents available. Create an agent first.</div>
//         ) : (
//           <>
//             <select
//               value={selectedAgentId}
//               onChange={(e) => {
//                 const newAgentId = e.target.value;
//                 setSelectedAgentId(newAgentId);
//                 setShowRegenerateWarning(false); // Clear warning when agent changes
//                 // Load embed URL for the new agent from localStorage
//                 if (newAgentId) {
//                   const storedUrl = getStoredEmbedUrl(newAgentId);
//                   setEmbedUrl(storedUrl);
//                 } else {
//                   setEmbedUrl(null);
//                 }
//               }}
//               className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//             >
//               <option value="">-- Select an agent --</option>
//               {agents.map((agent) => (
//                 <option key={agent.id} value={agent.id}>
//                   {agent.name}
//                 </option>
//               ))}
//             </select>
//             {selectedAgentId && (
//               <div className="mt-2">
//                 <CodeBlock code={selectedAgentId} label="Agent ID" />
//               </div>
//             )}
//           </>
//         )}
//       </div>

//       {/* Error Message */}
//       {error && (
//         <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
//           <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
//           <div className="flex-1">
//             <p className="text-sm font-medium text-red-900">Error</p>
//             <p className="text-sm text-red-700 mt-1">{error}</p>
//           </div>
//           <button
//             onClick={() => setError(null)}
//             className="p-1 rounded-md text-red-600 hover:bg-red-100 transition-colors"
//           >
//             <X className="w-4 h-4" />
//           </button>
//         </div>
//       )}

//       {/* Generate Embed URL Button - Only show when no embed URL exists */}
//       {selectedAgentId && !embedUrl && (
//         <div className="bg-white rounded-lg border border-slate-200 p-4">
//           <button
//             onClick={handleGenerateEmbed}
//             disabled={isGeneratingEmbed || isToggling || (credential ? !credential.is_active : false)}
//             className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-sm hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
//             title={credential && !credential.is_active ? "Enable embed first to generate URL" : "Generate embed URL"}
//           >
//             <Link2 className={`w-4 h-4 ${isGeneratingEmbed ? 'animate-pulse' : ''}`} />
//             <span>{isGeneratingEmbed ? 'Generating...' : 'Generate Embed URL'}</span>
//           </button>
//         </div>
//       )}

//       {/* Regenerate Warning Modal */}
//       {showRegenerateWarning && (
//         <>
//           {/* Backdrop */}
//           <div
//             className="fixed inset-0 z-50 bg-black/50"
//             onClick={() => setShowRegenerateWarning(false)}
//           />
          
//           {/* Modal */}
//           <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
//             <div
//               className="relative w-full max-w-md rounded-2xl bg-white shadow-xl"
//               onClick={(e) => e.stopPropagation()}
//             >
//               {/* Content */}
//               <div className="px-6 pt-6 pb-4">
//                 <h2 className="mb-2 text-lg font-semibold text-slate-900">
//                   Regenerating Embed URL
//                 </h2>
//                 <p className="mb-1 text-sm text-slate-600">
//                   The previous token will stop working.
//                 </p>
//                 <p className="mb-0 text-xs text-slate-500">
//                   You must update the embed code on your website with the new token.
//                 </p>
//               </div>

//               {/* Divider */}
//               <div className="border-t border-slate-200"></div>

//               {/* Actions */}
//               <div className="flex items-center justify-end gap-3 px-6 py-4">
//                 <button
//                   onClick={() => setShowRegenerateWarning(false)}
//                   disabled={isGeneratingEmbed}
//                   className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
//                 >
//                   Cancel
//                 </button>
//                 <button
//                   onClick={handleConfirmRegenerate}
//                   disabled={isGeneratingEmbed}
//                   className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-orange-600 disabled:opacity-50"
//                 >
//                   {isGeneratingEmbed ? "Regenerating..." : "Yes, Regenerate"}
//                 </button>
//               </div>
//             </div>
//           </div>
//         </>
//       )}

//       {/* Warning - Outside the embed code box */}
//       {/* {embedUrl && (
//         <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-start gap-2">
//           <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
//           <p className="text-xs text-yellow-800">
//             <strong>Important:</strong> If you regenerate the embed URL, the previous token will stop working. Make sure to update the embed code on your website with the new token.
//           </p>
//         </div>
//       )} */}

//       {/* Embed URL Success - Always show if generated */}
//       {embedUrl && (
//         <div className="bg-green-50 border border-green-200 rounded-lg p-6 space-y-4">
//           <div className="flex items-center justify-between">
//             <div className="flex items-center gap-2">
//               <div className="p-2 bg-green-100 rounded-lg text-green-600">
//                 <Link2 className="w-5 h-5" />
//               </div>
//               <div>
//                 <h3 className="text-sm font-semibold text-green-900">
//                   Embed Code Generated Successfully!
//                 </h3>
//                 <p className="text-xs text-green-700 mt-0.5">
//                   Add this script tag to your website to embed the chatbot as a floating circle icon.
//                 </p>
//               </div>
//             </div>
//           </div>
//           <div className="space-y-3">
//             {/* Embed Script Snippet */}
//             {(() => {
//               const urlObj = new URL(embedUrl);
//               const tokenValue = urlObj.searchParams.get("token") || "";
//               const embedScript = `<script src="${urlObj.origin}/embed.js" data-token="${tokenValue}"></script>`;
//               return (
//                 <CodeBlock
//                   code={embedScript}
//                   label="Embed Code (add before closing </body> tag)"
//                   copyValue={embedScript}
//                 />
//               );
//             })()}
//             {/* Also show direct URL */}
//             <CodeBlock code={embedUrl} label="Direct Widget URL (for testing)" />
//             <div className="flex items-center gap-2">
//               <button
//                 onClick={() => {
//                   window.open(embedUrl, '_blank');
//                 }}
//                 className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-sm hover:shadow-md transition-all duration-200"
//               >
//                 <Link2 className="w-4 h-4" />
//                 <span>Test in New Tab</span>
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     {embedUrl && (
//         <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-start gap-2">
//           <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
//           <p className="text-xs text-yellow-800">
//             <strong>Important:</strong> If you regenerate the embed URL, the previous token will stop working. Make sure to update the embed code on your website with the new token.
//           </p>
//         </div>
//       )}
//       {/* Regenerate Button - Below the embed code container */}
//       {embedUrl && (
//         <div className="flex items-center gap-2">
//           <button
//             onClick={handleGenerateEmbed}
//             disabled={isGeneratingEmbed || isToggling || (credential ? !credential.is_active : false)}
//             className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-sm hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
//             title={credential && !credential.is_active ? "Enable embed first to regenerate URL" : "Regenerate embed URL"}
//           >
//             <RefreshCw className={`w-4 h-4 ${isGeneratingEmbed ? 'animate-spin' : ''}`} />
//             <span>{isGeneratingEmbed ? 'Regenerating...' : 'Regenerate Embed URL'}</span>
//           </button>
//         </div>
//       )}

//       {/* Info Banner */}
//       {!selectedAgentId && (
//         <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
//           <p className="text-sm text-blue-700">
//             Select an agent above to generate embed code.
//           </p>
//         </div>
//       )}
//     </div>
//   );
// }



"use client";

import { useState, useEffect, useRef } from "react";
import { Copy, Check, AlertCircle, X, RefreshCw, Link2, AlertTriangle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getAccountId } from "@/services/agentsService";
import { useAgents } from "@/hooks/useAgents";
import { listCredentials, toggleEmbedStatus } from "@/services/credentialsService";
import { launchEmbed } from "@/services/embedService";
import type { Credential } from "@/types/credential";

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

  const selectedAgent = agents?.find((a) => a.id === selectedAgentId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-slate-900">
          Embed Configuration
        </h2>
        <p className="text-sm text-slate-600">
          Generate embed code to add the chatbot to your website.
        </p>
      </div>

      {/* Agent Selection */}
      <div className="bg-white rounded-lg border border-slate-200 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-semibold text-slate-900">
            Select Agent
          </label>
          {/* Toggle button - show if credential exists (allows enabling even when disabled) */}
          {credential && !isLoadingCredential && (
            <button
              onClick={handleToggleStatus}
              disabled={isToggling}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white shadow-sm hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                credential.is_active
                  ? "bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
                  : "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
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

      {/* Generate Embed URL Button - Only show when no embed URL exists */}
      {selectedAgentId && !embedUrl && (
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <button
            onClick={handleGenerateEmbed}
            disabled={isGeneratingEmbed || isToggling || (credential ? !credential.is_active : false)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-sm hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
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
              className="relative w-full max-w-md rounded-2xl bg-white shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Content */}
              <div className="px-6 pt-6 pb-4">
                <h2 className="mb-2 text-lg font-semibold text-slate-900">
                  Regenerating Embed URL
                </h2>
                <p className="mb-1 text-sm text-slate-600">
                  The previous token will stop working.
                </p>
                <p className="mb-0 text-xs text-slate-500">
                  You must update the embed code on your website with the new token.
                </p>
              </div>

              {/* Divider */}
              <div className="border-t border-slate-200"></div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 px-6 py-4">
                <button
                  onClick={() => setShowRegenerateWarning(false)}
                  disabled={isGeneratingEmbed}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmRegenerate}
                  disabled={isGeneratingEmbed}
                  className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-orange-600 disabled:opacity-50"
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

      {/* Embed URL Success - Only show if credential exists and embedUrl is set */}
      {embedUrl && credential && (
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
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-sm hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
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
