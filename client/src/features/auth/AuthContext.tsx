import React, {
    createContext,
    useState,
    useCallback,
    useEffect,
} from "react";
import type { UserDTO } from "../../../../server/src/application/dto/UserDTO";
import { apiClient } from "../../api/api-client";


function decodeJWT(token: string): Record<string, unknown> | null {
    try {
        const parts = token.split(".");
        if (parts.length !== 3) return null;
        const decoded = JSON.parse(atob(parts[1]));
        return decoded;
    } catch {
        return null;
    }
}

function isTokenExpired(token: string): boolean {
    const decoded = decodeJWT(token);
    if (!decoded || typeof decoded.exp !== "number") return true;
    return decoded.exp * 1000 < Date.now();
}

interface AuthContextType {
    user: UserDTO | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => void;
    setUser: (user: UserDTO | null) => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<UserDTO | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const initAuth = async () => {
            const token = localStorage.getItem("auth_token");
            const storedUser = localStorage.getItem("user_data");

            if (token && storedUser) {
                try {
                    if (isTokenExpired(token)) {
                        localStorage.removeItem("auth_token");
                        localStorage.removeItem("user_data");
                    } else {
                        setUser(JSON.parse(storedUser));
                    }
                } catch {
                    localStorage.removeItem("auth_token");
                    localStorage.removeItem("user_data");
                }
            }
            setIsLoading(false);
        };
        initAuth();
    }, []);

    const login = useCallback(async (email: string, password: string) => {
        setIsLoading(true);
        try {
            const response = await apiClient.post("/auth/login", { email, password });
            const { token, user: userData } = response.data;
            const mappedUser = {
                ...userData,
                roles: userData.role,
            };
            localStorage.setItem("auth_token", token);
            localStorage.setItem("user_data", JSON.stringify(mappedUser));
            setUser(mappedUser);

        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Invalid email or password";
            throw new Error(message);
        } finally {
            setIsLoading(false);
        }
    }, []);


    const logout = useCallback(() => {
        setUser(null);
        localStorage.removeItem("auth_token");
        localStorage.removeItem("user_data");
        window.location.href = "/";
    }, []);

    const value = {
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        setUser,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
