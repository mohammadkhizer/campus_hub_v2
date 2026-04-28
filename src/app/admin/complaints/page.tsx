"use client";

import { useEffect, useState } from 'react';
import { Navbar } from '@/components/navbar';
import { RouteGuard } from '@/components/route-guard';
import { useAuth } from '@/context/auth-context';
import { getAllComplaintsAction, updateComplaintStatusAction } from '@/app/actions/complaints';
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
  MessageSquare, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Megaphone,
  User,
  Filter,
  Search,
  ChevronRight,
  ShieldCheck,
  FileText,
  AlertTriangle,
  Paperclip,
  ShieldAlert
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

function AdminComplaintsContent() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState<any>(null);
  const [response, setResponse] = useState('');
  const [status, setStatus] = useState('');
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const loadComplaints = async () => {
    const data = await getAllComplaintsAction();
    setComplaints(data);
    setLoading(false);
  };

  useEffect(() => {
    loadComplaints();
  }, []);

  const handleUpdate = async () => {
    if (!selectedComplaint) return;
    setUpdating(true);
    const result = await updateComplaintStatusAction(selectedComplaint.id, status, response);
    if (result.success) {
      toast({ title: "Updated", description: "Complaint status has been updated." });
      setSelectedComplaint(null);
      setResponse('');
      loadComplaints();
    } else {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    }
    setUpdating(false);
  };

  const filteredComplaints = complaints.filter(c => {
    const matchesFilter = filter === 'all' || c.status === filter;
    const matchesSearch = c.studentName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         c.subject.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 uppercase text-[10px]">Pending</Badge>;
      case 'in-review': return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 uppercase text-[10px]">In Review</Badge>;
      case 'resolved': return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 uppercase text-[10px]">Resolved</Badge>;
      case 'rejected': return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 uppercase text-[10px]">Closed</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'low': return <Badge variant="outline" className="bg-slate-50 text-slate-500 border-slate-200 uppercase text-[10px]">Low</Badge>;
      case 'medium': return <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-100 uppercase text-[10px]">Medium</Badge>;
      case 'high': return <Badge variant="outline" className="bg-orange-50 text-orange-600 border-orange-200 uppercase text-[10px]">High</Badge>;
      case 'critical': return <Badge variant="outline" className="bg-red-100 text-red-700 border-red-200 animate-pulse uppercase text-[10px] font-bold">Critical</Badge>;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="container mx-auto px-6 py-10 max-w-6xl">
        
        {/* Admin Header */}
        <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm mb-10">
           <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div>
                 <div className="flex items-center gap-2 mb-2">
                    <Badge className="bg-primary/10 text-primary border-none text-[10px] font-bold uppercase tracking-widest px-3">Administrative Control</Badge>
                 </div>
                 <h1 className="text-3xl font-headline font-black text-slate-900 flex items-center gap-3">
                    <ShieldCheck className="h-8 w-8 text-primary" /> Grievance Management
                 </h1>
                 <p className="text-slate-500 mt-1">Review and resolve student complaints and feedback.</p>
              </div>
              <div className="flex items-center gap-4 text-xs font-mono">
                 <div className="text-right border-r pr-6">
                    <p className="font-bold text-slate-900">{complaints.filter(c => c.status === 'pending').length}</p>
                    <p className="text-slate-400 uppercase text-[9px]">Unresolved</p>
                 </div>
                 <div className="text-right">
                    <p className="font-bold text-slate-900">{complaints.length}</p>
                    <p className="text-slate-400 uppercase text-[9px]">Total Tickets</p>
                 </div>
              </div>
           </div>
        </div>

        {/* Filters and Controls */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
           <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input 
                 placeholder="Search by student name or subject..." 
                 className="pl-10 h-11 bg-white border-slate-200"
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
              />
           </div>
           <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 h-11">
              <Filter className="h-4 w-4 text-slate-400" />
              <Select value={filter} onValueChange={setFilter}>
                 <SelectTrigger className="border-none shadow-none focus:ring-0 w-[140px] h-9">
                    <SelectValue placeholder="Status Filter" />
                 </SelectTrigger>
                 <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in-review">In Review</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="rejected">Closed</SelectItem>
                 </SelectContent>
              </Select>
           </div>
        </div>

        {/* Complaints Table/Grid */}
        <div className="grid gap-4">
           {loading ? (
             <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
           ) : filteredComplaints.length > 0 ? (
             filteredComplaints.map((c) => (
               <Card key={c.id} className="hover:shadow-md transition-shadow cursor-pointer overflow-hidden group" onClick={() => {
                  setSelectedComplaint(c);
                  setStatus(c.status);
                  setResponse(c.response || '');
               }}>
                  <div className="flex items-center p-6 gap-6">
                     <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                        <User className="h-6 w-6 text-slate-400" />
                     </div>
                     <div className="flex-grow min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                           {getStatusBadge(c.status)}
                           {getSeverityBadge(c.severity)}
                           <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{c.category}</span>
                        </div>
                        <h4 className="font-bold text-slate-900 truncate group-hover:text-primary transition-colors">{c.subject}</h4>
                        <p className="text-xs text-slate-500 truncate">From: {c.studentName} • ID: {c.student.slice(-6).toUpperCase()}</p>
                     </div>
                     <div className="text-right hidden md:block">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Reported On</p>
                        <p className="text-sm font-medium text-slate-700">{new Date(c.createdAt).toLocaleDateString()}</p>
                     </div>
                     <ChevronRight className="h-5 w-5 text-slate-300 group-hover:translate-x-1 transition-transform" />
                  </div>
               </Card>
             ))
           ) : (
             <Card className="p-20 text-center border-dashed">
                <MessageSquare className="h-12 w-12 text-slate-200 mx-auto mb-4" />
                <h3 className="font-bold text-slate-900">No matching records</h3>
                <p className="text-slate-500 text-sm">Adjustment your filters or search terms.</p>
             </Card>
           )}
        </div>

        {/* Action Dialog */}
        <Dialog open={!!selectedComplaint} onOpenChange={(o) => !o && setSelectedComplaint(null)}>
           <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                 <DialogTitle className="text-2xl font-bold">Complaint Details</DialogTitle>
                 <DialogDescription>Review student concern and provide an official response.</DialogDescription>
              </DialogHeader>
              {selectedComplaint && (
                 <div className="space-y-6 py-4">
                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                       <div className="flex justify-between items-start mb-4">
                           <div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Subject</p>
                              <div className="flex items-center gap-2">
                                <h4 className="text-lg font-bold text-slate-900">{selectedComplaint.subject}</h4>
                                {getSeverityBadge(selectedComplaint.severity)}
                              </div>
                           </div>
                           <Badge className="bg-white border-slate-200 text-slate-700">{selectedComplaint.category}</Badge>
                        </div>
                        <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap mb-6">{selectedComplaint.description}</p>
                        
                        {selectedComplaint.evidence && selectedComplaint.evidence.length > 0 && (
                          <div className="space-y-2 mb-6">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Attached Evidence</p>
                            <div className="flex flex-wrap gap-2">
                              {selectedComplaint.evidence.map((file: any, i: number) => (
                                <a 
                                  key={i} 
                                  href={file.url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium hover:bg-slate-100 transition-colors"
                                >
                                  <Paperclip className="h-3.5 w-3.5 text-primary" />
                                  <span className="truncate max-w-[150px]">{file.name}</span>
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
                       <div className="mt-6 flex items-center gap-3 border-t pt-4">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                             {selectedComplaint.studentName?.[0]}
                          </div>
                          <div className="text-xs">
                             <p className="font-bold text-slate-900">{selectedComplaint.studentName}</p>
                             <p className="text-slate-400">Student Account • Registered {new Date(selectedComplaint.createdAt).toLocaleString()}</p>
                          </div>
                       </div>
                    </div>

                    <div className="space-y-4">
                       <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                             <Label>Update Status</Label>
                             <Select value={status} onValueChange={setStatus}>
                                <SelectTrigger>
                                   <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                   <SelectItem value="pending">Pending</SelectItem>
                                   <SelectItem value="in-review">In Review</SelectItem>
                                   <SelectItem value="resolved">Resolved</SelectItem>
                                   <SelectItem value="rejected">Closed/Rejected</SelectItem>
                                </SelectContent>
                             </Select>
                          </div>
                       </div>
                       <div className="space-y-2">
                          <Label>Official Response (Visible to Student)</Label>
                          <Textarea 
                             placeholder="Provide instructions or resolution details..." 
                             className="min-h-[120px]"
                             value={response}
                             onChange={(e) => setResponse(e.target.value)}
                          />
                       </div>
                    </div>
                 </div>
              )}
              <DialogFooter>
                 <Button variant="outline" onClick={() => setSelectedComplaint(null)}>Cancel</Button>
                 <Button onClick={handleUpdate} disabled={updating}>
                    {updating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Submit Resolution
                 </Button>
              </DialogFooter>
           </DialogContent>
        </Dialog>

      </main>
    </div>
  );
}

export default function AdminComplaintsPage() {
  return (
    <RouteGuard allowedRole={['administrator', 'superadmin']}>
      <AdminComplaintsContent />
    </RouteGuard>
  );
}
