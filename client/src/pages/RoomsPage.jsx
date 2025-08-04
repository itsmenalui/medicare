import React, { useState, useEffect } from "react";
import axios from "../api/axios";
import { usePatientAuth } from "../context/PatientAuthContext";
import { useAdminAuth } from "../context/AdminAuthContext";
import { BedDouble, Users, DollarSign, Check, X } from "lucide-react";

const RoomsPage = () => {
  const { isAdminAuthenticated } = useAdminAuth();

  // If admin is logged in, show the admin view, otherwise show the patient view
  return isAdminAuthenticated ? <AdminRoomsView /> : <PatientRoomsView />;
};

// ==================================================================
// --- Admin-Specific View Component ---
// ==================================================================
const AdminRoomsView = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [view, setView] = useState("pending"); // 'pending' or 'all'

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const response = await axios.get("/api/admin/rooms/bookings");
      setBookings(response.data);
    } catch (err) {
      setError("Could not load booking information.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleApprove = async (bookingId) => {
    try {
      await axios.post("/api/admin/rooms/approve", { booking_id: bookingId });
      alert("Booking approved!");
      fetchBookings(); // Refresh the list
    } catch (err) {
      alert("Failed to approve booking.");
    }
  };

  const handleDecline = async (bookingId) => {
    if (window.confirm("Are you sure you want to decline this request?")) {
      try {
        await axios.post("/api/admin/rooms/decline", { booking_id: bookingId });
        alert("Booking declined.");
        fetchBookings(); // Refresh the list
      } catch (err) {
        alert("Failed to decline booking.");
      }
    }
  };

  const pendingBookings = bookings.filter(
    (b) => b.booking_status === "pending"
  );
  const confirmedBookings = bookings.filter(
    (b) => b.booking_status === "confirmed"
  );

  return (
    <div className="bg-gray-100 min-h-screen">
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-8 text-gray-800">
          Manage Room Bookings
        </h1>
        <div className="bg-white p-6 rounded-2xl shadow-lg">
          <div className="border-b mb-4">
            <button
              onClick={() => setView("pending")}
              className={`px-4 py-2 font-semibold ${
                view === "pending"
                  ? "border-b-2 border-blue-600 text-blue-600"
                  : "text-gray-500"
              }`}
            >
              Pending Requests ({pendingBookings.length})
            </button>
            <button
              onClick={() => setView("all")}
              className={`px-4 py-2 font-semibold ${
                view === "all"
                  ? "border-b-2 border-blue-600 text-blue-600"
                  : "text-gray-500"
              }`}
            >
              All Confirmed Bookings ({confirmedBookings.length})
            </button>
          </div>
          {loading && <p className="text-center py-8">Loading...</p>}
          {error && <p className="text-center py-8 text-red-500">{error}</p>}

          {view === "pending" && (
            <BookingTable
              bookings={pendingBookings}
              onApprove={handleApprove}
              onDecline={handleDecline}
              isPending
            />
          )}
          {view === "all" && <BookingTable bookings={confirmedBookings} />}
        </div>
      </div>
    </div>
  );
};

