import { memo, useEffect, useState } from "react";
import { CheckCircle, Loader2 } from "lucide-react";
import { apiClient } from "../../api/api-client";
import type { ServiceDTO } from "../../shared/types/ServiceDTO";

interface ServiceSelectorProps {
    selectedService: string;
    isExpanded: boolean;
    onSelect: (serviceId: string) => void;
    onExpand: () => void;
}

export const ServiceSelector = memo(
    ({
         selectedService,
         isExpanded,
         onSelect,
         onExpand,
     }: ServiceSelectorProps) => {
        const [services, setServices] = useState<ServiceDTO[]>([]);
        const [isLoading, setIsLoading] = useState(false);

        useEffect(() => {
            const fetchServices = async () => {
                setIsLoading(true);
                try {
                    const response = await apiClient.get<ServiceDTO[]>("appointments/services");
                    setServices(response.data);
                } catch (error) {
                    console.error("Failed to fetch services", error);
                } finally {
                    setIsLoading(false);
                }
            };

            if (isExpanded || (selectedService && services.length === 0)) {
                fetchServices();
            }
        }, [isExpanded, selectedService, services.length]);

        const selectedServiceData = services.find((s) => s.id === selectedService);

        return (
            <div className="glass-lg rounded-2xl p-4 no-hover-bg">
                {isExpanded ? (
                    <>
                        <label className="block text-sm font-semibold text-foreground mb-3">
                            Select Service
                        </label>
                        {isLoading ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {services.map((service) => (
                                    <button
                                        key={service.id}
                                        type="button"
                                        onClick={() => onSelect(service.id)}
                                        className={`p-3 rounded-lg border-2 transition-all text-left no-hover-bg ${
                                            selectedService === service.id
                                                ? "glass border-primary bg-primary/5"
                                                : "glass border-border hover:border-primary/50"
                                        }`}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <p className="font-semibold text-foreground text-sm">
                                                    {service.name}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {service.durationMinutes} min • ${service.price}
                                                </p>
                                            </div>
                                            {selectedService === service.id && (
                                                <CheckCircle className="w-5 h-5 text-primary" />
                                            )}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </>
                ) : selectedService ? (
                    <button
                        type="button"
                        onClick={onExpand}
                        className="w-full p-2 rounded-lg text-left hover:bg-white/5 dark:hover:bg-white/10 transition-all"
                    >
                        <div>
                            <p className="text-xs text-muted-foreground">Service</p>
                            <p className="font-semibold text-foreground text-sm">
                                {selectedServiceData?.name || "Loading..."}
                            </p>
                        </div>
                    </button>
                ) : (
                    <button
                        type="button"
                        onClick={onExpand}
                        className="w-full p-3 rounded-lg border-2 glass border-border hover:border-primary/50 text-left"
                    >
                        <p className="text-sm text-muted-foreground">
                            Click to select service...
                        </p>
                    </button>
                )}
            </div>
        );
    },
);

ServiceSelector.displayName = "ServiceSelector";