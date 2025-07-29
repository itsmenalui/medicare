import React, { useState, useEffect } from "react";
import axios from "axios";
import { usePatientAuth } from "../context/PatientAuthContext";
import { Link } from "react-router-dom";
import { FileText, Download, ArrowLeft } from "lucide-react";

const TestReportsPage = () => {
  const { user, loading: authLoading } = usePatientAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (authLoading) return;

    const fetchReports = async () => {
      const patientId = user?.patient?.patient_id;
      if (!patientId) {
        setError("Patient information not found. Please log in again.");
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const response = await axios.get(`/api/patient/${patientId}/reports`);
        setReports(response.data);
      } catch (err) {
        setError("Could not load your test reports.");
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, [user, authLoading]);

  const handleDownloadReport = (orderId, fileName) => {
    // We create a temporary link to trigger the download
    axios({
      url: `/api/patient/reports/${orderId}/download`,
      method: "GET",
      responseType: "blob", // Important
    })
      .then((response) => {
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", fileName);
        document.body.appendChild(link);
        link.click();
        link.parentNode.removeChild(link);
      })
      .catch(() => {
        alert("Could not download the report.");
      });
  };

  if (loading || authLoading) {
    return <div className="text-center py-20">Loading reports...</div>;
  }

  return (
    <div className="bg-gray-100 min-h-screen">
      <div className="container mx-auto px-4 py-12">
        <div className="flex items-center mb-10">
          <Link
            to="/portal"
            className="p-2 rounded-full hover:bg-gray-200 mr-4"
          >
            <ArrowLeft size={24} className="text-gray-700" />
          </Link>
          <div>
            <h1 className="text-5xl font-extrabold text-gray-900">
              My Test Reports
            </h1>
            <p className="text-xl text-gray-600 mt-1">
              View and download your completed medical test reports.
            </p>
          </div>
        </div>

        {error ? (
          <p className="text-center text-red-500">{error}</p>
        ) : reports.length === 0 ? (
          <div className="text-center py-16 border-2 border-dashed rounded-xl">
            <FileText size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-2xl font-bold text-gray-700">
              No Reports Found
            </h3>
            <p className="text-gray-500 mt-2">
              You do not have any completed test reports yet.
            </p>
          </div>
        ) : (
          <div className="bg-white p-6 rounded-2xl shadow-lg">
            <div className="space-y-4">
              {reports.map((report) => (
                <div
                  key={report.order_id}
                  className="flex items-center justify-between p-4 border-b hover:bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="font-bold text-lg text-gray-800">
                      {report.test_name}
                    </p>
                    <p className="text-sm text-gray-500">
                      Completed on:{" "}
                      {new Date(report.order_date).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      handleDownloadReport(
                        report.order_id,
                        report.result_pdf_name
                      )
                    }
                    className="btn btn-primary flex items-center gap-2"
                  >
                    <Download size={18} />
                    View Report
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TestReportsPage;
