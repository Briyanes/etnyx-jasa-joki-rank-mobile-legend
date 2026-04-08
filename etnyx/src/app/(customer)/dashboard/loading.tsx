export default function Loading() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Header skeleton */}
        <div className="flex items-center justify-between">
          <div className="w-48 h-8 bg-white/5 rounded animate-pulse" />
          <div className="w-24 h-10 bg-white/5 rounded-lg animate-pulse" />
        </div>

        {/* Stats skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-surface rounded-xl p-4 border border-white/5 space-y-2">
              <div className="w-16 h-4 bg-white/5 rounded animate-pulse" />
              <div className="w-10 h-7 bg-white/5 rounded animate-pulse" />
            </div>
          ))}
        </div>

        {/* Tabs skeleton */}
        <div className="flex gap-2 border-b border-white/5 pb-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="w-20 h-8 bg-white/5 rounded-lg animate-pulse" />
          ))}
        </div>

        {/* Order list skeleton */}
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-surface rounded-xl p-4 border border-white/5 flex items-center gap-4">
              <div className="w-10 h-10 bg-white/5 rounded-full animate-pulse shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="w-32 h-4 bg-white/5 rounded animate-pulse" />
                <div className="w-48 h-3 bg-white/5 rounded animate-pulse" />
              </div>
              <div className="w-20 h-6 bg-white/5 rounded animate-pulse shrink-0" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
