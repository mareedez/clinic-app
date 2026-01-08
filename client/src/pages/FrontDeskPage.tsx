import { useState, useEffect, useMemo, useCallback } from "react";
import {
    Search, UserPlus, XCircle, AlertCircle, FileText,
    Users, Play, UserCheck, Sun, Moon, Clock, Timer, Activity
} from "lucide-react";
import { toast } from "sonner";
import { io } from "socket.io-client";
import ProtectedRoute from "../features/auth/ProtectedRoute";
import DashboardHeader from "../widgets/layouts/DashboardHeader";
import LoadingSpinner from "../widgets/LoadingSpinner";
import AddPatientModal from "../widgets/modals/AddPatientModal";
import { useAuth } from "../features/auth/auth";
import { useTheme } from "../shared/theme";
import { formatTime24Hour } from "../shared/lib/time-utils";
import { checkRole } from "../shared/lib/utils";
import { apiClient } from "../api/api-client";
import { AppointmentStatus } from "../shared/types/AppointmentStatusEnum";
import type { FrontDeskDashboardDTO } from "../shared/types/FrontDeskDashboardDTO";
import type { UserDTO } from "../shared/types/UserDTO";
import type { ClinicReportDTO } from "../shared/types/ClinicReportDTO";
import {getAppointmentStatusStyles} from "../shared/lib/statusColors";

