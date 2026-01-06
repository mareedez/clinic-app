import { memo } from "react";
import { User, Calendar, Clock } from "lucide-react";
import { formatDateFull } from "../../shared/lib/time-utils";
import { mockDoctors, mockServices } from "../../shared/lib/mockdata";

interface AppointmentSummaryProps {
    selectedService: string;
    selectedDoctor: string;
    selectedDate: string;
    selectedTime: string;
}

export const AppointmentSummary = memo(
    ({
         selectedService,
         selectedDoctor,
         selectedDate,
         selectedTime,
     }: AppointmentSummaryProps) => {

        const doctor = mockDoctors.find((d) => d.id === selectedDoctor);
        const service = mockServices.find((s) => s.id === selectedService);

        if (!selectedService || !selectedDoctor || !selectedDate || !selectedTime) {
            return null;
        }

        const [year, month, day] = selectedDate.split('-').map(Number);
        const dateObj = new Date(year!, month! - 1, day!);

        return (
            <div className="glass-lg rounded-2xl p-4 bg-primary/10 border border-primary/20 animate-in fade-in slide-in-from-bottom-4 no-hover-bg">
                <h3 className="text-xs font-bold uppercase tracking-widest text-primary mb-4">
                    Booking Summary
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-background border border-border">
                            <User className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                            <p className="text-[10px] text-muted-foreground uppercase font-bold">Physician</p>
                            <p className="font-semibold text-foreground text-sm">
                                Dr. {doctor?.firstName} {doctor?.lastName}
                            </p>
                            <p className="text-[10px] text-muted-foreground">{doctor?.specialization}</p>
                        </div>
                    </div>

                    <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-background border border-border">
                            <Clock className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                            <p className="text-[10px] text-muted-foreground uppercase font-bold">Service</p>
                            <p className="font-semibold text-foreground text-sm">
                                {service?.name}
                            </p>
                            <p className="text-[10px] text-muted-foreground">{service?.durationMinutes} minutes</p>
                        </div>
                    </div>

                    <div className="flex items-start gap-3 md:col-span-2 border-t border-border/50 pt-3 mt-1">
                        <div className="p-2 rounded-lg bg-background border border-border">
                            <Calendar className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                            <p className="text-[10px] text-muted-foreground uppercase font-bold">Appointment Time</p>
                            <p className="font-semibold text-foreground text-sm">
                                {formatDateFull(dateObj)}
                            </p>
                            <p className="text-sm text-primary font-bold">{selectedTime}</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    },
);

AppointmentSummary.displayName = "AppointmentSummary";
