import { AppointmentStatus } from "../enums";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export const getAppointmentStatusStyles = (status: AppointmentStatus): string => {
    const styles: Record<string, string> = {
        SCHEDULED: "border-blue-500/30 bg-blue-500/5 text-blue-600 dark:text-blue-400",
        WAITING: "border-amber-500/30 bg-amber-500/5 text-amber-600 dark:text-amber-400",
        CHECKED_IN: "border-amber-500/30 bg-amber-500/5 text-amber-600 dark:text-amber-400",
        IN_PROGRESS: "border-primary/30 bg-primary/5 text-primary",
        COMPLETED: "border-green-500/30 bg-green-500/5 text-green-600 dark:text-green-400",
        CANCELLED: "border-red-500/30 bg-red-500/5 text-red-600 dark:text-red-400",
        NO_SHOW: "border-slate-500/30 bg-slate-500/5 text-slate-600 dark:text-slate-400",
    };

    return cn(
        "px-2 py-0.5 rounded-full border text-[10px] uppercase tracking-wider transition-colors inline-block whitespace-nowrap",
        styles[status] || "border-border bg-muted/5 text-muted-foreground"
    );
};
