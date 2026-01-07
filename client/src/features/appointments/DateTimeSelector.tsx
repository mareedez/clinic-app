import DatePickerInline from "../../widgets/calendar/DatePickerInline";
import { formatClinicTime24Hour } from "../../shared/lib/time-utils";
import { CLINIC_CONFIG } from "../../config/clinicConfig";
import type { TimeSlotDTO } from "../../../../server/src/application/dto/TimeSlotDTO";

interface DateTimeSelectorProps {
    selectedDate: string;
    selectedTime: string;
    isExpanded?: boolean;
    timeSlots: TimeSlotDTO[];
    isLoading?: boolean;
    onDateSelect: (date: string) => void;
    onTimeSelect: (time: string) => void;
    onExpand?: () => void;
    getMinDate: () => string;
    getMaxDate: () => string;
}

export function DateTimeSelector({
         selectedDate,
         selectedTime,
         timeSlots,
         onDateSelect,
         onTimeSelect,
         getMinDate,
         getMaxDate,
     }: DateTimeSelectorProps) {

    return (
        <div className="space-y-4">
            <DatePickerInline
                value={selectedDate}
                onChange={(date) => {
                    onDateSelect(date);
                    onTimeSelect("");
                }}
                minDate={getMinDate()}
                maxDate={getMaxDate()}
            />

            {selectedDate && (
                <div className="glass-lg rounded-2xl p-4 animate-in fade-in slide-in-from-left-4">
                    <label className="block text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">
                        Available Times
                    </label>
                    {timeSlots.length > 0 ? (
                        <div
                            className="grid grid-cols-3 gap-1.5 max-h-64 overflow-y-auto p-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                            {timeSlots.map((slot) => {
                                const date = new Date(slot.startTime);
                                const timeStr = formatClinicTime24Hour(date, CLINIC_CONFIG.timezone.utcOffsetHours);
                                const isSelected = selectedTime === timeStr;
                                const isAvailable = slot.isAvailable;

                                return (
                                    <button
                                        key={slot.startTime}
                                        type="button"
                                        disabled={!isAvailable}
                                        onClick={() => onTimeSelect(timeStr)}
                                        className={`p-2 text-sm rounded-lg border transition-all ${
                                            isSelected
                                                ? "bg-primary text-primary-foreground border-primary shadow-sm"
                                                : isAvailable
                                                    ? "hover:border-primary/50 border-border bg-white dark:bg-slate-800"
                                                    : "opacity-30 cursor-not-allowed bg-muted border-transparent grayscale"
                                        }`}
                                        title={isAvailable ? "Click to select" : "Time slot already booked"}
                                    >
                                        {timeStr}
                                    </button>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="p-4 bg-amber-500/10 border border-amber-400/40 rounded-lg">
                            <p className="text-sm text-amber-300">
                                No slots found for this day.
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

DateTimeSelector.displayName = "DateTimeSelector";
