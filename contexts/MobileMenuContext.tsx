"use client";

import { createContext, useContext, useState, ReactNode, useCallback, useRef } from "react";

interface MobileMenuContextValue {
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
  openMobileMenu: () => void;
  closeMobileMenu: () => void;
  menuJustOpenedRef: React.MutableRefObject<boolean>;
}

const MobileMenuContext = createContext<MobileMenuContextValue | undefined>(undefined);

export function MobileMenuProvider({ children }: { children: ReactNode }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const menuJustOpenedRef = useRef(false);

  const openMobileMenu = useCallback(() => {
    menuJustOpenedRef.current = true;
    setIsMobileMenuOpen(true);
    // Reset flag after a short delay to allow overlay clicks
    setTimeout(() => {
      menuJustOpenedRef.current = false;
    }, 100);
  }, []);
  const closeMobileMenu = useCallback(() => setIsMobileMenuOpen(false), []);

  return (
    <MobileMenuContext.Provider
      value={{
        isMobileMenuOpen,
        setIsMobileMenuOpen,
        openMobileMenu,
        closeMobileMenu,
        menuJustOpenedRef,
      }}
    >
      {children}
    </MobileMenuContext.Provider>
  );
}

export function useMobileMenu() {
  const context = useContext(MobileMenuContext);
  if (context === undefined) {
    throw new Error("useMobileMenu must be used within a MobileMenuProvider");
  }
  return context;
}

