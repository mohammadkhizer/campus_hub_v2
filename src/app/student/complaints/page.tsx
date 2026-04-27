"use client";

import { useEffect, useState } from 'react';
import { Navbar } from '@/components/navbar';
import { RouteGuard } from '@/components/route-guard';
import { useAuth } from '@/context/auth-context';
import { submitComplaintAction, getStudentComplaintsAction } from '@/app/actions/complaints';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { 
  Loader2, 
  Plus, 
  MessageSquare, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  HelpCircle,
  Megaphone
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

function StudentComplaintsContent() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const [formData, setFormData] = useState({
    subject: '',
    category: 'other',
    description: '',
  });

  const loadComplaints = async () => {
    const data = await getStudentComplaintsAction();
    setComplaints(data);
    setLoading(false);
  };

  useEffect(() => {
    loadComplaints();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const result = await submitComplaintAction(formData);
    if (result.success) {
      toast({ title: "Complaint Registered", description: "Your concern has been sent to the administration." });
      setFormData({ subject: '', category: 'other', description: '' });
      setIsDialogOpen(false);
      loadComplaints();
    } else {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    }
    setSubmitting(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 uppercase text-[10px]">Pending</Badge>;
      case 'in-review': return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 uppercase text-[10px]">In Review</Badge>;
      case 'resolved': return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 uppercase text-[10px]">Resolved</Badge>;
      case 'rejected': return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 uppercase text-[10px]">Closed</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-neutral-surface">
      <Navbar />
      <main className="container mx-auto px-4 sm:px-6 py-6 md:py-10 max-w-5xl">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
          <div>
            <h1 className="text-2xl md:text-3xl font-headline font-black text-slate-900 flex items-center gap-2 md:gap-3">
              <Megaphone className="h-6 w-6 md:h-8 md:w-8 text-primary shrink-0" /> Student Complain Box
            </h1>
            <p className="text-slate-500 text-sm md:text-base mt-1">Register your concerns, technical issues, or academic grievances.</p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full md:w-auto bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 h-11 md:h-12 px-6">
                <Plus className="mr-2 h-5 w-5" /> New Complaint
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle className="text-2xl font-headline font-bold">Register Grievance</DialogTitle>
                <DialogDescription>
                  Please provide detailed information so the administration can assist you better.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-6 py-4">
                <div className="space-y-2">
                  <Label htmlFor="subject">Complaint Subject</Label>
                  <Input 
                    id="subject" 
                    placeholder="Briefly describe the issue" 
                    value={formData.subject}
                    onChange={(e) => setFormData({...formData, subject: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select 
                    value={formData.category} 
                    onValueChange={(val) => setFormData({...formData, category: val})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="academic">Academic (Lectures, Courses)</SelectItem>
                      <SelectItem value="technical">Technical (Portal, Quiz issues)</SelectItem>
                      <SelectItem value="facility">Facility (Classroom, Library)</SelectItem>
                      <SelectItem value="administrative">Administrative (Fees, Registration)</SelectItem>
                      <SelectItem value="other">Other Concerns</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Detailed Description</Label>
                  <Textarea 
                    id="description" 
                    placeholder="Explain the situation in detail..." 
                    className="min-h-[120px]"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    required
                  />
                </div>
                <DialogFooter>
                  <Button type="submit" className="w-full h-12" disabled={submitting}>
                    {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Submit Complaint
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Complaints List */}
        <div className="grid gap-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="h-10 w-10 animate-spin text-primary/40" />
              <p className="text-sm text-slate-400 mt-4 font-mono">Retrieving records...</p>
            </div>
          ) : complaints.length > 0 ? (
            complaints.map((complaint) => (
              <Card key={complaint.id} className="overflow-hidden border-none shadow-premium hover:shadow-xl transition-shadow group rounded-2xl md:rounded-3xl">
                <div className="flex flex-col md:flex-row">
                   <div className={`w-full md:w-1.5 h-1 md:h-auto ${
                     complaint.status === 'resolved' ? 'bg-green-500' : 
                     complaint.status === 'pending' ? 'bg-amber-400' : 
                     complaint.status === 'in-review' ? 'bg-blue-500' : 'bg-red-500'
                   }`} />
                   <div className="flex-grow p-6">
                      <div className="flex flex-wrap justify-between items-start gap-4 mb-4">
                         <div className="space-y-1">
                            <div className="flex items-center gap-2">
                               {getStatusBadge(complaint.status)}
                               <Badge variant="outline" className="uppercase text-[10px] text-slate-400 font-mono">
                                  {complaint.category}
                               </Badge>
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 group-hover:text-primary transition-colors">{complaint.subject}</h3>
                         </div>
                         <div className="text-right flex items-center gap-2 text-slate-400 text-xs font-mono">
                            <Clock className="h-3 w-3" />
                            {new Date(complaint.createdAt).toLocaleDateString()}
                         </div>
                      </div>
                      
                      <p className="text-slate-600 text-sm leading-relaxed mb-6 whitespace-pre-wrap">
                         {complaint.description}
                      </p>

                      {complaint.response && (
                        <div className={`rounded-2xl p-5 border relative ${
                          complaint.status === 'resolved' ? 'bg-green-50/50 border-green-100' : 
                          complaint.status === 'pending' ? 'bg-amber-50/50 border-amber-100' : 
                          complaint.status === 'in-review' ? 'bg-blue-50/50 border-blue-100' : 'bg-red-50/50 border-red-100'
                        }`}>
                           <div className="absolute -top-3 left-6 px-3 py-1 bg-white border border-slate-100 rounded-full text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 shadow-sm">
                              <HelpCircle className={`h-3 w-3 ${
                                complaint.status === 'resolved' ? 'text-green-500' : 
                                complaint.status === 'pending' ? 'text-amber-500' : 
                                complaint.status === 'in-review' ? 'text-blue-500' : 'text-red-500'
                              }`} /> Admin Response
                           </div>
                           <p className={`text-sm italic ${
                             complaint.status === 'resolved' ? 'text-green-800' : 
                             complaint.status === 'pending' ? 'text-amber-800' : 
                             complaint.status === 'in-review' ? 'text-blue-800' : 'text-red-800'
                           }`}>"{complaint.response}"</p>
                        </div>
                      )}
                   </div>
                </div>
              </Card>
            ))
          ) : (
            <div className="text-center py-16 md:py-24 bg-white rounded-3xl md:rounded-[2.5rem] border border-dashed border-slate-200 px-6">
               <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <MessageSquare className="h-10 w-10 text-slate-200" />
               </div>
               <h3 className="text-xl font-bold text-slate-900 mb-2">No complaints recorded</h3>
               <p className="text-slate-500 max-w-sm mx-auto mb-8">Your record is clean. If you encounter any issues, use the button above to register a complaint.</p>
               <Button variant="outline" className="border-slate-200" onClick={() => setIsDialogOpen(true)}>Register My First Complain</Button>
            </div>
          )}
        </div>

        {/* Support Footer */}
        <div className="mt-16 bg-slate-900 rounded-3xl md:rounded-[2.5rem] p-6 md:p-10 text-white relative overflow-hidden">
           <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
              <AlertCircle className="h-40 w-40" />
           </div>
           <div className="relative z-10 grid md:grid-cols-2 gap-10 items-center">
              <div>
                 <h2 className="text-2xl font-black mb-4">Immediate Technical Help?</h2>
                 <p className="text-slate-400 leading-relaxed mb-6">
                    If you are facing a critical issue during a live exam or cannot access your portal, please contact the IT Helpdesk directly for immediate assistance.
                 </p>
                 <div className="flex flex-wrap gap-4">
                    <div className="bg-white/5 border border-white/10 px-5 py-3 rounded-2xl">
                       <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Hotline</p>
                       <p className="text-sm font-bold font-mono">+1 (555) 012-3456</p>
                    </div>
                    <div className="bg-white/5 border border-white/10 px-5 py-3 rounded-2xl">
                       <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Email</p>
                       <p className="text-sm font-bold font-mono">support@campushub.edu</p>
                    </div>
                 </div>
              </div>
              <div className="flex justify-center md:justify-end">
                 <div className="h-40 w-40 bg-primary/20 rounded-full flex items-center justify-center border border-primary/30 animate-pulse">
                    <CheckCircle2 className="h-20 w-20 text-primary" />
                 </div>
              </div>
           </div>
        </div>
      </main>
    </div>
  );
}

export default function StudentComplaintsPage() {
  return (
    <RouteGuard allowedRole="student">
      <StudentComplaintsContent />
    </RouteGuard>
  );
}
