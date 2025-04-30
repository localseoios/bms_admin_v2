// This is a new component that displays multiple engagement letters
// Add this to your components directory

import React, { useState, useEffect } from "react";
import {
  DocumentTextIcon,
  ArrowDownTrayIcon,
  XMarkIcon,
  ClockIcon,
  UserIcon,
  InformationCircleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from "@heroicons/react/24/outline";

const EngagementLettersList = ({
  engagementLetters,
  onRemove,
  canRemove = true,
  isLoading = false,
}) => {
  const [expandedDetails, setExpandedDetails] = useState({});

  // If engagementLetters is a string (old format), convert it to array format
  const normalizedLetters = !engagementLetters
    ? []
    : typeof engagementLetters === "string"
    ? [{ fileUrl: engagementLetters, fileName: "Engagement Letter" }]
    : Array.isArray(engagementLetters)
    ? engagementLetters
    : [engagementLetters];

  const toggleDetails = (index) => {
    setExpandedDetails((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  // Function to format file name for display
  const formatFileName = (letter) => {
    // If we have a fileName property, use it
    if (letter.fileName) return letter.fileName;

    // Otherwise, try to extract name from URL
    if (letter.fileUrl) {
      const urlParts = letter.fileUrl.split("/");
      const fileName = urlParts[urlParts.length - 1];
      // Remove any query parameters
      return fileName.split("?")[0];
    }

    // Fallback
    return "Engagement Letter";
  };

  // Function to format date
  const formatDate = (dateString) => {
    if (!dateString) return "Unknown date";

    try {
      const date = new Date(dateString);
      return date.toLocaleDateString() + " " + date.toLocaleTimeString();
    } catch (error) {
      return "Invalid date";
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-4 bg-gray-50 rounded-lg">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
        <span className="ml-2 text-gray-700">
          Loading engagement letters...
        </span>
      </div>
    );
  }

  if (normalizedLetters.length === 0) {
    return (
      <div className="text-center p-6 bg-gray-50 rounded-lg border border-gray-200">
        <DocumentTextIcon className="h-10 w-10 text-gray-400 mx-auto mb-2" />
        <p className="text-gray-500">
          No engagement letters have been uploaded yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {normalizedLetters.map((letter, index) => (
        <div
          key={index}
          className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-all duration-200"
        >
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <DocumentTextIcon className="h-5 w-5 text-indigo-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-gray-900 truncate">
                  {formatFileName(letter)}
                </h4>
                {letter.uploadedAt && (
                  <p className="text-xs text-gray-500 flex items-center">
                    <ClockIcon className="h-3 w-3 mr-1" />
                    {formatDate(letter.uploadedAt)}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <a
                href={letter.fileUrl || letter}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 text-xs font-medium text-indigo-600 hover:text-white hover:bg-indigo-600 bg-indigo-50 rounded-lg shadow-sm border border-indigo-200 hover:shadow-md transition-all duration-200 flex items-center"
              >
                <ArrowDownTrayIcon className="h-3.5 w-3.5 mr-1" />
                View
              </a>

              {canRemove && onRemove && (
                <button
                  onClick={() => onRemove(index)}
                  className="p-1.5 text-red-400 hover:text-white hover:bg-red-500 rounded-lg hover:shadow-md transition-all duration-200"
                  title="Remove document"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              )}

              <button
                onClick={() => toggleDetails(index)}
                className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                title={expandedDetails[index] ? "Hide details" : "Show details"}
              >
                {expandedDetails[index] ? (
                  <ChevronUpIcon className="h-4 w-4" />
                ) : (
                  <ChevronDownIcon className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          {expandedDetails[index] && (
            <div className="px-4 pb-4 pt-1 border-t border-gray-100 bg-gray-50">
              <div className="space-y-2">
                {letter.description && (
                  <div className="text-xs text-gray-700">
                    <span className="font-medium">Description:</span>{" "}
                    {letter.description}
                  </div>
                )}

                {letter.uploadedBy &&
                  typeof letter.uploadedBy === "object" &&
                  letter.uploadedBy.name && (
                    <div className="text-xs text-gray-700 flex items-center">
                      <UserIcon className="h-3 w-3 mr-1" />
                      <span className="font-medium">Uploaded by:</span>{" "}
                      {letter.uploadedBy.name}
                    </div>
                  )}

                <div className="text-xs text-gray-700">
                  <span className="font-medium">URL:</span>
                  <span className="text-gray-500 break-all ml-1">
                    {letter.fileUrl || letter}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      ))}

      <div className="mt-2 p-3 bg-blue-50 rounded-lg border border-blue-100">
        <p className="text-xs text-blue-700 flex items-start">
          <InformationCircleIcon className="h-4 w-4 text-blue-500 mr-1 flex-shrink-0 mt-0.5" />
          <span>
            All engagement letters are shared across all jobs for this client.
            Any changes made here will affect all related jobs.
          </span>
        </p>
      </div>
    </div>
  );
};

export default EngagementLettersList;
