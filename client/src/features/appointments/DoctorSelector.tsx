import { memo, useEffect, useState } from "react";
import { CheckCircle, Loader2 } from "lucide-react";
import { apiClient } from "../../api/api-client";
import type { UserDTO } from "../../../../server/src/application/dto/UserDTO";

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
        const [doctors, setDoctors] = useState<UserDTO[]>([]);
        const [isLoading, setIsLoading] = useState(false);

        useEffect(() => {
            const fetchDoctors = async () => {
                setIsLoading(true);
                try {
                    const response = await apiClient.get<UserDTO[]>("appointments/physicians");
                    setDoctors(response.data);
                } catch (error) {
                    console.error("Failed to fetch physicians", error);
                } finally {
                    setIsLoading(false);
                }
            };

            if (isExpanded || (selectedDoctor && doctors.length === 0)) {
                fetchDoctors();
            }
        }, [isExpanded, selectedDoctor, doctors.length]);

        const selectedDoctorData = doctors.find((d) => d.id === selectedDoctor);

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
                        {isLoading ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                            </div>
                        ) : (
                            <div className="space-y-1">
                                {doctors.map((doctor) => (
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
                                                    {doctor.displayName}
                                                </p>
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    Specialist
                                                </p>
                                            </div>
                                            {selectedDoctor === doctor.id && (
                                                <CheckCircle className="w-5 h-5 text-primary" />
                                            )}
                                        </div>
                                    </button>
                                ))}
                                {doctors.length === 0 && (
                                    <p className="text-xs text-center py-4 text-muted-foreground italic">
                                        No doctors available for this service.
                                    </p>
                                )}
                            </div>
                        )}
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
                                    {selectedDoctorData?.displayName || "Loading..."}
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