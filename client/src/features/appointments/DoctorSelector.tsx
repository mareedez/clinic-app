import { memo } from "react";
import { CheckCircle, Clock } from "lucide-react";
import { mockDoctors } from "../../shared/lib/mockdata";

interface DoctorSelectorProps {
    selectedService: string;
    selectedDoctor: string;
    isExpanded: boolean;
    onSelect: (doctorId: string) => void;
    onExpand: () => void;
}

export const DoctorSelector = memo(
    ({
         selectedService,
         selectedDoctor,
         isExpanded,
         onSelect,
         onExpand,
     }: DoctorSelectorProps) => {
        const selectedDoctorData = mockDoctors.find((d) => d.id === selectedDoctor);
        const availableDoctors = selectedService ? mockDoctors : [];

        if (!selectedService) {
            return null;
        }

        return (
            <div className="glass-lg rounded-2xl p-4 animate-in fade-in slide-in-from-bottom-4 no-hover-bg">
                {isExpanded ? (
                    <>
                        <label className="block text-sm font-semibold text-foreground mb-3">
                            Select Doctor
                        </label>
                        <div className="space-y-1">
                            {availableDoctors.map((doctor) => (
                                <button
                                    key={doctor.id}
                                    type="button"
                                    onClick={() => onSelect(doctor.id)}
                                    className={`w-full p-3 rounded-lg border-2 transition-all text-left no-hover-bg ${
                                        selectedDoctor === doctor.id
                                            ? "glass border-primary bg-primary/5"
                                            : "glass border-border hover:border-primary/50"
                                    }`}
                                >
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <p className="font-semibold text-foreground">
                                                Dr. {doctor.firstName} {doctor.lastName}
                                            </p>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                {doctor.specialization}
                                            </p>
                                            <div className="flex items-center gap-1 mt-1">
                                                <Clock className="w-3 h-3" />
                                                <span className="text-xs text-muted-foreground">
                          {doctor.workingHoursStart} - {doctor.workingHoursEnd}
                        </span>
                                            </div>
                                        </div>
                                        {selectedDoctor === doctor.id && (
                                            <CheckCircle className="w-5 h-5 text-primary" />
                                        )}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </>
                ) : selectedDoctor ? (
                    <button
                        type="button"
                        onClick={onExpand}
                        className="w-full p-2 rounded-lg text-left hover:bg-white/5 dark:hover:bg-white/10 transition-all"
                    >
                        <div>
                            <p className="text-xs text-muted-foreground">Doctor</p>
                            <div>
                                <p className="font-semibold text-foreground">
                                    Dr. {selectedDoctorData?.firstName}{" "}
                                    {selectedDoctorData?.lastName}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {selectedDoctorData?.specialization}
                                </p>
                            </div>
                        </div>
                    </button>
                ) : (
                    <button
                        type="button"
                        onClick={onExpand}
                        className="w-full p-3 rounded-lg border-2 glass border-border hover:border-primary/50 text-left"
                    >
                        <p className="text-sm text-muted-foreground">
                            Click to select doctor...
                        </p>
                    </button>
                )}
            </div>
        );
    },
);

DoctorSelector.displayName = "DoctorSelector";
