import { useState } from "react";
import { X, UserPlus, Mail, Phone, Calendar as CalendarIcon } from "lucide-react";
import { toast } from "sonner";
import { apiClient } from "../../api/api-client";

interface AddPatientModalProps {
    onClose: () => void;
    onSuccess: (patientId: string) => void;
}

export default function AddPatientModal({ onClose, onSuccess }: AddPatientModalProps) {
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        dateOfBirth: ""
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const response = await apiClient.post("/auth/register-patient", formData);
            toast.success("Patient registered successfully!");
            onSuccess(response.data.id);
            onClose();
        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : "Registration failed. Email might be in use.";
            toast.error(msg);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[32px] border border-border shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                {/* Header */}
                <div className="p-6 border-b border-border flex items-center justify-between bg-slate-50/50 dark:bg-white/5">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-xl">
                            <UserPlus className="w-5 h-5 text-primary" />
                        </div>
                        <h3 className="text-lg font-black text-foreground uppercase tracking-tight">New Patient</h3>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-8 space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">First Name</label>
                            <input 
                                required
                                className="w-full px-4 py-3 rounded-2xl border border-border bg-background focus:ring-2 focus:ring-primary outline-none text-sm transition-all"
                                value={formData.firstName}
                                onChange={e => setFormData({...formData, firstName: e.target.value})}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Last Name</label>
                            <input 
                                required
                                className="w-full px-4 py-3 rounded-2xl border border-border bg-background focus:ring-2 focus:ring-primary outline-none text-sm transition-all"
                                value={formData.lastName}
                                onChange={e => setFormData({...formData, lastName: e.target.value})}
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Email Address</label>
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input 
                                type="email"
                                required
                                className="w-full pl-11 pr-4 py-3 rounded-2xl border border-border bg-background focus:ring-2 focus:ring-primary outline-none text-sm transition-all"
                                value={formData.email}
                                onChange={e => setFormData({...formData, email: e.target.value})}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Phone</label>
                            <div className="relative">
                                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <input 
                                    className="w-full pl-11 pr-4 py-3 rounded-2xl border border-border bg-background focus:ring-2 focus:ring-primary outline-none text-sm transition-all"
                                    value={formData.phone}
                                    onChange={e => setFormData({...formData, phone: e.target.value})}
                                />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Date of Birth</label>
                            <div className="relative">
                                <CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <input 
                                    type="date"
                                    className="w-full pl-11 pr-4 py-3 rounded-2xl border border-border bg-background focus:ring-2 focus:ring-primary outline-none text-sm transition-all"
                                    value={formData.dateOfBirth}
                                    onChange={e => setFormData({...formData, dateOfBirth: e.target.value})}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 flex gap-3">
                        <button type="button" onClick={onClose} className="flex-1 py-3 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors">
                            Cancel
                        </button>
                        <button 
                            type="submit" 
                            disabled={isSubmitting}
                            className="flex-1 bg-primary text-white py-3 rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                        >
                            {isSubmitting ? "Creating..." : "Create Patient"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
