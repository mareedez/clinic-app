import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import AppointmentManager from "../modals/AppointmentManager";
import { formatTime24Hour } from "../../shared/lib/time-utils";
import type { AppointmentDTO } from "../../../../server/src/application/dto/AppointmentDTO";

interface InteractiveCalendarProps {
  appointments: AppointmentDTO[];
  patientId: string;
  onSelectAppointment?: (appointment: AppointmentDTO) => void;
}

export default function InteractiveCalendar({
  appointments,
  patientId,
}: InteractiveCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentDTO | null>(null);
  const [selectedDateAppointments, setSelectedDateAppointments] = useState<AppointmentDTO[]>([]);

  // Helpers
  const getDaysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const getFirstDayOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

  const isToday = (date: Date) => {
    const today = new Date();
    return date.getFullYear() === today.getFullYear() &&
           date.getMonth() === today.getMonth() &&
           date.getDate() === today.getDate();
  };

  const isDatePast = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const getAppointmentsForDate = (date: Date) => {
    return appointments.filter((apt) => {
      if (!apt.schedule.startAt) return false;
      const aptDate = new Date(apt.schedule.startAt);
      return aptDate.getFullYear() === date.getFullYear() &&
             aptDate.getMonth() === date.getMonth() &&
             aptDate.getDate() === date.getDate() &&
             apt.status !== "CANCELLED";
    });
  };

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));

  const handleDateClick = (day: number) => {
    const dateObj = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const dayAppointments = getAppointmentsForDate(dateObj);
    if (dayAppointments.length > 0) {
      setSelectedDateAppointments(dayAppointments);
    }
  };

  if (selectedDateAppointments.length > 0) {
    if (selectedDateAppointments.length === 1 && !selectedAppointment) {
        return (
            <div className="w-full">
              <button onClick={() => setSelectedDateAppointments([])} className="mb-4 btn-secondary btn-sm">← Back to Calendar</button>
              <AppointmentManager
                appointment={selectedDateAppointments[0]}
                onClose={() => setSelectedDateAppointments([])}
                patientId={patientId}
              />
            </div>
        );
    }

    return (
      <div className="w-full">
        <button onClick={() => { setSelectedDateAppointments([]); setSelectedAppointment(null); }} className="mb-4 btn-secondary btn-sm">
          ← Back to Calendar
        </button>
        <div className="glass rounded-2xl p-4 animate-in fade-in slide-in-from-bottom-4">
          <h3 className="text-base font-bold text-foreground mb-3">
            {selectedDateAppointments[0].schedule.startAt &&
              new Date(selectedDateAppointments[0].schedule.startAt).toLocaleDateString("en-US", {
                weekday: "short", month: "short", day: "numeric",
              })}
          </h3>
          {selectedAppointment ? (
            <div>
              <button onClick={() => setSelectedAppointment(null)} className="mb-4 btn-secondary btn-sm">← Back to List</button>
              <AppointmentManager appointment={selectedAppointment} onClose={() => setSelectedAppointment(null)} patientId={patientId} />
            </div>
          ) : (
            <div className="space-y-2">
              {selectedDateAppointments.map((apt, idx) => (
                <div key={apt.id} className="animate-in fade-in slide-in-from-left-4" style={{ animationDelay: `${idx * 100}ms` }}>
                  <button onClick={() => setSelectedAppointment(apt)} className="w-full rounded-lg p-3 bg-white/50 dark:bg-slate-800/30 hover:bg-white/70 dark:hover:bg-slate-800/50 text-left transition-all border border-slate-200 dark:border-slate-700">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-primary mb-1">
                          {apt.schedule.startAt ? formatTime24Hour(new Date(apt.schedule.startAt)) : "--:--"}
                        </p>
                        <p className="font-semibold text-foreground text-sm leading-tight">{apt.service.displayName}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Dr. {apt.physician?.displayName}</p>
                      </div>
                      <span className="text-lg text-primary flex-shrink-0">→</span>
                    </div>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);
  const days = Array(firstDay).fill(null).concat(Array.from({ length: daysInMonth }, (_, i) => i + 1));

  return (
    <div className="glass-lg rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-foreground">
            {currentDate.toLocaleString("en-US", { month: "long", year: "numeric" })}
        </h3>
        <div className="flex gap-2">
          <button onClick={prevMonth} className="p-2 rounded-lg text-muted-foreground hover:text-foreground transition-colors"><ChevronLeft className="w-5 h-5" /></button>
          <button onClick={nextMonth} className="p-2 rounded-lg text-muted-foreground hover:text-foreground transition-colors"><ChevronRight className="w-5 h-5" /></button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-4">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div key={day} className="text-center text-xs font-semibold text-muted-foreground py-2.5">{day}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((day, idx) => {
          if (day === null) return <div key={`empty-${idx}`} />;
          const dateObj = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
          const dayAppointments = getAppointmentsForDate(dateObj);
          const hasAppts = dayAppointments.length > 0;
          const isPast = isDatePast(dateObj);
          const isDayToday = isToday(dateObj);

          return (
            <button
              key={day}
              onClick={() => handleDateClick(day)}
              disabled={!hasAppts}
              className={`
                aspect-square flex flex-col items-center justify-center font-semibold text-sm
                rounded-lg transition-all relative no-hover-bg
                ${isDayToday ? "glass-sm border-2 border-blue-500/60 bg-blue-500/10 text-foreground font-bold" : ""}
                ${!isDayToday && hasAppts && !isPast ? "text-slate-900 dark:text-white cursor-pointer" : ""}
                ${!isDayToday && hasAppts && isPast ? "text-slate-500 dark:text-slate-400 cursor-pointer" : ""}
                ${!hasAppts && !isPast ? "text-slate-900 dark:text-white cursor-default" : ""}
                ${!hasAppts && isPast ? "text-slate-500 dark:text-slate-500 cursor-default" : ""}
              `}
            >
              {day}
              {hasAppts && (
                <div className="flex gap-1 mt-1 justify-center">
                  {dayAppointments.slice(0, 3).map((apt) => (
                    <div key={apt.id} className={`w-1.5 h-1.5 rounded-full ${isPast ? "bg-slate-400/60" : isDayToday ? "bg-blue-600" : "bg-blue-500"}`} />
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}