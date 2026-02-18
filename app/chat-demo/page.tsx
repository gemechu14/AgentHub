"use client";

import ChatWidget from "@/components/ChatWidget";

export default function ChatDemoPage() {
  // Replace these with your actual values
  const TOKEN = "YOUR_TOKEN_HERE";
  const AGENT_ID = "YOUR_AGENT_ID_HERE";
  const AGENT_NAME = "My Assistant";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold text-white mb-4">
              Welcome to Our Website
            </h1>
            <p className="text-xl text-slate-300">
              Look at the bottom-right corner 👉
            </p>
          </div>

          {/* Feature Cards */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 text-white">
              <h3 className="text-xl font-semibold mb-2">💬 Chat Widget</h3>
              <p className="text-slate-300">
                Click the blue circle to start chatting with our AI assistant.
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 text-white">
              <h3 className="text-xl font-semibold mb-2">🚀 Easy Integration</h3>
              <p className="text-slate-300">
                Just add one component to your layout and you're done!
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 text-white">
              <h3 className="text-xl font-semibold mb-2">✨ Beautiful UI</h3>
              <p className="text-slate-300">
                Modern design that fits any website seamlessly.
              </p>
            </div>
          </div>

          {/* Integration Example */}
          <div className="bg-white rounded-xl shadow-2xl p-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">
              How to Add to Your Site
            </h2>
            <div className="bg-slate-900 rounded-lg p-6 overflow-x-auto">
              <pre className="text-sm text-slate-100">
                <code>{`// In your app/layout.tsx or any page
import ChatWidget from "@/components/ChatWidget";

export default function Layout({ children }) {
  return (
    <html>
      <body>
        {children}
        <ChatWidget
          token="YOUR_TOKEN_HERE"
          agentId="YOUR_AGENT_ID_HERE"
          agentName="My Assistant"
        />
      </body>
    </html>
  );
}`}</code>
              </pre>
            </div>
            <p className="text-slate-600 mt-4 text-sm">
              That's it! The chat widget will appear as a floating circle in the
              bottom-right corner. Click it to open, click ✕ to close.
            </p>
          </div>
        </div>
      </div>

      {/* The Chat Widget */}
      <ChatWidget token={TOKEN} agentId={AGENT_ID} agentName={AGENT_NAME} />
    </div>
  );
}





