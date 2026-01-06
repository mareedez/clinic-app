import { useState } from "react";
import { AlertCircle, Loader2 } from "lucide-react";
import { loginSchema } from "../../shared/lib/validation";

interface LoginFormProps {
    onSubmit: (email: string, password: string) => Promise<void>;
    isLoading?: boolean;
}

export default function LoginForm({
                                      onSubmit,
                                      isLoading = false,
                                  }: LoginFormProps) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [localLoading, setLocalLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        const validation = loginSchema.safeParse({ email, password });
        if (!validation.success) {
            const firstError = validation.error;
            setError(firstError.message);
            return;
        }

        setLocalLoading(true);

        try {
            await onSubmit(validation.data.email, validation.data.password);
        } catch {
            setError("Invalid email or password");
        } finally {
            setLocalLoading(false);
        }
    };

    const isSubmitting = isLoading || localLoading;

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
                <div
                    className="p-4 bg-destructive/10 border border-destructive/30 rounded-lg flex items-start gap-3"
                    role="alert"
                    aria-live="assertive"
                >
                    <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                    <p className="text-sm text-destructive">{error}</p>
                </div>
            )}

            {/* Email Field */}
            <div>
                <label
                    htmlFor="login-email"
                    className="block text-sm font-semibold text-foreground mb-2"
                >
                    Email Address
                </label>
                <input
                    id="login-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your.email@example.com"
                    className="input-field"
                    required
                    disabled={isSubmitting}
                />
            </div>

            {/* Password Field */}
            <div>
                <label
                    htmlFor="login-password"
                    className="block text-sm font-semibold text-foreground mb-2"
                >
                    Password
                </label>
                <input
                    id="login-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="input-field"
                    required
                    disabled={isSubmitting}
                />
            </div>

            {/* Submit Button */}
            <button
                type="submit"
                disabled={isSubmitting}
                className="w-full btn-primary mt-6"
            >
                {isSubmitting ? (
                    <span className="flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Signing in...
          </span>
                ) : (
                    "Sign In"
                )}
            </button>
        </form>
    );
}
