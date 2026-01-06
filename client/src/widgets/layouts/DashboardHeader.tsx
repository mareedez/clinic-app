import { useAuth } from "../../features/auth/auth";
import { useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import type {ReactNode} from "react";

interface DashboardHeaderProps {
    title?: string;
    actions?: ReactNode;
}

export default function DashboardHeader({
                                            title,
                                            actions,
                                        }: DashboardHeaderProps) {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate("/");
    };

    const getRoleLabel = (role: string) => {
        const labels: Record<string, string> = {
            patient: "Patient",
            doctor: "Physician",
            front_desk: "Front Desk",
        };
        return labels[role] || role;
    };

    return (
        <header className="sticky top-0 z-50 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
            <div className="max-w-7xl mx-auto px-6 lg:px-8 h-16 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold text-lg">+</span>
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                            ClinicFlow
                        </h1>
                        {title && (
                            <p className="text-xs text-slate-600 dark:text-slate-400">
                                {title}
                            </p>
                        )}
                    </div>
                </div>

                {user && (
                    <div className="flex items-center gap-4">
                        {actions && (
                            <div className="flex items-center gap-2">{actions}</div>
                        )}
                        <div className="text-right hidden sm:block">
                            <p className="text-sm font-medium text-foreground">
                                {user.displayName}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                {getRoleLabel(user.role)}
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={handleLogout}
                            className="p-2 rounded-lg transition-colors text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-400 focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none"
                            aria-label="Logout from account"
                        >
                            <LogOut className="w-5 h-5" />
                        </button>
                    </div>
                )}
            </div>
        </header>
    );
}
