import { useState, useEffect, useCallback, memo } from "react";
import { Clock, Sun, Moon, CheckCircle2, PlayCircle, Activity, Timer } from "lucide-react";
import { toast } from "sonner";
import { io } from "socket.io-client";
import ProtectedRoute from "../features/auth/ProtectedRoute";
import DashboardHeader from "../widgets/layouts/DashboardHeader";
import LoadingSpinner from "../widgets/LoadingSpinner";
import { useAuth } from "../features/auth/auth";
import { useTheme } from "../shared/theme";
import { formatTime24Hour } from "../shared/lib/time-utils";
import { checkRole } from "../shared/lib/utils";
import { apiClient } from "../api/api-client";
import { AppointmentStatus } from "../../../server/src/domain/clinic/AppointmentStatusEnum";
import type { AppointmentDTO } from "../../../server/src/application/dto/AppointmentDTO";
import type { PhysicianDashboardDTO } from "../../../server/src/application/dto/PhysicianDashboardDTO";
import {getAppointmentStatusStyles} from "../shared/lib/statusColors";

interface AppointmentRowProps {
    apt: AppointmentDTO;
    onAction: () => void;
}

const ConsultationTimer = ({ startedAt, durationMinutes }: { startedAt: string, durationMinutes: number }) => {
    const [elapsed, setElapsed] = useState(0);
    const startMs = new Date(startedAt).getTime();

    useEffect(() => {
        const update = () => setElapsed(Math.floor((Date.now() - startMs) / 1000));
        update();
        const interval = setInterval(update, 1000);
        return () => clearInterval(interval);
    }, [startMs]);

    const minutes = Math.floor(Math.max(0, elapsed) / 60);
    const seconds = Math.max(0, elapsed) % 60;
    const isOvertime = minutes >= durationMinutes;

    return (
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all duration-500 ${
            isOvertime
                ? "bg-red-500/10 border-red-500/20 text-red-500 animate-pulse"
                : "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
        }`}>
            <Timer className="w-3.5 h-3.5" />
            <span className="text-xs font-black tabular-nums">
                {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </span>
            {isOvertime && <span className="text-[8px] font-black uppercase tracking-tighter">Overtime</span>}
        </div>
    );
};

const AppointmentRow = memo(({ apt, onAction }: AppointmentRowProps) => {
    const [isProcessing, setIsProcessing] = useState(false);

    const handleStatusUpdate = async (action: 'start' | 'complete' | 'cancel') => {
        setIsProcessing(true);
        try {
            await apiClient.post(`appointments/${apt.id}/${action}`, {
                expectedUpdatedAt: apt.lifeCycle.updatedAt
            });
            toast.success(`Patient session ${action}ed`);
            onAction();
        } catch (error: any) {
            const message = error.response?.data?.message || "Update failed";
            toast.error(message);

            if (error.response?.status === 409 || message.includes("updated by another user")) {
                onAction();
            }
        } finally {
            setIsProcessing(false);
        }
    };

    const statusStyles = getAppointmentStatusStyles(apt.status);
    const startTime = apt.schedule.startAt ? new Date(apt.schedule.startAt) : null;

    return (
        <div className={`group bg-white dark:bg-slate-900 rounded-[24px] p-6 border border-border transition-all duration-300 hover:shadow-xl hover:border-primary/20 ${apt.status === AppointmentStatus.IN_PROGRESS ? 'ring-2 ring-primary/20' : ''}`}>
            <div className="flex items-center justify-between mb-6">
                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        <h4 className="font-black text-foreground text-lg tracking-tight leading-none">
                            {apt.patient.displayName}
                        </h4>
                        {apt.status === AppointmentStatus.IN_PROGRESS && apt.lifeCycle.startedAt ? (
                            <ConsultationTimer
                                startedAt={apt.lifeCycle.startedAt}
                                durationMinutes={apt.schedule.durationMinutes || 30}
                            />
                        ) : (
                            <div className={`w-2 h-2 rounded-full ${statusStyles.includes('bg-emerald') ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                        )}
                    </div>
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.1em]">
                        {apt.service.displayName} • {apt.schedule.durationMinutes}m
                    </p>
                </div>
                <div className="text-right">
                    <p className="text-2xl font-black text-primary tracking-tighter leading-none">
                        {startTime ? formatTime24Hour(startTime) : "--:--"}
                    </p>
                    <span className="text-[9px] font-bold text-muted-foreground uppercase opacity-60">Scheduled</span>
                </div>
            </div>

            <div className="flex gap-3">
                {apt.permissions.canBeStarted && (
                    <button
                        disabled={isProcessing}
                        onClick={() => handleStatusUpdate('start')}
                        className="flex-1 bg-primary text-primary-foreground py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all hover:brightness-110 active:scale-95 flex items-center justify-center gap-2"
                    >
                        <PlayCircle className="w-4 h-4" /> Start Session
                    </button>
                )}
                {apt.permissions.canBeCompleted && (
                    <button
                        disabled={isProcessing}
                        onClick={() => handleStatusUpdate('complete')}
                        className="flex-1 bg-emerald-600 text-white py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all hover:bg-emerald-500 active:scale-95 flex items-center justify-center gap-2"
                    >
                        <CheckCircle2 className="w-4 h-4" /> Complete
                    </button>
                )}
                {apt.status === AppointmentStatus.COMPLETED && (
                    <div className="flex-1 text-center py-3 text-[10px] text-emerald-600 font-black uppercase tracking-widest flex items-center justify-center gap-2 bg-emerald-500/5 rounded-2xl border border-emerald-500/10">
                        <CheckCircle2 className="w-4 h-4" /> Finalized
                    </div>
                )}
            </div>
        </div>
    );
});

