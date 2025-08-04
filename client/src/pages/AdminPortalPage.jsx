import React, { useEffect, useState } from "react";
import axios from "../api/axios";
import {
  CheckSquare,
  UserPlus,
  XSquare,
  Stethoscope,
  HeartPulse,
  Award,
} from "lucide-react";

// --- Reusable Approval Card Components ---

const DoctorApprovalCard = ({ doctor, onAction }) => {
  const handleApprove = async () => {
    if (
      !window.confirm(
        `Are you sure you want to approve Dr. ${doctor.first_name} ${doctor.last_name}?`
      )
    )
      return;
    try {
      await axios.post("/api/admin/approve-doctor", {
        employee_id: doctor.employee_id,
      });
      alert("Doctor approved successfully!");
      onAction(doctor.employee_id, "doctors");
    } catch (err) {
      alert(
        "Failed to approve doctor: " +
          (err.response?.data?.message || err.message)
      );
    }
  };

  const handleDecline = async () => {
    if (
      !window.confirm(
        `Are you sure you want to DECLINE this application? This action cannot be undone.`
      )
    )
      return;
    try {
      await axios.post("/api/admin/decline-doctor", {
        employee_id: doctor.employee_id,
      });
      alert("Doctor application declined.");
      onAction(doctor.employee_id, "doctors");
    } catch (err) {
      alert(
        "Failed to decline doctor: " +
          (err.response?.data?.message || err.message)
      );
    }
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-md border flex justify-between items-center">
      <div>
        <h3 className="font-bold text-lg text-gray-800">
          Dr. {doctor.first_name} {doctor.last_name}
        </h3>
        <p className="text-gray-600">
          {doctor.specialization} - {doctor.department_name}
        </p>
        <p className="text-sm text-gray-500">
          {doctor.email} | License: {doctor.license_number}
        </p>
      </div>
      <div className="flex space-x-2">
        <button onClick={handleDecline} className="btn btn-error btn-sm">
          <XSquare size={16} className="mr-2" />
          Decline
        </button>
        <button onClick={handleApprove} className="btn btn-success btn-sm">
          <CheckSquare size={16} className="mr-2" />
          Approve
        </button>
      </div>
    </div>
  );
};

const NurseApprovalCard = ({ nurse, onAction }) => {
    const handleApprove = async () => {
        if (!window.confirm(`Are you sure you want to approve Nurse ${nurse.first_name} ${nurse.last_name}?`)) return;
        try {
            await axios.post("/api/admin/approve-nurse", { employee_id: nurse.employee_id });
            alert("Nurse approved successfully!");
            onAction(nurse.employee_id, "nurses");
        } catch (err) {
            alert("Failed to approve nurse: " + (err.response?.data?.message || err.message));
        }
    };

    const handleDecline = async () => {
        if (!window.confirm(`Are you sure you want to DECLINE this application? This action cannot be undone.`)) return;
        try {
            await axios.post("/api/admin/decline-nurse", { employee_id: nurse.employee_id });
            alert("Nurse application declined.");
            onAction(nurse.employee_id, "nurses");
        } catch (err) {
            alert("Failed to decline nurse: " + (err.response?.data?.message || err.message));
        }
    };

    return (
        <div className="bg-white p-4 rounded-lg shadow-md border flex justify-between items-center">
            <div>
                <h3 className="font-bold text-lg text-gray-800">Nurse {nurse.first_name} {nurse.last_name}</h3>
                <p className="text-gray-600">{nurse.department_name} Department</p>
                <p className="text-sm text-gray-500">{nurse.email} | License: {nurse.license_number}</p>
            </div>
            <div className="flex space-x-2">
                <button onClick={handleDecline} className="btn btn-error btn-sm"><XSquare size={16} className="mr-2" />Decline</button>
                <button onClick={handleApprove} className="btn btn-success btn-sm"><CheckSquare size={16} className="mr-2" />Approve</button>
            </div>
        </div>
    );
};