export function FrontDeskPage() {
    const { user } = useAuth();
    const { theme, toggleTheme } = useTheme();

    // Data State
    const [data, setData] = useState<FrontDeskDashboardDTO | null>(null);
    const [report, setReport] = useState<ClinicReportDTO | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isConnected, setIsConnected] = useState(false);

    // UI State
    const [searchTerm, setSearchTerm] = useState("");
    const [searchResults, setSearchResults] = useState<UserDTO[]>([]);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [showAddPatient, setShowAddPatient] = useState(false);
    const [filterStatus, setFilterStatus] = useState<string>("ALL");

    const fetchDashboard = useCallback(async (silent = false) => {
        if (!silent) setIsLoading(true);
        try {
            const response = await apiClient.get<FrontDeskDashboardDTO>("appointments/dashboard/frontdesk");
            setData(response.data);
        } catch {
            if (!silent) toast.error("Dashboard sync failed");
        } finally {
            if (!silent) setIsLoading(false);
        }
    }, []);

    const handleGenerateReport = useCallback(async () => {
        try {
            const response = await apiClient.get<ClinicReportDTO>("appointments/reports/daily");
            setReport(response.data);
            toast.success("Intelligence report ready");
        } catch {
            toast.error("Failed to fetch report");
        }
    }, []);

    const handleRegisterWalkIn = useCallback(async (patientId: string) => {
        try {
            const response = await apiClient.post("appointments/walk-in", {
                patientId,
                serviceType: "SICK_VISIT"
            });

            const apt = response.data;
            const docName = apt.physician?.displayName || "an available doctor";

            toast.success(`Walk-in Assigned!`, {
                description: `${apt.patient.displayName} has been routed to ${docName}`,
                duration: 5000,
            });

            setSearchTerm("");
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Walk-in assignment failed");
        }
    }, []);

    // WebSocket Integration
    useEffect(() => {
        if (!user || !checkRole(user.role, "FRONT_DESK")) return;

        const socketUrl = (import.meta.env.VITE_API_URL || "http://localhost:4000").replace(/\/api$/, "");
        const socket = io(socketUrl, {
            transports: ["polling", "websocket"],
            withCredentials: true,
            forceNew: true
        });

        socket.on("connect", () => {
            setIsConnected(true);
            const normalizedRoles = Array.isArray(user.role) ? user.role.map(r => r.toUpperCase()) : [user.role.toUpperCase()];
            socket.emit("authenticate", { roles: normalizedRoles, userId: user.id });
        });

        socket.on("dashboard-update", () => fetchDashboard(true));
        socket.on("disconnect", () => setIsConnected(false));

        const timeInterval = setInterval(() => setCurrentTime(new Date()), 60000);

        return () => {
            socket.off("dashboard-update");
            socket.disconnect();
            clearInterval(timeInterval);
        };
    }, [user, fetchDashboard]);

    // Patient Search
    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (searchTerm.length >= 2) {
                try {
                    const response = await apiClient.get<UserDTO[]>(`appointments/patients/search?q=${searchTerm}`);
                    setSearchResults(response.data);
                } catch (err) { console.error("Search failed", err); }
            } else { setSearchResults([]); }
        }, 300);
        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm]);

    useEffect(() => {
        if (checkRole(user?.role, "FRONT_DESK")) fetchDashboard();
    }, [user, fetchDashboard]);

    // Derived Data
    const filteredAgenda = useMemo(() => {
        if (!data) return [];
        if (filterStatus === "ALL") return data.agenda;
        return data.agenda.filter(apt => apt.status === filterStatus);
    }, [data, filterStatus]);

    const routingSuggestion = useMemo(() => {
        if (!data || !data.physicians || data.physicians.length === 0) return { name: "N/A", reason: "No active doctors" };
        const available = data.physicians.find(p => p.status === "AVAILABLE");
        if (available) return { name: available.displayName, reason: "Available now" };
        const soonest = [...data.physicians].sort((a, b) => {
            const timeA = a.estimatedReadyAt ? new Date(a.estimatedReadyAt).getTime() : Infinity;
            const timeB = b.estimatedReadyAt ? new Date(b.estimatedReadyAt).getTime() : Infinity;
            return timeA - timeB;
        })[0];
        return { name: soonest.displayName, reason: "Soonest available" };
    }, [data]);

    const handleAction = async (aptId: string, action: string, version: string) => {
        try {
            await apiClient.post(`appointments/${aptId}/${action}`, { expectedUpdatedAt: version });
            toast.success(`Action processed`);
        } catch (error: any) {
            const msg = error.response?.data?.message || "Action failed";
            toast.error(msg);
            if (msg.includes("updated by another user")) fetchDashboard(true);
        }
    };

    if (!user || !checkRole(user.role, "FRONT_DESK")) return null;
    if (isLoading && !data) return <LoadingSpinner />;

    return (
        <ProtectedRoute allowedRoles={["FRONT_DESK"]}>
            <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#020617] text-slate-900 dark:text-slate-50 transition-colors duration-500">
                <DashboardHeader
                    title="Control Center"
                    actions={
                        <div className="flex items-center gap-4">
                            {isConnected && (
                                <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    <span className="text-[9px] font-black text-emerald-600 uppercase tracking-tighter">Live</span>
                                </div>
                            )}
                            <button onClick={handleGenerateReport} className="p-2.5 rounded-2xl border border-border bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm text-muted-foreground hover:text-primary">
                                <FileText className="w-4 h-4" />
                            </button>
                            <button onClick={() => setShowAddPatient(true)} className="btn-primary btn-sm gap-2 rounded-2xl">
                                <UserPlus className="w-4 h-4" /> Add Patient
                            </button>
                            <button onClick={toggleTheme} className="p-2.5 rounded-2xl border border-border bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm">
                                {theme === "dark" ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
                            </button>
                        </div>
                    }
                />

                <div className="max-w-7xl mx-auto px-6 py-10 space-y-12">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            { label: "Today's Ledger", val: data?.stats.totalToday, icon: Activity, color: "text-primary" },
                            { label: "Waitlist", val: data?.stats.waitingPatients, icon: Clock, color: "text-amber-500" },
                            { label: "Fleet Readiness", val: data?.stats.availableDoctors, icon: Users, color: "text-emerald-500" }
                        ].map((s, i) => (
                            <div key={i} className="flex items-center gap-6 p-2 group">
                                <div className={`p-4 rounded-3xl bg-white dark:bg-slate-900 border border-border shadow-sm group-hover:border-primary/20 transition-all`}>
                                    <s.icon className={`w-6 h-6 ${s.color}`} />
                                </div>
                                <div>
                                    <div className="text-3xl font-black tracking-tighter leading-none">{s.val ?? 0}</div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-50 mt-1">{s.label}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                        <div className="lg:col-span-8 space-y-8">
                            <div className="relative group">
                                <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <input
                                    className="w-full pl-16 pr-6 py-5 rounded-[32px] border border-border bg-white dark:bg-slate-900 shadow-sm focus:ring-2 focus:ring-primary transition-all text-sm font-medium outline-none"
                                    placeholder="Search patient record..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                                {searchResults.length > 0 && (
                                    <div className="absolute z-50 w-full mt-3 bg-white dark:bg-slate-900 border border-border rounded-[32px] shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2">
                                        {searchResults.map(p => (
                                            <button key={p.id} onClick={() => handleRegisterWalkIn(p.id)} className="w-full p-6 text-left hover:bg-primary/5 flex items-center justify-between border-b border-border last:border-0 transition-colors">
                                                <div>
                                                    <p className="font-black text-base">{p.displayName}</p>
                                                    <p className="text-xs text-muted-foreground">{p.email}</p>
                                                </div>
                                                <div className="flex items-center gap-2 text-primary font-black text-[10px] uppercase bg-primary/10 px-4 py-2 rounded-full">
                                                    Assign <UserCheck className="w-4 h-4" />
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="bg-white dark:bg-slate-900 rounded-[40px] border border-border shadow-sm overflow-hidden">
                                <div className="p-8 border-b border-border flex items-center justify-between gap-4 flex-wrap bg-slate-50/50 dark:bg-white/5">
                                    <h2 className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.3em]">Clinical Stream</h2>
                                    <div className="flex bg-muted/50 p-1.5 rounded-2xl border border-border">
                                        {["ALL", "SCHEDULED", "WAITING", "IN_PROGRESS"].map((s) => (
                                            <button
                                                key={s}
                                                onClick={() => setFilterStatus(s)}
                                                className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all ${
                                                    filterStatus === s ? "bg-white dark:bg-slate-800 shadow-sm text-primary" : "text-muted-foreground"
                                                }`}
                                            >
                                                {s.replace('_', ' ')}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                        <tr className="text-left">
                                            <th className="px-8 py-5 text-[10px] font-black uppercase text-muted-foreground tracking-widest opacity-50">Timeline</th>
                                            <th className="px-8 py-5 text-[10px] font-black uppercase text-muted-foreground tracking-widest opacity-50">Patient</th>
                                            <th className="px-8 py-5 text-[10px] font-black uppercase text-muted-foreground tracking-widest opacity-50">Current Status</th>
                                            <th className="px-8 py-5 text-right text-[10px] font-black uppercase text-muted-foreground tracking-widest opacity-50">Action</th>
                                        </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border/50">
                                        {filteredAgenda.map(apt => (
                                            <tr key={apt.id} className="group hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors">
                                                <td className="px-8 py-6 font-black text-primary text-sm">
                                                    {apt.schedule.startAt ? formatTime24Hour(new Date(apt.schedule.startAt)) : 'NOW'}
                                                </td>
                                                <td className="px-8 py-6">
                                                    <p className="font-black text-foreground text-sm">{apt.patient.displayName}</p>
                                                    <p className="text-[10px] text-muted-foreground font-bold italic opacity-60">Dr. {apt.physician?.displayName || 'Pending'}</p>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className={getAppointmentStatusStyles(apt.status)}>
                                                        {apt.status.replace('_', ' ')}
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6 text-right">
                                                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
                                                        {apt.permissions.canBeCheckedIn && (
                                                            <button onClick={() => handleAction(apt.id, 'check-in', apt.lifeCycle.updatedAt)} className="p-2.5 bg-amber-500/10 text-amber-600 rounded-xl hover:bg-amber-500/20" title="Check In">
                                                                <Play className="w-4 h-4 fill-current" />
                                                            </button>
                                                        )}
                                                        {apt.permissions.canBeCancelled && (
                                                            <button onClick={() => handleAction(apt.id, 'cancel', apt.lifeCycle.updatedAt)} className="p-2.5 bg-slate-500/10 text-slate-500 rounded-xl hover:bg-slate-500/20" title="Cancel">
                                                                <AlertCircle className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                        {apt.status === AppointmentStatus.SCHEDULED && (
                                                            <button onClick={() => handleAction(apt.id, 'no-show', apt.lifeCycle.updatedAt)} className="p-2.5 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500/20" title="No-Show">
                                                                <XCircle className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        {filteredAgenda.length === 0 && (
                                            <tr>
                                                <td colSpan={4} className="p-20 text-center text-muted-foreground opacity-30 font-bold uppercase tracking-widest">
                                                    No Activity Found
                                                </td>
                                            </tr>
                                        )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        <div className="lg:col-span-4 space-y-10">
                            <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-border p-8 shadow-sm">
                                <h2 className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.3em] mb-8">Physician Fleet</h2>
                                <div className="grid gap-6">
                                    {(data?.physicians || []).map(doc => {
                                        const readyTime = doc.estimatedReadyAt ? new Date(doc.estimatedReadyAt) : null;
                                        const minLeft = readyTime ? Math.max(0, Math.round((readyTime.getTime() - currentTime.getTime()) / 60000)) : 0;
                                        return (
                                            <div key={doc.id} className="flex items-center justify-between group">
                                                <div className="space-y-1">
                                                    <p className="text-sm font-black truncate">{doc.displayName}</p>
                                                    <div className="flex items-center gap-2">
                                                        <div className={`w-1.5 h-1.5 rounded-full ${doc.status === 'BUSY' ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
                                                        <span className="text-[10px] font-black uppercase text-muted-foreground opacity-60">
                                                            {doc.status === 'BUSY' ? `Ends in ~${minLeft}m` : 'Available'}
                                                        </span>
                                                    </div>
                                                </div>
                                                {doc.status === 'BUSY' && <Timer className="w-4 h-4 text-amber-500/20" />}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="bg-primary/10 border border-primary/20 rounded-[32px] p-8 relative overflow-hidden">
                                <Users className="absolute top-0 right-0 p-8 opacity-5 w-24 h-24" />
                                <h3 className="text-xs font-black text-primary uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4" /> Routing Suggestion
                                </h3>
                                <p className="text-xl font-black text-foreground">{routingSuggestion.name}</p>
                                <div className="mt-4 inline-block px-4 py-1.5 bg-white/50 dark:bg-black/20 rounded-full border border-primary/20">
                                    <p className="text-[10px] font-black text-primary uppercase">{routingSuggestion.reason}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {showAddPatient && <AddPatientModal onClose={() => setShowAddPatient(false)} onSuccess={(id) => handleRegisterWalkIn(id)} />}

                {report && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xl animate-in fade-in duration-500">
                        <div className="bg-white dark:bg-slate-900 border border-border rounded-[48px] shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-500">
                            <div className="p-10 border-b border-border flex justify-between items-center bg-white/50 dark:bg-slate-900/50 backdrop-blur-md">
                                <div>
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-primary mb-2">Operational Intelligence</h3>
                                    <p className="text-4xl font-black tracking-tighter">Daily Clinic Performance</p>
                                </div>
                                <button onClick={() => setReport(null)} className="p-4 hover:bg-slate-100 dark:hover:bg-white/10 rounded-3xl transition-all">
                                    <XCircle className="w-8 h-8 text-muted-foreground hover:text-foreground" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-10 space-y-12 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                    {[
                                        { label: "Throughput", val: report.summary.totalAppointments, color: "text-foreground" },
                                        { label: "Completed", val: report.summary.completed, color: "text-emerald-500" },
                                        { label: "No-Shows", val: report.summary.noShow, color: "text-amber-600" },
                                        { label: "Est. Revenue", val: `$${report.summary.revenue ?? 0}`, color: "text-primary" }
                                    ].map((m, i) => (
                                        <div key={i} className="bg-slate-50 dark:bg-white/5 p-6 rounded-[32px] border border-border/50 text-center">
                                            <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-2">{m.label}</p>
                                            <p className={`text-3xl font-black tracking-tight ${m.color}`}>{m.val}</p>
                                        </div>
                                    ))}
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                                    <div className="space-y-6">
                                        <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                                            <Activity className="w-4 h-4 text-primary" /> Physician Performance
                                        </h4>
                                        <div className="space-y-3">
                                            {(report.physicianPerformance || []).map((p, i) => (
                                                <div key={i} className="flex items-center justify-between p-5 rounded-2xl bg-slate-50/50 dark:bg-white/5 border border-border/30">
                                                    <span className="text-sm font-black">{p.name}</span>
                                                    <div className="flex gap-4">
                                                        <div className="text-right">
                                                            <p className="text-[8px] font-bold text-muted-foreground uppercase">Success</p>
                                                            <p className="text-xs font-black text-emerald-500">{p.completed}</p>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-[8px] font-bold text-muted-foreground uppercase">Missed</p>
                                                            <p className="text-xs font-black text-amber-600">{p.noShow}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                                            <Timer className="w-4 h-4 text-primary" /> Service Distribution
                                        </h4>
                                        <div className="space-y-3">
                                            {(report.serviceBreakdown || []).map((s, i) => (
                                                <div key={i} className="flex items-center justify-between p-5 rounded-2xl bg-slate-50/50 dark:bg-white/5 border border-border/30">
                                                    <span className="text-sm font-black">{s.type.replace('_', ' ')}</span>
                                                    <span className="px-3 py-1 rounded-lg bg-primary/10 text-primary text-xs font-black">{s.count}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="p-8 bg-slate-50 dark:bg-white/5 border-t border-border flex justify-between items-center">
                                <p className="text-[10px] font-bold text-muted-foreground opacity-50">Generated on {new Date().toLocaleString()}</p>
                                <button onClick={() => window.print()} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary hover:opacity-70 transition-opacity">
                                    <FileText className="w-4 h-4" /> Export Audit Log
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </ProtectedRoute>
    );
}