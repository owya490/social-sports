const AboutHero = () => {
  return (
    <div className="bg-gray-200">
      <div className="container flex items-center flex-col justify-center p-6 mx-auto sm:py-12 lg:py-24 lg:flex-row lg:justify-between">
        <div className="flex items-center justify-center w-full lg:w-1/2 h-72 sm:h-80 lg:h-96 xl:h-112 2xl:h-128 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl shadow-xl hidden lg:flex">
          <img src="images/volleyball-art.png" alt="volleyball" className="object-cover w-full h-full rounded-xl" />
        </div>
        <div className="flex flex-col justify-center xl:mr-24 p-6 text-left rounded-sm lg:max-w-md xl:max-w-lg lg:text-left mt-10 sm:mt-10 lg:mt-0">
          <h1 className="text-4xl font-bold leading-none sm:text-5xl">
            Simplifying
            <span className="text-primary-700"> Sports Booking</span>
          </h1>

          <p className="mt-6 mb-3 text-lg sm:mb-3">
            We are dedicated to making sports event management easier than ever before. Our platform streamlines the
            entire process, from booking to payments to managing your events seamlessly.
          </p>

          <p className="mb-3 text-lg sm:mb-3 italic font-bold">Making your sports events hassle-free.</p>

          <p className="mb-8 text-lg sm:mb-3">
            We offer a comprehensive suite of services that includes event scheduling, real-time availability updates,
            and easy payment processing. We make event management simpler, so you can focus on what matters most,
            enjoying the game.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AboutHero;