export function PhysicianPage() {
    const { user } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const [isConnected, setIsConnected] = useState(false);
    const [dashboardData, setDashboardData] = useState<PhysicianDashboardDTO | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchDashboard = useCallback(async (silent = false) => {
        if (!silent) setIsLoading(true);
        try {
            const response = await apiClient.get<PhysicianDashboardDTO>("appointments/dashboard/physician");
            setDashboardData(response.data);
        } catch {
            if (!silent) toast.error("Sync failed");
        } finally {
            if (!silent) setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!user || !checkRole(user.role, "PHYSICIAN")) return;
        fetchDashboard();

        const socketUrl = (import.meta.env.VITE_API_URL || "http://localhost:4000").replace(/\/api$/, "");
        const socket = io(socketUrl, {
            transports: ["polling", "websocket"],
            withCredentials: true,
            forceNew: true
        });

        socket.on("connect", () => {
            setIsConnected(true);
            socket.emit("authenticate", { roles: [user.role.toUpperCase()], userId: user.id });
        });

        socket.on("appointment-update", () => fetchDashboard(true));
        socket.on("disconnect", () => setIsConnected(false));

        return () => {
            socket.off("appointment-update");
            socket.disconnect();
        };
    }, [user, fetchDashboard]);

    if (!user || !checkRole(user.role, "PHYSICIAN")) return null;
    if (isLoading && !dashboardData) return <LoadingSpinner />;

    const { stats, todayAppointments, upcomingAppointments } = dashboardData!;

    return (
        <ProtectedRoute allowedRoles={["PHYSICIAN"]}>
            <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#020617] text-slate-900 dark:text-slate-50 transition-colors duration-500">
                <DashboardHeader
                    title="Clinical Stream"
                    actions={
                        <div className="flex items-center gap-4">
                            {isConnected && (
                                <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    <span className="text-[9px] font-black text-emerald-600 uppercase tracking-tighter">Live</span>
                                </div>
                            )}
                            <button onClick={toggleTheme} className="p-2.5 rounded-2xl border border-border bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm">
                                {theme === "dark" ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
                            </button>
                        </div>
                    }
                />

                <div className="max-w-7xl mx-auto px-6 py-10 space-y-12">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            { label: "Today's Ledger", val: stats.totalToday, icon: Activity, color: "text-primary" },
                            { label: "In Consultation", val: stats.inProgress, icon: Clock, color: "text-amber-500" },
                            { label: "Finalized", val: stats.completedToday, icon: CheckCircle2, color: "text-emerald-500" }
                        ].map((s, i) => (
                            <div key={i} className="flex items-center gap-6 p-2 group transition-all">
                                <div className={`p-4 rounded-3xl bg-white dark:bg-slate-900 border border-border shadow-sm group-hover:border-primary/20 transition-all`}>
                                    <s.icon className={`w-6 h-6 ${s.color}`} />
                                </div>
                                <div>
                                    <div className="text-3xl font-black tracking-tighter leading-none">{s.val}</div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-50 mt-1">{s.label}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                        <div className="lg:col-span-8 space-y-8">
                            <h2 className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.3em] pl-1">Active Queue</h2>
                            {todayAppointments.length > 0 ? (
                                <div className="grid gap-6">
                                    {todayAppointments.map((apt) => (
                                        <AppointmentRow key={apt.id} apt={apt} onAction={() => fetchDashboard(true)} />
                                    ))}
                                </div>
                            ) : (
                                <div className="py-24 text-center border-2 border-dashed border-border rounded-[40px] opacity-40">
                                    <p className="text-xs font-black uppercase tracking-widest">No patients remaining</p>
                                </div>
                            )}
                        </div>

                        <div className="lg:col-span-4 space-y-10">
                            <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-border p-8 shadow-sm">
                                <h2 className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.3em] mb-8">Schedule Outlook</h2>
                                {upcomingAppointments.length > 0 ? (
                                    <div className="space-y-6">
                                        {upcomingAppointments.map((apt) => {
                                            const start = apt.schedule.startAt ? new Date(apt.schedule.startAt) : null;
                                            return (
                                                <div key={apt.id} className="group flex items-start justify-between border-b border-border/50 pb-6 last:border-0 last:pb-0">
                                                    <div className="space-y-1">
                                                        <p className="text-sm font-black text-foreground">{apt.patient.displayName}</p>
                                                        <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">{apt.service.displayName}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-xs font-black text-primary uppercase">
                                                            {start?.toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                                                        </p>
                                                        <p className="text-[10px] font-bold text-muted-foreground opacity-60">
                                                            {start ? formatTime24Hour(start) : "N/A"}
                                                        </p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest text-center py-4">Calendar Empty</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </ProtectedRoute>
    );
}