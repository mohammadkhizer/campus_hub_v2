"use client";

import { useEffect, useState } from 'react';
import { Navbar } from '@/components/navbar';
import { RouteGuard } from '@/components/route-guard';
import { 
  getPlacementProfileAction, 
  getEligibleDrivesAction, 
  applyToDriveAction,
  updatePlacementProfileAction
} from '@/app/actions/placements';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Briefcase, 
  Target, 
  TrendingUp, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  FileText,
  User,
  GraduationCap,
  Award,
  ChevronRight,
  Loader2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

function StudentPlacementsContent() {
  const { toast } = useToast();
  const [profile, setProfile] = useState<any>(null);
  const [drives, setDrives] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState<string | null>(null);
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
  const [profileData, setProfileData] = useState({
    tenthPercentage: 0,
    twelfthPercentage: 0,
    currentCGPA: 0,
    activeBacklogs: 0
  });

  const fetchData = async () => {
    setLoading(true);
    const [prof, drv] = await Promise.all([
      getPlacementProfileAction(),
      getEligibleDrivesAction()
    ]);
    setProfile(prof);
    setDrives(drv || []);
    if (prof) {
      setProfileData({
        tenthPercentage: prof.personalDetails.tenthPercentage,
        twelfthPercentage: prof.personalDetails.twelfthPercentage,
        currentCGPA: prof.academicMetrics.currentCGPA,
        activeBacklogs: prof.academicMetrics.activeBacklogs
      });
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleApply = async (driveId: string) => {
    setApplying(driveId);
    const result = await applyToDriveAction(driveId);
    if (result.success) {
      toast({ title: "Success", description: "Application submitted successfully!" });
      fetchData();
    } else {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    }
    setApplying(null);
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await updatePlacementProfileAction({
      personalDetails: {
        tenthPercentage: profileData.tenthPercentage,
        twelfthPercentage: profileData.twelfthPercentage
      },
      academicMetrics: {
        currentCGPA: profileData.currentCGPA,
        activeBacklogs: profileData.activeBacklogs
      }
    });
    if (res.success) {
      toast({ title: "Profile Updated", description: "Your placement metrics have been saved." });
      setIsProfileDialogOpen(false);
      fetchData();
    } else {
      toast({ title: "Error", description: res.error, variant: "destructive" });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-surface">
        <Navbar />
        <div className="flex flex-col items-center justify-center h-[80vh]">
          <Loader2 className="h-10 w-10 animate-spin text-primary/40" />
          <p className="text-sm text-slate-400 mt-4 font-mono">Calculating Readiness...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-surface">
      <Navbar />
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
          <div>
            <h1 className="text-3xl font-headline font-black text-slate-900 flex items-center gap-3">
              <Briefcase className="h-8 w-8 text-primary" /> Placement Tracker
            </h1>
            <p className="text-slate-500 mt-1">Monitor your eligibility and track campus recruitment drives.</p>
          </div>
          
          <Dialog open={isProfileDialogOpen} onOpenChange={setIsProfileDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="border-slate-200 bg-white shadow-sm h-11">
                <User className="mr-2 h-4 w-4" /> Update My Metrics
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Update Placement Metrics</DialogTitle>
                <DialogDescription>
                  These details are used to calculate your eligibility for upcoming drives. 
                  <span className="block mt-2 text-red-500 font-bold text-xs">Note: Updating metrics will reset your "Verified" status and require TPO re-approval.</span>
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleUpdateProfile} className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>10th Percentage</Label>
                    <Input 
                      type="number" 
                      step="0.01" 
                      value={profileData.tenthPercentage}
                      onChange={(e) => setProfileData({...profileData, tenthPercentage: parseFloat(e.target.value) || 0})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>12th Percentage</Label>
                    <Input 
                      type="number" 
                      step="0.01" 
                      value={profileData.twelfthPercentage}
                      onChange={(e) => setProfileData({...profileData, twelfthPercentage: parseFloat(e.target.value) || 0})}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Current CGPA</Label>
                    <Input 
                      type="number" 
                      step="0.01" 
                      value={profileData.currentCGPA}
                      onChange={(e) => setProfileData({...profileData, currentCGPA: parseFloat(e.target.value) || 0})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Active Backlogs</Label>
                    <Input 
                      type="number" 
                      value={profileData.activeBacklogs}
                      onChange={(e) => setProfileData({...profileData, activeBacklogs: parseInt(e.target.value) || 0})}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" className="w-full">Save Changes</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Readiness Overview */}
        <div className="grid md:grid-cols-3 gap-6 mb-10">
          <Card className="border-none shadow-premium bg-white rounded-3xl">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="h-12 w-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
                  <GraduationCap className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Academic Score</p>
                    {profile?.academicMetrics?.isVerified ? (
                      <Badge className="bg-emerald-500/10 text-emerald-600 border-none text-[8px] h-4">Verified</Badge>
                    ) : (
                      <Badge variant="outline" className="text-amber-500 border-amber-200 text-[8px] h-4">Pending</Badge>
                    )}
                  </div>
                  <p className="text-2xl font-black text-slate-900">{profile?.academicMetrics?.currentCGPA || '0.0'}</p>
                </div>
              </div>
              <div className="w-full bg-slate-50 h-2 rounded-full overflow-hidden">
                <div className="bg-blue-500 h-full" style={{ width: `${(Math.min(profile?.academicMetrics?.currentCGPA || 0, 10) / 10) * 100}%` }} />
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-none shadow-premium bg-white rounded-3xl">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="h-12 w-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                  <Target className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Drive Eligibility</p>
                  <p className="text-2xl font-black text-slate-900">
                    {drives.filter(d => d.isEligible).length} <span className="text-sm text-slate-400 font-normal">Drives</span>
                  </p>
                </div>
              </div>
              <div className="flex gap-1.5 flex-wrap">
                <Badge variant="outline" className="bg-slate-50 text-slate-500 border-slate-200 uppercase text-[10px]">
                  {profile?.academicMetrics?.activeBacklogs} Backlogs
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-premium bg-white rounded-3xl">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="h-12 w-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600">
                  <TrendingUp className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Placement Status</p>
                  <p className="text-2xl font-black text-slate-900 uppercase">{profile?.status || 'Active'}</p>
                </div>
              </div>
              <p className="text-xs text-slate-500 italic">"Keep applying to improve your chances."</p>
            </CardContent>
          </Card>
        </div>

        {/* Drives Section */}
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900">Active Job Drives</h2>
            <Badge className="bg-primary/10 text-primary border-none">{drives.length}</Badge>
          </div>

          <div className="grid gap-6">
            {drives.length > 0 ? drives.map((drive) => (
              <Card key={drive.id} className="overflow-hidden border-none shadow-premium hover:shadow-xl transition-shadow group rounded-3xl bg-white">
                <div className="flex flex-col md:flex-row">
                  <div className={`w-full md:w-2 h-2 md:h-auto ${drive.isEligible ? 'bg-primary' : 'bg-slate-200'}`} />
                  <div className="flex-grow p-6 md:p-8">
                    <div className="flex flex-col md:flex-row justify-between items-start gap-6">
                      <div className="space-y-3 flex-grow">
                        <div className="flex flex-wrap items-center gap-3">
                          <Badge className="bg-slate-900 text-white border-none uppercase text-[10px] tracking-widest px-3 py-1">
                            {drive.companyName}
                          </Badge>
                          <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 shrink-0">
                            {drive.package} LPA
                          </Badge>
                        </div>
                        <h3 className="text-2xl font-black text-slate-900 group-hover:text-primary transition-colors">{drive.role}</h3>
                        <p className="text-slate-500 text-sm max-w-2xl line-clamp-2">{drive.description}</p>
                        
                        <div className="flex flex-wrap gap-4 pt-2">
                          <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
                            <Clock className="h-3.5 w-3.5" />
                            Deadline: {new Date(drive.deadline).toLocaleDateString()}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
                            <GraduationCap className="h-3.5 w-3.5" />
                            Min CGPA: {drive.eligibility.minCGPA}
                          </div>
                        </div>
                      </div>

                      <div className="shrink-0 w-full md:w-auto flex flex-col gap-3">
                        {drive.isEligible ? (
                          <Button 
                            className="w-full md:w-32 h-12 shadow-lg shadow-primary/20" 
                            disabled={applying === drive.id}
                            onClick={() => handleApply(drive.id)}
                          >
                            {applying === drive.id ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Apply Now'}
                          </Button>
                        ) : (
                          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 w-full md:w-48">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                              <AlertCircle className="h-3 w-3 text-red-400" /> Not Eligible
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {drive.reasons.map((r: string, i: number) => (
                                <Badge key={i} variant="outline" className="text-[9px] bg-white text-red-500 border-red-100">
                                  {r}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            )) : (
              <div className="text-center py-20 bg-white rounded-[2.5rem] border border-dashed border-slate-200">
                <Briefcase className="h-12 w-12 text-slate-200 mx-auto mb-4" />
                <h3 className="font-bold text-slate-900">No active drives</h3>
                <p className="text-slate-500 text-sm">Check back later for new placement opportunities.</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-16 bg-slate-900 rounded-[2.5rem] p-8 md:p-12 text-white overflow-hidden relative">
           <div className="absolute top-0 right-0 p-16 opacity-5 pointer-events-none">
              <Award className="h-64 w-64" />
           </div>
           <div className="relative z-10 max-w-2xl">
              <h2 className="text-3xl font-black mb-4">Placement Success Kit</h2>
              <p className="text-slate-400 leading-relaxed mb-8 text-lg">
                Your placement readiness score is calculated based on academic performance, skill verification, and project contributions. Update your profile regularly to stay eligible for top recruiters.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                 <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
                    <p className="text-xl font-bold">100+</p>
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mt-1">Partners</p>
                 </div>
                 <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
                    <p className="text-xl font-bold">42 LPA</p>
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mt-1">Highest</p>
                 </div>
                 <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
                    <p className="text-xl font-bold">95%</p>
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mt-1">Placed</p>
                 </div>
                 <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
                    <p className="text-xl font-bold">8.5 LPA</p>
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mt-1">Average</p>
                 </div>
              </div>
           </div>
        </div>

      </main>
    </div>
  );
}

export default function StudentPlacementsPage() {
  return (
    <RouteGuard allowedRole="student">
      <StudentPlacementsContent />
    </RouteGuard>
  );
}
