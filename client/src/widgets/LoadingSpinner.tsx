export default function LoadingSpinner() {
    return (
        <div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
            <div className="text-center">
                <div className="w-12 h-12 rounded-full border-4 border-white/10 border-t-cyan-400 animate-spin mx-auto mb-4" />
                <p className="text-muted-foreground">Loading...</p>
            </div>
        </div>
    );
}