"use client";

import { pricingTiers } from "@/lib/constants";
import { createWhatsAppUrl } from "@/utils/helpers";

export default function PricingSection() {
  const handleOrder = (tierName: string, price: string) => {
    const packageDetails = `${tierName} - Rp ${price}`;
    window.open(createWhatsAppUrl(packageDetails), "_blank", "noopener,noreferrer");
  };

  return (
    <section id="pricing" className="py-20 px-4 bg-surface/30">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-text mb-4">
            Pilih <span className="gradient-text">Paket</span>
          </h2>
          <p className="text-text-muted text-lg">
            Paket joki yang sesuai kebutuhanmu
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
          {pricingTiers.map((tier) => (
            <div
              key={tier.id}
              className={`bg-surface rounded-3xl p-6 lg:p-8 border transition-all duration-300 hover:-translate-y-1 relative ${
                tier.highlighted
                  ? "border-primary glow-primary scale-105 md:scale-110"
                  : "border-white/5 hover:border-white/10"
              }`}
            >
              {/* Badge */}
              {tier.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 gradient-primary px-4 py-1.5 rounded-full text-xs font-bold text-white whitespace-nowrap">
                  {tier.badge}
                </div>
              )}

              {/* Tier Info */}
              <div className={`mb-6 ${tier.badge ? "pt-2" : ""}`}>
                <h3 className="text-xl font-bold text-text mb-2">
                  {tier.name}
                </h3>
                <p className="text-text-muted text-sm">{tier.description}</p>
              </div>

              {/* Price */}
              <div className="mb-6">
                <span
                  className={`text-4xl font-extrabold ${
                    tier.highlighted ? "gradient-text" : "text-text"
                  }`}
                >
                  Rp {tier.price}
                </span>
                <span className="text-text-muted">{tier.priceUnit}</span>
              </div>

              {/* Features */}
              <ul className="space-y-3 mb-8">
                {tier.features.map((feature, index) => (
                  <li
                    key={index}
                    className="flex items-center gap-3 text-sm text-text"
                  >
                    <span className="text-success flex-shrink-0">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>

              {/* CTA Button */}
              <button
                onClick={() => handleOrder(tier.name, tier.price)}
                className={`w-full py-3.5 rounded-xl font-semibold transition-all duration-200 ${
                  tier.highlighted
                    ? "gradient-primary text-white hover:opacity-90"
                    : "border border-primary text-primary hover:bg-primary hover:text-white"
                }`}
              >
                Pilih {tier.name}
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
