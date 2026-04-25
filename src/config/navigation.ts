import { 
  Home,
  LayoutDashboard, 
  BookOpen, 
  School, 
  Trophy, 
  Settings, 
  Users, 
  Database,
  BarChart3,
  Calendar,
  Megaphone,
  UserCircle,
  MessageSquare
} from 'lucide-react';

export type Role = 'student' | 'teacher' | 'administrator' | 'superadmin';

export interface NavItem {
  title: string;
  href: string;
  icon: any;
  roles: Role[];
}

export const NAVIGATION_CONFIG: NavItem[] = [
  {
    title: 'Home',
    href: '/',
    icon: Home,
    roles: ['student', 'teacher', 'administrator', 'superadmin'],
  },
  {
    title: 'Dashboard',
    href: '/dashboard-redirect',
    icon: LayoutDashboard,
    roles: ['student', 'teacher', 'administrator', 'superadmin'],
  },
  {
    title: 'Classroom',
    href: '/classrooms',
    icon: School,
    roles: ['student', 'teacher', 'administrator'],
  },
  {
    title: 'Course',
    href: '/courses',
    icon: BookOpen,
    roles: ['student', 'teacher', 'administrator', 'superadmin'],
  },
  {
    title: 'Quiz',
    href: '/quizzes',
    icon: Trophy,
    roles: ['student'],
  },
  {
    title: 'Feedback',
    href: '/feedback',
    icon: MessageSquare,
    roles: ['student'],
  },
  {
    title: 'Complaint Box',
    href: '/student/complaints',
    icon: Megaphone,
    roles: ['student'],
  },
  {
    title: 'Profile',
    href: '/profile',
    icon: UserCircle,
    roles: ['student', 'teacher', 'administrator', 'superadmin'],
  },
  {
    title: 'Faculty Registry',
    href: '/admin/dashboard',
    icon: Users,
    roles: ['administrator', 'superadmin'],
  },
  {
    title: 'Leaderboard',
    href: '/admin/leaderboard',
    icon: Trophy,
    roles: ['administrator', 'teacher'],
  },
  {
    title: 'System Logs',
    href: '/superadmin/logs',
    icon: Database,
    roles: ['superadmin'],
  },
  {
    title: 'Analytics',
    href: '/superadmin/analytics',
    icon: BarChart3,
    roles: ['superadmin'],
  },
  {
    title: 'Feedbacks',
    href: '/superadmin/feedback',
    icon: MessageSquare,
    roles: ['superadmin'],
  },
  {
    title: 'Grievances',
    href: '/admin/complaints',
    icon: Megaphone,
    roles: ['administrator', 'superadmin'],
  }
];

export const getDashboardHref = (role?: Role) => {
  switch (role) {
    case 'superadmin': return '/superadmin/dashboard';
    case 'administrator': return '/admin/dashboard';
    case 'teacher': return '/teacher/dashboard';
    case 'student': return '/student/dashboard';
    default: return '/login';
  }
};
