import {
  Home,
  LayoutDashboard,
  BookOpen,
  School,
  Trophy,
  Users,
  Database,
  BarChart3,
  Megaphone,
  UserCircle,
  MessageSquare,
  Briefcase,
  HelpCircle,
  ShieldCheck,
  FileText,
  Lock,
  CreditCard,
  ClipboardList,
} from 'lucide-react';

export type Role = 'student' | 'teacher' | 'administrator' | 'superadmin';

export interface NavItem {
  title: string;
  href: string;          // always a full page path — never a #anchor
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: any;
  roles: Role[];
  group?: string;        // used as section header in the mobile drawer only
}

// ---------------------------------------------------------------------------
// RBAC Navigation — one clean list, zero duplicate hrefs per role
// ---------------------------------------------------------------------------
// Rules:
//   • Only pages that physically exist under src/app/ are listed.
//   • No #anchor/section links.
//   • /dashboard-redirect is a runtime alias → resolved by getDashboardHref().
//   • Each role sees only pages it is authorised to access.
//   • Governance (Privacy, Terms, Security) lives in the Footer — NOT here.
// ---------------------------------------------------------------------------

export const NAVIGATION_CONFIG: NavItem[] = [

  /* ─── STUDENT (6 links) ─────────────────────────────────────── */
  { title: 'Dashboard',  href: '/student/dashboard',   icon: LayoutDashboard, roles: ['student'], group: 'Main'   },
  { title: 'Courses',    href: '/courses',             icon: BookOpen,        roles: ['student'], group: 'Learn'  },
  { title: 'Quizzes',   href: '/quizzes',             icon: Trophy,          roles: ['student'], group: 'Learn'  },
  { title: 'Placements', href: '/student/placements',  icon: Briefcase,       roles: ['student'], group: 'Career' },
  { title: 'Feedback',  href: '/feedback',            icon: MessageSquare,   roles: ['student'], group: 'Engage' },
  { title: 'Profile',   href: '/profile',             icon: UserCircle,      roles: ['student'], group: 'Account'},

  /* ─── TEACHER (4 links) ─────────────────────────────────────── */
  { title: 'Dashboard',   href: '/teacher/dashboard',  icon: LayoutDashboard, roles: ['teacher'], group: 'Main'     },
  { title: 'Courses',     href: '/courses',            icon: BookOpen,        roles: ['teacher'], group: 'Teaching' },
  { title: 'Leaderboard', href: '/admin/leaderboard',  icon: Trophy,          roles: ['teacher'], group: 'Teaching' },
  { title: 'Profile',     href: '/profile',            icon: UserCircle,      roles: ['teacher'], group: 'Account'  },

  /* ─── ADMINISTRATOR (7 links) ───────────────────────────────── */
  { title: 'Dashboard',   href: '/admin/dashboard',    icon: LayoutDashboard, roles: ['administrator'], group: 'Main'   },
  { title: 'Courses',     href: '/courses',            icon: BookOpen,        roles: ['administrator'], group: 'Manage' },
  { title: 'Classrooms',  href: '/admin/classrooms',   icon: School,          roles: ['administrator'], group: 'Manage' },
  { title: 'Leaderboard', href: '/admin/leaderboard',  icon: Trophy,          roles: ['administrator'], group: 'Manage' },
  { title: 'Placements',  href: '/admin/placements',   icon: Briefcase,       roles: ['administrator'], group: 'Manage' },
  { title: 'Grievances',  href: '/admin/complaints',   icon: Megaphone,       roles: ['administrator'], group: 'Manage' },
  { title: 'Profile',     href: '/profile',            icon: UserCircle,      roles: ['administrator'], group: 'Account'},

  /* ─── SUPERADMIN (6 links) ──────────────────────────────────── */
  { title: 'Dashboard',   href: '/superadmin/dashboard', icon: LayoutDashboard, roles: ['superadmin'], group: 'System' },
  { title: 'Analytics',   href: '/superadmin/analytics', icon: BarChart3,       roles: ['superadmin'], group: 'System' },
  { title: 'System Logs', href: '/superadmin/logs',      icon: Database,        roles: ['superadmin'], group: 'System' },
  { title: 'Feedbacks',   href: '/superadmin/feedback',  icon: MessageSquare,   roles: ['superadmin'], group: 'System' },
  { title: 'Faculty',     href: '/admin/dashboard',      icon: Users,           roles: ['superadmin'], group: 'System' },
  { title: 'Profile',     href: '/profile',              icon: UserCircle,      roles: ['superadmin'], group: 'Account'},
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Resolve the correct dashboard URL for a given role. */
export const getDashboardHref = (role?: Role): string => {
  switch (role) {
    case 'superadmin':    return '/superadmin/dashboard';
    case 'administrator': return '/admin/dashboard';
    case 'teacher':       return '/teacher/dashboard';
    case 'student':       return '/student/dashboard';
    default:              return '/login';
  }
};

/**
 * Return the filtered, deduplicated nav items for a specific role.
 * Safe to call inside a React render — memoize with useMemo if needed.
 */
export const getNavItemsForRole = (role: Role): NavItem[] =>
  NAVIGATION_CONFIG.filter((item) => item.roles.includes(role));
