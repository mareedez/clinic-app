import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface DatePickerInlineProps {
    value: string;
    onChange: (date: string) => void;
    minDate: string;
    maxDate: string;
}

export default function DatePickerInline({
                                             value,
                                             onChange,
                                             minDate,
                                             maxDate,
                                         }: DatePickerInlineProps) {
    const [currentMonth, setCurrentMonth] = useState(() => {
        if (value) {
            const [year, month, day] = value.split("-").map(Number);
            return new Date(year, month - 1, day);
        }
        return new Date();
    });

    const getDaysInMonth = (date: Date) => {
        return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (date: Date) => {
        return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    };

    const monthName = currentMonth.toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
    });

    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);
    const days: (number | null)[] = [];

    for (let i = 0; i < firstDay; i++) {
        days.push(null);
    }

    for (let i = 1; i <= daysInMonth; i++) {
        days.push(i);
    }

    const handleDayClick = (day: number) => {
        const date = new Date(
            currentMonth.getFullYear(),
            currentMonth.getMonth(),
            day,
        );
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const dayStr = String(day).padStart(2, "0");
        const dateString = `${year}-${month}-${dayStr}`;
        onChange(dateString);
    };

    const handlePrevMonth = () => {
        setCurrentMonth(
            new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1),
        );
    };

    const handleNextMonth = () => {
        setCurrentMonth(
            new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1),
        );
    };

    const isDateDisabled = (day: number) => {
        const year = currentMonth.getFullYear();
        const month = String(currentMonth.getMonth() + 1).padStart(2, "0");
        const dayStr = String(day).padStart(2, "0");
        const dateString = `${year}-${month}-${dayStr}`;
        return dateString < minDate || dateString > maxDate;
    };

    const isDateSelected = (day: number) => {
        if (!value) return false;
        const year = currentMonth.getFullYear();
        const month = String(currentMonth.getMonth() + 1).padStart(2, "0");
        const dayStr = String(day).padStart(2, "0");
        const dateString = `${year}-${month}-${dayStr}`;
        return dateString === value;
    };

    return (
        <div className="glass-lg rounded-2xl p-4 animate-in fade-in slide-in-from-left-4">
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-foreground text-sm">{monthName}</h3>
                    <div className="flex gap-1">
                        <button
                            onClick={handlePrevMonth}
                            className="p-1.5 rounded-lg hover:bg-white/5 dark:hover:bg-white/10 transition-colors text-muted-foreground hover:text-foreground"
                            aria-label="Previous month"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                            onClick={handleNextMonth}
                            className="p-1.5 rounded-lg hover:bg-white/5 dark:hover:bg-white/10 transition-colors text-muted-foreground hover:text-foreground"
                            aria-label="Next month"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-7 gap-1">
                    {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((dayName) => (
                        <div
                            key={dayName}
                            className="text-center text-xs font-semibold text-muted-foreground py-1"
                        >
                            {dayName}
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-7 gap-1 min-h-[240px]">
                    {days.map((day, idx) => {
                        if (day === null) {
                            return <div key={`empty-${idx}`} />;
                        }

                        const disabled = isDateDisabled(day);
                        const selected = isDateSelected(day);

                        if (disabled) {
                            return (
                                <div
                                    key={`day-${day}-${idx}`}
                                    className="aspect-square rounded-lg text-xs font-medium flex items-center justify-center text-muted-foreground bg-slate-100 dark:bg-slate-800 cursor-not-allowed"
                                >
                                    {day}
                                </div>
                            );
                        }

                        return (
                            <button
                                key={`day-${day}-${idx}`}
                                onClick={() => handleDayClick(day)}
                                type="button"
                                className={`
                  aspect-square rounded-lg text-xs font-medium transition-all
                  flex items-center justify-center outline-none
                  ${
                                    selected
                                        ? "bg-primary text-primary-foreground font-semibold hover:bg-primary/90"
                                        : "text-foreground hover:bg-white/10 dark:hover:bg-white/5"
                                }
                `}
                            >
                                {day}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
