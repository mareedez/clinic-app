import { useContext, useMemo } from "react";
import { AuthContext } from "./AuthContext";

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within AuthProvider");
    }
    return context;
}

export function useRequireAuth(allowedRoles?: string[]) {
    const { user, isAuthenticated, isLoading } = useAuth();
    const isAuthorized = useMemo(() => {
        if (!user) return false;
        if (!allowedRoles) return true;
        return allowedRoles.includes(user.roles);
    }, [user, allowedRoles]);

    return {
        user,
        isAuthenticated,
        isAuthorized,
        isLoading,
    };
}
