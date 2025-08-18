export default function EventCreateSection() {
  return (
    <>
      {/* Event Create Section */}
      <div className="w-screen flex justify-center pt-24 bg-white relative overflow-hidden">
        <div className="screen-width-dashboard px-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-black text-white px-4 py-1 text-xs font-medium mb-6 rounded-full">
              <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
              ADVANCED EVENT CREATION
            </div>
            <h3 className="text-4xl md:text-5xl font-bold text-black mb-6 leading-tight">
              Flexible{" "}
              <span className="relative">
                event creation
                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-black"></div>
              </span>
            </h3>
            <p className="text-xl text-black font-thin mb-8 leading-relaxed">
              Set time, location, capacity, pricing, form fields and more — everything in one simple builder. Make your
              events pop with our powerful event creation.
            </p>
            <div className="flex items-center gap-6 text-gray-600 text-sm z-40">
              <span className="flex items-center gap-2">
                <div className="w-1 h-1 bg-black rounded-full"></div>
                Recurring Events
              </span>
              <span className="flex items-center gap-2">
                <div className="w-1 h-1 bg-black rounded-full"></div>
                Pricing & Capacity
              </span>
              <span className="flex items-center gap-2">
                <div className="w-1 h-1 bg-black rounded-full"></div>
                Custom Form Fields
              </span>
            </div>
          </div>
        </div>
      </div>
      <div className="overflow-hidden flex justify-center z-20 w-full mt-8 md:mt-0">
        <div className="screen-width-dashboard">
          <div
            className="-translate-y-12 md:-translate-y-16 lg:-translate-y-28"
            style={{ perspective: "1500px", transformStyle: "preserve-3d" }}
          >
            <div className="flex justify-center" style={{ transform: "rotateX(50deg)" }}>
              <div
                style={{
                  imageRendering: "auto",
                  width: "100%",
                  position: "relative",
                  inset: "0",
                  borderTopLeftRadius: "20px",
                  borderTopRightRadius: "20px",
                  borderTop: "1px solid lightgray",
                  borderLeft: "1px solid lightgray",
                  borderRight: "1px solid lightgray",
                  paddingTop: "20px",
                  background: "transparent",
                  margin: "0px auto auto",
                  transformStyle: "preserve-3d",
                  overflow: "visible",
                  willChange: "transform",
                }}
              >
                <img
                  src="/images/mocks/event-create-mock-4.png"
                  alt="Event creation interface"
                  style={{
                    objectFit: "cover",
                    borderRadius: "20px",
                    display: "block",
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
