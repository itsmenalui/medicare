import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

const emptyMedicine = {
  medication_id: "",
  custom_name: "",
  type: "tablet",
  dosage: "",
  times_per_day: 1,
  days: 1,
  quantity: 1,
};
const emptyCheckup = { description: "" };

const PrescriptionFormPage = () => {
  const { appointmentId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [appointment, setAppointment] = useState(null);
  const [doctor, setDoctor] = useState(null);
  const [patient, setPatient] = useState(null);
  const [reason, setReason] = useState("");
  const [date, setDate] = useState("");
  const [instructions, setInstructions] = useState("");
  const [medicines, setMedicines] = useState([{ ...emptyMedicine }]);
  const [checkups, setCheckups] = useState([]);
  const [medicationOptions, setMedicationOptions] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(""); // Clear previous errors
      try {
        // Fetch appointment details
        const res = await axios.get(`/api/appointments/${appointmentId}`);
        setAppointment(res.data);
        setReason(res.data.reason);
        setDate(res.data.appointment_date);

        // Fetch doctor info
        const docRes = await axios.get(`/api/doctors/${res.data.doctor_id}`);
        setDoctor(docRes.data);

        // Fetch patient info
        const patRes = await axios.get(`/api/patient/${res.data.patient_id}`);
        setPatient(patRes.data);

        // ✅ FIX: Corrected the API endpoint URL for medications
        const medsRes = await axios.get(`/api/pharmacy/medications?limit=1000`);
        setMedicationOptions(medsRes.data.medications || []);
      } catch (err) {
        console.error("API Call Failed:", err);
        if (err.response) {
          console.error("Error Status:", err.response.status);
          console.error("Error Data:", err.response.data);
          setError(
            `Error: ${err.response.data.error || err.response.statusText}`
          );
        } else {
          setError("An unexpected error occurred. Check the console.");
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [appointmentId]);

  const handleMedicineChange = (idx, field, value) => {
    setMedicines((prev) =>
      prev.map((m, i) => (i === idx ? { ...m, [field]: value } : m))
    );
  };
  const addMedicine = () =>
    setMedicines((prev) => [...prev, { ...emptyMedicine }]);
  const removeMedicine = (idx) =>
    setMedicines((prev) => prev.filter((_, i) => i !== idx));

  const handleCheckupChange = (idx, value) => {
    setCheckups((prev) =>
      prev.map((c, i) => (i === idx ? { description: value } : c))
    );
  };
  const addCheckup = () =>
    setCheckups((prev) => [...prev, { ...emptyCheckup }]);
  const removeCheckup = (idx) =>
    setCheckups((prev) => prev.filter((_, i) => i !== idx));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    try {
      await axios.post(`/api/appointments/${appointmentId}/prescription`, {
        instructions,
        medicines,
        checkups,
      });
      setSuccess("Prescription submitted successfully!");
      setTimeout(() => navigate(-1), 1500);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to submit prescription.");
    }
  };

  if (loading) return <div className="text-center py-20">Loading...</div>;
  if (error)
    return <div className="text-center py-20 text-red-600">{error}</div>;

  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      <h1 className="text-4xl font-bold mb-6">Write Prescription</h1>
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-lg shadow-xl space-y-6"
      >
        {/* Pre-filled info */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-700 font-semibold">Doctor</label>
            <input
              className="w-full p-2 border rounded"
              value={
                doctor ? `Dr. ${doctor.first_name} ${doctor.last_name}` : ""
              }
              disabled
            />
          </div>
          <div>
            <label className="block text-gray-700 font-semibold">Patient</label>
            <input
              className="w-full p-2 border rounded"
              value={
                patient ? `${patient.first_name} ${patient.last_name}` : ""
              }
              disabled
            />
          </div>
          <div>
            <label className="block text-gray-700 font-semibold">Date</label>
            <input
              className="w-full p-2 border rounded"
              value={date ? new Date(date).toLocaleString() : ""}
              disabled
            />
          </div>
          <div>
            <label className="block text-gray-700 font-semibold">Reason</label>
            <input
              className="w-full p-2 border rounded"
              value={reason}
              disabled
            />
          </div>
        </div>
        {/* Instructions */}
        <div>
          <label className="block text-gray-700 font-semibold">
            General Instructions
          </label>
          <textarea
            className="w-full p-2 border rounded"
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            rows={2}
            placeholder="e.g. Take with food, rest, etc."
          />
        </div>
        {/* Medicines */}
        <div>
          <label className="block text-gray-700 font-bold mb-2">
            Medicines
          </label>
          {medicines.map((med, idx) => (
            <div key={idx} className="mb-4 p-4 border rounded-lg bg-gray-50">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2">
                <div>
                  <label className="block text-gray-600 text-sm mb-1">
                    Medicine (from list)
                  </label>
                  <select
                    className="w-full p-3 border rounded text-base"
                    value={med.medication_id}
                    onChange={(e) =>
                      handleMedicineChange(idx, "medication_id", e.target.value)
                    }
                  >
                    <option value="">--Select Medicine--</option>
                    {medicationOptions.map((opt) => (
                      <option key={opt.medication_id} value={opt.medication_id}>
                        {opt.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-gray-600 text-sm mb-1">
                    Custom Name (if not in list)
                  </label>
                  <input
                    className="w-full p-2 border rounded"
                    placeholder="e.g. Paracetamol"
                    value={med.custom_name}
                    onChange={(e) =>
                      handleMedicineChange(idx, "custom_name", e.target.value)
                    }
                  />
                </div>
                <div>
                  <label className="block text-gray-600 text-sm mb-1">
                    Type
                  </label>
                  <select
                    className="w-full p-3 border rounded text-base"
                    value={med.type}
                    onChange={(e) =>
                      handleMedicineChange(idx, "type", e.target.value)
                    }
                  >
                    <option value="tablet">Tablet</option>
                    <option value="syrup">Syrup</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-2">
                <div>
                  <label className="block text-gray-600 text-sm mb-1">
                    Dosage
                  </label>
                  <input
                    className="w-full p-2 border rounded"
                    placeholder="e.g. 1+0+1 after meal"
                    value={med.dosage}
                    onChange={(e) =>
                      handleMedicineChange(idx, "dosage", e.target.value)
                    }
                  />
                </div>
                <div>
                  <label className="block text-gray-600 text-sm mb-1">
                    Times per day
                  </label>
                  <input
                    className="w-full p-2 border rounded"
                    type="number"
                    min={1}
                    placeholder="e.g. 2"
                    value={med.times_per_day}
                    onChange={(e) =>
                      handleMedicineChange(idx, "times_per_day", e.target.value)
                    }
                  />
                </div>
                <div>
                  <label className="block text-gray-600 text-sm mb-1">
                    Number of days
                  </label>
                  <input
                    className="w-full p-2 border rounded"
                    type="number"
                    min={1}
                    placeholder="e.g. 5"
                    value={med.days}
                    onChange={(e) =>
                      handleMedicineChange(idx, "days", e.target.value)
                    }
                  />
                </div>
                <div>
                  <label className="block text-gray-600 text-sm mb-1">
                    Total quantity
                  </label>
                  <div className="w-full p-2 border rounded bg-gray-100 text-gray-700">
                    {Number(med.times_per_day) * Number(med.days) || 0}
                  </div>
                </div>
              </div>
              <button
                type="button"
                className="text-red-600 font-bold mt-2"
                onClick={() => removeMedicine(idx)}
                disabled={medicines.length === 1}
              >
                Remove
              </button>
            </div>
          ))}
          <button
            type="button"
            className="mt-2 px-3 py-1 bg-blue-600 text-white rounded"
            onClick={addMedicine}
          >
            Add Medicine
          </button>
        </div>
        {/* Checkups */}
        <div>
          <label className="block text-gray-700 font-bold mb-2">Checkups</label>
          {checkups.map((check, idx) => (
            <div key={idx} className="flex gap-2 mb-2 items-center">
              <input
                className="flex-1 p-2 border rounded"
                placeholder="Checkup/Advice (e.g. Blood Test, X-ray, etc.)"
                value={check.description}
                onChange={(e) => handleCheckupChange(idx, e.target.value)}
              />
              <button
                type="button"
                className="text-red-600 font-bold"
                onClick={() => removeCheckup(idx)}
              >
                Remove
              </button>
            </div>
          ))}
          <button
            type="button"
            className="mt-2 px-3 py-1 bg-blue-600 text-white rounded"
            onClick={addCheckup}
          >
            Add Checkup
          </button>
        </div>
        {/* Submit */}
        <div>
          <button
            type="submit"
            className="w-full py-3 bg-green-600 text-white font-bold rounded text-lg hover:bg-green-700"
          >
            Submit Prescription
          </button>
        </div>
        {success && (
          <div className="text-green-700 font-bold text-center">{success}</div>
        )}
        {error && (
          <div className="text-red-600 font-bold text-center">{error}</div>
        )}
      </form>
    </div>
  );
};

export default PrescriptionFormPage;
