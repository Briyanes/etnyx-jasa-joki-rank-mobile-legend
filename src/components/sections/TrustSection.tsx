import { trustItems } from "@/lib/constants";

export default function TrustSection() {
  return (
    <section className="py-20 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-text mb-4">
            Kenapa Pilih <span className="gradient-text">Kami?</span>
          </h2>
        </div>

        {/* Trust Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {trustItems.map((item, index) => (
            <div
              key={index}
              className="bg-surface rounded-2xl p-6 text-center border border-white/5 hover:border-primary/30 transition-all duration-300 hover:-translate-y-1 group"
            >
              {/* Icon */}
              <div className="text-4xl mb-4 transition-transform group-hover:scale-110">
                {item.icon}
              </div>

              {/* Title */}
              <p className="font-bold text-text mb-1">{item.title}</p>

              {/* Description */}
              <p className="text-sm text-text-muted">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
