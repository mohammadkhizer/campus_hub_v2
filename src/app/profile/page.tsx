"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/navbar';
import { useAuth } from '@/context/auth-context';
import { getMyProfile, updateMyProfile } from '@/app/actions/profile';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  Loader2,
  User,
  Mail,
  Lock,
  Shield,
  BookOpen,
  Trophy,
  Users,
  School,
  LayoutDashboard,
  GraduationCap,
  Save,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  Pencil,
} from 'lucide-react';
import { format } from 'date-fns';

interface ProfileData {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  createdAt: string;
  stats: Record<string, number>;
}

const ROLE_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode; gradient: string }> = {
  superadmin: {
    label: 'Super Admin',
    color: 'bg-primary',
    icon: <Shield className="h-5 w-5" />,
    gradient: 'from-[#1E3A8A] to-[#2563EB]',
  },
  administrator: {
    label: 'Administrator',
    color: 'bg-primary',
    icon: <Shield className="h-5 w-5" />,
    gradient: 'from-[#1E40AF] to-[#2563EB]',
  },
  teacher: {
    label: 'Subject Coordinator',
    color: 'bg-success',
    icon: <GraduationCap className="h-5 w-5" />,
    gradient: 'from-[#15803D] to-[#22C55E]',
  },
  student: {
    label: 'Student',
    color: 'bg-primary',
    icon: <BookOpen className="h-5 w-5" />,
    gradient: 'from-[#1E3A8A] to-[#3B82F6]',
  },
};

const STAT_ICONS: Record<string, React.ReactNode> = {
  coursesEnrolled: <BookOpen className="h-5 w-5 text-primary" />,
  quizzesCompleted: <Trophy className="h-5 w-5 text-accent" />,
  classrooms: <School className="h-5 w-5 text-success" />,
  coursesManaged: <LayoutDashboard className="h-5 w-5 text-primary" />,
  quizzesCreated: <Trophy className="h-5 w-5 text-accent" />,
  totalCourses: <BookOpen className="h-5 w-5 text-primary" />,
  totalClassrooms: <School className="h-5 w-5 text-success" />,
  totalUsers: <Users className="h-5 w-5 text-primary" />,
};

const STAT_LABELS: Record<string, string> = {
  coursesEnrolled: 'Courses Enrolled',
  quizzesCompleted: 'Quizzes Completed',
  classrooms: 'Classrooms',
  coursesManaged: 'Courses Managed',
  quizzesCreated: 'Quizzes Created',
  totalCourses: 'Total Courses',
  totalClassrooms: 'Total Classrooms',
  totalUsers: 'Total Users',
};

