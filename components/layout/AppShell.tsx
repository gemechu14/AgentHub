"use client";

import type { ReactNode } from "react";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Bot, Settings, ChevronLeft, ChevronRight, Menu, X, User, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { APP_NAME } from "@/lib/config";
import { useAuth } from "@/contexts/AuthContext";

interface AppShellProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
}

function NavItem({
  href,
  label,
  icon,
  isActive,
  isCollapsed,
}: {
  href: string;
  label: string;
  icon: ReactNode;
  isActive: boolean;
  isCollapsed: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm ${
        isActive
          ? "bg-blue-500/20 text-blue-400"
          : "text-slate-400 hover:bg-slate-800/50 hover:text-white"
      } ${isCollapsed ? "justify-center" : ""}`}
      title={isCollapsed ? label : undefined}
    >
      <span className="w-5 h-5 flex-shrink-0">{icon}</span>
      {!isCollapsed && <span className="truncate">{label}</span>}
    </Link>
  );
}

/**
 * Get user initials from name
 */
function getUserInitials(user: { first_name: string; last_name: string } | null): string {
  if (!user) return "U";
  const first = user.first_name?.charAt(0).toUpperCase() || "";
  const last = user.last_name?.charAt(0).toUpperCase() || "";
  return first + last || "U";
}

/**
 * Get user full name
 */
function getUserFullName(user: { first_name: string; last_name: string } | null): string {
  if (!user) return "User";
  return `${user.first_name || ""} ${user.last_name || ""}`.trim() || "User";
}

export function AppShell({
  children,
  title = "Dashboard",
}: AppShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout, isLoading: authLoading } = useAuth();
  const [agentsOpen, setAgentsOpen] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileButtonRef = useRef<HTMLButtonElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });

  // Get user display data
  const userInitials = getUserInitials(user);
  const userFullName = getUserFullName(user);
  const userEmail = user?.email || "";

  useEffect(() => {
    if (isProfileMenuOpen && profileButtonRef.current) {
      const rect = profileButtonRef.current.getBoundingClientRect();
      // Calculate dropdown height (approximately 120px) and position it above the button
      // Position it higher so the button remains visible below the dropdown
      const dropdownHeight = 120;
      const buttonHeight = 40; // Approximate button height
      setDropdownPosition({
        top: rect.top - dropdownHeight - buttonHeight - 12, // Position higher with more gap
        left: isCollapsed ? rect.left : rect.left,
      });
    }
  }, [isProfileMenuOpen, isCollapsed]);

  return (
    <div className="h-screen bg-slate-100 overflow-hidden">
      <div className="flex h-screen">
        {/* Mobile Overlay */}
        {isMobileMenuOpen && (
          <div
            className="fixed inset-0 z-40 bg-slate-900/80 md:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        {/* Desktop Sidebar */}
        <aside
          className={`hidden h-screen flex-col border-r border-slate-800/50 bg-[#0d1321] transition-all duration-300 md:flex flex-shrink-0 ${
            isCollapsed ? "w-16" : "w-64"
          }`}
        >
          <div className="flex h-16 items-center justify-between border-b border-slate-800/50 px-4">
            {!isCollapsed && (
              <>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-sm font-semibold tracking-tight text-white">
                    {APP_NAME}
                  </span>
                </div>
                <button
                  onClick={() => setIsCollapsed(!isCollapsed)}
                  className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                  aria-label="Collapse sidebar"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              </>
            )}
            {isCollapsed && (
              <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                aria-label="Expand sidebar"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            )}
          </div>

          <nav className="flex flex-1 flex-col overflow-y-auto py-4 px-2">
            <div className="flex-grow space-y-1">
              <NavItem
                href="/dashboard"
                label="Dashboard"
                icon={<LayoutDashboard className="w-5 h-5" />}
                isActive={pathname === "/dashboard"}
                isCollapsed={isCollapsed}
              />

              <div>
                <div className="relative">
                  <NavItem
                    href="/agents"
                    label="Agents"
                    icon={<Bot className="w-5 h-5" />}
                    isActive={pathname.startsWith("/agents")}
                    isCollapsed={isCollapsed}
                  />
                  {!isCollapsed && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setAgentsOpen((open) => !open);
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-400 transition-transform"
                    >
                      <span
                        className={`transition-transform ${
                          agentsOpen ? "rotate-0" : "-rotate-90"
                        }`}
                      >
                        ▾
                      </span>
                    </button>
                  )}
                </div>
                {agentsOpen && !isCollapsed && (
                  <div className="mt-2 space-y-1 pl-1">
                    <div className="px-3 text-xs font-semibold uppercase tracking-wide text-slate-600">
                      My Agents
                    </div>
                    <div className="mt-2 space-y-1 pl-1">
                      <Link href="/agents/1" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-300 hover:bg-slate-800/50 transition-colors">
                        <span className="h-2 w-2 rounded-full bg-emerald-500" />
                        <span className="truncate">CRE Chatbot</span>
                      </Link>
                      <Link href="/agents/4" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-400 hover:bg-slate-800/50 transition-colors">
                        <span className="h-2 w-2 rounded-full bg-slate-600" />
                        <span className="truncate">Data Analyst</span>
                      </Link>
                      <Link href="/agents/6" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-300 hover:bg-slate-800/50 transition-colors">
                        <span className="h-2 w-2 rounded-full bg-emerald-500" />
                        <span className="truncate">Sales Assistant</span>
                      </Link>
                      <Link href="/agents/2" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-300 hover:bg-slate-800/50 transition-colors">
                        <span className="h-2 w-2 rounded-full bg-emerald-500" />
                        <span className="truncate">Customer Support Bot</span>
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-auto p-2 border-t border-slate-800/50 space-y-1 overflow-visible">
              <NavItem
                href="/settings"
                label="Settings"
                icon={<Settings className="w-5 h-5" />}
                isActive={pathname.startsWith("/settings")}
                isCollapsed={isCollapsed}
              />
              <div className="relative overflow-visible">
                <button
                  ref={profileButtonRef}
                  onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm text-slate-400 hover:bg-slate-800/50 hover:text-white ${
                    isCollapsed ? "justify-center" : ""
                  }`}
                >
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-[10px] font-semibold text-white flex-shrink-0">
                    {authLoading ? "..." : userInitials}
                  </div>
                  {!isCollapsed && (
                    <span className="truncate text-sm">
                      {authLoading ? "Loading..." : userFullName}
                    </span>
                  )}
                </button>

              </div>
            </div>
          </nav>
        </aside>

        {/* Mobile Sidebar */}
        <aside
          className={`fixed inset-y-0 left-0 z-50 flex h-screen w-64 flex-col border-r border-slate-800/50 bg-[#0d1321] transition-transform duration-300 md:hidden ${
            isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex h-16 items-center justify-between border-b border-slate-800/50 px-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <span className="text-sm font-semibold tracking-tight text-white">
                {APP_NAME}
              </span>
            </div>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="flex flex-1 flex-col overflow-y-auto py-4 px-2">
            <div className="flex-grow space-y-6">
              <div>
                <NavItem
                  href="/dashboard"
                  label="Dashboard"
                  icon={<LayoutDashboard className="w-5 h-5" />}
                  isActive={pathname === "/dashboard"}
                  isCollapsed={false}
                />
              </div>

              <div>
                <div className="relative">
                  <NavItem
                    href="/agents"
                    label="Agents"
                    icon={<Bot className="w-5 h-5" />}
                    isActive={pathname.startsWith("/agents")}
                    isCollapsed={false}
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setAgentsOpen((open) => !open);
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-400 transition-transform"
                  >
                    <span
                      className={`transition-transform ${
                        agentsOpen ? "rotate-0" : "-rotate-90"
                      }`}
                    >
                      ▾
                    </span>
                  </button>
                </div>
                {agentsOpen && (
                  <div className="mt-2 space-y-1 pl-1">
                    <div className="px-3 text-xs font-semibold uppercase tracking-wide text-slate-600">
                      My Agents
                    </div>
                    <div className="mt-2 space-y-1 pl-1">
                      <Link href="/agents/1" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-300 hover:bg-slate-800/50 transition-colors">
                        <span className="h-2 w-2 rounded-full bg-emerald-500" />
                        <span className="truncate">CRE Chatbot</span>
                      </Link>
                      <Link href="/agents/4" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-400 hover:bg-slate-800/50 transition-colors">
                        <span className="h-2 w-2 rounded-full bg-slate-600" />
                        <span className="truncate">Data Analyst</span>
                      </Link>
                      <Link href="/agents/6" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-300 hover:bg-slate-800/50 transition-colors">
                        <span className="h-2 w-2 rounded-full bg-emerald-500" />
                        <span className="truncate">Sales Assistant</span>
                      </Link>
                      <Link href="/agents/2" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-300 hover:bg-slate-800/50 transition-colors">
                        <span className="h-2 w-2 rounded-full bg-emerald-500" />
                        <span className="truncate">Customer Support Bot</span>
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-auto p-2 border-t border-slate-800/50 space-y-1">
              <NavItem
                href="/settings"
                label="Settings"
                icon={<Settings className="w-5 h-5" />}
                isActive={pathname.startsWith("/settings")}
                isCollapsed={false}
              />
              <div className="relative">
                <button
                  onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm text-slate-400 hover:bg-slate-800/50 hover:text-white"
                >
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-[10px] font-semibold text-white flex-shrink-0">
                    {authLoading ? "..." : userInitials}
                  </div>
                  <span className="truncate text-sm">
                    {authLoading ? "Loading..." : userFullName}
                  </span>
                </button>

                {/* Profile Dropdown Menu */}
                {isProfileMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setIsProfileMenuOpen(false)}
                    />
                    <div className="absolute bottom-full left-0 mb-2 w-64 rounded-lg border border-slate-700 bg-[#1e293b] shadow-xl z-20">
                      {/* User Info */}
                      <div className="px-4 py-3 border-b border-slate-700">
                        <p className="text-sm font-semibold text-white">
                          {authLoading ? "Loading..." : userFullName}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {authLoading ? "..." : userEmail}
                        </p>
                      </div>

                      {/* Menu Options */}
                      <div className="py-1">
                        <Link
                          href="/settings"
                          onClick={() => setIsProfileMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-white hover:bg-slate-700/50 transition-colors"
                        >
                          <User className="w-4 h-4" />
                          <span>Profile</span>
                        </Link>
                        <button
                          onClick={() => {
                            setIsProfileMenuOpen(false);
                            logout();
                          }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-slate-700/50 transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Log out</span>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </nav>
        </aside>

        <main className="flex-1 flex flex-col overflow-hidden bg-white">
          <header className="flex-shrink-0 border-b border-slate-200 px-4 py-4 md:px-10">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="md:hidden p-2 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors"
                aria-label="Open menu"
              >
                <Menu className="w-5 h-5" />
              </button>
              <h1 className="text-lg font-semibold tracking-tight text-slate-900">
                {title}
              </h1>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto px-4 py-6 md:px-10 md:py-8">
            {children}
          </div>
        </main>
      </div>

      {/* Profile Dropdown Menu - Popover Card */}
      {isProfileMenuOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsProfileMenuOpen(false)}
          />
          <div
            className="fixed w-56 rounded-lg border border-slate-700 bg-[#1e293b] shadow-2xl z-50"
            style={{
              top: `${dropdownPosition.top}px`,
              left: `${dropdownPosition.left}px`,
            }}
          >
            {/* Popover Arrow */}
            <div
              className="absolute -bottom-2 left-6 w-4 h-4 rotate-45 border-r border-b border-slate-700 bg-[#1e293b]"
            />

            {/* User Info */}
            <div className="px-4 py-3 border-b border-slate-700">
              <p className="text-sm font-semibold text-white">
                {authLoading ? "Loading..." : userFullName}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                {authLoading ? "..." : userEmail}
              </p>
            </div>

            {/* Menu Options */}
            <div className="py-1">
              <Link
                href="/settings"
                onClick={() => setIsProfileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-white hover:bg-slate-700/50 transition-colors rounded-md mx-1"
              >
                <User className="w-4 h-4" />
                <span>Profile</span>
              </Link>
              <button
                onClick={() => {
                  setIsProfileMenuOpen(false);
                  logout();
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-slate-700/50 transition-colors rounded-md mx-1"
              >
                <LogOut className="w-4 h-4" />
                <span>Log out</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

