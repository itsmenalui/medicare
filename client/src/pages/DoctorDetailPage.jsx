import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { usePatientAuth as useAuth } from "../context/PatientAuthContext";
const DoctorDetailPage = () => {
  const { user } = useAuth();
  const { id } = useParams();
  const [doctor, setDoctor] = useState(null);
  const [schedule, setSchedule] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [bookingStatus, setBookingStatus] = useState("");

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

  // **IMPROVEMENT: Group schedule by day for a better UI**
  const groupedSchedule = useMemo(() => {
    return schedule.reduce((acc, slot) => {
      const date = new Date(slot.time).toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "short",
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
    if (!user || !user.patient) {
      setError("You must be logged in as a patient to book an appointment.");
      return;
    }
    if (!selectedSlot || !reason) {
      setError("Please select a time slot and provide a reason for the visit.");
      return;
    }

    setBookingStatus("booking");
    setError("");
    try {
      await axios.post("/api/appointments", {
        doctor_id: doctor.doctor_id,
        appointment_date: selectedSlot,
        reason: reason,
        patient_id: user.patient.patient_id,
      });
      setBookingStatus("success");
      await fetchSchedule();
      setSelectedSlot("");
      setReason("");
    } catch (err) {
      setBookingStatus("error");
      setError(err.response?.data?.error || "Could not book appointment.");
    } finally {
      setTimeout(() => setBookingStatus(""), 3000);
    }
  };

  if (loading)
    return <div className="text-center py-20">Loading Doctor's Profile...</div>;
  if (!doctor)
    return (
      <div className="text-center py-20 text-red-500">
        {error || "Doctor not found."}
      </div>
    );

  return (
    <div className="container mx-auto px-4 py-12">
      {/* Doctor Profile Section */}
      <div className="bg-white p-8 rounded-lg shadow-xl mb-12 flex flex-col md:flex-row items-center gap-8">
        <img
          src={`https://placehold.co/200x200/E2E8F0/4A5568?text=${
            doctor?.first_name?.charAt(0) || "D"
          }${doctor?.last_name?.charAt(0) || "R"}`}
          alt={`Dr. ${doctor.first_name} ${doctor.last_name}`}
          className="w-48 h-48 rounded-full object-cover border-8 border-gray-100"
        />
        <div>
          <h1 className="text-4xl font-extrabold text-gray-900">
            Dr. {doctor.first_name || ""} {doctor.last_name || ""}
          </h1>
          <p className="text-2xl text-indigo-600 font-semibold mt-1">
            {doctor.specialization || "Specialist"}
          </p>
          <p className="text-lg text-gray-700 mt-2">
            {doctor.department_name || "General"} Department
          </p>
        </div>
      </div>

      {/* Booking Section */}
      <div className="bg-white p-8 rounded-lg shadow-xl">
        <h2 className="text-3xl font-bold text-gray-800 border-b pb-4 mb-6">
          Book an Appointment
        </h2>

        {bookingStatus === "success" && (
          <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-6 rounded">
            <p className="font-bold">Appointment Booked Successfully!</p>
            <p>The schedule has been updated.</p>
          </div>
        )}

        <form onSubmit={handleBooking}>
          {/* **IMPROVEMENT: Loop through grouped days** */}
          <div className="space-y-6 mb-8">
            {Object.keys(groupedSchedule).map((date) => (
              <div key={date}>
                <h3 className="text-lg font-bold text-gray-700 mb-3 border-b pb-2">
                  {date}
                </h3>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
                  {groupedSchedule[date].map((slot) => (
                    <button
                      type="button"
                      key={slot.time}
                      onClick={() =>
                        !slot.isBooked && setSelectedSlot(slot.time)
                      }
                      disabled={slot.isBooked}
                      // **IMPROVEMENT: New, more visible styles**
                      className={`py-3 px-2 rounded-lg text-md font-semibold border-2 transition text-center shadow-sm ${
                        slot.isBooked
                          ? "bg-gray-200 text-gray-400 border-gray-300 cursor-not-allowed line-through"
                          : selectedSlot === slot.time
                          ? "bg-indigo-600 text-white border-transparent ring-2 ring-offset-2 ring-indigo-500 transform scale-105"
                          : "bg-white text-indigo-700 border-gray-300 hover:bg-indigo-50 hover:border-indigo-400"
                      }`}
                    >
                      {new Date(slot.time).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: true,
                      })}
                    </button>
                  ))}
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

          <button
            type="submit"
            disabled={bookingStatus === "booking" || !selectedSlot}
            className="w-full bg-indigo-600 text-white font-bold py-4 px-8 rounded-lg hover:bg-indigo-700 transition duration-300 disabled:bg-gray-400 text-lg"
          >
            {bookingStatus === "booking" ? "Booking..." : "Confirm Appointment"}
          </button>
          {error && <p className="text-red-500 text-center mt-4">{error}</p>}
        </form>
      </div>
    </div>
  );
};

export default DoctorDetailPage;
