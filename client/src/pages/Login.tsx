import {useEffect, useState} from "react";
import { useNavigate } from "react-router-dom";
import { Sun, Moon } from "lucide-react";
import { useAuth } from "../features/auth/auth"
import { useTheme }  from "../shared/theme";
import DemoAccounts from "../features/auth/DemoAccounts";
import LoginHeader from "../features/auth/LoginHeader";
import LoginForm from "../features/auth/LoginForm";
import {toast} from "sonner";


export function Login() {
    const navigate = useNavigate();
    const { login, user } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async (email: string, password: string) => {
        setIsLoading(true);
        try {
            await login(email, password);
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Login failed";
            toast.error(message);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (user) {
            switch (user.role.toUpperCase()) {
                case "PATIENT": navigate("/patient"); break;
                case "PHYSICIAN": navigate("/physician"); break;
                case "FRONT_DESK": navigate("/front-desk"); break;
                default: navigate("/");
            }
        }
    }, [user, navigate]);


    return (
        <div className="min-h-screen bg-background relative overflow-hidden">
            <div className="flex flex-col items-center justify-center min-h-screen px-4 relative z-10 max-w-7xl mx-auto w-full">
                <button
                    onClick={toggleTheme}
                    className="absolute top-6 right-6 p-2.5 rounded-lg transition-all duration-200 text-muted-foreground hover:text-foreground hover:bg-white/10 dark:hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                    title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
                    aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
                >
                    {theme === "dark" ? (
                        <Sun className="w-5 h-5" />
                    ) : (
                        <Moon className="w-5 h-5" />
                    )}
                </button>

                <div className="w-full max-w-md">
                    <div className="glass-lg rounded-2xl p-8 border border-white/10">
                        <LoginHeader />
                        <div className="space-y-6">
                            <LoginForm onSubmit={handleLogin} isLoading={isLoading} />
                            <DemoAccounts onDemoLogin={handleLogin} />
                        </div>
                    </div>
                    <p className="text-center text-xs text-muted-foreground mt-8">
                        © 2026 All rights reserved.
                    </p>
                </div>
            </div>
        </div>
    );
}