// --- Main Admin Portal Page Component ---
const AdminPortalPage = () => {
  const [pendingDoctors, setPendingDoctors] = useState([]);
  const [pendingNurses, setPendingNurses] = useState([]);
  const [pendingMemberships, setPendingMemberships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("memberships");

  useEffect(() => {
    const fetchAllPending = async () => {
      setLoading(true);
      try {
        const [doctorsRes, nursesRes, membershipsRes] = await Promise.all([
          axios.get("/api/admin/pending-doctors"),
          axios.get("/api/admin/pending-nurses"),
          axios.get("/api/admin/membership-applications"),
        ]);
        setPendingDoctors(doctorsRes.data);
        setPendingNurses(nursesRes.data);
        setPendingMemberships(membershipsRes.data);
      } catch (error) {
        console.error("Failed to fetch pending applications", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAllPending();
  }, []);

  const handleAction = (id, type) => {
    if (type === "doctors") {
      setPendingDoctors((prev) => prev.filter((doc) => doc.employee_id !== id));
    } else if (type === "nurses") {
      setPendingNurses((prev) => prev.filter((nurse) => nurse.employee_id !== id));
    } else if (type === "memberships") {
      setPendingMemberships((prev) => prev.filter((mem) => mem.patient_id !== id));
    }
  };

  const handleApproveMembership = async (patientId, newLevel) => {
    if (!window.confirm(`Approve ${newLevel} membership for this patient?`)) return;
    try {
      await axios.post("/api/admin/approve-membership", {
        patient_id: patientId,
        new_level: newLevel,
      });
      alert("Membership approved!");
      handleAction(patientId, "memberships");
    } catch (err) {
      alert("Failed to approve membership.");
    }
  };

  const TabButton = ({ tabName, label, icon, count }) => (
    <button
      onClick={() => setActiveTab(tabName)}
      className={`flex items-center px-4 py-2 text-lg font-semibold rounded-t-lg transition-colors duration-200 ${
        activeTab === tabName
          ? "bg-white text-gray-900 border-b-2 border-red-600"
          : "bg-transparent text-gray-500 hover:bg-gray-200"
      }`}
    >
      {icon}
      <span className="ml-2">{label}</span>
      {count > 0 && <span className="ml-2 badge badge-secondary">{count}</span>}
    </button>
  );

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold mb-8 text-gray-900">Admin Dashboard</h1>
      <div className="border-b border-gray-300 mb-6 flex">
        <TabButton tabName="memberships" label="Membership Approvals" icon={<Award />} count={pendingMemberships.length} />
        <TabButton tabName="doctors" label="Doctor Approvals" icon={<Stethoscope />} count={pendingDoctors.length} />
        <TabButton tabName="nurses" label="Nurse Approvals" icon={<HeartPulse />} count={pendingNurses.length} />
      </div>
      <div className="bg-gray-100 p-6 rounded-xl shadow-inner">
        {loading ? (
          <p>Loading applications...</p>
        ) : (
          <div className="space-y-4">
            {activeTab === "doctors" &&
              (pendingDoctors.length > 0 ? (
                pendingDoctors.map((doc) => (
                  <DoctorApprovalCard
                    key={doc.employee_id}
                    doctor={doc}
                    onAction={handleAction}
                  />
                ))
              ) : (
                <p className="text-gray-500 italic">
                  No pending doctor approvals.
                </p>
              ))}
            {activeTab === "nurses" &&
              (pendingNurses.length > 0 ? (
                pendingNurses.map((nurse) => (
                  <NurseApprovalCard
                    key={nurse.employee_id}
                    nurse={nurse}
                    onAction={handleAction}
                  />
                ))
              ) : (
                <p className="text-gray-500 italic">
                  No pending nurse approvals.
                </p>
              ))}
            {activeTab === "memberships" &&
              (pendingMemberships.length > 0 ? (
                <div className="space-y-4">
                  {pendingMemberships.map((mem) => (
                    <div key={mem.patient_id} className="bg-white p-4 rounded-lg shadow-md border flex justify-between items-center">
                      <div>
                        <h3 className="font-bold text-lg text-gray-800">{mem.first_name} {mem.last_name}</h3>
                        <p className="text-gray-600">
                          Current: <span className="font-semibold capitalize">{mem.current_level || 'None'}</span> | Requesting: <span className="font-semibold capitalize">{mem.requested_level}</span>
                        </p>
                        <p className="text-sm text-gray-500">{mem.email}</p>
                      </div>
                      <button onClick={() => handleApproveMembership(mem.patient_id, mem.requested_level)} className="btn btn-success btn-sm">Approve</button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 italic">No pending membership approvals.</p>
              ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPortalPage;
