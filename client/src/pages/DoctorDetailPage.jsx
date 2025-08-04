import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { usePatientAuth as useAuth } from "../context/PatientAuthContext";
import {
  Stethoscope,
  Calendar,
  Clock,
  DollarSign,
  CheckCircle,
  AlertCircle,
  XCircle,
} from "lucide-react";
import { useCart } from "../context/CartContext";

const DoctorDetailPage = () => {
  const { user } = useAuth();
  const { id } = useParams();
  const { refreshDbBillCount } = useCart();
  const [doctor, setDoctor] = useState(null);
  const [schedule, setSchedule] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [bookingStatus, setBookingStatus] = useState({
    state: "idle",
    message: "",
  });

  const fetchSchedule = useCallback(async () => {
    try {
      const scheduleRes = await axios.get(`/api/doctors/${id}/availability`);
      setSchedule(scheduleRes.data);
    } catch (err) {
      console.error("Failed to fetch schedule", err);
      setError((prev) => prev || "Could not update schedule.");
    }
  }, [id]);

  useEffect(() => {
    const initialFetch = async () => {
      setLoading(true);
      try {
        const doctorRes = await axios.get(`/api/doctors/${id}`);
        setDoctor(doctorRes.data);
        await fetchSchedule();
      } catch (err) {
        setError("Could not fetch doctor details.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    initialFetch();
  }, [id, fetchSchedule]);

  const groupedSchedule = useMemo(() => {
    return schedule.reduce((acc, slot) => {
      const date = new Date(slot.time).toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(slot);
      return acc;
    }, {});
  }, [schedule]);

  const handleBooking = async (e) => {
    e.preventDefault();
    if (!selectedSlot) {
      setError("Please select a time slot.");
      return;
    }
    if (!reason) {
      setError("Please provide a reason for your visit.");
      return;
    }
    if (!user?.patient?.patient_id) {
      setError("You must be logged in to book an appointment.");
      return;
    }

    setBookingStatus({ state: "booking", message: "" });
    setError("");

    try {
      await axios.post("/api/appointments", {
        doctor_id: id,
        patient_id: user.patient.patient_id,
        appointment_date: selectedSlot,
        reason: reason,
      });
      setBookingStatus({
        state: "success",
        message:
          "Appointment booked successfully! The consultation fee has been added to your cart.",
      });
      refreshDbBillCount();
      setSelectedSlot("");
      setReason("");
      fetchSchedule(); // Refresh schedule to show the newly booked slot as unavailable
    } catch (err) {
      const errorMessage =
        err.response?.data?.error || "An error occurred during booking.";
      setBookingStatus({ state: "error", message: errorMessage });
      // Also refresh the schedule in case the slot was booked by someone else while this user was on the page
      fetchSchedule();
    }
  };

  if (loading)
    return <div className="text-center py-20">Loading doctor's profile...</div>;

  if (bookingStatus.state === "success") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <CheckCircle className="w-24 h-24 text-green-500 mb-4" />
        <h2 className="text-3xl font-bold text-gray-800 mb-2">
          Appointment Confirmed!
        </h2>
        <p className="text-lg text-gray-600 max-w-md">
          {bookingStatus.message}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gray-100 min-h-screen">
      <div className="container mx-auto px-4 py-12">
        {doctor && (
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 flex items-center space-x-6">
            <Stethoscope className="w-16 h-16 text-indigo-500" />
            <div>
              <h1 className="text-4xl font-bold text-gray-900">
                Dr. {doctor.first_name} {doctor.last_name}
              </h1>
              <p className="text-xl text-indigo-600 font-semibold">
                {doctor.specialization}
              </p>
              <p className="text-gray-600">
                {doctor.department_name} Department
              </p>
            </div>
          </div>
        )}

        <form
          onSubmit={handleBooking}
          className="bg-white rounded-2xl shadow-xl p-8"
        >
          <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-4">
            Book an Appointment
          </h2>

          {bookingStatus.state === "error" && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-md flex items-center">
              <AlertCircle className="mr-3" />
              <span>{bookingStatus.message}</span>
            </div>
          )}

          <div className="mb-6">
            <label className="block text-lg font-semibold text-gray-700 mb-2">
              <Calendar className="inline-block mr-2" /> Select a Time Slot
            </label>
            {Object.keys(groupedSchedule).length === 0 && !loading && (
              <div className="text-center py-10 px-6 bg-gray-50 rounded-lg">
                <XCircle className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  No available slots
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  This doctor has no upcoming availability. Please check back
                  later.
                </p>
              </div>
            )}
            {Object.keys(groupedSchedule).map((date) => (
              <div key={date} className="mb-4">
                <h3 className="font-semibold text-gray-600 mb-2">{date}</h3>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                  {/* ✅ FIX: Updated button logic to handle different slot statuses */}
                  {groupedSchedule[date].map((slot) => {
                    const isAvailable = slot.status === "available";
                    let buttonClass = "";

                    if (isAvailable) {
                      if (selectedSlot === slot.time) {
                        // Style for selected available slot
                        buttonClass =
                          "bg-indigo-600 text-white border-transparent ring-2 ring-offset-2 ring-indigo-500 transform scale-105";
                      } else {
                        // Style for a normal, unselected, available slot
                        buttonClass =
                          "bg-white text-indigo-700 border-gray-300 hover:bg-indigo-50 hover:border-indigo-400";
                      }
                    } else {
                      // Style for disabled (unavailable/appointment) slots
                      buttonClass =
                        "bg-gray-200 text-gray-400 border-gray-200 cursor-not-allowed line-through";
                    }

                    return (
                      <button
                        key={slot.time}
                        type="button"
                        onClick={() => {
                          if (isAvailable) {
                            setSelectedSlot(slot.time);
                          }
                        }}
                        disabled={!isAvailable}
                        className={`p-3 border rounded-lg text-sm font-semibold transition duration-200 ${buttonClass}`}
                      >
                        {new Date(slot.time).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: true,
                        })}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <textarea
            name="reason"
            placeholder="Brief reason for your visit..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full p-3 border rounded-lg mb-4 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            rows="3"
            required
          ></textarea>

          {doctor?.consultation_fee && (
            <div className="flex justify-end items-center mb-4 text-xl font-bold text-gray-800">
              <DollarSign size={20} className="mr-2 text-gray-500" />
              <span>
                Consultation Fee: ৳
                {parseFloat(doctor.consultation_fee).toFixed(2)}
              </span>
            </div>
          )}

          <button
            type="submit"
            disabled={bookingStatus.state === "booking" || !selectedSlot}
            className="w-full bg-indigo-600 text-white font-bold py-4 px-8 rounded-lg hover:bg-indigo-700 transition duration-300 disabled:bg-gray-400 text-lg"
          >
            {bookingStatus.state === "booking"
              ? "Booking..."
              : "Confirm Appointment"}
          </button>
          {error && <p className="text-red-500 text-center mt-4">{error}</p>}
        </form>
      </div>
    </div>
  );
};

export default DoctorDetailPage;
