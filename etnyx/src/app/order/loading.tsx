export default function Loading() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="w-48 h-8 bg-white/5 rounded animate-pulse mx-auto" />
        
        {/* Mode tabs skeleton */}
        <div className="flex gap-2 justify-center">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="w-28 h-10 bg-white/5 rounded-lg animate-pulse" />
          ))}
        </div>

        {/* Rank selectors skeleton */}
        <div className="bg-surface rounded-xl p-6 border border-white/5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="w-20 h-4 bg-white/5 rounded animate-pulse" />
              <div className="w-full h-12 bg-white/5 rounded-lg animate-pulse" />
            </div>
            <div className="space-y-2">
              <div className="w-20 h-4 bg-white/5 rounded animate-pulse" />
              <div className="w-full h-12 bg-white/5 rounded-lg animate-pulse" />
            </div>
          </div>
          <div className="w-full h-12 bg-white/5 rounded-lg animate-pulse" />
          <div className="w-full h-14 bg-white/5 rounded-lg animate-pulse" />
        </div>
      </div>
    </div>
  );
}
