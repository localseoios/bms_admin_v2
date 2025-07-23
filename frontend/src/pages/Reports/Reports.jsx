// pages/Reports/Reports.jsx
import React, { useState, useEffect } from "react";
import { 
  DocumentTextIcon, 
  ChartBarIcon,
  BanknotesIcon,
  DocumentChartBarIcon,
  ExclamationTriangleIcon
} from "@heroicons/react/24/outline";
import { useAuth } from "../../context/AuthContext";
import FinancialDocuments from "./FinancialDocuments";

const Reports = () => {
  const [activeTab, setActiveTab] = useState("financial_statement");
  const { checkPermission } = useAuth();

  // Check if user has permission to access financial reports - ONLY Audited Financial permissions allowed
  // We explicitly prevent admin bypass for this specific page to enforce strict access control
  const { user } = useAuth();
  const hasFinancialReportAccess = user && user.role && user.role.permissions && (
    user.role.permissions.clientManagement?.auditedFinancial?.viewer === true ||
    user.role.permissions.clientManagement?.auditedFinancial?.editor === true
  );

  // If user doesn't have permission, show access denied
  if (!hasFinancialReportAccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Access Denied
          </h3>
          <p className="text-gray-600 mb-4">
            You don't have permission to access Financial Reports. Please contact your administrator to request "Audited Financial" access.
          </p>
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <p className="text-sm text-red-700">
              Required permission: <span className="font-mono">Audited Financial</span>
            </p>
          </div>
        </div>
      </div>
    );
  }
  
  const tabs = [
    {
      id: "financial_statement",
      name: "Financial Statements",
      icon: DocumentChartBarIcon,
      description: "Annual financial statement documents"
    },
    // {
    //   id: "tax_return",
    //   name: "Tax Returns",
    //   icon: BanknotesIcon,
    //   description: "Annual tax return final documents"
    // },
    {
      id: "other_reports",
      name: "Other Reports",
      icon: ChartBarIcon,
      description: "Additional reports and analytics",
      comingSoon: true
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center space-x-3">
              <ChartBarIcon className="h-8 w-8 text-indigo-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
                <p className="text-gray-600">
                  Manage financial statements, tax returns, and other important documents
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => !tab.comingSoon && setActiveTab(tab.id)}
                className={`${
                  activeTab === tab.id
                    ? "border-indigo-500 text-indigo-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                } ${
                  tab.comingSoon ? "cursor-not-allowed opacity-50" : "cursor-pointer"
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors duration-200`}
                disabled={tab.comingSoon}
              >
                <tab.icon className="h-5 w-5" />
                <span>{tab.name}</span>
                {tab.comingSoon && (
                  <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full ml-2">
                    Coming Soon
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === "financial_statement" && (
          <FinancialDocuments 
            documentType="financial_statement"
            title="Financial Statements"
            description="Upload and manage annual financial statement documents. Maximum 3 documents per year."
          />
        )}
        
        {activeTab === "tax_return" && (
          <FinancialDocuments 
            documentType="tax_return"
            title="Tax Returns"
            description="Upload and manage annual tax return final documents. Maximum 3 documents per year."
          />
        )}

        {activeTab === "other_reports" && (
          <div className="text-center py-12">
            <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              Other Reports
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Additional reporting features are coming soon.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;