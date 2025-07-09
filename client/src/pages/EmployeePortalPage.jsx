import React from "react";
import { Link } from "react-router-dom";
import { useEmployeeAuth } from "../context/EmployeeAuthContext.jsx";
import { Briefcase, Users, MessageSquare, ArrowRight } from "lucide-react";

const PortalCard = ({ to, title, description, icon, color }) => (
  <Link
    to={to}
    className="group block bg-white p-6 rounded-2xl shadow-md hover:shadow-2xl hover:-translate-y-2 transition-transform duration-300"
  >
    <div className="flex items-start justify-between">
      <div className={`p-4 rounded-full ${color}`}>{icon}</div>
      <ArrowRight className="text-gray-300 group-hover:text-gray-500 transition-colors" />
    </div>
    <div className="mt-4">
      <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
      <p className="text-gray-600 mt-1">{description}</p>
    </div>
  </Link>
);

const EmployeePortalPage = () => {
  const { employeeUser, loading } = useEmployeeAuth();

  if (loading) {
    return (
      <div className="text-center py-20 font-semibold text-lg">
        Loading Employee Portal...
      </div>
    );
  }

  if (!employeeUser || !employeeUser.employee) {
    return (
      <div className="text-center py-20 text-red-600 font-semibold text-lg">
        Could not load employee data. Please try logging in again.
      </div>
    );
  }

  const employee = employeeUser.employee;

  return (
    <div className="bg-gray-100 min-h-screen">
      <div className="container mx-auto px-6 py-12">
        <div className="mb-10">
          <h1 className="text-5xl font-extrabold text-gray-900">
            Employee Portal
          </h1>
          <p className="text-xl text-gray-600 mt-2">
            Welcome, {employee.first_name} {employee.last_name}.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <PortalCard
            to="/employee-portal/schedule"
            title="My Schedule"
            description="View and manage your upcoming patient appointments."
            icon={<Briefcase size={28} className="text-teal-800" />}
            color="bg-teal-100"
          />
          <PortalCard
            to="/employee-portal/patients" // Placeholder link
            title="Patient Directory"
            description="Access medical records and patient information."
            icon={<Users size={28} className="text-cyan-800" />}
            color="bg-cyan-100"
          />
          <div className="md:col-span-3">
            <PortalCard
              to="/employee-portal/chat"
              title="Chat with Patients"
              description="Directly message patients and other staff."
              icon={<MessageSquare size={28} className="text-pink-800" />}
              color="bg-pink-100"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeePortalPage;
