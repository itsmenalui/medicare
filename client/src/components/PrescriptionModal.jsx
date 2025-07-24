import React from "react";
import { X, ShoppingCart } from "lucide-react";

// A dedicated component for the prescription modal for better organization and styling.
const PrescriptionModal = ({
  prescription,
  patient,
  doctor,
  onClose,
  onBuyNow,
}) => {
  if (!prescription) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full relative">
        {/* Close Button */}
        <button
          className="absolute top-3 right-3 bg-gray-100 hover:bg-gray-200 rounded-full p-1.5 transition-colors z-10"
          onClick={onClose}
        >
          <X size={20} className="text-gray-600" />
        </button>

        {/* Prescription Content */}
        <div className="p-8 md:p-12 border-8 border-gray-100 max-h-[90vh] overflow-y-auto">
          {/* Centered Hospital Header */}
          <div className="text-center mb-8">
            <h3 className="text-3xl font-bold text-indigo-600">
              MediCare Hospital
            </h3>
            <p className="text-gray-500">123 Health St, Wellness City, Dhaka</p>
          </div>

          {/* Doctor and Date Details */}
          <div className="flex justify-between items-start pb-4 border-b-2 border-gray-200">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">
                Dr. {doctor?.first_name} {doctor?.last_name}
              </h2>
              <p className="text-gray-600">{doctor?.specialization}</p>
              <p className="text-sm text-gray-500 mt-1">
                Regd. No: {doctor?.license_number || "N/A"}
              </p>
            </div>
            <div className="text-right">
              <label className="text-sm font-semibold text-gray-500 block">
                Date of Consultation
              </label>
              <p className="text-lg text-gray-800">
                {new Date(prescription.prescription_date).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Patient Details */}
          <div className="grid grid-cols-2 gap-x-8 gap-y-4 my-6">
            <div>
              <label className="text-sm font-semibold text-gray-500 block">
                Patient Name
              </label>
              <p className="text-lg text-gray-800">
                {patient?.first_name} {patient?.last_name}
              </p>
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-500 block">
                Age
              </label>
              <p className="text-lg text-gray-800">{patient?.age || "N/A"}</p>
            </div>
            <div className="col-span-2">
              <label className="text-sm font-semibold text-gray-500 block">
                Address
              </label>
              <p className="text-lg text-gray-800">{patient?.address}</p>
            </div>
          </div>

          {/* Rx Symbol */}
          <div className="text-4xl font-serif font-bold text-gray-700 mb-4">
            Rx
          </div>

          <div className="mb-6 bg-gray-50 p-4 rounded-lg">
            <h4 className="font-bold text-gray-700 mb-2">
              General Instructions
            </h4>
            <p className="text-gray-700">
              {prescription.instructions ||
                "No specific instructions provided."}
            </p>
          </div>

          {/* Medicines Table */}
          <div className="mb-6">
            <table className="w-full text-left">
              <thead className="bg-gray-50 rounded-lg">
                <tr>
                  <th className="p-3 text-sm font-semibold text-gray-600">
                    Medicine Name
                  </th>
                  <th className="p-3 text-sm font-semibold text-gray-600">
                    Dosage
                  </th>
                  <th className="p-3 text-sm font-semibold text-gray-600">
                    Duration
                  </th>
                </tr>
              </thead>
              <tbody>
                {prescription.medicines.map((med, idx) => (
                  <tr key={idx} className="border-b border-gray-200">
                    <td className="p-3 text-gray-800">
                      {med.medication_name || med.custom_name}
                    </td>
                    <td className="p-3 text-gray-700">{med.dosage}</td>
                    <td className="p-3 text-gray-700">{med.days} days</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Checkups/Advice */}
          {prescription.checkups?.length > 0 && (
            <div className="mb-8">
              <h4 className="font-bold text-gray-700 mb-2">
                Advice / Checkups
              </h4>
              <ul className="list-disc list-inside text-gray-700 space-y-1">
                {prescription.checkups.map((c, idx) => (
                  <li key={idx}>{c.description}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Footer & Signature */}
          <div className="mt-12 pt-6 border-t flex justify-between items-center">
            <div>
              <p className="text-lg font-semibold text-gray-800">
                Dr. {doctor?.first_name} {doctor?.last_name}
              </p>
              <p className="text-gray-500">Doctor's Signature</p>
            </div>
            <button
              onClick={onBuyNow}
              className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition-transform hover:scale-105"
            >
              <ShoppingCart size={20} />
              Buy Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrescriptionModal;
