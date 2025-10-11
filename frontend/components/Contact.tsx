const ContactUs = () => {
  return (
    <div className="w-screen flex items-center justify-center md:pt-0 pt-6 md:pb-0 pb-6">
      <div className="space-y-6">
        <h1 className="text-4xl font-bold md:mt-0">Get in touch</h1>
        <p className="pt-4 pb-8">Fill in the form to start a conversation</p>
        <div className="flex items-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="w-5 h-5 mr-2 sm:mr-6"
          >
            <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"></path>
            <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"></path>
          </svg>
          <span>info@sportshub.net.au</span>
        </div>

        <div className="flex items-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="w-5 h-5 mr-2 sm:mr-6"
          >
            <path
              fillRule="evenodd"
              d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
              clipRule="evenodd"
            ></path>
          </svg>
          <span>Sydney, NSW</span>
        </div>
      </div>
    </div>
  );
};

export default ContactUs;
