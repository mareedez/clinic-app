import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle, Sun, Moon } from "lucide-react";
import { toast } from "sonner";
import DashboardHeader from "../widgets/layouts/DashboardHeader";
import ProtectedRoute from "../features/auth/ProtectedRoute";
import { useAuth } from "../features/auth/auth";
import { useTheme } from "../shared/theme";
import { useAppointments } from "../features/appointments/useAppointments";
import { ServiceSelector } from "../features/appointments/ServiceSelector";
import { DoctorSelector } from "../features/appointments/DoctorSelector";
import { DateTimeSelector } from "../features/appointments/DateTimeSelector";
import { AppointmentSummary } from "../features/appointments/AppointmentSummary";
import { apiClient } from "../api/api-client";
import { CLINIC_CONFIG } from "../config/clinicConfig";
import type { TimeSlotDTO } from "../../../server/src/application/dto/TimeSlotDTO";
import type { ServiceDTO } from "../../../server/src/application/dto/ServiceDTO";
import type { UserDTO } from "../../../server/src/application/dto/UserDTO";

export function NewAppointment() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const { refresh } = useAppointments();

    const [selectedServiceId, setSelectedServiceId] = useState("");
    const [selectedDoctorId, setSelectedDoctorId] = useState("");
    const [selectedDate, setSelectedDate] = useState("");
    const [selectedTime, setSelectedTime] = useState("");

    const [services, setServices] = useState<ServiceDTO[]>([]);
    const [doctors, setDoctors] = useState<UserDTO[]>([]);

    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [timeSlots, setTimeSlots] = useState<TimeSlotDTO[]>([]);
    const [isSlotsLoading, setIsSlotsLoading] = useState(false);
    const [expandedSection, setExpandedSection] = useState<"service" | "doctor" | "date" | null>("service");

    useEffect(() => {
        const loadInitialData = async () => {
            try {
                const [sRes, dRes] = await Promise.all([
                    apiClient.get<ServiceDTO[]>("appointments/services"),
                    apiClient.get<UserDTO[]>("appointments/physicians")
                ]);
                setServices(sRes.data);
                setDoctors(dRes.data);
            } catch (e) {
                console.error("Failed to load selectors data", e);
                setError("Failed to initialize booking data");
            }
        };
        loadInitialData();
    }, []);

    useEffect(() => {
        const fetchSlots = async () => {
            if (!selectedServiceId || !selectedDoctorId || !selectedDate) {
                setTimeSlots([]);
                return;
            }

            setIsSlotsLoading(true);
            try {
                const response = await apiClient.get<TimeSlotDTO[]>("appointments/slots", {
                    params: {
                        physicianId: selectedDoctorId,
                        date: selectedDate,
                        serviceType: selectedServiceId
                    }
                });
                setTimeSlots(response.data.filter(slot => slot.isAvailable));
            } catch (err: unknown) {
                console.error("Failed to fetch slots", err);
                setError("Failed to load available time slots");
            } finally {
                setIsSlotsLoading(false);
            }
        };

        fetchSlots();
    }, [selectedServiceId, selectedDoctorId, selectedDate]);

    if (!user || user.role.toUpperCase() !== "PATIENT") {
        return null;
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!selectedServiceId || !selectedDoctorId || !selectedDate || !selectedTime) {
            setError("Please fill in all fields");
            return;
        }

        const service = services.find(s => s.id === selectedServiceId);
        if (!service) return;

        setIsSubmitting(true);
        try {

            const [year, month, day] = selectedDate.split('-').map(Number);
            const [hour, minute] = selectedTime.split(':').map(Number);
            const clinicLocalDate = new Date(Date.UTC(year, month - 1, day, hour, minute, 0));

            const offsetMs = CLINIC_CONFIG.timezone.utcOffsetHours * 60 * 60 * 1000;
            const utcDate = new Date(clinicLocalDate.getTime() - offsetMs);
            const isoString = utcDate.toISOString();

            await apiClient.post("appointments", {
                patientId: user.id,
                physicianId: selectedDoctorId,
                serviceType: selectedServiceId,
                scheduledStartAt: isoString,
                scheduledDurationMinutes: service.durationMinutes,
                notes: ""
            });

            toast.success("Appointment booked successfully!");
            await refresh();
            navigate("/patient");
        } catch (err: any) {
            const message = err.response?.data?.message || err.message || "Failed to book appointment";
            setError(message);
            toast.error(message);
        } finally {
            setIsSubmitting(false);
        }
    };


    const formatLocalDate = (date: Date): string => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const getMinDate = () => {
        const date = new Date();
        date.setDate(date.getDate() + 1);
        return formatLocalDate(date);
    };

    const getMaxDate = () => {
        const date = new Date();
        date.setDate(date.getDate() + 90);
        return formatLocalDate(date);
    };

    const currentService = services.find(s => s.id === selectedServiceId) || null;
    const currentDoctor = doctors.find(d => d.id === selectedDoctorId) || null;

    return (
        <ProtectedRoute allowedRoles={["PATIENT"]}>
            <div className="min-h-screen bg-background">
                <DashboardHeader
                    title="Book an Appointment"
                    actions={
                        <button
                            onClick={toggleTheme}
                            className="p-2 hover:bg-white/10 rounded-lg transition-colors text-muted-foreground hover:text-foreground"
                        >
                            {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                        </button>
                    }
                />
                <div className="max-w-7xl mx-auto px-6 lg:px-8 py-4">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 space-y-4">
                            <form onSubmit={handleSubmit} className="space-y-4">
                                {error && (
                                    <div className="p-4 bg-red-500/10 border border-red-400/40 rounded-lg flex items-start gap-3">
                                        <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                                        <p className="text-sm text-red-300">{error}</p>
                                    </div>
                                )}

                                <ServiceSelector
                                    selectedService={selectedServiceId}
                                    isExpanded={expandedSection === "service"}
                                    onSelect={(id: string) => {
                                        setSelectedServiceId(id);
                                        setSelectedDoctorId("");
                                        setExpandedSection("doctor");
                                    }}
                                    onExpand={() => setExpandedSection("service")}
                                />

                                <DoctorSelector
                                    selectedService={selectedServiceId}
                                    selectedDoctor={selectedDoctorId}
                                    isExpanded={expandedSection === "doctor"}
                                    onSelect={(id: string) => {
                                        setSelectedDoctorId(id);
                                        setExpandedSection(null);
                                    }}
                                    onExpand={() => setExpandedSection("doctor")}
                                />

                                <AppointmentSummary
                                    service={currentService}
                                    doctor={currentDoctor}
                                    selectedDate={selectedDate}
                                    selectedTime={selectedTime}
                                />

                                <div className="flex gap-2">
                                    <button type="button" onClick={() => navigate("/patient")} className="flex-1 btn-secondary">
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={!selectedTime || isSubmitting || isSlotsLoading}
                                        className="flex-1 btn-primary"
                                    >
                                        {isSubmitting ? "Booking..." : "Confirm Appointment"}
                                    </button>
                                </div>
                            </form>
                        </div>

                        <div className="lg:col-span-1">
                            {selectedServiceId && selectedDoctorId && (
                                <DateTimeSelector
                                    selectedDate={selectedDate}
                                    selectedTime={selectedTime}
                                    timeSlots={timeSlots}
                                    isLoading={isSlotsLoading}
                                    onDateSelect={setSelectedDate}
                                    onTimeSelect={setSelectedTime}
                                    getMinDate={getMinDate}
                                    getMaxDate={getMaxDate}
                                />
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </ProtectedRoute>
    );
}
