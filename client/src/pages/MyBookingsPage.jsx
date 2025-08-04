// Create this file at: src/pages/MyBookingsPage.jsx

import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "../api/axios";
import { usePatientAuth } from "../context/PatientAuthContext.jsx";
import {
  ArrowLeft,
  BedDouble,
  Calendar,
  CheckSquare,
  XSquare,
} from "lucide-react";

// Card component for a single booking
const BookingCard = ({ booking }) => {
  const getStatusChip = (status) => {
    if (status === "Booked") {
      return (
        <div className="flex items-center text-xs font-semibold text-green-800 bg-green-100 px-3 py-1 rounded-full">
          <CheckSquare size={14} className="mr-1.5" /> {status}
        </div>
      );
    }
    return (
      <div className="flex items-center text-xs font-semibold text-gray-800 bg-gray-200 px-3 py-1 rounded-full">
        <XSquare size={14} className="mr-1.5" /> {status}
      </div>
    );
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-md border">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-xl font-bold text-gray-900">
            {booking.type_name}
          </h3>
          <p className="text-md text-cyan-600 font-semibold">
            Room: {booking.room_number}
          </p>
        </div>
        {getStatusChip(booking.booking_status)}
      </div>
      <div className="border-t my-4"></div>
      <div className="space-y-3 text-gray-700">
        <div className="flex items-center">
          <Calendar size={16} className="mr-3 text-gray-500" />
          <span>
            Check-in Date:{" "}
            {new Date(booking.check_in_date).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </span>
        </div>
        <p className="text-sm text-gray-600 pt-2">{booking.description}</p>
      </div>
    </div>
  );
};

// Main page component
const MyBookingsPage = () => {
  const { user } = usePatientAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user || !user.patient) {
      setError("You must be logged in to view your bookings.");
      setLoading(false);
      return;
    }

    const fetchBookings = async () => {
      try {
        const response = await axios.get(
          `/api/patient/${user.patient.patient_id}/bookings`
        );
        setBookings(response.data);
      } catch (err) {
        console.error("Error fetching room bookings:", err);
        setError("Could not fetch your room bookings. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [user]);

  if (loading) {
    return (
      <div className="text-center py-20 font-semibold text-lg">
        Loading Your Bookings...
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20 text-red-600 font-semibold text-lg">
        {error}
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto px-6 py-12">
        <div className="flex items-center mb-10">
          <Link
            to="/portal"
            className="p-2 rounded-full hover:bg-gray-200 mr-4"
          >
            <ArrowLeft size={24} className="text-gray-700" />
          </Link>
          <div>
            <h1 className="text-5xl font-extrabold text-gray-900">
              My Room Bookings
            </h1>
            <p className="text-xl text-gray-600 mt-1">
              A history of all your hospital stays.
            </p>
          </div>
        </div>

        {bookings.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {bookings.map((booking) => (
              <BookingCard key={booking.booking_id} booking={booking} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 border-2 border-dashed rounded-xl">
            <BedDouble size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-2xl font-bold text-gray-700">
              No Bookings Found
            </h3>
            <p className="text-gray-500 mt-2">
              You haven't booked any rooms yet.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyBookingsPage;
