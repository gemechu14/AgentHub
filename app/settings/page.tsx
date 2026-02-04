"use client";

import { AppShell } from "@/components/layout/AppShell";
import { SettingsTabs } from "@/features/settings/components/SettingsTabs";

export default function SettingsPage() {
  return (
    <AppShell title="Settings">
      <SettingsTabs />
    </AppShell>
  );
}

