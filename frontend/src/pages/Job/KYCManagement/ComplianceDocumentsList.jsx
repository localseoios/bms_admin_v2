// ComplianceDocumentsList.js
import React from "react";
import { ArrowDownTrayIcon, DocumentTextIcon } from "@heroicons/react/24/outline";

function ComplianceDocumentsList({ documents, onViewDocument }) {
  if (!documents || documents.length === 0) {
    return (
      <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
        <p className="text-sm text-gray-500 text-center">
          No compliance documents available for this job.
        </p>
      </div>
    );
  }

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <div className="bg-blue-50 px-4 py-3 border-b border-gray-200">
        <h3 className="text-sm font-medium text-blue-800">
          Compliance Documents ({documents.length})
        </h3>
      </div>
      <ul className="divide-y divide-gray-200">
        {documents.map((doc, index) => (
          <li 
            key={index} 
            className="px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer"
            onClick={() => onViewDocument && onViewDocument(doc)}
          >
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <DocumentTextIcon className="h-5 w-5 text-blue-500" />
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-gray-900">
                  {doc.fileName || "Document"}
                </p>
                <p className="text-xs text-gray-500">
                  Uploaded: {new Date(doc.uploadedAt).toLocaleString()}
                </p>
                <p className="text-xs text-gray-500">
                  Type: {doc.documentType || "Standard Document"}
                </p>
                {doc.notes && (
                  <p className="text-xs text-gray-600 mt-1">{doc.notes}</p>
                )}
              </div>
              <div className="ml-2">
                <a
                  href={doc.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  onClick={(e) => e.stopPropagation()}
                >
                  <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
                  View
                </a>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default ComplianceDocumentsList;