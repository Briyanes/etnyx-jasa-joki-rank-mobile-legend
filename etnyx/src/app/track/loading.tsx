export default function Loading() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <div className="w-40 h-8 bg-white/5 rounded animate-pulse mx-auto" />
        
        {/* Search skeleton */}
        <div className="w-full h-12 bg-white/5 rounded-lg animate-pulse" />
        
        {/* Result skeleton */}
        <div className="bg-surface rounded-xl p-6 border border-white/5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/5 rounded-full animate-pulse" />
            <div className="space-y-2 flex-1">
              <div className="w-32 h-5 bg-white/5 rounded animate-pulse" />
              <div className="w-48 h-4 bg-white/5 rounded animate-pulse" />
            </div>
          </div>
          <div className="w-full h-3 bg-white/5 rounded-full animate-pulse" />
          <div className="grid grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-1">
                <div className="w-16 h-3 bg-white/5 rounded animate-pulse" />
                <div className="w-24 h-4 bg-white/5 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
