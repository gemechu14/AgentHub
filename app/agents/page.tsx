"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AgentsPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect agents page to chat interface
    router.replace("/chat");
  }, [router]);

  return null;
}

