// DocumentViewerModal.jsx
import React from "react";
import { motion } from "framer-motion";
import { XMarkIcon, DocumentTextIcon, CalendarIcon, UserIcon, InformationCircleIcon } from "@heroicons/react/24/outline";

function DocumentViewerModal({ document, onClose }) {
  if (!document) return null;

  // Determine file type to show proper icon or preview
  const isImage = document.fileType?.startsWith("image/");
  const isPdf = document.fileType === "application/pdf";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.9 }}
        className="bg-white rounded-lg shadow-xl max-w-3xl w-full p-6"
      >
        <div className="flex justify-between items-start">
          <h3 className="text-lg font-medium text-gray-900">
            {document.fileName || "Document"}
          </h3>
          <button
            onClick={onClose}
            className="rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <span className="sr-only">Close</span>
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="mt-4">
          <div className="flex items-center text-sm text-gray-500 mb-4">
            <CalendarIcon className="h-4 w-4 mr-1" />
            Uploaded: {document.uploadedAt ? new Date(document.uploadedAt).toLocaleString() : 'Unknown date'}
            {document.uploadedBy && (
              <>
                <span className="mx-2">•</span>
                <UserIcon className="h-4 w-4 mr-1" />
                By: {document.uploadedBy.name || 'Unknown user'}
              </>
            )}
          </div>

          {document.notes && (
            <div className="bg-yellow-50 p-3 rounded-md mb-4 text-sm">
              <div className="flex">
                <InformationCircleIcon className="h-5 w-5 text-yellow-500 mr-2" />
                <p className="text-yellow-700">{document.notes}</p>
              </div>
            </div>
          )}

          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
            {isImage ? (
              <img
                src={document.fileUrl}
                alt={document.fileName || "Document preview"}
                className="max-w-full h-auto mx-auto rounded"
              />
            ) : isPdf && document.fileUrl ? (
              <iframe
                src={document.fileUrl}
                title={document.fileName || "PDF document"}
                className="w-full h-96 rounded border border-gray-300"
              ></iframe>
            ) : (
              <div className="text-center py-10">
                <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">
                  Preview not available. Please download to view.
                </p>
              </div>
            )}
          </div>

          <div className="mt-4 flex justify-end">
            <a
              href={document.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Open Document
            </a>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default DocumentViewerModal;