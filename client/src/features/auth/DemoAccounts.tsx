interface DemoAccountsProps {
    onDemoLogin: (email: string, password: string) => Promise<void>;
}

const DEMO_CREDENTIALS = [
    {
        role: "Patient",
        email: "demo.patient@clinic.local",
        password: "Demo@12345",
    },
    {
        role: "Doctor",
        email: "demo.doctor@clinic.local",
        password: "Demo@12345",
    },
    {
        role: "Front Desk",
        email: "demo.desk@clinic.local",
        password: "Demo@12345",
    },
];

export default function DemoAccounts({ onDemoLogin }: DemoAccountsProps) {
    // Demo accounts are always available for testing

    const handleDemoClick = async (email: string, password: string) => {
        try {
            await onDemoLogin(email, password);
        } catch {
            // Error handling is done in parent component
        }
    };

    return (
        <div className="space-y-4">
            {/* Divider */}
            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border/50"></div>
                </div>
                <div className="relative flex justify-center">
          <span className="px-3 text-xs uppercase font-semibold text-muted-foreground bg-white dark:bg-background/50 dark:backdrop-blur-sm">
            Or try demo accounts
          </span>
                </div>
            </div>

            {/* Demo Login Buttons */}
            <div className="space-y-3">
                {DEMO_CREDENTIALS.map((cred) => (
                    <button
                        key={cred.email}
                        type="button"
                        onClick={() => handleDemoClick(cred.email, cred.password)}
                        className="w-full glass-md rounded-xl px-4 py-3 text-sm font-medium text-foreground transition-all duration-200 hover:bg-white/10 dark:hover:bg-white/5 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                    >
                        Login as {cred.role}
                    </button>
                ))}
            </div>
        </div>
    );
}