export default function ProfilePage() {
  const { profile: authProfile, isLoading: authLoading, refreshSession } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [form, setForm] = useState({ firstName: '', lastName: '', email: '' });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'edit' | 'password'>('overview');

  useEffect(() => {
    if (!authLoading && !authProfile) {
      router.push('/login');
      return;
    }
    if (authProfile) {
      loadProfile();
    }
  }, [authProfile, authLoading]);

  const loadProfile = async () => {
    setLoading(true);
    const data = await getMyProfile();
    if (data) {
      setProfileData(data);
      setForm({ firstName: data.firstName, lastName: data.lastName, email: data.email });
    }
    setLoading(false);
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    const result = await updateMyProfile({
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      email: form.email.trim(),
    });
    if (result.success) {
      toast({ title: 'Profile Updated!', description: 'Your profile details have been saved.' });
      await loadProfile();
      await refreshSession();
      setIsEditing(false);
      setActiveTab('overview');
    } else {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    }
    setSaving(false);
  };

  const handleChangePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({ title: 'Mismatch', description: 'New passwords do not match.', variant: 'destructive' });
      return;
    }
    setSaving(true);
    const result = await updateMyProfile({
      firstName: form.firstName,
      lastName: form.lastName,
      email: form.email,
      currentPassword: passwordForm.currentPassword,
      newPassword: passwordForm.newPassword,
    });
    if (result.success) {
      toast({ title: 'Password Changed!', description: 'Your password has been updated successfully.' });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setActiveTab('overview');
    } else {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    }
    setSaving(false);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-neutral-surface flex flex-col">
        <Navbar />
        <div className="flex-grow flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="font-mono text-sm text-muted-foreground">Loading your profile...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!profileData) return null;

  const roleConf = ROLE_CONFIG[profileData.role] || ROLE_CONFIG.student;
  const initials = `${profileData.firstName[0]}${profileData.lastName[0]}`.toUpperCase();
  const fullName = `${profileData.firstName} ${profileData.lastName}`;
  const joinDate = profileData.createdAt ? format(new Date(profileData.createdAt), 'MMMM yyyy') : 'N/A';

  return (
    <div className="min-h-screen bg-neutral-surface pb-20">
      <Navbar />

      {/* Hero Banner */}
      <div className="relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${roleConf.gradient.includes('15803D') ? '#15803D, #22C55E' : '#1E3A8A, #2563EB'})` }}>
        <div className="absolute inset-0 bg-dot-grid opacity-10" />
        <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-10 -left-10 w-60 h-60 rounded-full bg-white/10 blur-3xl" />
        <div className="container mx-auto px-6 py-14 relative z-10">
          <div className="flex flex-col md:flex-row items-center md:items-end gap-8">
            {/* Avatar */}
            <div className="relative shrink-0">
              <div className="w-28 h-28 rounded-3xl bg-white/20 border-4 border-white/40 backdrop-blur-sm flex items-center justify-center shadow-2xl">
                <span className="font-headline text-4xl font-black text-white tracking-tight">{initials}</span>
              </div>
              <div className="absolute -bottom-2 -right-2 w-9 h-9 rounded-xl bg-white flex items-center justify-center shadow-lg text-primary">
                {roleConf.icon}
              </div>
            </div>
            {/* Info */}
            <div className="text-center md:text-left text-white">
              <p className="font-mono text-xs font-bold uppercase tracking-widest text-white/60 mb-1">Your Profile</p>
              <h1 className="font-headline text-4xl font-black tracking-tight">{fullName}</h1>
              <p className="font-mono text-white/70 mt-1 text-sm">{profileData.email}</p>
              <div className="flex flex-wrap gap-2 mt-3 justify-center md:justify-start">
                <span className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-sm border border-white/30 text-white font-mono text-xs font-bold px-3 py-1 rounded-full">
                  {roleConf.icon} {roleConf.label}
                </span>
                <span className="inline-flex items-center gap-1.5 bg-white/10 backdrop-blur-sm border border-white/20 text-white/80 font-mono text-xs px-3 py-1 rounded-full">
                  Member since {joinDate}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-6 -mt-6 max-w-5xl relative z-20">
        {/* Tab Navigation */}
        <div className="bg-white rounded-2xl shadow-premium border border-border p-1.5 flex gap-1 mb-8">
          {[
            { id: 'overview', label: 'Overview', icon: <User className="h-4 w-4" /> },
            { id: 'edit', label: 'Edit Profile', icon: <Pencil className="h-4 w-4" /> },
            { id: 'password', label: 'Change Password', icon: <Lock className="h-4 w-4" /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-primary text-white shadow-md'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Stats Grid */}
            <div>
              <h2 className="font-headline font-black text-xl text-foreground mb-4">Your Statistics</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {Object.entries(profileData.stats).map(([key, value]) => (
                  <div key={key} className="stat-card group">
                    <div className="flex items-start justify-between mb-3">
                      <div className="p-2 bg-primary/8 rounded-xl group-hover:bg-primary/15 transition-colors">
                        {STAT_ICONS[key] || <LayoutDashboard className="h-5 w-5 text-primary" />}
                      </div>
                    </div>
                    <p className="font-headline font-black text-3xl text-foreground">{value}</p>
                    <p className="font-mono text-[10px] text-muted-foreground font-bold mt-1 uppercase tracking-widest">
                      {STAT_LABELS[key] || key}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Profile Info Card */}
            <Card className="border-border shadow-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="font-headline font-black text-xl">Account Details</CardTitle>
                    <CardDescription className="font-mono text-xs">Your personal information on record.</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setActiveTab('edit')} className="gap-1.5 border-primary text-primary hover:bg-primary hover:text-white">
                    <Pencil className="h-3.5 w-3.5" /> Edit
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-2 gap-4">
                  {[
                    { label: 'First Name', value: profileData.firstName, icon: <User className="h-4 w-4 text-primary" /> },
                    { label: 'Last Name', value: profileData.lastName, icon: <User className="h-4 w-4 text-primary" /> },
                    { label: 'Email Address', value: profileData.email, icon: <Mail className="h-4 w-4 text-primary" /> },
                    { label: 'Role', value: roleConf.label, icon: roleConf.icon },
                  ].map((item) => (
                    <div key={item.label} className="flex items-start gap-3 p-4 bg-neutral-surface border border-border rounded-xl">
                      <div className="p-2 bg-white rounded-lg shadow-sm border border-border/50 shrink-0 mt-0.5">
                        {item.icon}
                      </div>
                      <div className="min-w-0">
                        <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-0.5">{item.label}</p>
                        <p className="font-mono font-bold text-sm text-foreground truncate">{item.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Security Card */}
            <Card className="border-primary/20 bg-primary/4 shadow-blue">
              <CardContent className="p-6 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white rounded-2xl shadow-sm">
                    <Lock className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">Password & Security</p>
                    <p className="text-sm text-muted-foreground">Keep your account secure with a strong password.</p>
                  </div>
                </div>
                <Button variant="outline" onClick={() => setActiveTab('password')} className="shrink-0">
                  Change Password
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* EDIT PROFILE TAB */}
        {activeTab === 'edit' && (
          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle className="font-headline font-black text-xl flex items-center gap-2">
                <Pencil className="h-5 w-5 text-primary" />
                Edit Profile
              </CardTitle>
              <CardDescription className="font-mono text-xs">Update your personal information. Your email is used for login.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">First Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      type="text"
                      value={form.firstName}
                      onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all bg-white"
                      placeholder="First name"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Last Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      type="text"
                      value={form.lastName}
                      onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all bg-white"
                      placeholder="Last name"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all bg-white"
                    placeholder="your@email.com"
                  />
                </div>
              </div>

              <div className="p-4 bg-accent/8 border border-accent/20 rounded-xl flex gap-3">
                <AlertCircle className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                <p className="font-mono text-sm text-foreground/70">
                  Changing your email will update your login credentials. You'll need to use the new email on your next login.
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  onClick={handleSaveProfile}
                  disabled={saving || !form.firstName || !form.lastName || !form.email}
                  className="flex-1 bg-primary hover:bg-primary/90 gap-2"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Save Changes
                </Button>
                <Button variant="outline" onClick={() => setActiveTab('overview')} disabled={saving}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* CHANGE PASSWORD TAB */}
        {activeTab === 'password' && (
          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle className="font-headline font-black text-xl flex items-center gap-2">
                <Lock className="h-5 w-5 text-primary" />
                Change Password
              </CardTitle>
              <CardDescription className="font-mono text-xs">
                Enter your current password, then choose a new one. It must be at least 6 characters.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Current Password */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Current Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type={showCurrent ? 'text' : 'password'}
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    className="w-full pl-10 pr-10 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all bg-white"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent(!showCurrent)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type={showNew ? 'text' : 'password'}
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    className="w-full pl-10 pr-10 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all bg-white"
                    placeholder="Min. 6 characters"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {passwordForm.newPassword.length > 0 && passwordForm.newPassword.length < 6 && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> Minimum 6 characters required.
                  </p>
                )}
                {passwordForm.newPassword.length >= 6 && (
                  <p className="text-xs text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" /> Password strength looks good.
                  </p>
                )}
              </div>

              {/* Confirm New Password */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Confirm New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    className="w-full pl-10 pr-10 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all bg-white"
                    placeholder="Repeat new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {passwordForm.confirmPassword.length > 0 &&
                  passwordForm.confirmPassword !== passwordForm.newPassword && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> Passwords do not match.
                    </p>
                  )}
                {passwordForm.confirmPassword.length > 0 &&
                  passwordForm.confirmPassword === passwordForm.newPassword &&
                  passwordForm.newPassword.length >= 6 && (
                    <p className="text-xs text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" /> Passwords match!
                    </p>
                  )}
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  onClick={handleChangePassword}
                  disabled={
                    saving ||
                    !passwordForm.currentPassword ||
                    !passwordForm.newPassword ||
                    passwordForm.newPassword.length < 6 ||
                    passwordForm.newPassword !== passwordForm.confirmPassword
                  }
                  className="flex-1 bg-primary hover:bg-primary/90 gap-2"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Update Password
                </Button>
                <Button variant="outline" onClick={() => setActiveTab('overview')} disabled={saving}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
