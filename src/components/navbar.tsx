"use client";

import Link from 'next/link';
import { useAuth } from '@/context/auth-context';
import {
  LogOut,
  GraduationCap,
  Loader2,
  Menu,
  X,
  Home,
  LayoutDashboard,
  BookOpen,
  UserCircle,
  Sparkles,
} from 'lucide-react';
import { NAVIGATION_CONFIG, getDashboardHref, Role } from '@/config/navigation';
import { usePathname } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';

/* ─── Role badge colors ─── */
const ROLE_BADGE: Record<string, string> = {
  superadmin:    'bg-gradient-to-r from-primary to-blue-700 text-white',
  administrator: 'bg-primary/10 text-primary border border-primary/20',
  teacher:       'bg-success/10 text-green-700 border border-success/20',
  student:       'bg-muted text-muted-foreground border border-border',
};

/* ─── Bottom-tab config (max 4 items per role) ─── */
const BOTTOM_TAB_HREFS: Record<string, string[]> = {
  student:       ['/dashboard-redirect', '/courses', '/student/ai', '/profile'],
  teacher:       ['/dashboard-redirect', '/courses', '/admin/leaderboard', '/profile'],
  administrator: ['/dashboard-redirect', '/courses', '/admin/dashboard', '/profile'],
  superadmin:    ['/dashboard-redirect', '/courses', '/superadmin/analytics', '/profile'],
};

