import "./carousel.css"; // Import animation styles

const imagePaths = [
  "/images/club-logos/10.png",
  "/images/club-logos/11.png",
  "/images/club-logos/12.png",
  "/images/club-logos/13.png",
  "/images/club-logos/14.png",
  "/images/club-logos/15.png",
  "/images/club-logos/16.png",
  "/images/club-logos/17.png",
  "/images/club-logos/18.png",
  "/images/club-logos/19.png",
  "/images/club-logos/20.png",
  "/images/club-logos/21.png",
  "/images/club-logos/22.png",
];

const InfiniteCarousel = () => {
  const allImages = [...imagePaths, ...imagePaths]; // Duplicate for seamless loop

  return (
    <div className="relative overflow-hidden w-full bg-white">
      <div className="flex animate-carousel whitespace-nowrap">
        {allImages.map((src, idx) => (
          <div key={idx} className="flex items-center justify-center w-20 h-20 opacity-80 mx-12 flex-shrink-0">
            <img src={src} alt={`Club Logo ${idx}`} className="w-full h-full object-contain" />
          </div>
        ))}
      </div>
      {/* Left fade */}
      <div className="hidden md:block absolute top-0 left-0 w-32 h-full bg-gradient-to-r from-white to-transparent pointer-events-none z-10"></div>
      {/* Right fade */}
      <div className="hidden md:block absolute top-0 right-0 w-32 h-full bg-gradient-to-l from-white to-transparent pointer-events-none z-10"></div>
    </div>
  );
};

export default InfiniteCarousel;
