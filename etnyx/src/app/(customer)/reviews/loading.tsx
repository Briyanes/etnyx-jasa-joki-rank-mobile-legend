export default function Loading() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-4xl space-y-6">
        <div className="w-48 h-8 bg-white/5 rounded animate-pulse mx-auto" />
        <div className="w-64 h-5 bg-white/5 rounded animate-pulse mx-auto" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-surface rounded-xl p-6 border border-white/5 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/5 animate-pulse" />
                <div className="w-24 h-4 bg-white/5 rounded animate-pulse" />
              </div>
              <div className="w-20 h-4 bg-white/5 rounded animate-pulse" />
              <div className="w-full h-12 bg-white/5 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
