"use client";

import { useState, useEffect } from "react";

export function ThinkingIndicator() {
  const [messageIndex, setMessageIndex] = useState(0);
  
  // Messages to cycle through (like ChatGPT)
  const messages = ["Thinking...", "Writing..."];

  // Cycle through messages every 2 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % messages.length);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex justify-start px-4 py-6">
      <div className="w-full">
        <div className="max-w-[85%] md:max-w-[80%]">
          <div className="rounded-2xl rounded-bl-sm bg-slate-100 px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="flex gap-1">
                <div className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.3s]"></div>
                <div className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.15s]"></div>
                <div className="h-2 w-2 animate-bounce rounded-full bg-slate-400"></div>
              </div>
              <span className="text-sm text-slate-600 font-medium">
                {messages[messageIndex]}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

