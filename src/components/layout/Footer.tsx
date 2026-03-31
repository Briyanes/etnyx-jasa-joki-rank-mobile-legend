export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="py-12 px-4 border-t border-white/5">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col items-center gap-6">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center font-bold text-white text-lg">
              E
            </div>
            <span className="font-bold text-xl text-text">
              ETN<span className="text-accent">YX</span>
            </span>
          </div>

          {/* Tagline */}
          <p className="text-text-muted text-sm text-center max-w-md">
            Platform jasa joki Mobile Legends terpercaya. Push rank impianmu
            dengan cepat, aman, dan tanpa ribet.
          </p>

          {/* Copyright */}
          <p className="text-text-muted/60 text-xs">
            © {currentYear} ETNYX. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
