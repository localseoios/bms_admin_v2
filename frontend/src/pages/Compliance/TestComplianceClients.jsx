import React from 'react';

const TestComplianceClients = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">
          🎉 Compliance Clients Page Working!
        </h1>
        <p className="text-lg text-gray-600">
          This is the dedicated Compliance Clients page - completely separate from KYC Management.
        </p>
        <div className="mt-8 p-6 bg-white rounded-lg shadow-lg">
          <h2 className="text-2xl font-semibold text-green-600 mb-4">Success!</h2>
          <p className="text-gray-700">
            The routing is working correctly. This page is at <code>/compliance/clients</code>
          </p>
        </div>
      </div>
    </div>
  );
};

export default TestComplianceClients;