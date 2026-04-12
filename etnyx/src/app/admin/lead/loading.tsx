export default function Loading() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-6xl space-y-6">
        <div className="w-48 h-8 bg-white/5 rounded animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-surface rounded-xl p-5 border border-white/5">
              <div className="w-20 h-4 bg-white/5 rounded animate-pulse mb-3" />
              <div className="w-16 h-8 bg-white/5 rounded animate-pulse" />
            </div>
          ))}
        </div>
        <div className="bg-surface rounded-xl p-5 border border-white/5 space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="w-24 h-4 bg-white/5 rounded animate-pulse" />
              <div className="flex-1 h-4 bg-white/5 rounded animate-pulse" />
              <div className="w-16 h-6 bg-white/5 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
