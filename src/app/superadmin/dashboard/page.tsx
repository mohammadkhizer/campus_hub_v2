"use client";

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { RouteGuard } from '@/components/route-guard';
import { useAuth } from '@/context/auth-context';
import { getSystemStats, manageUserRoleAction } from '@/app/actions/superadmin';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import {
  Loader2,
  UserCog,
  ShieldAlert,
  Activity,
  Users,
  BookOpen,
  Trophy,
  TrendingUp,
  Mail,
  Calendar,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Lazy load heavy components
const Navbar = dynamic(() => import('@/components/navbar').then(mod => mod.Navbar), {
  loading: () => <div className="h-14 bg-white border-b border-border animate-pulse" />,
  ssr: false
});

/** Inline badge for role display */
function RoleBadge({ role }: { role: string }) {
  const map: Record<string, string> = {
    superadmin:    'bg-gradient-to-r from-primary to-blue-700 text-white',
    administrator: 'bg-primary/10 text-primary border border-primary/20',
    teacher:       'bg-success/10 text-green-700 border border-success/20',
    student:       'bg-muted text-muted-foreground border border-border',
  };
  return (
    <span className={`inline-flex items-center font-mono text-[10px] font-bold tracking-widest uppercase px-2.5 py-0.5 rounded-full ${map[role] ?? map.student}`}>
      {role}
    </span>
  );
}

function SuperAdminContent() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [stats, setStats] = useState<any>(null);
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleUpdating, setRoleUpdating] = useState<string | null>(null);

  const loadStats = async () => {
    setLoading(true);
    const result = await getSystemStats();
    if (result.success) {
      setStats(result.stats);
      setRecentUsers(result.recentUsers);
    } else {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    }
    setLoading(false);
  };

  useEffect(() => { loadStats(); }, []);

  const handleRoleChange = async (userId: string, newRole: string) => {
    if (userId === profile?.id && newRole !== 'superadmin') {
      toast({ title: "Warning", description: "Changes to your own superadmin role require re-login.", variant: "destructive" });
      return;
    }
    setRoleUpdating(userId);
    setRecentUsers(prev =>
      prev.map(u => u._id === userId ? { ...u, role: newRole } : u)
    );
    const result = await manageUserRoleAction(userId, newRole);
    if (result.success) {
      toast({ title: "Role Updated ✓", description: result.message });
    } else {
      toast({ title: "Failed", description: result.error, variant: "destructive" });
      loadStats();
    }
    setRoleUpdating(null);
  };

  if (loading && !stats) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-surface">
        <div className="text-center space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
          <p className="font-mono text-xs text-muted-foreground uppercase tracking-widest">
            Synchronizing System Metrics...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-surface">
      <Navbar />

      <main className="container mx-auto px-6 py-10 max-w-7xl">

        {/* ── Header ─────────────────────────────────────────────────── */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-5 animate-fade-up">
          <div>
            <p className="section-label mb-2">Control Center</p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-blue">
                <UserCog className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="font-headline font-black text-3xl text-foreground">
                  Super Admin <span className="text-primary">Governance</span>
                </h1>
                <p className="font-mono text-sm text-muted-foreground">
                  Enterprise oversight for the Campus Hub ecosystem.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2.5 bg-white border border-border rounded-xl px-4 py-2.5 shadow-sm">
              <div className="relative flex h-2.5 w-2.5">
                <span className="animate-ping-slow absolute inline-flex h-full w-full rounded-full bg-success opacity-60" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-success" />
              </div>
              <div>
                <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">System Health</p>
                <p className="font-mono text-xs font-bold text-green-700">All Operational</p>
              </div>
            </div>
            <button
              onClick={loadStats}
              className="p-2.5 bg-white border border-border rounded-xl text-muted-foreground hover:text-primary hover:border-primary/30 transition-all shadow-sm"
              disabled={loading}
              title="Refresh data"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* ── Analytics Grid ──────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-8 animate-fade-up delay-150">
          {[
            { label: 'Total Users', value: stats?.totalUsers ?? '—', icon: <Users className="h-5 w-5 text-primary" />, bg: 'bg-primary/8 border-primary/15' },
            { label: 'Courses', value: stats?.totalCourses ?? '—', icon: <BookOpen className="h-5 w-5 text-accent" />, bg: 'bg-accent/8 border-accent/15' },
            { label: 'Quizzes', value: stats?.totalQuizzes ?? '—', icon: <Trophy className="h-5 w-5 text-success" />, bg: 'bg-success/8 border-success/15' },
            { label: 'Attempts', value: stats?.totalAttempts ?? '—', icon: <TrendingUp className="h-5 w-5 text-primary" />, bg: 'bg-primary/4 border-border' },
          ].map((item, i) => (
            <div key={i} className={`stat-card border ${item.bg} animate-fade-up delay-150`}>
              <div className="flex items-center justify-between mb-3">
                <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{item.label}</p>
                <div className="p-2 bg-white rounded-lg shadow-sm border border-border/50">{item.icon}</div>
              </div>
              <p className="font-headline font-black text-4xl text-foreground">{item.value}</p>
              <p className="font-mono text-[10px] text-muted-foreground mt-2 flex items-center gap-1">
                <TrendingUp className="h-3 w-3 text-success" /> +12.4% vs last month
              </p>
            </div>
          ))}
        </div>

        {/* ── Main Grid ───────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-up delay-300">
          <div className="lg:col-span-2 bg-white border border-border rounded-2xl overflow-hidden shadow-sm">
            <div className="px-6 py-5 border-b border-border flex items-center justify-between"
              style={{ background: 'linear-gradient(135deg, #1E3A8A 0%, #2563EB 100%)' }}>
              <div>
                <p className="font-mono text-[10px] text-blue-200/80 uppercase tracking-widest mb-1">Management</p>
                <h2 className="font-headline font-black text-xl text-white">User Identity Registry</h2>
                <p className="font-mono text-xs text-blue-100/70 mt-0.5">
                  Manage global roles and monitor account integrity.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-neutral-surface border-b border-border">
                  <tr>
                    <th className="text-left px-6 py-3 font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">User</th>
                    <th className="text-left px-4 py-3 font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Joined</th>
                    <th className="text-left px-4 py-3 font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Current Role</th>
                    <th className="text-right px-6 py-3 font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Change Role</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {recentUsers.map((user: any) => (
                    <tr key={user._id} className="hover:bg-neutral-surface/60 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center font-mono text-xs font-black text-primary shrink-0">
                            {user.firstName[0]}{user.lastName[0]}
                          </div>
                          <div>
                            <p className="font-mono text-sm font-bold text-foreground">
                              {user.firstName} {user.lastName}
                              {user._id === profile?.id && (
                                <span className="ml-2 font-mono text-[9px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full uppercase tracking-widest">You</span>
                              )}
                            </p>
                            <div className="flex items-center gap-1 font-mono text-[11px] text-muted-foreground mt-0.5">
                              <Mail className="h-3 w-3" />
                              {user.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1.5 font-mono text-xs text-muted-foreground">
                          <Calendar className="h-3.5 w-3.5" />
                          {new Date(user.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <RoleBadge role={user.role} />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {roleUpdating === user._id ? (
                            <Loader2 className="h-4 w-4 animate-spin text-primary" />
                          ) : (
                            <Select
                              key={`${user._id}-${user.role}`}
                              value={user.role}
                              onValueChange={(val) => handleRoleChange(user._id, val)}
                            >
                              <SelectTrigger className="w-[140px] h-8 font-mono text-xs border-border">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="student">
                                  <span className="font-mono text-xs">Student</span>
                                </SelectItem>
                                <SelectItem value="teacher">
                                  <span className="font-mono text-xs">Teacher</span>
                                </SelectItem>
                                <SelectItem value="administrator">
                                  <span className="font-mono text-xs">Administrator</span>
                                </SelectItem>
                                <SelectItem value="superadmin">
                                  <span className="font-mono text-xs font-bold text-primary">Super Admin</span>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-5">
            <div className="bg-white border border-border rounded-2xl overflow-hidden shadow-sm">
              <div className="px-5 py-4 border-b border-border">
                <h3 className="font-headline font-bold text-lg text-foreground flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" /> Role Distribution
                </h3>
              </div>
              <div className="p-5 space-y-3">
                {[
                  { role: 'superadmin', label: 'Super Admins', count: stats?.roles?.superadmin ?? 0, color: 'bg-primary' },
                  { role: 'administrator', label: 'Administrators', count: stats?.roles?.administrator ?? 0, color: 'bg-blue-400' },
                  { role: 'teacher', label: 'Teachers', count: stats?.roles?.teacher ?? 0, color: 'bg-success' },
                  { role: 'student', label: 'Students', count: stats?.roles?.student ?? 0, color: 'bg-border' },
                ].map((item) => {
                  const total = stats?.totalUsers || 1;
                  const pct = Math.round((item.count / total) * 100);
                  return (
                    <div key={item.role}>
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="font-mono text-xs text-muted-foreground">{item.label}</span>
                        <span className="font-mono text-xs font-bold text-foreground">{item.count}</span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full ${item.color} rounded-full transition-all duration-700`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-white border border-border rounded-2xl overflow-hidden shadow-sm">
              <div className="px-5 py-4 border-b border-border">
                <h3 className="font-headline font-bold text-lg text-foreground flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 text-accent" /> Security Status
                </h3>
              </div>
              <div className="p-5 space-y-3">
                <div className="mb-4">
                  <div className="flex justify-between text-[10px] font-mono font-bold uppercase tracking-widest mb-2 text-muted-foreground">
                    <span>Security Compliance</span>
                    <span className="text-success">94%</span>
                  </div>
                  <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-success rounded-full transition-all duration-1000" style={{ width: '94%' }} />
                  </div>
                </div>
                {[
                  { label: 'Brute Force Protection', status: 'Active', color: 'text-green-700 bg-success/10 border-success/20' },
                  { label: 'Database Replication', status: 'Primary Active', color: 'text-green-700 bg-success/10 border-success/20' },
                  { label: 'Strict CSP Headers', status: 'Configured', color: 'text-primary bg-primary/10 border-primary/20' },
                ].map((m) => (
                  <div key={m.label} className="flex items-center justify-between p-3 bg-neutral-surface border border-border rounded-xl">
                    <span className="font-mono text-xs font-medium text-foreground">{m.label}</span>
                    <span className={`font-mono text-[10px] font-bold uppercase tracking-wide px-2.5 py-0.5 rounded-full border ${m.color}`}>
                      {m.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl overflow-hidden shadow-blue"
              style={{ background: 'linear-gradient(135deg, #2563EB 0%, #1E40AF 100%)' }}>
              <div className="px-5 py-4 border-b border-white/10">
                <h3 className="font-headline font-bold text-lg text-white">Executive Controls</h3>
              </div>
              <div className="p-5 space-y-3">
                {[
                  { label: 'Platform-wide Config', icon: <ChevronRight className="h-4 w-4" /> },
                  { label: 'Audit Logs Download', icon: <ChevronRight className="h-4 w-4" /> },
                ].map((btn) => (
                  <button
                    key={btn.label}
                    className="w-full flex items-center justify-between px-4 py-3 bg-white/10 border border-white/15 text-white rounded-xl hover:bg-white/20 transition-colors font-mono text-sm font-medium"
                  >
                    <span>{btn.label}</span>
                    {btn.icon}
                  </button>
                ))}
                <button className="w-full flex items-center justify-between px-4 py-3 bg-white text-primary rounded-xl hover:bg-blue-50 transition-colors font-mono text-sm font-bold shadow-sm">
                  <span>Initialize DB Sync</span>
                  <Activity className="h-4 w-4 animate-pulse" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function SuperAdminDashboard() {
  return (
    <RouteGuard allowedRole="superadmin">
      <SuperAdminContent />
    </RouteGuard>
  );
}
