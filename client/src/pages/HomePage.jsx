import React from "react";
import { Link } from "react-router-dom";

// ServiceCard and ServicesGrid components remain exactly as you provided.
const ServiceCard = ({ service }) => (
  <div className="card bg-white/95 backdrop-blur-sm shadow-xl w-full transform hover:-translate-y-2 transition-transform duration-300 overflow-hidden">
    <figure className="p-0.5 bg-white">
      <img
        src={
          service.image ||
          "https://placehold.co/400x400/E2E8F0/4A5568?text=Image"
        }
        alt={service.title}
        className="w-full aspect-square object-cover"
      />
    </figure>
    <div className="card-body items-center text-center p-4">
      <h2 className="card-title text-lg text-black font-bold">
        {service.title}
      </h2>
      <p className="text-sm text-gray-500">{service.description}</p>
      <div className="card-actions mt-2">
        <Link to={service.link} className={`btn btn-sm ${service.buttonClass}`}>
          {service.buttonText}
        </Link>
      </div>
    </div>
  </div>
);

const ServicesGrid = () => {
  const services = [
    {
      id: 1,
      title: "Find a Doctor",
      description: "Consult with specialists.",
      image: "/images/service-doctors.jpg",
      link: "/doctors",
      buttonText: "Find",
      buttonClass: "btn-primary",
    },
    {
      id: 5,
      title: "Disease Info",
      description: "Learn about diseases.",
      image: "/images/disease-info.jpg",
      link: "/diseases",
      buttonText: "Learn",
      buttonClass: "btn-info",
    },
    {
      id: 3,
      title: "24/7 Pharmacy",
      description: "Order medicines anytime.",
      image: "/images/onlinepharmacy.jpg",
      link: "/pharmacy",
      buttonText: "Order",
      buttonClass: "btn-success",
    },
    {
      id: 2,
      title: "Ambulance Service",
      description: "24/7 emergency services.",
      image: "/images/ambulance.jpg",
      link: "/ambulance",
      buttonText: "Call",
      buttonClass: "btn-error",
    },
    {
      id: 4,
      title: "Room Services",
      description: "Comfortable inpatient care.",
      image: "/images/bed.jpg",
      link: "/rooms",
      buttonText: "Book",
      buttonClass: "btn-primary",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
      {services.slice(0, 3).map((service) => (
        <ServiceCard key={service.id} service={service} />
      ))}
      <div className="hidden lg:block"></div>
      {services.slice(3, 5).map((service) => (
        <ServiceCard key={service.id} service={service} />
      ))}
    </div>
  );
};

// Testimonials component with the names reordered as you requested.
const Testimonials = () => {
  const testimonials = [
    {
      name: "Mohammad Sium",
      role: "Patient",
      text: "Booking an appointment online was incredibly easy and saved me a lot of time.",
    },
    {
      name: "Rabib Jahin",
      role: "Patient's Relative",
      text: "The ambulance arrived very quickly and the staff were extremely helpful. Thank you.",
    },
    {
      name: "Tahmid Khan",
      role: "Patient",
      text: "A wonderful experience. The doctors were very professional and the service was top-notch.",
    },
    {
      name: "Tanvir Mamun",
      role: "Patient",
      text: "The pharmacy delivery was a lifesaver. I got my medications delivered to my door within hours.",
    },
    {
      name: "Estey Hossain",
      role: "Patient",
      text: "The nursing staff are the heart of this hospital. So caring and attentive to every need.",
    },
    {
      name: "Fahim Adib", // Using the name from your previous code
      role: "Patient",
      text: "Clean facilities and a very organized system. I felt safe and well-cared for during my stay.",
    },
  ];
  const duplicatedTestimonials = [...testimonials, ...testimonials];
  return (
    <div className="bg-white py-20">
      <div className="container mx-auto px-6 text-center">
        <h2 className="text-4xl font-bold text-center text-gray-800 mb-12">
          What Our Patients Say
        </h2>
      </div>
      <div className="relative w-full overflow-hidden">
        <div className="flex animate-scroll hover:pause">
          {duplicatedTestimonials.map((testimonial, index) => (
            <div key={index} className="flex-shrink-0 w-full max-w-lg mx-4">
              <div className="card bg-blue-50 shadow-lg border border-blue-100 h-full">
                <div className="card-body text-gray-700 text-left">
                  <p className="italic text-lg mb-4">"{testimonial.text}"</p>
                  <div className="mt-auto">
                    <h3 className="font-bold text-lg text-gray-900">
                      {testimonial.name}
                    </h3>
                    <p className="text-sm text-gray-500">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const HomePage = () => {
  return (
    <>
      <style>
        {`
          @keyframes scroll { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
          .animate-scroll { display: flex; width: 200%; animation: scroll 40s linear infinite; }
          .hover\\:pause:hover { animation-play-state: paused; }

          @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(30px); }
            to { opacity: 1; transform: translateY(0); }
          }
          
          .fade-in-up {
            animation: fadeInUp 1s ease-out forwards;
          }
        `}
      </style>
      <div className="bg-gray-100">
        <div
          className="hero min-h-screen relative"
          style={{ backgroundImage: "url(/images/homepagebg.jpg)" }}
        >
          <div className="hero-overlay bg-black bg-opacity-60"></div>

          <div className="hero-content w-full max-w-screen-xl mx-auto p-4 lg:p-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="text-center lg:text-left text-white">
                <h1
                  className="mb-5 text-6xl md:text-7xl font-extrabold fade-in-up"
                  style={{ animationDelay: "0.2s" }}
                >
                  Your Health, Our Priority
                </h1>
                <p
                  className="mb-8 text-xl md:text-2xl text-gray-200 font-light fade-in-up"
                  style={{ animationDelay: "0.4s" }}
                >
                  Comprehensive medical services, right at your fingertips.
                </p>
                <div
                  className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 fade-in-up"
                  style={{ animationDelay: "0.6s" }}
                >
                  <Link to="/doctors" className="btn btn-primary btn-lg">
                    Book an Appointment
                  </Link>
                  <Link
                    to="/ai-help"
                    className="btn btn-outline btn-primary btn-lg"
                  >
                    Get AI Help
                  </Link>
                </div>
              </div>

              <div className="w-full">
                <ServicesGrid />
              </div>
            </div>
          </div>
        </div>

        <section id="about" className="py-20 bg-gray-100">
          <div className="container mx-auto px-6 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
              About MediCare
            </h2>
            <p className="text-gray-600 max-w-4xl mx-auto mb-12">
              MediCare Hospital is a leading multi-specialty hospital committed
              to providing ethical, reliable, high-quality, and cost-effective
              healthcare.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <div className="p-6">
                <h3 className="text-2xl font-bold text-primary mb-2">100+</h3>
                <p className="text-gray-700 font-semibold">
                  Highly qualified doctors
                </p>
              </div>
              <div className="p-6">
                <h3 className="text-2xl font-bold text-primary mb-2">50+</h3>
                <p className="text-gray-700 font-semibold">
                  Modern, comfortable rooms
                </p>
              </div>
              <div className="p-6">
                <h3 className="text-2xl font-bold text-primary mb-2">20+</h3>
                <p className="text-gray-700 font-semibold">
                  Ambulances on standby
                </p>
              </div>
            </div>
          </div>
        </section>

        <Testimonials />
      </div>
    </>
  );
};

export default HomePage;
