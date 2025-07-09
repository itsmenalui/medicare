import React from "react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-gray-800 text-gray-300 py-8">
      <div className="container mx-auto px-6 text-center">
        <div className="mb-4">
          <p>
            &copy; {new Date().getFullYear()} MediCare Hospital. All Rights
            Reserved.
          </p>
        </div>
        <div className="flex justify-center space-x-6">
          {/* NEW LINK ADDED HERE */}
          <Link to="/about" className="hover:text-white transition-colors">
            About Us
          </Link>
          <Link to="/privacy" className="hover:text-white transition-colors">
            Privacy Policy
          </Link>
          <Link to="/terms" className="hover:text-white transition-colors">
            Terms of Service
          </Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
