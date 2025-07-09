import React, { useState, useEffect } from "react";
import axios from "axios";
import { usePatientAuth } from "../context/PatientAuthContext";
import {
  BedDouble,
  Users,
  DollarSign,
  CheckCircle,
  XCircle,
} from "lucide-react";

// This is the card component for a single room
const RoomCard = ({ room, onBook, isPatientLoggedIn, colorClass }) => {
  const isAvailable = room.availability;

  return (
    <div
      className={`rounded-lg shadow-lg overflow-hidden border-2 ${
        isAvailable ? "border-transparent" : "border-gray-300"
      }`}
    >
      <div
        // UPDATED: The color is now passed in as a prop
        className={`p-6 text-white ${
          isAvailable
            ? colorClass
            : "bg-gradient-to-r from-gray-500 to-gray-600"
        }`}
      >
        <h3 className="text-3xl font-bold">{room.type_name}</h3>
        <p className="text-xl font-semibold">Room: {room.room_number}</p>
      </div>
      <div className="p-6 bg-white">
        <p className="text-gray-600 mb-4">{room.description}</p>
        <div className="space-y-3 mb-6">
          <div className="flex items-center text-gray-700">
            <Users size={20} className="mr-3 text-cyan-700" />
            <span>Capacity: {room.capacity} Person(s)</span>
          </div>
          <div className="flex items-center text-gray-700">
            <DollarSign size={20} className="mr-3 text-cyan-700" />
            <span>Cost: ${parseFloat(room.cost_per_day).toFixed(2)} / day</span>
          </div>
        </div>
        <button
          onClick={() => onBook(room)}
          disabled={!isAvailable || !isPatientLoggedIn}
          className={`w-full font-bold py-3 px-6 rounded-lg transition duration-300 text-white ${
            isAvailable
              ? "bg-cyan-600 hover:bg-cyan-700"
              : "bg-gray-400 cursor-not-allowed"
          } disabled:bg-gray-300 disabled:cursor-not-allowed disabled:text-gray-500`}
        >
          {isAvailable
            ? isPatientLoggedIn
              ? "Book Now"
              : "Login as Patient to Book"
            : "Unavailable"}
        </button>
      </div>
    </div>
  );
};

// Main page component
const RoomsPage = () => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { isAuthenticated, user } = usePatientAuth();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [bookingStatus, setBookingStatus] = useState({
    state: "idle",
    message: "",
  });

  // UPDATED: Create a map to assign colors based on room type name
  const roomTypeColors = {
    "General Ward": "bg-gradient-to-r from-blue-500 to-blue-600",
    "Semi-Private Cabin": "bg-gradient-to-r from-purple-500 to-purple-600",
    "Private Cabin": "bg-gradient-to-r from-indigo-500 to-indigo-600",
    "Intensive Care Unit (ICU)": "bg-gradient-to-r from-red-500 to-red-600",
    "Coronary Care Unit (CCU)": "bg-gradient-to-r from-teal-500 to-cyan-600",
    // Add more types and colors here as needed
    default: "bg-gradient-to-r from-gray-700 to-gray-800", // A fallback color
  };

  const getRoomColor = (typeName) => {
    return roomTypeColors[typeName] || roomTypeColors.default;
  };

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/rooms");
      setRooms(response.data);
    } catch (err) {
      setError("Could not load room information. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  const handleBookClick = (room) => {
    setSelectedRoom(room);
    setBookingStatus({ state: "idle", message: "" });
    setIsModalOpen(true);
  };

  const handleConfirmBooking = async () => {
    if (!selectedRoom || !user?.patient?.patient_id) return;

    setBookingStatus({ state: "loading", message: "" });

    try {
      await axios.post("/api/rooms/book", {
        room_id: selectedRoom.room_id,
        patient_id: user.patient.patient_id,
        check_in_date: new Date().toISOString().split("T")[0],
      });
      setBookingStatus({
        state: "success",
        message: "Room booked successfully!",
      });
      fetchRooms();
    } catch (err) {
      setBookingStatus({
        state: "error",
        message: err.response?.data?.error || "Could not book the room.",
      });
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-extrabold text-gray-900">Book a Room</h1>
          <p className="text-xl text-gray-600 mt-2">
            Find and book a comfortable room for your stay.
          </p>
        </div>

        {loading ? (
          <p className="text-center">Loading rooms...</p>
        ) : error ? (
          <p className="text-center text-red-500">{error}</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {rooms.map((room) => (
              <RoomCard
                key={room.room_id}
                room={room}
                onBook={handleBookClick}
                isPatientLoggedIn={isAuthenticated}
                // UPDATED: Pass the specific color class to the card
                colorClass={getRoomColor(room.type_name)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Booking Confirmation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">
              Confirm Booking
            </h2>

            {bookingStatus.state === "idle" && (
              <>
                <p className="text-gray-700 mb-6">
                  You are about to book{" "}
                  <span className="font-bold">
                    {selectedRoom?.type_name} - Room {selectedRoom?.room_number}
                  </span>
                  .
                </p>
                <div className="flex justify-end space-x-4">
                  <button onClick={() => setIsModalOpen(false)} className="btn">
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmBooking}
                    className="btn btn-primary"
                  >
                    Confirm
                  </button>
                </div>
              </>
            )}

            {bookingStatus.state === "loading" && (
              <p>Processing your booking...</p>
            )}

            {bookingStatus.state === "success" && (
              <div className="text-center">
                <CheckCircle
                  size={48}
                  className="mx-auto text-green-500 mb-4"
                />
                <p className="text-lg font-semibold text-green-700">
                  {bookingStatus.message}
                </p>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="btn btn-success mt-6"
                >
                  Close
                </button>
              </div>
            )}

            {bookingStatus.state === "error" && (
              <div className="text-center">
                <XCircle size={48} className="mx-auto text-red-500 mb-4" />
                <p className="text-lg font-semibold text-red-700">
                  {bookingStatus.message}
                </p>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="btn btn-error mt-6"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default RoomsPage;
