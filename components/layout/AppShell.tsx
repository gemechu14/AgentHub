"use client";

import type { ReactNode } from "react";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bot, Settings, ChevronLeft, ChevronRight, Menu, X, User, LogOut, Shield } from "lucide-react";
import { APP_NAME } from "@/lib/config";
import { useAuth } from "@/contexts/AuthContext";
import { ChatNavSection } from "@/components/layout/ChatNavSection";
import { useChatContext } from "@/contexts/ChatContext";
import { useMobileMenu } from "@/contexts/MobileMenuContext";

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
  onNavigate,
}: {
  href: string;
  label: string;
  icon: ReactNode;
  isActive: boolean;
  isCollapsed: boolean;
  onNavigate?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
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
  const pathname = usePathname();
  const { user, logout, isLoading: authLoading } = useAuth();
  const { isMobileMenuOpen, openMobileMenu, closeMobileMenu } = useMobileMenu();

  // Read selectedAgent from context (state lives in ChatStateProvider)
  const { selectedAgent } = useChatContext();

  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("sidebarCollapsed");
      return saved === "true";
    }
    return false;
  });
  
  // Persist sidebar collapse state
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("sidebarCollapsed", String(isCollapsed));
    }
  }, [isCollapsed]);

  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileButtonRef = useRef<HTMLButtonElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const { menuJustOpenedRef } = useMobileMenu();

  // Get user display data
  const userInitials = getUserInitials(user);
  const userFullName = getUserFullName(user);
  const userEmail = user?.email || "";

  // Get user's role from memberships
  const userRole = user?.memberships?.[0]?.role?.toUpperCase();
  const isMember = userRole === "MEMBER";

  useEffect(() => {
    if (isProfileMenuOpen && profileButtonRef.current) {
      const rect = profileButtonRef.current.getBoundingClientRect();
      const dropdownHeight = 120;
      const buttonHeight = 40;
      setDropdownPosition({
        top: rect.top - dropdownHeight - buttonHeight - 12,
        left: isCollapsed ? rect.left : rect.left,
      });
    }
  }, [isProfileMenuOpen, isCollapsed]);

  // Close mobile menu when pathname changes (but not on initial mount)
  const prevPathnameRef = useRef(pathname);
  useEffect(() => {
    if (prevPathnameRef.current !== pathname) {
      prevPathnameRef.current = pathname;
      closeMobileMenu();
    } else {
      prevPathnameRef.current = pathname;
    }
  }, [pathname, closeMobileMenu]);

  return (
    <div className="h-screen bg-slate-100 overflow-hidden">
      <div className="flex h-screen">
        {/* Mobile Overlay */}
        {isMobileMenuOpen && (
          <div
            className="fixed inset-0 z-40 bg-slate-900/80 md:hidden"
            onClick={(e) => {
              // Prevent closing if menu was just opened (to avoid immediate close)
              if (menuJustOpenedRef.current) {
                return;
              }
              // Only close if clicking directly on the overlay, not if event came from sidebar
              if (e.target === e.currentTarget) {
                closeMobileMenu();
              }
            }}
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

          <nav className="flex flex-1 flex-col overflow-hidden">
            {/* Chat Navigation Section - Reads from persistent context */}
            {selectedAgent && (
              <ChatNavSection isCollapsed={isCollapsed} />
            )}

            <div className="flex-shrink-0 mt-auto p-2 border-t border-slate-800/50 space-y-1">
              <NavItem
                href="/settings"
                label="Settings"
                icon={<Settings className="w-5 h-5" />}
                isActive={pathname.startsWith("/settings")}
                isCollapsed={isCollapsed}
                onNavigate={closeMobileMenu}
              />
              {!isMember && (
                <NavItem
                  href="/admin"
                  label="Admin Portal"
                  icon={<Shield className="w-5 h-5" />}
                  isActive={pathname.startsWith("/admin")}
                  isCollapsed={isCollapsed}
                  onNavigate={closeMobileMenu}
                />
              )}
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
          onClick={(e) => e.stopPropagation()}
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
              onClick={closeMobileMenu}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="flex flex-1 flex-col overflow-y-auto py-4 px-2">
            <div className="flex-grow space-y-6">
              {/* Mobile chat section */}
              {selectedAgent && (
                <ChatNavSection isCollapsed={false} />
              )}
            </div>

            <div className="mt-auto p-2 border-t border-slate-800/50 space-y-1">
              <NavItem
                href="/settings"
                label="Settings"
                icon={<Settings className="w-5 h-5" />}
                isActive={pathname.startsWith("/settings")}
                isCollapsed={false}
                onNavigate={closeMobileMenu}
              />
              {!isMember && (
                <NavItem
                  href="/admin"
                  label="Admin Portal"
                  icon={<Shield className="w-5 h-5" />}
                  isActive={pathname.startsWith("/admin")}
                  isCollapsed={false}
                  onNavigate={closeMobileMenu}
                />
              )}
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
                          onClick={() => {
                            setIsProfileMenuOpen(false);
                            closeMobileMenu();
                          }}
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
          {!pathname.startsWith("/chat") && (
            <header className="flex-shrink-0 border-b border-slate-200 px-4 py-4 md:px-10">
              <div className="flex items-center gap-4">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    openMobileMenu();
                  }}
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
          )}

          <div className={`flex-1 overflow-y-auto ${pathname.startsWith("/chat") ? "px-0 py-0" : "px-4 py-6 md:px-10 md:py-8"}`}>
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
                onClick={() => {
                  setIsProfileMenuOpen(false);
                  closeMobileMenu();
                }}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-white hover:bg-slate-700/50 transition-colors rounded-md mx-1"
              >
                <User className="w-4 h-4" />
                <span>Profile</span>
              </Link>
              <button
                onClick={() => {
                  setIsProfileMenuOpen(false);
                  closeMobileMenu();
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
