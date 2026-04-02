import { howItWorksSteps } from "@/lib/constants";

export default function HowItWorksSection() {
  return (
    <section className="py-20 px-4 bg-surface/30">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-text mb-4">
            Cara <span className="gradient-text">Order</span>
          </h2>
          <p className="text-text-muted text-lg">
            Proses mudah dalam 4 langkah
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {howItWorksSteps.map((item, index) => (
            <div
              key={index}
              className="bg-surface rounded-2xl p-6 text-center border border-white/5 hover:border-accent/30 transition-colors group"
            >
              {/* Icon */}
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl transition-transform group-hover:scale-110 ${
                  index === howItWorksSteps.length - 1
                    ? "bg-accent/20"
                    : "bg-primary/20"
                }`}
              >
                {item.icon}
              </div>

              {/* Step Number */}
              <div
                className={`text-xs font-semibold mb-2 ${
                  index === howItWorksSteps.length - 1
                    ? "text-accent"
                    : "text-primary"
                }`}
              >
                STEP {item.step}
              </div>

              {/* Title */}
              <p className="font-semibold text-text text-sm">{item.title}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
