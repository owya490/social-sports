"use client";

export default function PaymentsSection() {
  return (
    <>
      {/* Payments Section */}
      <div className="w-screen flex justify-center pt-24 bg-white relative overflow-hidden">
        <div className="screen-width-dashboard px-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-black text-white px-4 py-1 text-xs font-medium mb-6 rounded-full">
              <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
              INSTANT PAYMENTS
            </div>
            <h3 className="text-4xl md:text-5xl font-bold text-black mb-6 leading-tight">
              Get paid in{" "}
              <span className="relative">
                seconds
                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-black"></div>
              </span>
              , not weeks
            </h3>
            <p className="text-xl text-black font-thin mb-8 leading-relaxed">
              Stripe-powered payments that process instantly. No waiting, no chasing payments. Just seamless
              transactions that keep your events running smooth.
            </p>
            <div className="flex items-center gap-6 text-gray-600 text-sm z-40">
              <span className="flex items-center gap-2">
                <div className="w-1 h-1 bg-black rounded-full"></div>
                Paid to your bank daily
              </span>
              <span className="flex items-center gap-2">
                <div className="w-1 h-1 bg-black rounded-full"></div>
                No missed payments
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-hidden justify-center pb-16 block md:hidden">
        <div
          style={{
            width: "600px",
            position: "relative",
            inset: "0",
            borderRadius: "10px",
            background: "transparent",
            margin: "0px auto auto",
            transform: "scale(1) rotateX(40deg) rotateY(20deg) rotate(335deg)",
            overflow: "visible",
          }}
        >
          <img
            src="/images/mocks/stripe-checkout-mock.png"
            alt="Stripe checkout interface"
            style={{
              objectFit: "cover",
              borderRadius: "10px",
              display: "block",
            }}
          />
        </div>
      </div>
      <div className="overflow-hidden justify-center pb-8 translate-x-8 hidden md:block">
        <div
          style={{
            width: "1200px",
            position: "relative",
            inset: "0",
            borderRadius: "10px",
            background: "transparent",
            margin: "0px auto auto",
            transform: "scale(1) rotateX(40deg) rotateY(20deg) rotate(335deg)",
            overflow: "visible",
          }}
        >
          <img
            src="/images/mocks/stripe-checkout-mock.png"
            alt="Stripe checkout interface"
            style={{
              objectFit: "cover",
              borderRadius: "10px",
              display: "block",
            }}
          />
        </div>
      </div>
    </>
  );
}
