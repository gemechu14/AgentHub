"use client";

import { AppShell } from "@/components/layout/AppShell";
import { CreateAgentForm } from "@/features/agents/components/CreateAgentForm";

export default function CreateAgentPage() {
  return (
    <AppShell title="Create New Agent">
      <CreateAgentForm />
    </AppShell>
  );
}

