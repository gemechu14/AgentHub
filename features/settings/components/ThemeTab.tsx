"use client";

import { useState } from "react";
import { ArrowUp } from "lucide-react";

export function ThemeTab() {
  const [primaryColor, setPrimaryColor] = useState("#3b82f6");
  const [secondaryColor, setSecondaryColor] = useState("#8b5cf6");
  const [logoUrl, setLogoUrl] = useState("");

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-[65%]">
      {/* Organization Branding Section */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8">
        <h2 className="text-lg font-semibold text-slate-900 mb-6">
          Organization Branding
        </h2>

        <div className="space-y-6">
          {/* Primary Color */}
          <div>
            <label className="block text-sm font-medium text-slate-900 mb-2">
              Primary Color
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="w-16 h-10 rounded-md border border-slate-300 bg-white cursor-pointer"
              />
              <input
                type="text"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="flex-1 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Secondary Color */}
          <div>
            <label className="block text-sm font-medium text-slate-900 mb-2">
              Secondary Color
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={secondaryColor}
                onChange={(e) => setSecondaryColor(e.target.value)}
                className="w-16 h-10 rounded-md border border-slate-300 bg-white cursor-pointer"
              />
              <input
                type="text"
                value={secondaryColor}
                onChange={(e) => setSecondaryColor(e.target.value)}
                className="flex-1 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Logo URL */}
          <div>
            <label className="block text-sm font-medium text-slate-900 mb-2">
              Logo URL
            </label>
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="https://..."
                className="flex-1 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <button
                type="button"
                className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition-colors flex items-center gap-2"
              >
                <ArrowUp className="w-4 h-4" />
                Upload
              </button>
            </div>
          </div>

          {/* Save Theme Button */}
          <div className="pt-4">
            <button
              type="button"
              className="rounded-lg bg-blue-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-600 transition-colors"
            >
              Save Theme
            </button>
          </div>
        </div>
      </div>

      {/* Preview Section */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8">
        <h2 className="text-lg font-semibold text-slate-900 mb-6">Preview</h2>

        <div className="space-y-4">
          {/* Sample Header */}
          <div
            className="rounded-lg px-4 py-3 text-sm font-medium text-white"
            style={{ backgroundColor: "#e5e7eb" }}
          >
            <span className="text-slate-700">Sample Header</span>
          </div>

          {/* Sample Button */}
          <div
            className="rounded-lg px-4 py-2.5 text-sm font-semibold text-white text-center"
            style={{ backgroundColor: primaryColor }}
          >
            Sample Button
          </div>

          {/* Sample Chat Bubble */}
          <div
            className="rounded-lg px-4 py-6 text-sm text-white"
            style={{ backgroundColor: primaryColor }}
          >
            Sample chat bubble
          </div>
        </div>
      </div>
    </div>
  );
}

