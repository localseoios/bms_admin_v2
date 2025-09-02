import React from "react";
import { FaTimes, FaUser, FaPhone, FaMapMarkerAlt, FaCalendar, FaIdCard, FaBriefcase, FaGraduationCap, FaCertificate, FaStar, FaExclamationTriangle } from "react-icons/fa";

const ComplianceStaffDetails = ({ staff, onClose }) => {
  if (!staff) return null;

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getStatusBadge = (status) => {
    const statusClasses = {
      Active: "bg-green-100 text-green-800",
      "On Leave": "bg-yellow-100 text-yellow-800",
      Inactive: "bg-gray-100 text-gray-800",
      Terminated: "bg-red-100 text-red-800",
    };

    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusClasses[status] || "bg-gray-100 text-gray-800"}`}>
        {status}
      </span>
    );
  };

  const getDepartmentBadge = (department) => {
    const deptClasses = {
      KYC: "bg-blue-100 text-blue-800",
      BRA: "bg-purple-100 text-purple-800",
      Screening: "bg-indigo-100 text-indigo-800",
      "General Compliance": "bg-teal-100 text-teal-800",
    };

    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${deptClasses[department] || "bg-gray-100 text-gray-800"}`}>
        {department}
      </span>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">Staff Member Details</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <FaTimes size={20} />
          </button>
        </div>

        <div className="p-6">
          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 bg-blue-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                  {staff.userId?.name?.charAt(0).toUpperCase() || "?"}
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-800">{staff.userId?.name || "N/A"}</h3>
                  <p className="text-gray-600">{staff.designation}</p>
                  <div className="flex gap-2 mt-2">
                    {getDepartmentBadge(staff.department)}
                    {getStatusBadge(staff.status)}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Staff ID</p>
                <p className="text-lg font-semibold text-gray-800">{staff.staffId}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white border rounded-lg p-4">
              <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <FaUser className="text-blue-500" /> Basic Information
              </h4>
              <div className="space-y-2">
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="text-gray-800">{staff.userId?.email || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Phone Number</p>
                  <p className="text-gray-800">{staff.phoneNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Address</p>
                  <p className="text-gray-800">{staff.address}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Joining Date</p>
                  <p className="text-gray-800">{formatDate(staff.joiningDate)}</p>
                </div>
              </div>
            </div>

            <div className="bg-white border rounded-lg p-4">
              <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <FaExclamationTriangle className="text-red-500" /> Emergency Contact
              </h4>
              <div className="space-y-2">
                <div>
                  <p className="text-sm text-gray-500">Name</p>
                  <p className="text-gray-800">{staff.emergencyContact?.name || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Relationship</p>
                  <p className="text-gray-800">{staff.emergencyContact?.relationship || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Phone Number</p>
                  <p className="text-gray-800">{staff.emergencyContact?.phoneNumber || "N/A"}</p>
                </div>
              </div>
            </div>
          </div>

          {staff.qualifications?.length > 0 && (
            <div className="bg-white border rounded-lg p-4 mt-6">
              <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <FaGraduationCap className="text-green-500" /> Qualifications
              </h4>
              <div className="space-y-2">
                {staff.qualifications.map((qual, index) => (
                  <div key={index} className="flex justify-between items-center py-2 border-b last:border-0">
                    <div>
                      <p className="font-medium text-gray-800">{qual.degree}</p>
                      <p className="text-sm text-gray-600">{qual.institution}</p>
                    </div>
                    {qual.year && (
                      <span className="text-sm text-gray-500">{qual.year}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {staff.certifications?.length > 0 && (
            <div className="bg-white border rounded-lg p-4 mt-6">
              <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <FaCertificate className="text-purple-500" /> Certifications
              </h4>
              <div className="space-y-2">
                {staff.certifications.map((cert, index) => (
                  <div key={index} className="py-2 border-b last:border-0">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-gray-800">{cert.name}</p>
                        <p className="text-sm text-gray-600">Issued by: {cert.issuedBy}</p>
                      </div>
                      {cert.expiryDate && new Date(cert.expiryDate) < new Date() && (
                        <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">Expired</span>
                      )}
                    </div>
                    <div className="flex gap-4 mt-1">
                      {cert.issuedDate && (
                        <p className="text-xs text-gray-500">
                          Issued: {formatDate(cert.issuedDate)}
                        </p>
                      )}
                      {cert.expiryDate && (
                        <p className="text-xs text-gray-500">
                          Expires: {formatDate(cert.expiryDate)}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {staff.specializations?.length > 0 && (
            <div className="bg-white border rounded-lg p-4 mt-6">
              <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <FaStar className="text-yellow-500" /> Specializations
              </h4>
              <div className="flex flex-wrap gap-2">
                {staff.specializations.map((spec, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm"
                  >
                    {spec}
                  </span>
                ))}
              </div>
            </div>
          )}

          {staff.notes && (
            <div className="bg-white border rounded-lg p-4 mt-6">
              <h4 className="font-semibold text-gray-800 mb-3">Notes</h4>
              <p className="text-gray-700 whitespace-pre-wrap">{staff.notes}</p>
            </div>
          )}

          <div className="bg-gray-50 rounded-lg p-4 mt-6">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Created By</p>
                <p className="text-gray-800">{staff.createdBy?.name || "N/A"}</p>
                <p className="text-xs text-gray-500">{formatDate(staff.createdAt)}</p>
              </div>
              {staff.updatedBy && (
                <div>
                  <p className="text-gray-500">Last Updated By</p>
                  <p className="text-gray-800">{staff.updatedBy?.name}</p>
                  <p className="text-xs text-gray-500">{formatDate(staff.updatedAt)}</p>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComplianceStaffDetails;