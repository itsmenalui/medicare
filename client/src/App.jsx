import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// Layout Components
import Navbar from "./components/navbar.jsx";
import Footer from "./components/footer.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";

// Page Components
import HomePage from "./pages/HomePage.jsx";
import DoctorsPage from "./pages/DoctorsPage.jsx";
import DoctorDetailPage from "./pages/DoctorDetailPage.jsx";
import PharmacyPage from "./pages/PharmacyPage.jsx";
import MedicationDetailPage from "./pages/MedicationDetailPage.jsx";
import CheckoutPage from "./pages/CheckoutPage.jsx";
import PatientLoginPage from "./pages/PatientLoginPage.jsx";
import SignupPage from "./pages/SignupPage.jsx";
import PatientPortalPage from "./pages/PatientPortalPage.jsx";
import RoomsPage from "./pages/RoomsPage.jsx";
import MyAppointmentPage from "./pages/MyAppointmentPage.jsx";
import MyBookingsPage from "./pages/MyBookingsPage.jsx";
import EmployeePortalPage from "./pages/EmployeePortalPage.jsx";
import EmployeeLoginPage from "./pages/EmployeeLoginPage.jsx";
import EmployeeSignupPage from "./pages/EmployeeSignupPage.jsx";
import ChatPage from "./pages/ChatPage.jsx";
import DiseasesPage from "./pages/DiseasesPage.jsx";
import DiseaseDetailPage from "./pages/DiseaseDetailPage.jsx";
import AIHelpPage from "./pages/AIHelpPage.jsx";
import AboutUsPage from "./pages/AboutUsPage.jsx";
import EmployeeSchedulePage from "./pages/EmployeeSchedulePage.jsx";
import AdminLoginPage from "./pages/AdminLoginPage.jsx";
import AdminPortalPage from "./pages/AdminPortalPage.jsx";
import AmbulancePage from "./pages/AmbulancePage.jsx";
import PrescriptionFormPage from "./pages/PrescriptionFormPage.jsx";
import MyPrescriptionsPage from "./pages/MyPrescriptionsPage.jsx";
import MyPreviousPrescriptionsPage from "./pages/MyPreviousPrescriptionsPage.jsx";
import CheckupsPage from "./pages/CheckupsPage.jsx";
import TestReportsPage from "./pages/TestReportsPage.jsx"; // NEW: Import the new TestReportsPage

function App() {
  return (
    <Router>
      <div className="flex flex-col min-h-screen bg-gray-50">
        <Navbar />
        <main className="flex-grow">
          <Routes>
            {/* --- PUBLIC ROUTES --- */}
            <Route path="/" element={<HomePage />} />
            <Route path="/doctors" element={<DoctorsPage />} />
            <Route path="/doctor/:id" element={<DoctorDetailPage />} />
            <Route path="/pharmacy" element={<PharmacyPage />} />
            <Route path="/medication/:id" element={<MedicationDetailPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/login" element={<PatientLoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/employee-login" element={<EmployeeLoginPage />} />
            <Route path="/employee-signup" element={<EmployeeSignupPage />} />
            <Route path="/diseases" element={<DiseasesPage />} />
            <Route path="/diseases/:id" element={<DiseaseDetailPage />} />
            <Route path="/about" element={<AboutUsPage />} />
            <Route path="/ambulance" element={<AmbulancePage />} />
            <Route path="/rooms" element={<RoomsPage />} />
            <Route path="/ai-help" element={<AIHelpPage />} />
            <Route path="/admin/login" element={<AdminLoginPage />} />

            {/* Add the new route for the checkups page with ProtectedRoute */}
            <Route
              path="/checkups"
              element={
                <ProtectedRoute role={["patient", "employee"]}>
                  <CheckupsPage />
                </ProtectedRoute>
              }
            />

            {/* --- ADMIN PROTECTED ROUTE --- */}
            <Route
              path="/admin/portal"
              element={
                <ProtectedRoute role="admin">
                  <AdminPortalPage />
                </ProtectedRoute>
              }
            />

            {/* --- PATIENT PROTECTED ROUTES --- */}
            <Route
              path="/portal"
              element={
                <ProtectedRoute role="patient">
                  <PatientPortalPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/portal/appointments"
              element={
                <ProtectedRoute role="patient">
                  <MyAppointmentPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/portal/my-bookings"
              element={
                <ProtectedRoute role="patient">
                  <MyBookingsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/portal/prescriptions"
              element={
                <ProtectedRoute role="patient">
                  <MyPrescriptionsPage />
                </ProtectedRoute>
              }
            />
            {/* NEW: Add the protected route for test reports */}
            <Route
              path="/portal/reports"
              element={
                <ProtectedRoute role="patient">
                  <TestReportsPage />
                </ProtectedRoute>
              }
            />

            {/* --- EMPLOYEE PROTECTED ROUTES --- */}
            <Route
              path="/employee-portal"
              element={
                <ProtectedRoute role="employee">
                  <EmployeePortalPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/employee-portal/schedule"
              element={
                <ProtectedRoute role="employee">
                  <EmployeeSchedulePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/employee-portal/appointments/:appointmentId/prescribe"
              element={
                <ProtectedRoute role="employee">
                  <PrescriptionFormPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/employee-portal/prescriptions"
              element={
                <ProtectedRoute role="employee">
                  <MyPreviousPrescriptionsPage />
                </ProtectedRoute>
              }
            />

            {/* --- SHARED PROTECTED ROUTES --- */}
            <Route
              path="/portal/chat"
              element={
                <ProtectedRoute role="patient">
                  <ChatPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/employee-portal/chat"
              element={
                <ProtectedRoute role="employee">
                  <ChatPage />
                </ProtectedRoute>
              }
            />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
