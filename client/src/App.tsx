import { Toaster } from "./shared/ui/sonner";
import { TooltipProvider } from "./shared/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./features/auth/auth";
import {ThemeProvider} from "./shared/theme";
import LoadingSpinner from "./widgets/LoadingSpinner";


import {Login} from "./pages/Login";
import {PatientPage} from "./pages/PatientPage";
import {NewAppointment} from "./pages/NewAppointment";
import {PhysicianPage} from "./pages/PhysicianPage";
import {FrontDeskPage} from "./pages/FrontDeskPage";
import {NotFoundPage} from "./pages/NotFoundPage";

const queryClient = new QueryClient();

function DashboardRouter() {
    const { user, isLoading } = useAuth();

    if (isLoading) {
        return <LoadingSpinner />;
    }

    if (!user) {
        return <Navigate to="/" replace />;
    }

    switch (user.role) {
        case "PATIENT":
            return <PatientPage />;
        case "PHYSICIAN":
            return <PhysicianPage />;
        case "FRONT_DESK":
            return <FrontDeskPage />;
        default:
            return <Navigate to="/" replace />;
    }
}

function AppRoutes() {
    return (
        <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/dashboard" element={<DashboardRouter />} />
            <Route path="/patient" element={<PatientPage />} />
            <Route path="/patient/new_appointment" element={<NewAppointment />} />
            <Route path="/physician" element={<PhysicianPage />} />
            <Route path="/front-desk" element={<FrontDeskPage />} />
            {/* Catch all */}
            <Route path="*" element={<NotFoundPage />} />
        </Routes>
    );
}

export default function App() {
    return (
        <ThemeProvider>
            <QueryClientProvider client={queryClient}>
                <TooltipProvider>
                    <Toaster />
                    <BrowserRouter>
                        <AuthProvider>
                            <AppRoutes />
                        </AuthProvider>
                    </BrowserRouter>
                </TooltipProvider>
            </QueryClientProvider>
        </ThemeProvider>
    );
}