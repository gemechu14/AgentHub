"use client";

import ChatWidgetStandalone from "./ChatWidgetStandalone";

interface ChatWidgetProps {
  token: string;
  agentId: string;
  agentName?: string;
}

export default function ChatWidget({ token, agentId, agentName }: ChatWidgetProps) {
  return <ChatWidgetStandalone token={token} agentId={agentId} agentName={agentName} />;
}
