import React, { useState, useEffect } from "react";
import { FaTimes, FaPlus, FaTrash } from "react-icons/fa";
import { toast } from "react-toastify";
import axios from "../../utils/axios";

const ComplianceStaffForm = ({ staff, editMode, onClose }) => {
  const [formData, setFormData] = useState({
    userId: "",
    staffId: "",
    department: "",
    designation: "",
    joiningDate: "",
    phoneNumber: "",
    address: "",
    emergencyContact: {
      name: "",
      relationship: "",
      phoneNumber: "",
    },
    qualifications: [],
    certifications: [],
    specializations: [],
    status: "Active",
    notes: "",
  });

  const [availableUsers, setAvailableUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editMode && staff) {
      setFormData({
        userId: staff.userId?._id || "",
        staffId: staff.staffId || "",
        department: staff.department || "",
        designation: staff.designation || "",
        joiningDate: staff.joiningDate ? new Date(staff.joiningDate).toISOString().split("T")[0] : "",
        phoneNumber: staff.phoneNumber || "",
        address: staff.address || "",
        emergencyContact: staff.emergencyContact || {
          name: "",
          relationship: "",
          phoneNumber: "",
        },
        qualifications: staff.qualifications || [],
        certifications: staff.certifications || [],
        specializations: staff.specializations || [],
        status: staff.status || "Active",
        notes: staff.notes || "",
      });
    }
    fetchAvailableUsers();
  }, [staff, editMode]);

  const fetchAvailableUsers = async () => {
    try {
      const response = await axios.get("/api/compliance-staff/available-users");
      setAvailableUsers(response.data.data);
    } catch (error) {
      console.error("Error fetching available users:", error);
      toast.error("Failed to fetch available users");
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.includes(".")) {
      const [parent, child] = name.split(".");
      setFormData((prev) => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleAddQualification = () => {
    setFormData((prev) => ({
      ...prev,
      qualifications: [
        ...prev.qualifications,
        { degree: "", institution: "", year: "" },
      ],
    }));
  };

  const handleQualificationChange = (index, field, value) => {
    const updated = [...formData.qualifications];
    updated[index][field] = value;
    setFormData((prev) => ({
      ...prev,
      qualifications: updated,
    }));
  };

  const handleRemoveQualification = (index) => {
    setFormData((prev) => ({
      ...prev,
      qualifications: prev.qualifications.filter((_, i) => i !== index),
    }));
  };

  const handleAddCertification = () => {
    setFormData((prev) => ({
      ...prev,
      certifications: [
        ...prev.certifications,
        { name: "", issuedBy: "", issuedDate: "", expiryDate: "" },
      ],
    }));
  };

  const handleCertificationChange = (index, field, value) => {
    const updated = [...formData.certifications];
    updated[index][field] = value;
    setFormData((prev) => ({
      ...prev,
      certifications: updated,
    }));
  };

  const handleRemoveCertification = (index) => {
    setFormData((prev) => ({
      ...prev,
      certifications: prev.certifications.filter((_, i) => i !== index),
    }));
  };

  const handleAddSpecialization = () => {
    setFormData((prev) => ({
      ...prev,
      specializations: [...prev.specializations, ""],
    }));
  };

  const handleSpecializationChange = (index, value) => {
    const updated = [...formData.specializations];
    updated[index] = value;
    setFormData((prev) => ({
      ...prev,
      specializations: updated,
    }));
  };

  const handleRemoveSpecialization = (index) => {
    setFormData((prev) => ({
      ...prev,
      specializations: prev.specializations.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const dataToSubmit = {
        ...formData,
        qualifications: formData.qualifications.filter(q => q.degree && q.institution),
        certifications: formData.certifications.filter(c => c.name && c.issuedBy),
        specializations: formData.specializations.filter(s => s),
      };

      if (editMode) {
        await axios.put(`/api/compliance-staff/${staff._id}`, dataToSubmit);
        toast.success("Staff member updated successfully");
      } else {
        await axios.post("/api/compliance-staff", dataToSubmit);
        toast.success("Staff member added successfully");
      }
      onClose();
    } catch (error) {
      console.error("Error saving staff:", error);
      toast.error(error.response?.data?.message || "Failed to save staff member");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">
            {editMode ? "Edit Staff Member" : "Add New Staff Member"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <FaTimes size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select User *
              </label>
              <select
                name="userId"
                value={formData.userId}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                required
                disabled={editMode}
              >
                <option value="">Select a user</option>
                {editMode && staff?.userId ? (
                  <option value={staff.userId._id}>
                    {staff.userId.name} ({staff.userId.email})
                  </option>
                ) : (
                  availableUsers.map((user) => (
                    <option key={user._id} value={user._id}>
                      {user.name} ({user.email})
                    </option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Staff ID *
              </label>
              <input
                type="text"
                name="staffId"
                value={formData.staffId}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Department *
              </label>
              <select
                name="department"
                value={formData.department}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                required
              >
                <option value="">Select department</option>
                <option value="KYC">KYC</option>
                <option value="BRA">BRA</option>
                <option value="Screening">Screening</option>
                <option value="General Compliance">General Compliance</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Designation *
              </label>
              <input
                type="text"
                name="designation"
                value={formData.designation}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Joining Date *
              </label>
              <input
                type="date"
                name="joiningDate"
                value={formData.joiningDate}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number *
              </label>
              <input
                type="tel"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
              >
                <option value="Active">Active</option>
                <option value="On Leave">On Leave</option>
                <option value="Inactive">Inactive</option>
                <option value="Terminated">Terminated</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address *
              </label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                rows="2"
                required
              />
            </div>
          </div>

          <div className="border-t pt-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Emergency Contact</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  name="emergencyContact.name"
                  value={formData.emergencyContact.name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Relationship *
                </label>
                <input
                  type="text"
                  name="emergencyContact.relationship"
                  value={formData.emergencyContact.relationship}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  name="emergencyContact.phoneNumber"
                  value={formData.emergencyContact.phoneNumber}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                  required
                />
              </div>
            </div>
          </div>

          <div className="border-t pt-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-semibold text-gray-800">Qualifications</h3>
              <button
                type="button"
                onClick={handleAddQualification}
                className="text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                <FaPlus size={14} /> Add
              </button>
            </div>
            {formData.qualifications.map((qual, index) => (
              <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-3">
                <input
                  type="text"
                  placeholder="Degree"
                  value={qual.degree}
                  onChange={(e) => handleQualificationChange(index, "degree", e.target.value)}
                  className="px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                />
                <input
                  type="text"
                  placeholder="Institution"
                  value={qual.institution}
                  onChange={(e) => handleQualificationChange(index, "institution", e.target.value)}
                  className="px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                />
                <input
                  type="number"
                  placeholder="Year"
                  value={qual.year}
                  onChange={(e) => handleQualificationChange(index, "year", e.target.value)}
                  className="px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveQualification(index)}
                  className="text-red-600 hover:text-red-700"
                >
                  <FaTrash />
                </button>
              </div>
            ))}
          </div>

          <div className="border-t pt-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-semibold text-gray-800">Certifications</h3>
              <button
                type="button"
                onClick={handleAddCertification}
                className="text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                <FaPlus size={14} /> Add
              </button>
            </div>
            {formData.certifications.map((cert, index) => (
              <div key={index} className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-3">
                <input
                  type="text"
                  placeholder="Certification Name"
                  value={cert.name}
                  onChange={(e) => handleCertificationChange(index, "name", e.target.value)}
                  className="px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                />
                <input
                  type="text"
                  placeholder="Issued By"
                  value={cert.issuedBy}
                  onChange={(e) => handleCertificationChange(index, "issuedBy", e.target.value)}
                  className="px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                />
                <input
                  type="date"
                  placeholder="Issue Date"
                  value={cert.issuedDate}
                  onChange={(e) => handleCertificationChange(index, "issuedDate", e.target.value)}
                  className="px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                />
                <input
                  type="date"
                  placeholder="Expiry Date"
                  value={cert.expiryDate}
                  onChange={(e) => handleCertificationChange(index, "expiryDate", e.target.value)}
                  className="px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveCertification(index)}
                  className="text-red-600 hover:text-red-700"
                >
                  <FaTrash />
                </button>
              </div>
            ))}
          </div>

          <div className="border-t pt-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-semibold text-gray-800">Specializations</h3>
              <button
                type="button"
                onClick={handleAddSpecialization}
                className="text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                <FaPlus size={14} /> Add
              </button>
            </div>
            {formData.specializations.map((spec, index) => (
              <div key={index} className="flex gap-4 mb-3">
                <input
                  type="text"
                  placeholder="Specialization"
                  value={spec}
                  onChange={(e) => handleSpecializationChange(index, e.target.value)}
                  className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveSpecialization(index)}
                  className="text-red-600 hover:text-red-700"
                >
                  <FaTrash />
                </button>
              </div>
            ))}
          </div>

          <div className="border-t pt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
              rows="3"
              placeholder="Additional notes or comments..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Saving..." : editMode ? "Update" : "Add"} Staff Member
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ComplianceStaffForm;