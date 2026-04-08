export default function Loading() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navbar skeleton */}
      <div className="h-16 bg-surface border-b border-white/5 flex items-center px-4 max-w-7xl mx-auto">
        <div className="w-28 h-8 bg-white/5 rounded animate-pulse" />
        <div className="ml-auto flex gap-3">
          <div className="w-20 h-8 bg-white/5 rounded animate-pulse" />
          <div className="w-20 h-8 bg-white/5 rounded animate-pulse" />
        </div>
      </div>

      {/* Hero skeleton */}
      <div className="max-w-7xl mx-auto px-4 py-20 text-center space-y-6">
        <div className="w-64 h-8 bg-white/5 rounded mx-auto animate-pulse" />
        <div className="w-96 h-6 bg-white/5 rounded mx-auto animate-pulse" />
        <div className="w-48 h-12 bg-white/5 rounded-lg mx-auto animate-pulse" />
      </div>

      {/* Cards skeleton */}
      <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-surface rounded-xl p-6 border border-white/5 space-y-3">
            <div className="w-12 h-12 bg-white/5 rounded-lg animate-pulse" />
            <div className="w-32 h-5 bg-white/5 rounded animate-pulse" />
            <div className="w-full h-4 bg-white/5 rounded animate-pulse" />
            <div className="w-3/4 h-4 bg-white/5 rounded animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}
