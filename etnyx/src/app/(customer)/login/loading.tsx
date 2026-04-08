export default function Loading() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-surface rounded-xl p-8 border border-white/5 space-y-6">
        <div className="w-28 h-8 bg-white/5 rounded animate-pulse mx-auto" />
        <div className="w-40 h-6 bg-white/5 rounded animate-pulse mx-auto" />
        <div className="space-y-4">
          <div className="w-full h-12 bg-white/5 rounded-lg animate-pulse" />
          <div className="w-full h-12 bg-white/5 rounded-lg animate-pulse" />
          <div className="w-full h-12 bg-white/5 rounded-lg animate-pulse" />
        </div>
      </div>
    </div>
  );
}
