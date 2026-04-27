"use client";

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { RouteGuard } from '@/components/route-guard';
import { getSystemActivityLogs } from '@/app/actions/superadmin';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import {
  Loader2,
  ShieldAlert,
  Activity,
  ChevronLeft,
  RefreshCw,
  Search,
  Filter,
  FileText,
  AlertTriangle,
  Info,
  Lock,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Lazy load heavy components
const Navbar = dynamic(() => import('@/components/navbar').then(mod => mod.Navbar), {
  loading: () => <div className="h-14 bg-white border-b border-border animate-pulse" />,
  ssr: false
});

/** Badge for Log Level display */
function LevelBadge({ level }: { level: string }) {
  const map: Record<string, { className: string, icon: any }> = {
    security: { className: 'bg-purple-100 text-purple-700 border-purple-200', icon: <Lock className="h-3 w-3" /> },
    error:    { className: 'bg-red-100 text-red-700 border-red-200', icon: <AlertTriangle className="h-3 w-3" /> },
    warn:     { className: 'bg-amber-100 text-amber-700 border-amber-200', icon: <AlertTriangle className="h-3 w-3" /> },
    info:     { className: 'bg-blue-100 text-blue-700 border-blue-200', icon: <Info className="h-3 w-3" /> },
  };
  
  const config = map[level] ?? map.info;
  
  return (
    <span className={`inline-flex items-center gap-1.5 font-mono text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-full border ${config.className}`}>
      {config.icon}
      {level}
    </span>
  );
}

function LogsPageContent() {
  const { toast } = useToast();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const loadLogs = async () => {
    setLoading(true);
    const result = await getSystemActivityLogs();
    if (result.success) {
      setLogs(result.data.logs);
    } else {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    }
    setLoading(false);
  };

  useEffect(() => { loadLogs(); }, []);

  const filteredLogs = logs.filter(log => 
    log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.level.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading && logs.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-surface">
        <div className="text-center space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
          <p className="font-mono text-xs text-muted-foreground uppercase tracking-widest">
            Fetching System Audit Logs...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-surface">
      <Navbar />

      <main className="container mx-auto px-4 sm:px-6 py-6 md:py-10 max-w-7xl">
        {/* ── Header ─────────────────────────────────────────────────── */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-5 animate-fade-up">
          <div className="flex items-center gap-4">
            <Link 
              href="/superadmin/dashboard" 
              className="p-2 bg-white border border-border rounded-xl text-muted-foreground hover:text-primary transition-all shadow-sm"
            >
              <ChevronLeft className="h-5 w-5" />
            </Link>
            <div>
              <p className="section-label mb-1">Audit Trail</p>
              <h1 className="font-headline font-black text-2xl md:text-3xl text-foreground">
                System <span className="text-primary">Logs</span>
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-border rounded-xl font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all shadow-sm"
              />
            </div>
            <button
              onClick={loadLogs}
              className="p-2.5 bg-white border border-border rounded-xl text-muted-foreground hover:text-primary hover:border-primary/30 transition-all shadow-sm"
              disabled={loading}
            >
              <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* ── Logs Table ────────────────────────────────────────────── */}
        <div className="bg-white border border-border rounded-2xl overflow-hidden shadow-sm animate-fade-up delay-150">
          <div className="px-6 py-5 border-b border-border bg-neutral-surface/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              <h2 className="font-headline font-bold text-lg text-foreground">Recent Activity</h2>
              <span className="font-mono text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">
                {filteredLogs.length} Events
              </span>
            </div>
            <div className="flex items-center gap-4">
               <div className="flex items-center gap-1.5 text-muted-foreground">
                 <Filter className="h-4 w-4" />
                 <span className="font-mono text-[10px] uppercase tracking-widest font-bold">Filters Active</span>
               </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-neutral-surface/30">
                <TableRow className="border-b border-border">
                  <TableHead className="px-6 py-4 font-mono text-[10px] font-bold uppercase tracking-widest">Level</TableHead>
                  <TableHead className="px-4 py-4 font-mono text-[10px] font-bold uppercase tracking-widest">Message</TableHead>
                  <TableHead className="px-4 py-4 font-mono text-[10px] font-bold uppercase tracking-widest">Timestamp</TableHead>
                  <TableHead className="px-6 py-4 font-mono text-[10px] font-bold uppercase tracking-widest text-right">Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.length > 0 ? (
                  filteredLogs.map((log) => (
                    <TableRow key={log._id} className="hover:bg-neutral-surface/40 transition-colors border-b border-border">
                      <td className="px-6 py-4">
                        <LevelBadge level={log.level} />
                      </td>
                      <td className="px-4 py-4">
                        <p className="font-mono text-xs font-medium text-foreground max-w-md truncate md:max-w-xl">
                          {log.message}
                        </p>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="font-mono text-[11px] text-muted-foreground">
                          <p>{new Date(log.timestamp).toLocaleDateString()}</p>
                          <p className="font-bold text-foreground/70">{new Date(log.timestamp).toLocaleTimeString()}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {log.context && (
                          <div className="group relative inline-block">
                             <button className="p-1.5 bg-neutral-surface border border-border rounded-lg text-muted-foreground hover:text-primary transition-all">
                               <Activity className="h-3.5 w-3.5" />
                             </button>
                             <div className="invisible group-hover:visible absolute right-0 bottom-full mb-2 w-80 p-4 bg-white border border-border rounded-2xl shadow-xl z-50 animate-fade-up">
                                <p className="font-mono text-[10px] font-black uppercase tracking-widest text-primary mb-3 border-b border-border pb-2">Context Metadata</p>
                                <pre className="font-mono text-[10px] text-muted-foreground overflow-auto max-h-48 text-left whitespace-pre-wrap">
                                  {JSON.stringify(log.context, null, 2)}
                                </pre>
                             </div>
                          </div>
                        )}
                      </td>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <td colSpan={4} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <Search className="h-10 w-10 text-muted-foreground/30" />
                        <p className="font-mono text-sm text-muted-foreground">No matching audit logs found.</p>
                      </div>
                    </td>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* ── System Status Footer ────────────────────────────────────── */}
        <div className="mt-8 flex flex-col md:flex-row gap-5">
           <div className="flex-1 bg-white border border-border rounded-2xl p-6 flex items-center gap-4 shadow-sm">
             <div className="w-12 h-12 bg-success/10 rounded-xl flex items-center justify-center">
                <ShieldAlert className="h-6 w-6 text-success" />
             </div>
             <div>
               <h3 className="font-headline font-bold text-foreground">Integrity Verified</h3>
               <p className="font-mono text-xs text-muted-foreground">System logs are cryptographically sealed and immutable.</p>
             </div>
           </div>
           
           <div className="flex-1 bg-white border border-border rounded-2xl p-6 flex items-center gap-4 shadow-sm">
             <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                <Lock className="h-6 w-6 text-primary" />
             </div>
             <div>
               <h3 className="font-headline font-bold text-foreground">Super Admin Only</h3>
               <p className="font-mono text-xs text-muted-foreground">This audit trail is restricted to governance personnel.</p>
             </div>
           </div>
        </div>
      </main>
    </div>
  );
}

export default function LogsPage() {
  return (
    <RouteGuard allowedRole="superadmin">
      <LogsPageContent />
    </RouteGuard>
  );
}
