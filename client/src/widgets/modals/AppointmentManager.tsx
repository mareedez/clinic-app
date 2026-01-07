import { useState } from "react";

import { X, Clock, Calendar, AlertTriangle } from "lucide-react";
import { formatTime24Hour, formatDateFull } from "../../shared/lib/time-utils";
import { getAppointmentStatusStyles } from "../../shared/lib/statusColors";
import { toast } from "sonner";
import { apiClient } from "../../api/api-client";
import type { AppointmentDTO } from "../../../../server/src/application/dto/AppointmentDTO";

interface AppointmentManagerProps {
    appointment: AppointmentDTO;
    onClose: () => void;
    patientId: string;
}

export default function AppointmentManager({ appointment, onClose }: AppointmentManagerProps) {
    const [mode, setMode] = useState<"view" | "cancel">("view");
    const [cancelReason, setCancelReason] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const now = new Date();
    const startTime = appointment.schedule.startAt ? new Date(appointment.schedule.startAt) : null;
    const endTime = appointment.schedule.endAt ? new Date(appointment.schedule.endAt) : null;
    const isPast = startTime ? startTime <= now : false;

    // Проверка возможности отмены (бизнес-логика)
    const canCancel = appointment.permissions.canBeCancelled;
    const statusStyles = getAppointmentStatusStyles(appointment.status);

    const handleCancel = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!cancelReason.trim()) {
            toast.error("Please provide a reason for cancellation");
            return;
        }

        setIsSubmitting(true);
        try {
            await apiClient.post(`appointments/${appointment.id}/cancel`, { 
                reason: cancelReason 
            });
            toast.success("Appointment cancelled successfully");
            onClose();
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Failed to cancel appointment";
            toast.error(message);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (mode === "cancel" && startTime) {
        return (
            <div className="glass rounded-2xl p-6 mx-auto no-hover-bg max-w-96 shadow-2xl border-red-500/20">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-foreground">Cancel Visit</h3>
                    <button onClick={() => setMode("view")} className="p-1 hover:bg-white/10 rounded">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleCancel} className="space-y-4">
                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex gap-3 items-start">
                        <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                        <p className="text-[11px] text-red-400 leading-relaxed">
                            Are you sure you want to cancel this appointment? This action is permanent and will notify the clinic staff.
                        </p>
                    </div>

                    <div className="bg-white/5 p-3 rounded-lg border border-white/5">
                        <p className="text-[10px] text-muted-foreground uppercase font-bold mb-1">Appointment</p>
                        <p className="text-sm text-foreground">
                            {formatDateFull(startTime)} at {formatTime24Hour(startTime)}
                        </p>
                    </div>

                    <div>
                        <label className="block text-[10px] font-bold text-muted-foreground mb-2 uppercase">Reason for Cancellation</label>
                        <textarea
                            value={cancelReason}
                            onChange={(e) => setCancelReason(e.target.value)}
                            placeholder="Please tell us why you need to cancel..."
                            className="w-full bg-background border border-border rounded-lg p-3 text-sm resize-none focus:ring-2 focus:ring-primary outline-none transition-all"
                            rows={3}
                            required
                        />
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={() => setMode("view")} className="flex-1 btn-secondary btn-sm">Go Back</button>
                        <button type="submit" disabled={isSubmitting} className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-all disabled:opacity-50">
                            {isSubmitting ? "Cancelling..." : "Cancel Visit"}
                        </button>
                    </div>
                </form>
            </div>
        );
    }

    return (
        <div className="glass rounded-2xl p-6 mx-auto no-hover-bg max-w-96 shadow-xl border-white/10">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-foreground">Visit Details</h3>
                <button onClick={onClose} className="p-1 hover:bg-white/10 rounded">
                    <X className="w-5 h-5" />
                </button>
            </div>

            <div className="space-y-5 mb-8">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Status</p>
                        <div className={`text-[10px] font-bold px-2 py-0.5 rounded-full border inline-block ${statusStyles}`}>
                            {appointment.status.replace(/_/g, " ")}
                        </div>
                    </div>
                    {appointment.notes && (
                        <div className="text-right">
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Notes</p>
                            <p className="text-[11px] text-muted-foreground italic">Has comments</p>
                        </div>
                    )}
                </div>

                <div className="space-y-3">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10 text-primary"><Clock className="w-4 h-4" /></div>
                        <div>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase">Physician</p>
                            <p className="text-sm text-foreground font-medium">{appointment.physician?.displayName || "TBD Specialist"}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10 text-primary"><Calendar className="w-4 h-4" /></div>
                        <div>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase">Service</p>
                            <p className="text-sm text-foreground font-medium">{appointment.service.displayName}</p>
                        </div>
                    </div>

                    {startTime && (
                        <div className="flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/5 mt-2">
                            <div className="flex-1">
                                <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Scheduled Time</p>
                                <p className="text-sm font-bold text-primary">
                                    {formatDateFull(startTime)}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {formatTime24Hour(startTime)} {endTime ? `- ${formatTime24Hour(endTime)}` : ''}
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {appointment.notes && (
                    <div className="pt-2 border-t border-white/5">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Patient Comments</p>
                        <p className="text-xs text-muted-foreground leading-relaxed">"{appointment.notes}"</p>
                    </div>
                )}
            </div>

            {!canCancel && !isPast && appointment.status === "SCHEDULED" && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl mb-4 flex gap-2 items-center">
                    <AlertTriangle className="w-3 h-3 text-amber-500" />
                    <p className="text-[10px] text-amber-600 dark:text-amber-400">
                        Late cancellation policy applies (within 24h).
                    </p>
                </div>
            )}

            {canCancel && appointment.status === "SCHEDULED" && (
                <div className="flex justify-center pt-2">
                    <button onClick={() => setMode("cancel")} className="text-[11px] text-red-500/70 hover:text-red-500 hover:underline font-medium transition-all">
                        Request Cancellation
                    </button>
                </div>
            )}
        </div>
    );
}
