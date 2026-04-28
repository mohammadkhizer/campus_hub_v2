"use client";

import { useEffect, useState } from 'react';
import { Navbar } from '@/components/navbar';
import { RouteGuard } from '@/components/route-guard';
import { 
  createPlacementDriveAction, 
  getAllApplicationsAction, 
  updateApplicationStatusAction,
  verifyStudentAcademicsAction
} from '@/app/actions/placements';
// Removed dbConnect import as it is a client component and dbConnect is for server-side
import { getEligibleDrivesAction } from '@/app/actions/placements'; // Re-using to list drives
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Briefcase, 
  Users, 
  DollarSign, 
  PieChart, 
  TrendingUp, 
  Search, 
  Filter, 
  ChevronRight,
  MoreVertical,
  Calendar,
  Building2,
  FileDown,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
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
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";

function AdminPlacementsContent() {
  const { toast } = useToast();
  const [drives, setDrives] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isNewDriveOpen, setIsNewDriveOpen] = useState(false);
  const [selectedDrive, setSelectedDrive] = useState<any>(null);
  const [applications, setApplications] = useState<any[]>([]);
  const [loadingApps, setLoadingApps] = useState(false);

  const [newDrive, setNewDrive] = useState({
    companyName: '',
    role: '',
    package: 0,
    description: '',
    location: 'On-Campus',
    minCGPA: 0,
    minTenthPercentage: 0,
    minTwelfthPercentage: 0,
    maxActiveBacklogs: 0,
    driveDate: '',
    deadline: ''
  });

  const fetchDrives = async () => {
    setLoading(true);
    // In a real app, I'd have a specific getAdminDrives action, 
    // but for now I'll use getEligibleDrivesAction and just ignore eligibility
    const data = await getEligibleDrivesAction();
    setDrives(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchDrives();
  }, []);

  const handleCreateDrive = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await createPlacementDriveAction({
      ...newDrive,
      eligibility: {
        minCGPA: newDrive.minCGPA,
        minTenthPercentage: newDrive.minTenthPercentage,
        minTwelfthPercentage: newDrive.minTwelfthPercentage,
        maxActiveBacklogs: newDrive.maxActiveBacklogs,
        allowedBranches: ['CSE', 'ECE', 'ME', 'CE', 'EE'] // Default for MVP
      },
      status: 'active'
    });

    if (res.success) {
      toast({ title: "Drive Created", description: `${newDrive.companyName} drive is now live.` });
      setIsNewDriveOpen(false);
      fetchDrives();
    } else {
      toast({ title: "Error", description: res.error, variant: "destructive" });
    }
  };

  const handleViewApplicants = async (drive: any) => {
    setSelectedDrive(drive);
    setLoadingApps(true);
    const apps = await getAllApplicationsAction(drive.id);
    setApplications(apps);
    setLoadingApps(false);
  };

  const handleStatusUpdate = async (appId: string, status: string) => {
    const res = await updateApplicationStatusAction(appId, status);
    if (res.success) {
      toast({ title: "Status Updated" });
      handleViewApplicants(selectedDrive);
    }
  };

  const handleVerifyAcademics = async (studentId: string) => {
    const res = await verifyStudentAcademicsAction(studentId, true);
    if (res.success) {
      toast({ title: "Student Verified", description: "Academic metrics have been approved." });
    } else {
      toast({ title: "Error", description: res.error, variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="container mx-auto px-6 py-10 max-w-7xl">
        
        {/* Admin Header */}
        <div className="bg-white rounded-[2.5rem] p-8 md:p-12 border border-slate-100 shadow-sm mb-10 relative overflow-hidden">
           <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
              <PieChart className="h-48 w-48 text-primary" />
           </div>
           <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
              <div>
                 <Badge className="bg-primary/10 text-primary border-none text-[10px] font-bold uppercase tracking-widest px-3 mb-3">TPO Command Center</Badge>
                 <h1 className="text-4xl font-headline font-black text-slate-900 flex items-center gap-3">
                    Placement Portal
                 </h1>
                 <p className="text-slate-500 mt-2 text-lg">Manage recruitment drives and track institutional placement performance.</p>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" className="h-12 px-6 rounded-2xl border-slate-200 bg-white">
                  <FileDown className="mr-2 h-4 w-4" /> Export NIRF Report
                </Button>
                <Dialog open={isNewDriveOpen} onOpenChange={setIsNewDriveOpen}>
                  <DialogTrigger asChild>
                    <Button className="h-12 px-8 rounded-2xl bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20">
                      <Plus className="mr-2 h-5 w-5" /> Schedule New Drive
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Create Placement Drive</DialogTitle>
                      <DialogDescription>Enter the recruitment details and eligibility criteria.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCreateDrive} className="space-y-6 py-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2 col-span-2">
                          <Label>Company Name</Label>
                          <Input required value={newDrive.companyName} onChange={(e) => setNewDrive({...newDrive, companyName: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                          <Label>Job Role</Label>
                          <Input required value={newDrive.role} onChange={(e) => setNewDrive({...newDrive, role: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                          <Label>Package (CTC in LPA)</Label>
                          <Input required type="number" step="0.1" value={newDrive.package} onChange={(e) => setNewDrive({...newDrive, package: parseFloat(e.target.value) || 0})} />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Job Description</Label>
                        <Textarea required value={newDrive.description} onChange={(e) => setNewDrive({...newDrive, description: e.target.value})} />
                      </div>
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-4">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Eligibility Rules</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Min CGPA</Label>
                            <Input type="number" step="0.1" value={newDrive.minCGPA} onChange={(e) => setNewDrive({...newDrive, minCGPA: parseFloat(e.target.value) || 0})} />
                          </div>
                          <div className="space-y-2">
                            <Label>Max Backlogs</Label>
                            <Input type="number" value={newDrive.maxActiveBacklogs} onChange={(e) => setNewDrive({...newDrive, maxActiveBacklogs: parseInt(e.target.value) || 0})} />
                          </div>
                          <div className="space-y-2">
                            <Label>Min 10th %</Label>
                            <Input type="number" value={newDrive.minTenthPercentage} onChange={(e) => setNewDrive({...newDrive, minTenthPercentage: parseFloat(e.target.value) || 0})} />
                          </div>
                          <div className="space-y-2">
                            <Label>Min 12th %</Label>
                            <Input type="number" value={newDrive.minTwelfthPercentage} onChange={(e) => setNewDrive({...newDrive, minTwelfthPercentage: parseFloat(e.target.value) || 0})} />
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Drive Date</Label>
                          <Input required type="date" value={newDrive.driveDate} onChange={(e) => setNewDrive({...newDrive, driveDate: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                          <Label>App Deadline</Label>
                          <Input required type="date" value={newDrive.deadline} onChange={(e) => setNewDrive({...newDrive, deadline: e.target.value})} />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button type="submit" className="w-full h-12">Launch Recruitment Drive</Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
           </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
           <Card className="border-none shadow-sm bg-white rounded-3xl p-2">
              <CardContent className="pt-6">
                 <div className="flex items-center gap-4">
                    <div className="h-14 w-14 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
                       <TrendingUp className="h-7 w-7" />
                    </div>
                    <div>
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Placement Rate</p>
                       <h3 className="text-2xl font-black text-slate-900">88.4%</h3>
                    </div>
                 </div>
              </CardContent>
           </Card>
           <Card className="border-none shadow-sm bg-white rounded-3xl p-2">
              <CardContent className="pt-6">
                 <div className="flex items-center gap-4">
                    <div className="h-14 w-14 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                       <DollarSign className="h-7 w-7" />
                    </div>
                    <div>
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Average Package</p>
                       <h3 className="text-2xl font-black text-slate-900">7.2 LPA</h3>
                    </div>
                 </div>
              </CardContent>
           </Card>
           <Card className="border-none shadow-sm bg-white rounded-3xl p-2">
              <CardContent className="pt-6">
                 <div className="flex items-center gap-4">
                    <div className="h-14 w-14 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-600">
                       <Building2 className="h-7 w-7" />
                    </div>
                    <div>
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Active Recruiters</p>
                       <h3 className="text-2xl font-black text-slate-900">{drives.length}</h3>
                    </div>
                 </div>
              </CardContent>
           </Card>
           <Card className="border-none shadow-sm bg-white rounded-3xl p-2">
              <CardContent className="pt-6">
                 <div className="flex items-center gap-4">
                    <div className="h-14 w-14 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600">
                       <Users className="h-7 w-7" />
                    </div>
                    <div>
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Students Placed</p>
                       <h3 className="text-2xl font-black text-slate-900">412</h3>
                    </div>
                 </div>
              </CardContent>
           </Card>
        </div>

        {/* Drives List */}
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
           <div className="p-8 border-b border-slate-50 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                 Active Recruitment Drives
                 <Badge variant="outline" className="ml-2 font-mono">{drives.length}</Badge>
              </h2>
              <div className="flex gap-2">
                <Button variant="ghost" size="icon" className="rounded-xl"><Search className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" className="rounded-xl"><Filter className="h-4 w-4" /></Button>
              </div>
           </div>
           
           <div className="divide-y divide-slate-50">
              {loading ? (
                <div className="p-20 text-center"><Loader2 className="h-10 w-10 animate-spin mx-auto text-primary/40" /></div>
              ) : drives.length > 0 ? drives.map((drive) => (
                <div key={drive.id} className="p-8 hover:bg-slate-50/50 transition-colors flex flex-col md:flex-row justify-between items-start md:items-center gap-6 group">
                   <div className="flex items-center gap-6">
                      <div className="h-16 w-16 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                         <Building2 className="h-8 w-8" />
                      </div>
                      <div>
                         <div className="flex items-center gap-2 mb-1">
                            <Badge className="bg-slate-900 text-white uppercase text-[9px] tracking-widest">{drive.companyName}</Badge>
                            <Badge variant="outline" className="text-[9px] uppercase tracking-widest">{drive.package} LPA</Badge>
                         </div>
                         <h3 className="text-xl font-bold text-slate-900 group-hover:text-primary transition-colors">{drive.role}</h3>
                         <p className="text-xs text-slate-400 mt-1 flex items-center gap-4">
                            <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {new Date(drive.driveDate).toLocaleDateString()}</span>
                            <span className="flex items-center gap-1 font-mono uppercase tracking-widest text-[10px] text-primary">Eligibility: {drive.eligibility.minCGPA}+ CGPA</span>
                         </p>
                      </div>
                   </div>
                   
                   <div className="flex items-center gap-3">
                      <Button 
                        variant="outline" 
                        className="rounded-xl border-slate-200"
                        onClick={() => handleViewApplicants(drive)}
                      >
                         <Users className="mr-2 h-4 w-4" /> View Applicants
                      </Button>
                      <Button variant="ghost" size="icon" className="rounded-xl">
                         <MoreVertical className="h-5 w-5 text-slate-400" />
                      </Button>
                   </div>
                </div>
              )) : (
                <div className="p-20 text-center text-slate-400">No drives scheduled yet.</div>
              )}
           </div>
        </div>

        {/* Applicants Sidebar/Dialog */}
        <Dialog open={!!selectedDrive} onOpenChange={(o) => !o && setSelectedDrive(null)}>
          <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black">{selectedDrive?.companyName} - {selectedDrive?.role}</DialogTitle>
              <DialogDescription>Shortlist candidates and track interview progress.</DialogDescription>
            </DialogHeader>
            
            {loadingApps ? (
              <div className="py-20 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" /></div>
            ) : (
              <div className="space-y-4 py-4">
                <div className="flex justify-between items-center mb-6">
                   <h4 className="font-bold text-slate-900">Total Applicants ({applications.length})</h4>
                   <Button size="sm" variant="outline" className="rounded-xl">
                      <FileDown className="mr-2 h-4 w-4" /> Export CSV
                   </Button>
                </div>
                
                <div className="divide-y border rounded-2xl overflow-hidden">
                   {applications.map((app) => (
                     <div key={app._id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                        <div className="flex items-center gap-4">
                           <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs">
                              {app.student?.firstName?.[0]}
                           </div>
                           <div>
                              <p className="text-sm font-bold text-slate-900">{app.student?.firstName} {app.student?.lastName}</p>
                              <p className="text-xs text-slate-500 font-mono">{app.student?.enrollmentNumber}</p>
                           </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                           <Button 
                             variant="outline" 
                             size="sm" 
                             className="h-9 px-3 text-[10px] uppercase font-bold border-emerald-100 text-emerald-600 hover:bg-emerald-50"
                             onClick={() => handleVerifyAcademics(app.student._id)}
                           >
                             <ShieldCheck className="mr-1.5 h-3.5 w-3.5" /> Verify Marks
                           </Button>
                           <Select value={app.status} onValueChange={(val) => handleStatusUpdate(app._id, val)}>
                              <SelectTrigger className="w-[140px] h-9 text-xs">
                                 <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                 <SelectItem value="applied">Applied</SelectItem>
                                 <SelectItem value="shortlisted">Shortlisted</SelectItem>
                                 <SelectItem value="interview">Interviewing</SelectItem>
                                 <SelectItem value="selected">Selected</SelectItem>
                                 <SelectItem value="rejected">Rejected</SelectItem>
                              </SelectContent>
                           </Select>
                        </div>
                     </div>
                   ))}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

      </main>
    </div>
  );
}

export default function AdminPlacementsPage() {
  return (
    <RouteGuard allowedRole={['administrator', 'superadmin']}>
      <AdminPlacementsContent />
    </RouteGuard>
  );
}
