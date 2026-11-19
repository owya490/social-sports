import "./carousel.css"; // Import animation styles

const imagePaths = [
  "/images/club-logos/10.png",
  "/images/club-logos/11.png",
  "/images/club-logos/12.png",
  "/images/club-logos/13.png",
  "/images/club-logos/14.png",
  "/images/club-logos/15.png",
  "/images/club-logos/16.png",
  "/images/club-logos/23.png",
  "/images/club-logos/17.png",
  "/images/club-logos/18.png",
  "/images/club-logos/19.png",
  // "/images/club-logos/20.png",
  // "/images/club-logos/21.png",
  "/images/club-logos/22.png",
];

const ClubCarousel = () => {
  const allImages = [...imagePaths, ...imagePaths]; // Duplicate for seamless loop

  return (
    <div
      aria-hidden
      className="relative w-full overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]"
    >
      <div className="flex w-max animate-carousel-mobile">
        {[...allImages, ...allImages].map((src, idx) => (
          <div key={idx} className="mx-3 flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-2xl bg-white p-2.5">
            <img src={src} alt="" className="h-full w-full object-contain" />
          </div>
        ))}
      </div>
    </div>
  );
};

export default ClubCarousel;
