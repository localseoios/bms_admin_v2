import React from "react";
import {
  UserGroupIcon,
  ClipboardDocumentCheckIcon,
  LockClosedIcon,
} from "@heroicons/react/24/outline";

function KYCRoleManagement({ role, onChange }) {
  // Function to handle checkbox changes
  const handlePermissionChange = (permission) => {
    // Create a deep copy of the role to avoid direct state mutation
    const updatedRole = JSON.parse(JSON.stringify(role));

    // Initialize the kycManagement object if it doesn't exist
    if (!updatedRole.permissions.kycManagement) {
      updatedRole.permissions.kycManagement = {};
    }

    // Toggle the boolean value
    updatedRole.permissions.kycManagement[permission] =
      !updatedRole.permissions.kycManagement[permission];

    // Call the parent component's onChange handler
    onChange(updatedRole);
  };

  return (
    <div className="bg-white rounded-lg shadow p-4 mb-6">
      <div className="flex items-center mb-4">
        <div className="p-2 bg-purple-100 rounded-md">
          <UserGroupIcon className="h-5 w-5 text-purple-600" />
        </div>
        <h3 className="ml-3 text-lg font-medium text-gray-900">
          KYC Management Permissions
        </h3>
      </div>

      <p className="text-sm text-gray-500 mb-4">
        These roles are responsible for the sequential approval of Know Your
        Customer (KYC) documentation.
      </p>

      <div className="grid md:grid-cols-3 gap-4">
        {/* LMRO Role */}
        <div className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors duration-200">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="kycLMRO"
              checked={role.permissions?.kycManagement?.lmro || false}
              onChange={() => handlePermissionChange("lmro")}
              className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
            />
            <label
              htmlFor="kycLMRO"
              className="ml-2 font-medium text-gray-700 flex items-center"
            >
              <UserGroupIcon className="h-4 w-4 mr-1 text-blue-500" />
              LMRO Role
            </label>
          </div>
          <p className="mt-2 text-xs text-gray-500">
            First level of KYC approval. LMRO (Local Money Laundering Reporting
            Officer) is responsible for initial KYC verification.
          </p>
        </div>

        {/* DLMRO Role */}
        <div className="p-4 border border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-colors duration-200">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="kycDLMRO"
              checked={role.permissions?.kycManagement?.dlmro || false}
              onChange={() => handlePermissionChange("dlmro")}
              className="h-4 w-4 text-purple-600 rounded focus:ring-purple-500 border-gray-300"
            />
            <label
              htmlFor="kycDLMRO"
              className="ml-2 font-medium text-gray-700 flex items-center"
            >
              <ClipboardDocumentCheckIcon className="h-4 w-4 mr-1 text-purple-500" />
              DLMRO Role
            </label>
          </div>
          <p className="mt-2 text-xs text-gray-500">
            Second level of KYC approval. DLMRO (Deputy Money Laundering
            Reporting Officer) reviews after LMRO approval.
          </p>
        </div>

        {/* CEO Role */}
        <div className="p-4 border border-gray-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 transition-colors duration-200">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="kycCEO"
              checked={role.permissions?.kycManagement?.ceo || false}
              onChange={() => handlePermissionChange("ceo")}
              className="h-4 w-4 text-indigo-600 rounded focus:ring-indigo-500 border-gray-300"
            />
            <label
              htmlFor="kycCEO"
              className="ml-2 font-medium text-gray-700 flex items-center"
            >
              <LockClosedIcon className="h-4 w-4 mr-1 text-indigo-500" />
              CEO Role
            </label>
          </div>
          <p className="mt-2 text-xs text-gray-500">
            Final level of KYC approval. CEO provides the final authorization
            after LMRO and DLMRO approvals.
          </p>
        </div>
      </div>

      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-100 rounded-md">
        <p className="text-xs text-yellow-800">
          <strong>Note:</strong> The KYC process follows a specific sequence:
          LMRO → DLMRO → CEO. Each role must approve in order, with
          notifications sent automatically to the next role.
        </p>
      </div>
    </div>
  );
}

export default KYCRoleManagement;
