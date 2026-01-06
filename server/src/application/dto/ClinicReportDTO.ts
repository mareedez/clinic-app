export interface ClinicReportDTO {
    summary: {
        totalAppointments: number;
        noShow: number;
        completed: number;
        revenue: number;
    };
    physicianPerformance: {
        name: string;
        completed: number;
        noShow: number;
    }[];
    serviceBreakdown: {
        type: string;
        count: number;
    }[];
}