const BookingTable = ({
  bookings,
  onApprove,
  onDecline,
  isPending = false,
}) => (
  <div className="overflow-x-auto">
    <table className="w-full text-left">
      <thead>
        <tr className="border-b bg-gray-50">
          <th className="p-3 font-semibold text-gray-600">Patient</th>
          <th className="p-3 font-semibold text-gray-600">Room Type</th>
          <th className="p-3 font-semibold text-gray-600">Room No.</th>
          <th className="p-3 font-semibold text-gray-600">Check-in Date</th>
          {isPending && (
            <th className="p-3 font-semibold text-gray-600 text-center">
              Actions
            </th>
          )}
        </tr>
      </thead>
      <tbody>
        {bookings.length === 0 && (
          <tr>
            <td colSpan="5" className="text-center p-6 text-gray-500">
              No bookings found.
            </td>
          </tr>
        )}
        {bookings.map((b) => (
          <tr key={b.booking_id} className="border-b hover:bg-gray-50">
            <td className="p-3 font-semibold text-gray-800">
              {b.first_name} {b.last_name}
            </td>
            <td className="p-3 text-gray-700">{b.type_name}</td>
            <td className="p-3 text-gray-700">{b.room_number}</td>
            <td className="p-3 text-gray-700">
              {new Date(b.check_in_date).toLocaleDateString()}
            </td>
            {isPending && (
              <td className="p-3 text-center space-x-2">
                <button
                  onClick={() => onApprove(b.booking_id)}
                  className="p-2 bg-green-100 text-green-700 rounded-full hover:bg-green-200 transition-colors"
                >
                  <Check size={18} />
                </button>
                <button
                  onClick={() => onDecline(b.booking_id)}
                  className="p-2 bg-red-100 text-red-700 rounded-full hover:bg-red-200 transition-colors"
                >
                  <X size={18} />
                </button>
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

// ==================================================================
// --- Patient-Facing View Component ---
// ==================================================================
const PatientRoomsView = () => {
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

  const roomTypeColors = {
    "General Ward": "bg-gradient-to-r from-blue-500 to-blue-600",
    "Semi-Private Cabin": "bg-gradient-to-r from-purple-500 to-purple-600",
    "Private Cabin": "bg-gradient-to-r from-indigo-500 to-indigo-600",
    "Intensive Care Unit (ICU)": "bg-gradient-to-r from-red-500 to-red-600",
    "Coronary Care Unit (CCU)": "bg-gradient-to-r from-teal-500 to-cyan-600",
    default: "bg-gradient-to-r from-gray-700 to-gray-800",
  };

  const getRoomColor = (typeName) =>
    roomTypeColors[typeName] || roomTypeColors.default;

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/rooms");
      setRooms(response.data);
    } catch (err) {
      setError("Could not load room information.");
    } finally {
      setLoading(false);
    }
  };

  const handleBookClick = (room) => {
    setSelectedRoom(room);
    setBookingStatus({ state: "idle", message: "" });
    setIsModalOpen(true);
  };

  const handleConfirmRequest = async () => {
    if (!selectedRoom || !user?.patient?.patient_id) return;
    setBookingStatus({ state: "loading", message: "" });
    try {
      const response = await axios.post("/api/rooms/book", {
        room_id: selectedRoom.room_id,
        patient_id: user.patient.patient_id,
        check_in_date: new Date().toISOString().split("T")[0],
      });
      setBookingStatus({ state: "success", message: response.data.message });
    } catch (err) {
      setBookingStatus({
        state: "error",
        message: err.response?.data?.error || "Could not send request.",
      });
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-extrabold text-gray-900">Book a Room</h1>
          <p className="text-xl text-gray-600 mt-2">
            Find and request a room for your stay.
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
                colorClass={getRoomColor(room.type_name)}
              />
            ))}
          </div>
        )}
      </div>
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">
              {bookingStatus.state === "idle"
                ? "Confirm Request"
                : "Booking Status"}
            </h2>
            {bookingStatus.state === "idle" && (
              <>
                <p className="text-gray-700 mb-6">
                  Send a booking request for{" "}
                  <span className="font-bold">
                    {selectedRoom?.type_name} - Room {selectedRoom?.room_number}
                  </span>
                  ?
                </p>
                <div className="flex justify-end space-x-4">
                  <button onClick={() => setIsModalOpen(false)} className="btn">
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmRequest}
                    className="btn btn-primary"
                  >
                    Send Request
                  </button>
                </div>
              </>
            )}
            {bookingStatus.state === "loading" && <p>Sending request...</p>}
            {bookingStatus.state === "success" && (
              <div className="text-center">
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

const RoomCard = ({ room, onBook, isPatientLoggedIn, colorClass }) => {
  const isAvailable = room.availability;
  return (
    <div
      className={`rounded-lg shadow-lg overflow-hidden border-2 ${
        isAvailable ? "border-transparent" : "border-gray-300"
      }`}
    >
      <div
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
            {/* ✅ FIX: Changed '$' to '৳' */}
            <span>Cost: ৳{parseFloat(room.cost_per_day).toFixed(2)} / day</span>
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
              ? "Request to Book"
              : "Login to Book"
            : "Unavailable"}
        </button>
      </div>
    </div>
  );
};

export default RoomsPage;
