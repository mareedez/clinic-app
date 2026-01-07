import { useState, useCallback, useEffect } from "react";
import { apiClient } from "../../api/api-client";
import type { AppointmentDTO } from "../../../../server/src/application/dto/AppointmentDTO.js";

export function useAppointments() {
    const [allAppointments, setAllAppointments] = useState<AppointmentDTO[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchAppointments = useCallback(async (params?: Record<string, unknown>) => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await apiClient.get<AppointmentDTO[]>("appointments", { params });
            setAllAppointments(response.data);
        } catch (err: any) {
            const message = err.response?.data?.message || "Failed to load appointments";
            setError(message);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAppointments();
    }, [fetchAppointments]);

    const cancelAppointment = async (id: string, reason: string, expectedUpdatedAt?: string) => {

        await apiClient.post(`appointments/${id}/cancel`, { 
            reason,
            expectedUpdatedAt
        });
        await fetchAppointments();
    };

    const checkIn = async (id: string, expectedUpdatedAt?: string) => {

        await apiClient.post(`appointments/${id}/check-in`, { expectedUpdatedAt });
        await fetchAppointments();
    };

    return {
        allAppointments,
        isLoading,
        error,
        refresh: fetchAppointments,
        cancelAppointment,
        checkIn
    };
}
