import {useState, useEffect, memo, useCallback} from "react";
import { useNavigate } from "react-router-dom";
import { Sun, Moon, Calendar } from "lucide-react";
import { toast } from "sonner";
import { io } from "socket.io-client";
import { useAuth } from "../features/auth/auth";
import { useTheme } from "../shared/theme";
import ProtectedRoute from "../features/auth/ProtectedRoute";
import DashboardHeader from "../widgets/layouts/DashboardHeader";
import InteractiveCalendar from "../widgets/calendar/InteractiveCalendar";
import LoadingSpinner from "../widgets/LoadingSpinner";
import { formatDateFull, formatTime24Hour } from "../shared/lib/time-utils";
import AppointmentManager from "../widgets/modals/AppointmentManager";
import { checkRole } from "../shared/lib/utils";
import { apiClient } from "../api/api-client";
import {getAppointmentStatusStyles} from "../shared/lib/statusColors";
import type {PatientDashboardDTO} from "../shared/types/PatientDashboardDTO";
import type {AppointmentDTO} from "../shared/types/AppointmentDTO";

interface AppointmentCardProps {
    apt: AppointmentDTO;
    isPast?: boolean;
    onSelect: (apt: AppointmentDTO) => void;
}

const AppointmentCard = memo(({ apt, isPast = false, onSelect }: AppointmentCardProps) => {
    const statusStyles = getAppointmentStatusStyles(apt.status);
    const startTime = apt.schedule.startAt ? new Date(apt.schedule.startAt) : null;

    return (
        <button
            onClick={() => onSelect(apt)}
            className={`rounded-xl p-4 transition-all text-left focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none no-hover-bg ${
                isPast
                    ? "bg-white dark:bg-slate-800/40 border border-slate-300/50 dark:border-slate-700/50"
                    : "bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md"
            }`}
        >
            <div className="flex items-start justify-between mb-3">
                <div>
                    <div className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border mb-2 inline-block ${statusStyles}`}>
                        {apt.status.replace(/_/g, " ")}
                    </div>
                    {apt.permissions.canBeCancelled && !isPast && (
                        <div className="ml-2 text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-tight inline-block">
                            • Modifiable
                        </div>
                    )}
                    <h4 className={`font-semibold text-sm ${isPast ? "text-slate-700 dark:text-slate-200" : "text-slate-900 dark:text-white"}`}>
                        {apt.service.displayName}
                    </h4>
                </div>
            </div>

            <div className="space-y-1 text-xs mb-3">
                <div className={isPast ? "text-slate-600 dark:text-slate-300" : "text-slate-600 dark:text-slate-200"}>
                    {apt.physician?.displayName || "TBD Specialist"}
                </div>
                {startTime && (
                    <>
                        <div className={isPast ? "text-slate-600 dark:text-slate-300" : "text-slate-600 dark:text-slate-200"}>
                            {formatDateFull(startTime)}
                        </div>
                        <div className={`font-semibold ${isPast ? "text-slate-600 dark:text-slate-300" : "text-blue-600 dark:text-blue-400"}`}>
                            {formatTime24Hour(startTime)}
                        </div>
                    </>
                )}
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-300 font-medium">Details →</div>
        </button>
    );
});

AppointmentCard.displayName = "AppointmentCard";

export function PatientPage() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const [dashboard, setDashboard] = useState<PatientDashboardDTO | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedAppointment, setSelectedAppointment] = useState<AppointmentDTO | null>(null);

    const fetchDashboard = useCallback(async (silent = false) => {
        if (!silent) setIsLoading(true);
        try {
            const response = await apiClient.get<PatientDashboardDTO>("appointments/dashboard/patient");
            setDashboard(response.data);
        } catch {
            if (!silent) toast.error("Failed to load health records");
        } finally {
            if (!silent) setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!user || !checkRole(user.role, "PATIENT")) return;

        fetchDashboard();

        const socketUrl = (import.meta.env.VITE_API_URL || "http://localhost:4000").replace(/\/api$/, "");

        const socket = io(socketUrl, {
            transports: ["polling", "websocket"],
            withCredentials: true,
            forceNew: true
        });

        socket.on("connect", () => {
            console.log("🟢 Patient Portal: Connected to live updates");
        });

        socket.on("dashboard-update", () => {
            console.log("⚡ Live Sync: Health records refresh");
            fetchDashboard(true);
        });

        return () => {
            console.log("🔴 Closing patient live sync");
            socket.off("dashboard-update");
            socket.disconnect();
        };
    }, [user, fetchDashboard]);

    if (!user || !checkRole(user.role, "PATIENT")) return null;
    if (isLoading && !dashboard) return <LoadingSpinner />;

    const { upcoming, past } = dashboard!;

    return (
        <ProtectedRoute allowedRoles={["PATIENT"]}>
            <div className="min-h-screen bg-background">
                <DashboardHeader
                    title="My Appointments"
                    actions={
                        <div className="flex items-center gap-2">
                            <button onClick={() => navigate("/patient/new_appointment")} className="btn-primary btn-sm">+ Book Appointment</button>
                            <button onClick={toggleTheme} className="p-2 rounded-lg text-muted-foreground hover:bg-muted transition-colors">
                                {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                            </button>
                        </div>
                    }
                />

                <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8 space-y-8">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 space-y-6">
                            <h2 className="text-xl font-bold text-foreground">Upcoming Appointments</h2>
                            {upcoming.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {upcoming.map((apt) => (
                                        <AppointmentCard key={apt.id} apt={apt} onSelect={setSelectedAppointment} />
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-12 px-4 rounded-[12px] border-2 border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/30 dark:bg-white/5 text-center">
                                    <Calendar className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-4" />
                                    <h3 className="text-lg font-bold text-foreground mb-1">No upcoming visits</h3>
                                    <p className="text-sm text-muted-foreground mb-6 max-w-xs leading-relaxed">
                                        You haven't scheduled any appointments yet. Book a visit to get started.
                                    </p>
                                    <button onClick={() => navigate("/patient/new_appointment")} className="btn-primary px-8">
                                        Book Appointment
                                    </button>
                                </div>
                            )}

                            {past.length > 0 && (
                                <div className="mt-10">
                                    <h2 className="text-xl font-bold text-foreground mb-4">Past Appointments</h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {past.slice(0, 4).map((apt) => (
                                            <AppointmentCard key={apt.id} apt={apt} isPast={true} onSelect={setSelectedAppointment} />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="lg:col-span-1">
                            <h2 className="text-xl font-bold text-foreground mb-4">Calendar</h2>
                            <InteractiveCalendar
                                appointments={[...upcoming, ...past]}
                                patientId={user.id}
                                onSelectAppointment={setSelectedAppointment}
                            />
                        </div>
                    </div>
                </div>

                {selectedAppointment && (
                    <AppointmentManager
                        appointment={selectedAppointment}
                        onClose={() => {
                            setSelectedAppointment(null);
                            fetchDashboard(true);
                        }}
                        patientId={user.id}
                    />
                )}
            </div>
        </ProtectedRoute>
    );
}
