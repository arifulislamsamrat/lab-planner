import { createContext, useCallback, useContext, useEffect, useState } from 'react';

const STORAGE_KEY = 'lab-planner-sidebar-collapsed';

export type SidebarState = 'expanded' | 'collapsed';

interface SidebarContextValue {
  /** Desktop sidebar state: full labels vs icon-only. */
  desktop: SidebarState;
  /** Mobile drawer: open or closed. Only meaningful when viewport ≤980px. */
  mobileOpen: boolean;
  /** True when the viewport is at or below the mobile breakpoint. */
  isMobile: boolean;
  toggleDesktop: () => void;
  setDesktop: (s: SidebarState) => void;
  openMobile: () => void;
  closeMobile: () => void;
  toggleMobile: () => void;
}

const SidebarContext = createContext<SidebarContextValue | null>(null);

const MOBILE_BREAKPOINT = 980;

function readInitialDesktop(): SidebarState {
  if (typeof window === 'undefined') return 'expanded';
  try {
    const v = window.localStorage.getItem(STORAGE_KEY);
    return v === 'collapsed' ? 'collapsed' : 'expanded';
  } catch {
    return 'expanded';
  }
}

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [desktop, setDesktopState] = useState<SidebarState>(readInitialDesktop);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.innerWidth <= MOBILE_BREAKPOINT : false,
  );

  // Track viewport.
  useEffect(() => {
    function onResize() {
      const mobile = window.innerWidth <= MOBILE_BREAKPOINT;
      setIsMobile(mobile);
      // Auto-close mobile drawer when crossing back to desktop.
      if (!mobile) setMobileOpen(false);
    }
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Persist desktop state.
  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, desktop);
    } catch {}
  }, [desktop]);

  const toggleDesktop = useCallback(() => {
    setDesktopState((s) => (s === 'expanded' ? 'collapsed' : 'expanded'));
  }, []);
  const setDesktop = useCallback((s: SidebarState) => setDesktopState(s), []);
  const openMobile = useCallback(() => setMobileOpen(true), []);
  const closeMobile = useCallback(() => setMobileOpen(false), []);
  const toggleMobile = useCallback(() => setMobileOpen((o) => !o), []);

  return (
    <SidebarContext.Provider
      value={{
        desktop,
        mobileOpen,
        isMobile,
        toggleDesktop,
        setDesktop,
        openMobile,
        closeMobile,
        toggleMobile,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const ctx = useContext(SidebarContext);
  if (!ctx) throw new Error('useSidebar must be used inside <SidebarProvider>');
  return ctx;
}
