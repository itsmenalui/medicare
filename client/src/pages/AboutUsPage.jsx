import React from "react";
import { Link } from "react-router-dom";

// Placeholder for icons from the original file
const PharmacyIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-10 w-10 text-primary"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
    />
  </svg>
);
const AmbulanceIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-10 w-10 text-primary"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10l2 2h8a1 1 0 001-1z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M18 17h-5m-4 0H4m14 0h1a2 2 0 002-2V7a2 2 0 00-2-2h-1"
    />
  </svg>
);
const RoomIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-10 w-10 text-primary"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
    />
  </svg>
);
const InsuranceIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-10 w-10 text-primary"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
    />
  </svg>
);

const DeveloperCard = ({ name, image, institution, prevInstitution }) => (
  <div className="card bg-base-100 shadow-xl text-center">
    <figure className="px-10 pt-10">
      <img
        src={image}
        alt={`Photo of ${name}`}
        className="rounded-full w-32 h-32 object-cover ring-4 ring-primary"
      />
    </figure>
    <div className="card-body items-center">
      <h2 className="card-title text-2xl">{name}</h2>
      <p className="font-semibold text-primary">{institution}</p>
      <p className="text-sm text-gray-500">{prevInstitution}</p>
    </div>
  </div>
);

const AboutUsPage = () => {
  return (
    <div className="bg-base-200">
      {/* Section 1: Hero Introduction */}
      <div className="hero min-h-[40vh] bg-base-100">
        <div className="hero-content text-center">
          <div className="max-w-3xl">
            <h1 className="text-5xl font-bold">About MediCare</h1>
            <p className="py-6 text-lg">
              Pioneering a new era of healthcare where compassionate service
              meets cutting-edge technology. We are dedicated to providing
              accessible, efficient, and comprehensive medical care for you and
              your family.
            </p>
          </div>
        </div>
      </div>

      {/* Section 2: Our Mission & Vision */}
      <div className="container mx-auto px-4 py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-4xl font-bold mb-4">Our Mission</h2>
            <p className="opacity-80 mb-4">
              To deliver patient-centric healthcare with integrity and empathy.
              We leverage technology to break down barriers, making quality
              medical services available to everyone, anytime, anywhere.
            </p>
            <h2 className="text-4xl font-bold mb-4">Our Vision</h2>
            <p className="opacity-80">
              To be the most trusted digital healthcare provider in the region,
              recognized for our innovation, reliability, and unwavering
              commitment to patient well-being.
            </p>
          </div>
          <div>
            {/* UPDATED: Image path changed to your local file */}
            <img
              src="/images/aubg.jpg"
              alt="Our Team"
              className="rounded-lg shadow-2xl"
            />
          </div>
        </div>
      </div>

      {/* Section 3: Highlighted Features */}
      <div className="bg-base-100">
        <div className="container mx-auto px-4 py-20 text-center">
          <h2 className="text-4xl font-bold mb-2">
            Seamless Healthcare at Your Fingertips
          </h2>
          <p className="text-lg opacity-70 mb-12 max-w-2xl mx-auto">
            We've integrated modern technology to simplify every aspect of your
            healthcare journey.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="card bg-base-200 shadow-xl text-center p-6">
              <div className="flex justify-center mb-4">
                <PharmacyIcon />
              </div>
              <h3 className="text-xl font-bold">Online Pharmacy</h3>
              <p className="opacity-80 mt-2">
                Get prescribed medications delivered directly to your doorstep.
                Safe, fast, and convenient.
              </p>
            </div>
            <div className="card bg-base-200 shadow-xl text-center p-6">
              <div className="flex justify-center mb-4">
                <AmbulanceIcon />
              </div>
              <h3 className="text-xl font-bold">Online Ambulance Request</h3>
              <p className="opacity-80 mt-2">
                In an emergency, request an ambulance with a single click. We
                track and dispatch the nearest unit immediately.
              </p>
            </div>
            <div className="card bg-base-200 shadow-xl text-center p-6">
              <div className="flex justify-center mb-4">
                <RoomIcon />
              </div>
              <h3 className="text-xl font-bold">Online Room Booking</h3>
              <p className="opacity-80 mt-2">
                Plan your hospital stay by viewing and booking available rooms
                online, ensuring your comfort.
              </p>
            </div>
            <div className="card bg-base-200 shadow-xl text-center p-6">
              <div className="flex justify-center mb-4">
                <InsuranceIcon />
              </div>
              <h3 className="text-xl font-bold">Integrated Insurance</h3>
              <p className="opacity-80 mt-2">
                Easily manage your health insurance claims and coverage directly
                through our integrated system.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Section: Meet the Developers */}
      <div className="container mx-auto px-4 py-20">
        <h2 className="text-4xl font-bold text-center mb-12">
          Meet the Developers
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-4xl mx-auto">
          <DeveloperCard
            name="Gazi Faiaz Zafor Niloy"
            image="/images/niloy.jpg"
            institution="CSE, BUET"
            prevInstitution="prev- Notre Dame College"
          />
          <DeveloperCard
            name="Rafsan Jani Bin Islam"
            image="/images/rafsan.jpg"
            institution="CSE, BUET"
            prevInstitution="prev- Notre Dame College"
          />
        </div>
      </div>

      {/* Section: Call to Action */}
      <div className="hero min-h-[30vh]">
        <div className="hero-content text-center">
          <div className="max-w-md">
            <h1 className="text-4xl font-bold">Join Our Community</h1>
            <p className="py-6">
              Experience a new standard of healthcare. Book an appointment or
              explore our services today.
            </p>
            <Link to="/contact" className="btn btn-primary">
              Contact Us
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutUsPage;
