export default function Loading() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-3xl space-y-6">
        <div className="w-40 h-8 bg-white/5 rounded animate-pulse mx-auto" />
        <div className="w-72 h-5 bg-white/5 rounded animate-pulse mx-auto" />
        <div className="space-y-4 mt-8">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-surface rounded-xl p-5 border border-white/5">
              <div className="w-3/4 h-5 bg-white/5 rounded animate-pulse" />
              <div className="w-full h-3 bg-white/5 rounded animate-pulse mt-3" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
