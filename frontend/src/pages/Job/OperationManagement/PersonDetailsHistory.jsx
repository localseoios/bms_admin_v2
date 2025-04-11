import React, { useState, useEffect } from "react";
import { InformationCircleIcon, ClockIcon } from "@heroicons/react/24/outline";
import axiosInstance from "../../../utils/axios";

// Component to display field history on hover
const FieldHistory = ({ fieldName, personId, personType, jobId }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  // Fetch history data when hovering (lazy loading)
  const fetchHistory = async () => {
    if (history.length > 0) return; // Don't fetch if we already have history

    try {
      setLoading(true);
      const response = await axiosInstance.get(
        `/operations/jobs/${jobId}/person-details/${personType}/${personId}/history?field=${fieldName}`
      );

      setHistory(response.data.history || []);
    } catch (error) {
      console.error(`Error fetching history for ${fieldName}:`, error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative inline-block">
      <span
        className="ml-1 inline-flex items-center text-gray-400 hover:text-indigo-500 cursor-help"
        onMouseEnter={() => {
          setShowTooltip(true);
          fetchHistory();
        }}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <ClockIcon className="h-4 w-4" />
      </span>

      {showTooltip && (
        <div className="absolute z-10 w-64 mt-2 -right-2 bg-white rounded-lg shadow-lg border border-gray-200 p-3">
          <div className="flex items-center mb-2 pb-1 border-b border-gray-100">
            <ClockIcon className="h-4 w-4 text-indigo-500 mr-2" />
            <span className="text-sm font-medium text-gray-700">
              Value History
            </span>
          </div>

          {loading ? (
            <div className="flex justify-center py-2">
              <div className="animate-spin h-4 w-4 border-2 border-indigo-500 rounded-full border-t-transparent"></div>
            </div>
          ) : history.length > 0 ? (
            <ul className="space-y-2 max-h-40 overflow-y-auto">
              {history.map((item, index) => (
                <li key={index} className="text-xs">
                  <div className="flex justify-between">
                    <span
                      className={`font-medium ${
                        index === 0 ? "text-indigo-600" : "text-gray-600"
                      }`}
                    >
                      {item.value || "(empty)"}
                    </span>
                    <span className="text-gray-400">
                      {new Date(item.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                  {index === 0 && (
                    <span className="text-xs text-green-600">Current</span>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-gray-500 py-1">No history available</p>
          )}
        </div>
      )}
    </div>
  );
};

// HOC to add history tracking to form inputs
export const withHistory = (Component) => {
  return ({ fieldName, personId, personType, jobId, ...props }) => {
    return (
      <div className="relative w-full">
        <Component {...props} />
        {personId && (
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
            <FieldHistory
              fieldName={fieldName}
              personId={personId}
              personType={personType}
              jobId={jobId}
            />
          </div>
        )}
      </div>
    );
  };
};

// Enhanced input components with history
export const TextInputWithHistory = withHistory(
  ({ value, onChange, className, placeholder, readOnly }) => (
    <input
      type="text"
      value={value}
      onChange={onChange}
      className={className}
      placeholder={placeholder}
      readOnly={readOnly}
    />
  )
);

export const DateInputWithHistory = withHistory(
  ({ value, onChange, className, disabled }) => (
    <input
      type="date"
      value={value}
      onChange={onChange}
      className={className}
      disabled={disabled}
    />
  )
);

export default {
  TextInputWithHistory,
  DateInputWithHistory,
  FieldHistory,
};
