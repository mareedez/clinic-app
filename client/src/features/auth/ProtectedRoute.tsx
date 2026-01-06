import { Navigate } from "react-router-dom";
import { useAuth } from "./auth";

interface ProtectedRouteProps {
    children: React.ReactNode;
    allowedRoles?: string[];
}

export default function ProtectedRoute({
                                           children,
                                           allowedRoles,
                                       }: ProtectedRouteProps) {
    const { user, isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 rounded-full border-4 border-muted border-t-primary animate-spin mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading...</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/" replace />;
    }

    const userRole = (user?.roles || "").toUpperCase();
    const allowed = allowedRoles?.map(r => r.toUpperCase()) || [];

    if (allowedRoles && user && !allowed.includes(userRole)) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-foreground mb-2">
                        Access Denied
                    </h1>
                    <p className="text-muted-foreground mb-6">
                        You don't have permission to access this page.
                    </p>
                    <a href="/" className="btn-primary inline-flex">
                        Go Back
                    </a>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}