export function Navbar() {
  const { profile, isAuthenticated, isLoading, signOut } = useAuth();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);

  const userRole = profile?.role as Role;

  /* All nav items allowed for this role */
  const allowedItems = NAVIGATION_CONFIG.filter(item =>
    item.roles.includes(userRole)
  );

  /* Bottom tab items */
  const bottomTabHrefs = BOTTOM_TAB_HREFS[userRole] ?? [];
  const bottomTabItems = bottomTabHrefs
    .map(href => NAVIGATION_CONFIG.find(i => i.href === href))
    .filter(Boolean) as typeof NAVIGATION_CONFIG;

  /* Resolve special redirects */
  const resolveHref = (href: string) => {
    if (href === '/dashboard-redirect' || href === '/classrooms') {
      return getDashboardHref(userRole);
    }
    return href;
  };

  /* Close on navigation */
  useEffect(() => { setIsMenuOpen(false); }, [pathname]);

  /* Prevent scroll when menu open */
  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isMenuOpen]);

  /* Close on outside click */
  useEffect(() => {
    if (!isMenuOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (drawerRef.current && !drawerRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isMenuOpen]);

  return (
    <>
      {/* ═══════════════════════════════════════════════════════ TOP NAV ══ */}
      <nav className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-md border-b border-border shadow-sm">
        {/* Brand gradient strip */}
        <div className="h-[3px] w-full bg-gradient-to-r from-primary-dark via-primary to-blue-400" />

        <div className="container mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">

          {/* ── Logo ── */}
          <Link href="/" className="flex items-center gap-2.5 group shrink-0">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-sm group-hover:bg-primary-dark transition-colors duration-200">
              <GraduationCap className="h-4 w-4 text-white" />
            </div>
            <span className="font-headline font-black text-xl tracking-tight text-foreground">
              Campus<span className="text-primary">Hub</span>
            </span>
          </Link>

          {/* ── Desktop Nav ── */}
          {isAuthenticated && !isLoading && (
            <div className="hidden md:flex items-center gap-1">
              {allowedItems.map((item) => {
                const href = resolveHref(item.href);
                const Icon = item.icon;
                const isActive = pathname === href;
                return (
                  <Link
                    key={item.title}
                    href={href}
                    className={`nav-link flex items-center gap-1.5 px-3 py-2 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-primary/10 text-primary font-bold'
                        : 'hover:bg-primary/5 text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span className="font-mono text-[11px] uppercase tracking-wider">{item.title}</span>
                  </Link>
                );
              })}
            </div>
          )}

          {/* ── Auth / Profile Section ── */}
          <div className="flex items-center gap-1 sm:gap-2">
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
            ) : !isAuthenticated ? (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="hidden sm:block font-mono text-xs font-bold tracking-widest uppercase text-muted-foreground hover:text-foreground transition-colors px-3 py-2"
                >
                  Login
                </Link>
                <Link href="/signup" className="btn-primary text-xs px-4 py-2">
                  <span className="hidden xs:inline">Get Access</span>
                  <span className="xs:hidden">Join</span>
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-1">
                {/* Profile chip — desktop only */}
                <Link
                  href="/profile"
                  className="hidden md:flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg hover:bg-primary/5 border border-transparent hover:border-border transition-all duration-200"
                >
                  <div className="w-7 h-7 bg-primary rounded-md flex items-center justify-center shrink-0 shadow-sm">
                    <span className="font-mono text-[10px] font-black text-white uppercase">
                      {profile?.firstName?.[0]}{profile?.lastName?.[0]}
                    </span>
                  </div>
                  <div className="text-left hidden lg:block">
                    <p className="font-mono text-[11px] font-bold leading-none text-foreground">
                      {profile?.firstName} {profile?.lastName}
                    </p>
                    <p className="font-mono text-[9px] text-muted-foreground capitalize mt-0.5 tracking-widest">
                      {profile?.role}
                    </p>
                  </div>
                </Link>

                <button
                  onClick={() => signOut()}
                  title="Sign out"
                  className="hidden md:flex p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/8 transition-all duration-200"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* Mobile hamburger */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="flex md:hidden p-2 rounded-lg hover:bg-primary/5 text-foreground transition-colors"
              aria-label="Toggle menu"
              aria-expanded={isMenuOpen}
            >
              {isMenuOpen
                ? <X className="h-5 w-5" />
                : <Menu className="h-5 w-5" />
              }
            </button>
          </div>
        </div>
      </nav>

      {/* ═══════════════════════════════════════════════ MOBILE DRAWER ══ */}

      {/* Backdrop */}
      <div
        onClick={() => setIsMenuOpen(false)}
        className={`fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-300 md:hidden ${
          isMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* Slide-in panel from right */}
      <div
        ref={drawerRef}
        className={`fixed top-0 right-0 z-50 h-full w-[300px] max-w-[85vw] bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-out md:hidden ${
          isMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Drawer brand strip */}
        <div className="h-1 w-full bg-gradient-to-r from-primary-dark via-primary to-blue-400" />

        {/* ── Drawer Header ── */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-border">
          <Link href="/" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center shadow-sm">
              <GraduationCap className="h-4 w-4 text-white" />
            </div>
            <span className="font-headline font-black text-lg tracking-tight text-foreground">
              Campus<span className="text-primary">Hub</span>
            </span>
          </Link>
          <button
            onClick={() => setIsMenuOpen(false)}
            className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground transition-colors"
            aria-label="Close menu"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* ── User Profile Card ── */}
        {isAuthenticated && profile && (
          <Link
            href="/profile"
            onClick={() => setIsMenuOpen(false)}
            className="mx-4 mt-4 flex items-center gap-3 p-3.5 rounded-xl bg-gradient-to-br from-primary/8 to-blue-50 border border-primary/15 hover:border-primary/30 transition-all duration-200"
          >
            {/* Avatar */}
            <div className="w-11 h-11 bg-gradient-to-br from-primary to-blue-700 rounded-xl flex items-center justify-center shrink-0 shadow-md shadow-primary/20">
              <span className="font-mono text-sm font-black text-white uppercase">
                {profile?.firstName?.[0]}{profile?.lastName?.[0]}
              </span>
            </div>
            <div className="min-w-0">
              <p className="font-mono text-[13px] font-bold text-foreground truncate">
                {profile?.firstName} {profile?.lastName}
              </p>
              <p className="font-mono text-[10px] text-muted-foreground truncate mb-1">
                {profile?.email}
              </p>
              <span className={`inline-flex items-center font-mono text-[9px] font-bold tracking-widest uppercase px-2 py-0.5 rounded-full ${ROLE_BADGE[profile?.role ?? 'student'] ?? ''}`}>
                {profile?.role}
              </span>
            </div>
          </Link>
        )}

        {/* ── Navigation Items ── */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
          {/* Section label */}
          {isAuthenticated && (
            <p className="px-2 pb-2 font-mono text-[9px] tracking-[0.2em] uppercase text-muted-foreground">
              Navigation
            </p>
          )}

          {isAuthenticated && allowedItems.map((item, index) => {
            const href = resolveHref(item.href);
            const Icon = item.icon;
            const isActive = pathname === href;

            return (
              <Link
                key={item.title}
                href={href}
                onClick={() => setIsMenuOpen(false)}
                style={{ animationDelay: isMenuOpen ? `${index * 40}ms` : '0ms' }}
                className={`group flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 relative overflow-hidden ${
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                {/* Active left bar */}
                <div className={`absolute left-0 top-2 bottom-2 w-[3px] rounded-full transition-all duration-200 ${
                  isActive ? 'bg-primary' : 'bg-transparent group-hover:bg-primary/30'
                }`} />

                <Icon className={`h-[18px] w-[18px] shrink-0 transition-colors ${
                  isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
                }`} />

                <span className={`font-mono text-[12px] font-bold uppercase tracking-wider transition-colors ${
                  isActive ? 'text-primary' : ''
                }`}>
                  {item.title}
                </span>

                {isActive && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                )}
              </Link>
            );
          })}

          {/* Unauthenticated state */}
          {!isAuthenticated && !isLoading && (
            <div className="space-y-2 pt-2">
              <Link
                href="/login"
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-3.5 rounded-xl text-muted-foreground hover:bg-muted transition-all"
              >
                <span className="font-mono text-[12px] font-bold uppercase tracking-wider">Login</span>
              </Link>
              <Link
                href="/signup"
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center justify-center gap-3 px-3 py-3.5 rounded-xl bg-primary text-white hover:bg-blue-600 transition-all"
              >
                <span className="font-mono text-[12px] font-bold uppercase tracking-wider">Get Access</span>
              </Link>
            </div>
          )}
        </div>

        {/* ── Drawer Footer — Sign Out ── */}
        {isAuthenticated && (
          <div className="px-3 pb-6 pt-2 border-t border-border mt-1">
            <button
              onClick={() => { signOut(); setIsMenuOpen(false); }}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-destructive hover:bg-destructive/8 transition-all duration-200"
            >
              <LogOut className="h-[18px] w-[18px] shrink-0" />
              <span className="font-mono text-[12px] font-bold uppercase tracking-wider">Sign Out</span>
            </button>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════ MOBILE BOTTOM TAB BAR ══ */}
      {isAuthenticated && !isLoading && bottomTabItems.length > 0 && (
        <div className="fixed bottom-0 inset-x-0 z-40 md:hidden">
          {/* Frosted glass bar */}
          <div className="bg-white/90 backdrop-blur-xl border-t border-border shadow-[0_-4px_24px_rgba(37,99,235,0.08)]">
            <div className="flex items-stretch justify-around px-2 pb-safe">
              {bottomTabItems.map((item) => {
                const href = resolveHref(item.href);
                const Icon = item.icon;
                const isActive = pathname === href || pathname.startsWith(href.replace('/dashboard-redirect', ''));

                return (
                  <Link
                    key={item.title}
                    href={href}
                    className="flex flex-col items-center justify-center gap-0.5 px-3 py-3 min-w-0 flex-1 relative group"
                  >
                    {/* Active pill indicator */}
                    {isActive && (
                      <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-primary" />
                    )}

                    <div className={`p-1.5 rounded-xl transition-all duration-200 ${
                      isActive
                        ? 'bg-primary/12'
                        : 'group-hover:bg-muted'
                    }`}>
                      <Icon className={`h-[20px] w-[20px] transition-colors duration-200 ${
                        isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
                      }`} />
                    </div>

                    <span className={`font-mono text-[9px] font-bold tracking-wider uppercase truncate max-w-[56px] text-center transition-colors duration-200 ${
                      isActive ? 'text-primary' : 'text-muted-foreground'
                    }`}>
                      {item.title}
                    </span>
                  </Link>
                );
              })}

              {/* More / Hamburger tab */}
              <button
                onClick={() => setIsMenuOpen(true)}
                className="flex flex-col items-center justify-center gap-0.5 px-3 py-3 min-w-0 flex-1 relative group"
              >
                <div className="p-1.5 rounded-xl transition-all duration-200 group-hover:bg-muted">
                  <Menu className="h-[20px] w-[20px] text-muted-foreground group-hover:text-foreground transition-colors" />
                </div>
                <span className="font-mono text-[9px] font-bold tracking-wider uppercase text-muted-foreground">
                  More
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
