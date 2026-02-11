import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion"; // eslint-disable-line no-unused-vars
import AutoSuggestPersonInput from "../../../components/AutoSuggestPersonInput";
import {
  ArrowLeftIcon,
  DocumentTextIcon,
  CloudArrowUpIcon,
  XMarkIcon,
  CheckIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  UserIcon,
  CalendarIcon,
  BuildingOfficeIcon,
  MapPinIcon,
  EnvelopeIcon,
  PencilIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  DocumentDuplicateIcon,
  DocumentCheckIcon,
  LightBulbIcon,
  BriefcaseIcon,
  ShieldCheckIcon,
  InformationCircleIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  PlusIcon,
  DocumentArrowDownIcon,
  DocumentArrowUpIcon,
  EyeIcon,
  TrashIcon,
  XCircleIcon
} from "@heroicons/react/24/outline";
import axiosInstance from "../../../utils/axios";
import {
  TextInputWithHistory,
  DateInputWithHistory,
  TextInputWithHistoryAndAutoSuggest,
} from "./PersonDetailsHistory";
import * as XLSX from "xlsx";
import operationService from "../../../utils/operationService";



function JobDetails() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Main state for the job
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form states
  const [engagementLetter, setEngagementLetter] = useState(null);
  const [engagementLetters, setEngagementLetters] = useState([]);

  const [isDragging, setIsDragging] = useState(false);

  // Timeline state
  const [timeline, setTimeline] = useState([]);
  const [timelineLoading, setTimelineLoading] = useState(false);
  const [showTimeline, setShowTimeline] = useState(true); // State to control timeline visibility

  // Action states
  const [submitting, setSubmitting] = useState(false);
  const [actionMessage, setActionMessage] = useState({
    type: null,
    message: null,
  }); // <-- Added closing parenthesis and semicolon here

  // Person details tabs
  const [activeTab, setActiveTab] = useState("company");

  // State for highlighting expiring document field
  const [highlightedField, setHighlightedField] = useState(null);

  // Edit mode state for company details
  const [editingCompanyDetails, setEditingCompanyDetails] = useState(false);
  const [originalCompanyDetails, setOriginalCompanyDetails] = useState(null);

  // Add state for multiple CR Extract files
  const [crExtractFiles, setCrExtractFiles] = useState([]);

  const [companyMemoFiles, setCompanyMemoFiles] = useState([]);
const [deletedCompanyMemoIds, setDeletedCompanyMemoIds] = useState([]); // ADD THIS

  const [editingCrNo, setEditingCrNo] = useState(false);
  const [crNoValue, setCrNoValue] = useState('');
  const [savingCrNo, setSavingCrNo] = useState(false);

  const DIRECTOR_SUGGESTIONS = [
    {
      name: "Mr Sarath Kumara Ganegoda Hitiarachchige",
      nationality: "Sri Lankan",
      email: "sarath@newoon.com",
      mobileNo: "33631831",
      qidNo: "27914405663",
      passportNo: "P0196918",
    },
  ];

  

  // Fixed AutoSuggestInput component
  const AutoSuggestInput = ({
    label,
    value,
    onChange,
    onSuggestionSelect,
    suggestions = [],
    fieldKey,
    placeholder,
    className = "",
    disabled = false,
    showPreFilled = false,
  }) => {
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [filteredSuggestions, setFilteredSuggestions] = useState([]);
    const inputRef = useRef(null);
    const suggestionsRef = useRef(null);

    // Memoize filtered suggestions to prevent unnecessary recalculations
    const memoizedFilteredSuggestions = useMemo(() => {
      if (value && value.length > 0) {
        return suggestions.filter((suggestion) =>
          suggestion[fieldKey]?.toLowerCase().includes(value.toLowerCase())
        );
      }
      return suggestions;
    }, [value, suggestions, fieldKey]);

    useEffect(() => {
      setFilteredSuggestions(memoizedFilteredSuggestions);
      setShowSuggestions(
        memoizedFilteredSuggestions.length > 0 && value && value.length > 0
      );
    }, [memoizedFilteredSuggestions, value]);

    // CRITICAL FIX: Prevent focus loss during typing
    const handleInputChange = useCallback(
      (e) => {
        const inputValue = e.target.value;

        // Store current cursor position
        const cursorPosition = e.target.selectionStart;

        // Call the parent onChange directly - this will trigger re-render
        onChange(e);

        // Restore focus and cursor position after state update
        requestAnimationFrame(() => {
          if (inputRef.current) {
            inputRef.current.focus();
            inputRef.current.setSelectionRange(cursorPosition, cursorPosition);
          }
        });

        // Show suggestions if there's input and suggestions exist
        if (inputValue.length > 0 && suggestions.length > 0) {
          setShowSuggestions(true);
        } else {
          setShowSuggestions(false);
        }
      },
      [onChange, suggestions.length]
    );

    const handleSuggestionClick = useCallback(
      (suggestion) => {
        onSuggestionSelect(suggestion);
        setShowSuggestions(false);

        // Maintain focus on input after selection
        if (inputRef.current) {
          setTimeout(() => {
            inputRef.current.focus();
          }, 0);
        }
      },
      [onSuggestionSelect]
    );

    const handleInputFocus = useCallback(() => {
      if (suggestions.length > 0 && (!value || value.length === 0)) {
        setFilteredSuggestions(suggestions);
        setShowSuggestions(true);
      }
    }, [suggestions, value]);

    // Improved click outside handler with useCallback
    const handleClickOutside = useCallback((e) => {
      if (
        inputRef.current &&
        !inputRef.current.contains(e.target) &&
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target)
      ) {
        setShowSuggestions(false);
      }
    }, []);

    useEffect(() => {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }, [handleClickOutside]);

    // Handle keyboard navigation
    const handleKeyDown = useCallback((e) => {
      // Prevent form submission on Enter
      if (e.key === "Enter") {
        e.preventDefault();
        setShowSuggestions(false);
      }
      // Allow normal typing and don't interfere with input
    }, []);

    return (
      <div className="relative">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {showPreFilled && (
            <span className="ml-2 text-xs text-indigo-600">
              <CheckCircleIcon className="h-4 w-4 inline" /> Pre-filled
            </span>
          )}
        </label>
        <input
          ref={inputRef}
          type="text"
          value={value || ""} // Ensure controlled input
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          className={`block w-full rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${className}`}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete="off" // Prevent browser autocomplete interference
        />

        {showSuggestions && filteredSuggestions.length > 0 && (
          <div
            ref={suggestionsRef}
            className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto"
          >
            {filteredSuggestions.map((suggestion, index) => (
              <div
                key={`${suggestion[fieldKey]}-${index}`} // Stable key
                onClick={() => handleSuggestionClick(suggestion)}
                className="px-4 py-3 cursor-pointer hover:bg-indigo-50 border-b border-gray-100 last:border-b-0 transition-colors"
              >
                <div className="flex items-start space-x-3">
                  <div className="p-2 bg-indigo-100 rounded-lg flex-shrink-0">
                    <UserIcon className="h-4 w-4 text-indigo-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {suggestion.name}
                    </p>
                    <div className="text-xs text-gray-500 space-y-1 mt-1">
                      <p>
                        <span className="font-medium">Nationality:</span>{" "}
                        {suggestion.nationality}
                      </p>
                      <p>
                        <span className="font-medium">Email:</span>{" "}
                        {suggestion.email}
                      </p>
                      <p>
                        <span className="font-medium">Mobile:</span>{" "}
                        {suggestion.mobileNo}
                      </p>
                      <p>
                        <span className="font-medium">QID:</span>{" "}
                        {suggestion.qidNo}
                      </p>
                      <p>
                        <span className="font-medium">Passport:</span>{" "}
                        {suggestion.passportNo}
                      </p>
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    <div className="bg-green-100 p-1 rounded-full">
                      <CheckCircleIcon className="h-4 w-4 text-green-600" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const createFocusPreservingHandler = (index, field, details, setDetails) => {
    return (e) => {
      const inputValue = e.target.value;
      const cursorPosition = e.target.selectionStart;
      const inputElement = e.target;

      // Update state
      const newDetails = [...details];
      newDetails[index] = {
        ...newDetails[index],
        [field]: inputValue,
      };
      setDetails(newDetails);

      // Preserve focus and cursor position
      requestAnimationFrame(() => {
        if (inputElement) {
          inputElement.focus();
          inputElement.setSelectionRange(cursorPosition, cursorPosition);
        }
      });
    };
  };

  const createFocusPreservingHandlerForField = (
    index,
    field,
    details,
    setDetails
  ) => {
    return (e) => {
      const inputValue = e.target.value;
      const cursorPosition = e.target.selectionStart;
      const inputElement = e.target;

      // Update state
      const newDetails = [...details];
      newDetails[index] = {
        ...newDetails[index],
        [field]: inputValue,
      };
      setDetails(newDetails);

      // Preserve focus and cursor position
      requestAnimationFrame(() => {
        if (inputElement) {
          inputElement.focus();
          inputElement.setSelectionRange(cursorPosition, cursorPosition);
        }
      });
    };
  };

  // Add this state management inside your JobDetails component (add to existing state declarations)
  const [autoFilledEntries, setAutoFilledEntries] = useState({});

  // Add this function to handle suggestion selection
  const handleSuggestionSelect = (section, index, suggestion) => {
    const updateState = {
      director: setDirectorDetails,
      shareholder: setShareholderDetails,
      secretary: setSecretaryDetails,
      sef: setSefDetails,
    }[section];

    updateState((prev) => {
      const newDetails = [...prev];
      newDetails[index] = {
        ...newDetails[index],
        name: suggestion.name,
        nationality: suggestion.nationality,
        email: suggestion.email,
        mobileNo: suggestion.mobileNo,
        qidNo: suggestion.qidNo,
        passportNo: suggestion.passportNo,
      };
      return newDetails;
    });

    // Track which entry was auto-filled
    setAutoFilledEntries((prev) => ({
      ...prev,
      [`${section}-${index}`]: suggestion,
    }));

    // Show success message
    setActionMessage({
      type: "success",
      message: `Director details auto-filled for "${suggestion.name}". You can edit any field as needed.`,
    });

    setTimeout(() => {
      setActionMessage({ type: null, message: null });
    }, 4000);
  };

const handleDeleteEngagementLetter = async (letterId, letterFileName) => {
  // Show confirmation dialog
  if (!window.confirm(`Are you sure you want to delete "${letterFileName}"? This action cannot be undone and will remove the letter from all jobs for this client.`)) {
    return;
  }

  try {
    setSubmitting(true);
    setActionMessage({
      type: "info",
      message: "Deleting engagement letter...",
    });

    // Call the delete API
    const response = await axiosInstance.delete(
      `/operations/jobs/${jobId}/engagement-letter/${letterId}`
    );

    // Update the company details state to remove the deleted letter
    setCompanyDetails(prevDetails => ({
      ...prevDetails,
      engagementLetters: prevDetails.engagementLetters.filter(
        letter => letter._id !== letterId
      )
    }));

    setActionMessage({
      type: "success",
      message: `Engagement letter "${letterFileName}" deleted successfully`,
    });

    // Refresh company details to get updated data
    try {
      const updatedResponse = await axiosInstance.get(
        `/operations/jobs/${jobId}/company-details`
      );
      setCompanyDetails(updatedResponse.data);
    } catch (refreshError) {
      console.error("Error refreshing company details:", refreshError);
    }

    setTimeout(() => {
      setActionMessage({ type: null, message: null });
    }, 3000);

  } catch (error) {
    console.error("Error deleting engagement letter:", error);
    setActionMessage({
      type: "error",
      message: error.response?.data?.message || "Failed to delete engagement letter",
    });

    setTimeout(() => {
      setActionMessage({ type: null, message: null });
    }, 5000);
  } finally {
    setSubmitting(false);
  }
};

const handleReplaceEngagementLetter = async (letterId, letterFileName, file) => {
  if (!file) return;

  try {
    setSubmitting(true);
    setActionMessage({
      type: "info",
      message: "Replacing engagement letter...",
    });

    const formData = new FormData();
    formData.append("engagementLetter", file);

    const response = await axiosInstance.put(
      `/operations/jobs/${jobId}/engagement-letter/${letterId}/replace`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    setActionMessage({
      type: "success",
      message: `Engagement letter replaced successfully. Old document archived.`,
    });

    try {
      const updatedResponse = await axiosInstance.get(
        `/operations/jobs/${jobId}/company-details`
      );
      setCompanyDetails(updatedResponse.data);
    } catch (refreshError) {
      console.error("Error refreshing company details:", refreshError);
    }

    setTimeout(() => {
      setActionMessage({ type: null, message: null });
    }, 3000);

  } catch (error) {
    console.error("Error replacing engagement letter:", error);
    setActionMessage({
      type: "error",
      message: error.response?.data?.message || "Failed to replace engagement letter",
    });

    setTimeout(() => {
      setActionMessage({ type: null, message: null });
    }, 5000);
  } finally {
    setSubmitting(false);
  }
};

const handleCompanyMemoFileChange = (files) => {
  const fileArray = Array.from(files);
  // Limit to 10 files maximum
  const limitedFiles = fileArray.slice(0, 10);
  setCompanyMemoFiles(limitedFiles);
};

// Add function to remove Company Memo file
const removeCompanyMemoFile = (index) => {
  setCompanyMemoFiles((prev) => prev.filter((_, i) => i !== index));
};

// ADD THIS FUNCTION to handle individual Company Memo deletion
const handleDeleteCompanyMemo = async (memoId, memoFileName, index) => {
  // Show confirmation dialog
  if (!window.confirm(`Are you sure you want to delete "${memoFileName}"? This action cannot be undone.`)) {
    return;
  }

  try {
    setSubmitting(true);
    setActionMessage({
      type: "info",
      message: "Deleting company memo...",
    });

    // Remove from local state immediately for better UX
    const newCompanyMemo = [...companyDetails.companyMemo];
    newCompanyMemo.splice(index, 1);
    setCompanyDetails({
      ...companyDetails,
      companyMemo: newCompanyMemo
    });

    // Track the deleted ID to send to backend
    setDeletedCompanyMemoIds(prev => [...prev, memoId]);

    setActionMessage({
      type: "success",
      message: `Company memo "${memoFileName}" will be deleted when you save`,
    });

    setTimeout(() => {
      setActionMessage({ type: null, message: null });
    }, 3000);

  } catch (error) {
    console.error("Error marking company memo for deletion:", error);
    setActionMessage({
      type: "error",
      message: "Failed to mark company memo for deletion",
    });

    setTimeout(() => {
      setActionMessage({ type: null, message: null });
    }, 5000);
  } finally {
    setSubmitting(false);
  }
};




  // Update the renderPersonDetails function to include auto-suggestion
  // Replace the Name input section in your renderPersonDetails function with this:
  // COMPLETE renderPersonDetailsWithAutoSuggest function
  // Replace the existing incomplete function with this complete version

  const renderPersonDetailsWithAutoSuggest = (section, details, setDetails) => (
    <div className="space-y-6">
      {/* Auto-suggestion notification banner */}
      {autoFilledEntries[`${section}-0`] && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <CheckCircleIcon className="h-5 w-5 text-green-600 mr-2" />
              <span className="text-sm font-medium text-green-800">
                {section.charAt(0).toUpperCase() + section.slice(1)} details
                auto-filled
              </span>
            </div>
            <button
              onClick={() =>
                setAutoFilledEntries((prev) => ({
                  ...prev,
                  [`${section}-0`]: null,
                }))
              }
              className="text-green-600 hover:text-green-800"
            >
              <XMarkIcon className="h-3 w-3 sm:h-4 sm:w-4" />
            </button>
          </div>
          <p className="text-sm text-green-700 mt-1">
            Details for "{autoFilledEntries[`${section}-0`]?.name}" have been
            populated. You can edit any field as needed.
          </p>
        </div>
      )}

      {/* Add this at the top of your component's return statement */}
      {job &&
        job.timeline?.some((event) =>
          event.description?.includes("auto-populated")
        ) && (
          <div className="sticky top-0 z-50 bg-blue-100 border-l-4 border-blue-500 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <InformationCircleIcon
                  className="h-5 w-5 text-blue-500"
                  aria-hidden="true"
                />
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-700">
                  Some information has been auto-populated from other jobs for
                  the same client ({job.gmail}).
                </p>
              </div>
            </div>
          </div>
        )}

      {details.map((entry, index) => (
        <div
          key={entry._id || `${section}-entry-${index}`} // Use stable key
          className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-all duration-300"
        >
          <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100">
            <div className="flex items-center">
              <div className="bg-indigo-100 rounded-lg p-2 mr-3">
                <UserIcon className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-800">
                  Entry {index + 1}
                </h3>
                {autoFilledEntries[`${section}-${index}`] && (
                  <span className="ml-2 text-xs text-green-600 bg-green-100 px-2 py-0.5 rounded-full">
                    Auto-filled
                  </span>
                )}
                {/* Auto-populated badge */}
                {job &&
                  job.timeline?.some((event) =>
                    event.description?.includes(
                      `${section} details auto-populated`
                    )
                  ) && (
                    <span className="ml-2 text-xs text-green-600 bg-green-100 px-2 py-0.5 rounded-full">
                      Auto-populated
                    </span>
                  )}
              </div>
            </div>
            {details.length > 1 && (
              <button
                onClick={() => handleDeletePersonEntry(section, index)}
                className="text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-50 transition-colors"
                title="Remove entry"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Name Field with Auto-suggestion */}
            <div className="space-y-1">
              <AutoSuggestInput
                label="Name"
                value={entry.name || ""}
                onChange={(e) => {
                  // Fixed: Use createFocusPreservingHandler pattern
                  const inputValue = e.target.value;
                  const cursorPosition = e.target.selectionStart;
                  const inputElement = e.target;

                  // Update state with deep copy to prevent reference issues
                  const newDetails = [...details];
                  newDetails[index] = {
                    ...newDetails[index],
                    name: inputValue
                  };
                  setDetails(newDetails);

                  // Preserve focus and cursor position
                  requestAnimationFrame(() => {
                    if (inputElement) {
                      inputElement.focus();
                      inputElement.setSelectionRange(
                        cursorPosition,
                        cursorPosition
                      );
                    }
                  });
                }}
                onSuggestionSelect={(suggestion) =>
                  handleSuggestionSelect(section, index, suggestion)
                }
                suggestions={DIRECTOR_SUGGESTIONS}
                fieldKey="name"
                placeholder="Enter full name or start typing to see suggestions"
                className={`mt-1 block w-full rounded-lg ${
                  autoFilledEntries[`${section}-${index}`] ||
                  (job &&
                    job.timeline?.some((event) =>
                      event.description?.includes(
                        `${section} details auto-populated`
                      )
                    ) &&
                    entry.name)
                    ? "bg-indigo-50 border-indigo-300"
                    : "border-gray-300"
                } shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition-colors`}
                showPreFilled={
                  !!autoFilledEntries[`${section}-${index}`] ||
                  (job &&
                    job.timeline?.some((event) =>
                      event.description?.includes(
                        `${section} details auto-populated`
                      )
                    ) &&
                    entry.name)
                }
              />
            </div>

            {/* Nationality Field with Auto-suggestion */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">
                Nationality
                {job &&
                  job.timeline?.some((event) =>
                    event.description?.includes(
                      `${section} details auto-populated`
                    )
                  ) &&
                  entry.nationality && (
                    <span className="ml-2 text-xs text-indigo-600">
                      <CheckCircleIcon className="h-4 w-4 inline" /> Pre-filled
                    </span>
                  )}
              </label>
              <input
                type="text"
                value={entry.nationality || ""} // Ensure controlled input
                onChange={(e) => {
                  const newDetails = [...details];
                  newDetails[index] = {
                    ...newDetails[index],
                    nationality: e.target.value,
                  };
                  setDetails(newDetails);
                }}
                className={`mt-1 block w-full rounded-lg ${
                  job &&
                  job.timeline?.some((event) =>
                    event.description?.includes(
                      `${section} details auto-populated`
                    )
                  ) &&
                  entry.nationality
                    ? "bg-indigo-50 border-indigo-300"
                    : "border-gray-300"
                } shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition-colors`}
                placeholder="Enter nationality"
                autoComplete="off"
                // REMOVED: onKeyDown handler that was preventing normal typing
              />
            </div>

            {/* Visa Copy Upload - HIDDEN */}
            {/* <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                <DocumentTextIcon className="h-4 w-4 mr-1 text-indigo-500" />
                Visa Copy
                {job &&
                  job.timeline?.some((event) =>
                    event.description?.includes(
                      `${section} details auto-populated`
                    )
                  ) &&
                  entry.visaCopy && (
                    <span className="ml-2 text-xs text-indigo-600">
                      <CheckCircleIcon className="h-4 w-4 inline" /> Pre-filled
                    </span>
                  )}
              </label>
              <div
                className={`border-2 rounded-lg p-3 transition-all duration-300 ${
                  isDragging
                    ? "border-indigo-500 bg-indigo-50 shadow-md"
                    : entry.visaCopy
                    ? "border-green-400 bg-green-50/40 shadow-md"
                    : "border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/30 hover:shadow-md"
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handlePersonDrop(e, section, "visaCopy", index)}
              >
                {entry.visaCopy ? (
                  <div className="flex items-center justify-between bg-white p-3 rounded-lg shadow-sm border border-gray-100">
                    <div className="flex items-center flex-1 min-w-0">
                      <div className="bg-indigo-100 p-2 rounded-lg mr-3">
                        <DocumentTextIcon className="h-5 w-5 text-indigo-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium text-gray-900 truncate block">
                          {entry.visaCopy instanceof File
                            ? entry.visaCopy.name
                            : "Visa Copy Document"}
                        </span>
                        <span className="text-xs text-green-600 flex items-center">
                          <CheckCircleIcon className="h-3 w-3 mr-1" /> Uploaded
                          {job &&
                            job.timeline?.some((event) =>
                              event.description?.includes(
                                `${section} details auto-populated`
                              )
                            ) &&
                            typeof entry.visaCopy === "string" && (
                              <span className="ml-2 bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full text-xs">
                                Auto-filled
                              </span>
                            )}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center ml-4">
                      {typeof entry.visaCopy === "string" && (
                        <a
                          href={entry.visaCopy}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mr-2 px-3 py-1.5 text-xs font-medium text-indigo-600 hover:text-white hover:bg-indigo-600 bg-indigo-50 rounded-lg shadow-sm border border-indigo-200 hover:shadow-md transition-all duration-200"
                        >
                          View Document
                        </a>
                      )}
                      <button
                        onClick={() => {
                          if (entry._id) {
                            handleDeletePersonDocument(section, entry._id, 'visaCopy')
                          } else {
                            handlePersonFileChange(section, "visaCopy", index, null)
                          }
                        }}
                        disabled={submitting}
                        className={`p-1.5 text-red-400 hover:text-white hover:bg-red-500 rounded-lg hover:shadow-md transition-all duration-200 ${
                          submitting ? "opacity-50 cursor-not-allowed" : ""
                        }`}
                        title="Delete document permanently"
                      >
                        <XMarkIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <div className="bg-gray-100/80 mx-auto rounded-full w-14 h-14 flex items-center justify-center mb-2">
                      <CloudArrowUpIcon className="h-7 w-7 text-gray-400" />
                    </div>
                    <div className="mt-2">
                      <label className="cursor-pointer block">
                        <span className="relative px-4 py-2 rounded-md font-medium text-sm text-white bg-gradient-to-r from-indigo-600 to-blue-500 hover:from-indigo-700 hover:to-blue-600 shadow-sm transition-all duration-200 hover:shadow-md">
                          Choose File
                        </span>
                        <input
                          type="file"
                          className="sr-only"
                          onChange={(e) =>
                            handlePersonFileChange(
                              section,
                              "visaCopy",
                              index,
                              e.target.files[0]
                            )
                          }
                        />
                      </label>
                      <p className="text-xs text-gray-500 mt-2">
                        or drag and drop your Visa Copy document here
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div> */}

            {/* QID Details Section */}
            <div
              id={`expiry-field-${section}-qid-${index}`}
              data-person-name={entry.name || ''}
              className={`col-span-2 p-4 rounded-lg border transition-all duration-500 ${
                highlightedField === `expiry-field-${section}-qid-${index}`
                  ? 'ring-4 ring-yellow-400 bg-yellow-100 shadow-xl animate-pulse border-yellow-400'
                  : 'bg-gradient-to-r from-blue-50/50 to-indigo-50/50 border-indigo-100/50'
              }`}
            >
              <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center">
                <UserIcon className="h-4 w-4 mr-1 text-indigo-500" />
                QID Details
                {job &&
                  job.timeline?.some((event) =>
                    event.description?.includes(
                      `${section} details auto-populated`
                    )
                  ) &&
                  entry.qidNo && (
                    <span className="ml-2 text-xs text-indigo-600">
                      <CheckCircleIcon className="h-4 w-4 inline" /> Pre-filled
                    </span>
                  )}
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    QID Number
                  </label>
                  <input
                    type="text"
                    value={entry.qidNo || ""}
                    onChange={createFocusPreservingHandlerForField(
                      index,
                      "qidNo",
                      details,
                      setDetails
                    )}
                    className="..."
                    placeholder="QID Number"
                    autoComplete="off"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    Expiry Date
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="date"
                      value={entry.qidExpiry || ""}
                      onChange={(e) => {
                        const newDetails = [...details];
                        newDetails[index] = {
                          ...newDetails[index],
                          qidExpiry: e.target.value
                        };
                        setDetails(newDetails);
                      }}
                      className={`block w-full rounded-lg ${
                        job &&
                        job.timeline?.some((event) =>
                          event.description?.includes(
                            `${section} details auto-populated`
                          )
                        ) &&
                        entry.qidExpiry
                          ? "bg-indigo-50 border-indigo-300"
                          : "border-gray-300"
                      } shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition-colors`}
                    />
                    <button
                      onClick={() =>
                        handleRenewDate(section, "qidExpiry", index)
                      }
                      className="p-2 text-gray-400 hover:text-indigo-500 rounded-lg hover:bg-indigo-50 transition-colors"
                      title="Renew for one year"
                    >
                      <ArrowPathIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    QID Document
                  </label>
                  <div
                    className={`border-2 rounded-lg p-2 h-10 flex items-center justify-center transition-all duration-300 ${
                      entry.qidDoc
                        ? "border-green-400 bg-green-50/40 shadow-sm"
                        : "border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/30"
                    }`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) =>
                      handlePersonDrop(e, section, "qidDoc", index)
                    }
                  >
                    {entry.qidDoc ? (
                      <div className="flex items-center justify-between w-full px-2">
                        <div className="flex items-center text-xs text-green-600">
                          <CheckCircleIcon className="h-3 w-3 mr-1" /> Uploaded
                          {job &&
                            job.timeline?.some((event) =>
                              event.description?.includes(
                                `${section} details auto-populated`
                              )
                            ) &&
                            typeof entry.qidDoc === "string" && (
                              <span className="ml-2 bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full text-xs">
                                Auto-filled
                              </span>
                            )}
                        </div>
                        <div className="flex items-center gap-1">
                          {typeof entry.qidDoc === "string" && (
                            <a
                              href={entry.qidDoc}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2 py-0.5 text-xs font-medium text-indigo-600 hover:text-white hover:bg-indigo-600 bg-indigo-50 rounded-lg shadow-sm border border-indigo-200 hover:shadow-md transition-all duration-200"
                            >
                              View
                            </a>
                          )}
                          {entry._id && typeof entry.qidDoc === "string" && (
                            <label className="cursor-pointer">
                              <span className="p-0.5 text-green-500 hover:text-white hover:bg-green-500 rounded-lg hover:shadow-md transition-all duration-200 inline-flex" title="Replace (archive old to Library)">
                                <ArrowPathIcon className="h-3 w-3" />
                              </span>
                              <input
                                type="file"
                                className="sr-only"
                                onChange={(e) => {
                                  if (e.target.files[0]) {
                                    handleReplacePersonDocument(section, entry._id, 'qidDoc', e.target.files[0]);
                                  }
                                }}
                              />
                            </label>
                          )}
                          <button
                            onClick={() => {
                              if (entry._id) {
                                handleDeletePersonDocument(section, entry._id, 'qidDoc')
                              } else {
                                handlePersonFileChange(section, "qidDoc", index, null)
                              }
                            }}
                            disabled={submitting}
                            className={`p-0.5 text-red-400 hover:text-white hover:bg-red-500 rounded-lg hover:shadow-md transition-all duration-200 ${
                              submitting ? "opacity-50 cursor-not-allowed" : ""
                            }`}
                            title="Delete permanently"
                          >
                            <XMarkIcon className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <label className="cursor-pointer text-center block w-full">
                        <div className="flex items-center justify-center text-gray-400 hover:text-indigo-500 transition-colors">
                          <CloudArrowUpIcon className="h-4 w-4 mr-1" />
                          <span className="text-xs">Upload QID</span>
                        </div>
                        <input
                          type="file"
                          className="sr-only"
                          onChange={(e) =>
                            handlePersonFileChange(
                              section,
                              "qidDoc",
                              index,
                              e.target.files[0]
                            )
                          }
                        />
                      </label>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* National Address Section */}
            <div
              id={`expiry-field-${section}-nationalAddress-${index}`}
              data-person-name={entry.name || ''}
              className={`col-span-2 p-4 rounded-lg border transition-all duration-500 ${
                highlightedField === `expiry-field-${section}-nationalAddress-${index}`
                  ? 'ring-4 ring-yellow-400 bg-yellow-100 shadow-xl animate-pulse border-yellow-400'
                  : 'bg-gradient-to-r from-blue-50/50 to-indigo-50/50 border-indigo-100/50'
              }`}
            >
              <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center">
                <MapPinIcon className="h-4 w-4 mr-1 text-indigo-500" />
                National Address
                {job &&
                  job.timeline?.some((event) =>
                    event.description?.includes(
                      `${section} details auto-populated`
                    )
                  ) &&
                  entry.nationalAddress && (
                    <span className="ml-2 text-xs text-indigo-600">
                      <CheckCircleIcon className="h-4 w-4 inline" /> Pre-filled
                    </span>
                  )}
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="col-span-2">
                  <input
                    type="text"
                    value={entry.nationalAddress || ""}
                    onChange={(e) => {
                      const newDetails = [...details];
                      newDetails[index] = {
                        ...newDetails[index],
                        nationalAddress: e.target.value
                      };
                      setDetails(newDetails);
                    }}
                    className={`block w-full rounded-lg ${
                      job &&
                      job.timeline?.some((event) =>
                        event.description?.includes(
                          `${section} details auto-populated`
                        )
                      ) &&
                      entry.nationalAddress
                        ? "bg-indigo-50 border-indigo-300"
                        : "border-gray-300"
                    } shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition-colors`}
                    placeholder="Enter national address"
                  />
                </div>
                <div className="col-span-2">
                  <div
                    className={`border-2 rounded-lg p-3 transition-all duration-300 ${
                      isDragging
                        ? "border-indigo-500 bg-indigo-50 shadow-md"
                        : entry.nationalAddressDoc
                        ? "border-green-400 bg-green-50/40 shadow-md"
                        : "border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/30 hover:shadow-md"
                    }`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) =>
                      handlePersonDrop(e, section, "nationalAddressDoc", index)
                    }
                  >
                    {entry.nationalAddressDoc ? (
                      <div className="flex items-center justify-between bg-white p-3 rounded-lg shadow-sm border border-gray-100">
                        <div className="flex items-center flex-1 min-w-0">
                          <div className="bg-indigo-100 p-2 rounded-lg mr-3">
                            <DocumentTextIcon className="h-5 w-5 text-indigo-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="text-sm font-medium text-gray-900 truncate block">
                              {entry.nationalAddressDoc instanceof File
                                ? entry.nationalAddressDoc.name
                                : "National Address Document"}
                            </span>
                            <span className="text-xs text-green-600 flex items-center">
                              <CheckCircleIcon className="h-3 w-3 mr-1" />{" "}
                              Uploaded
                              {job &&
                                job.timeline?.some((event) =>
                                  event.description?.includes(
                                    `${section} details auto-populated`
                                  )
                                ) &&
                                typeof entry.nationalAddressDoc ===
                                  "string" && (
                                  <span className="ml-2 bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full text-xs">
                                    Auto-filled
                                  </span>
                                )}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 ml-4">
                          {typeof entry.nationalAddressDoc === "string" && (
                            <a
                              href={entry.nationalAddressDoc}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-1.5 text-xs font-medium text-indigo-600 hover:text-white hover:bg-indigo-600 bg-indigo-50 rounded-lg shadow-sm border border-indigo-200 hover:shadow-md transition-all duration-200"
                            >
                              View Document
                            </a>
                          )}
                          {entry._id && typeof entry.nationalAddressDoc === "string" && (
                            <label className="cursor-pointer">
                              <span className="p-1.5 text-green-500 hover:text-white hover:bg-green-500 rounded-lg hover:shadow-md transition-all duration-200 inline-flex" title="Replace (archive old to Library)">
                                <ArrowPathIcon className="h-4 w-4" />
                              </span>
                              <input
                                type="file"
                                className="sr-only"
                                onChange={(e) => {
                                  if (e.target.files[0]) {
                                    handleReplacePersonDocument(section, entry._id, 'nationalAddressDoc', e.target.files[0]);
                                  }
                                }}
                              />
                            </label>
                          )}
                          <button
                            onClick={() => {
                              if (entry._id) {
                                handleDeletePersonDocument(section, entry._id, 'nationalAddressDoc')
                              } else {
                                handlePersonFileChange(section, "nationalAddressDoc", index, null)
                              }
                            }}
                            className="p-1.5 text-red-400 hover:text-white hover:bg-red-500 rounded-lg hover:shadow-md transition-all duration-200"
                            title="Delete document permanently"
                          >
                            <XMarkIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <div className="bg-gray-100/80 mx-auto rounded-full w-12 h-12 flex items-center justify-center mb-2">
                          <CloudArrowUpIcon className="h-6 w-6 text-gray-400" />
                        </div>
                        <div className="mt-1">
                          <label className="cursor-pointer block">
                            <span className="relative px-4 py-1.5 rounded-md font-medium text-sm text-white bg-gradient-to-r from-indigo-600 to-blue-500 hover:from-indigo-700 hover:to-blue-600 shadow-sm transition-all duration-200 hover:shadow-md">
                              Upload Address Document
                            </span>
                            <input
                              type="file"
                              className="sr-only"
                              onChange={(e) =>
                                handlePersonFileChange(
                                  section,
                                  "nationalAddressDoc",
                                  index,
                                  e.target.files[0]
                                )
                              }
                            />
                          </label>
                          <p className="text-xs text-gray-500 mt-1">
                            or drag and drop here
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="w-full space-y-1">
                    <label className="block text-xs text-gray-500">
                      Expiry Date
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="date"
                        value={entry.nationalAddressExpiry || ""}
                        onChange={(e) => {
                          const newDetails = [...details];
                          newDetails[index] = {
                            ...newDetails[index],
                            nationalAddressExpiry: e.target.value
                          };
                          setDetails(newDetails);
                        }}
                        className={`block w-full rounded-lg ${
                          job &&
                          job.timeline?.some((event) =>
                            event.description?.includes(
                              `${section} details auto-populated`
                            )
                          ) &&
                          entry.nationalAddressExpiry
                            ? "bg-indigo-50 border-indigo-300"
                            : "border-gray-300"
                        } shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition-colors`}
                      />
                      <button
                        onClick={() =>
                          handleRenewDate(
                            section,
                            "nationalAddressExpiry",
                            index
                          )
                        }
                        className="p-2 text-gray-400 hover:text-indigo-500 rounded-lg hover:bg-indigo-50 transition-colors"
                        title="Renew for one year"
                      >
                        <ArrowPathIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Passport Details Section */}
            <div
              id={`expiry-field-${section}-passport-${index}`}
              data-person-name={entry.name || ''}
              className={`col-span-2 p-4 rounded-lg border transition-all duration-500 ${
                highlightedField === `expiry-field-${section}-passport-${index}`
                  ? 'ring-4 ring-yellow-400 bg-yellow-100 shadow-xl animate-pulse border-yellow-400'
                  : 'bg-gradient-to-r from-blue-50/50 to-indigo-50/50 border-indigo-100/50'
              }`}
            >
              <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center">
                <DocumentDuplicateIcon className="h-4 w-4 mr-1 text-indigo-500" />
                Passport Details
                {job &&
                  job.timeline?.some((event) =>
                    event.description?.includes(
                      `${section} details auto-populated`
                    )
                  ) &&
                  entry.passportNo && (
                    <span className="ml-2 text-xs text-indigo-600">
                      <CheckCircleIcon className="h-4 w-4 inline" /> Pre-filled
                    </span>
                  )}
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    Passport Number
                  </label>
                  <input
                    type="text"
                    value={entry.passportNo || ""}
                    onChange={(e) => {
                      // Fixed: Use createFocusPreservingHandler pattern
                      const inputValue = e.target.value;
                      const cursorPosition = e.target.selectionStart;
                      const inputElement = e.target;

                      // Update state
                      const newDetails = [...details];
                      newDetails[index] = {
                        ...newDetails[index],
                        passportNo: inputValue,
                      };
                      setDetails(newDetails);

                      // Preserve focus and cursor position
                      requestAnimationFrame(() => {
                        if (inputElement) {
                          inputElement.focus();
                          inputElement.setSelectionRange(
                            cursorPosition,
                            cursorPosition
                          );
                        }
                      });
                    }}
                    className={`block w-full rounded-lg ${
                      job &&
                      job.timeline?.some((event) =>
                        event.description?.includes(
                          `${section} details auto-populated`
                        )
                      ) &&
                      entry.passportNo
                        ? "bg-indigo-50 border-indigo-300"
                        : "border-gray-300"
                    } shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition-colors`}
                    placeholder="Passport Number"
                    autoComplete="off"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    Expiry Date
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="date"
                      value={entry.passportExpiry || ""}
                      onChange={(e) => {
                        const newDetails = [...details];
                        newDetails[index] = {
                          ...newDetails[index],
                          passportExpiry: e.target.value
                        };
                        setDetails(newDetails);
                      }}
                      className={`block w-full rounded-lg ${
                        job &&
                        job.timeline?.some((event) =>
                          event.description?.includes(
                            `${section} details auto-populated`
                          )
                        ) &&
                        entry.passportExpiry
                          ? "bg-indigo-50 border-indigo-300"
                          : "border-gray-300"
                      } shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition-colors`}
                    />
                    <button
                      onClick={() =>
                        handleRenewDate(section, "passportExpiry", index)
                      }
                      className="p-2 text-gray-400 hover:text-indigo-500 rounded-lg hover:bg-indigo-50 transition-colors"
                      title="Renew for one year"
                    >
                      <ArrowPathIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    Passport Document
                  </label>
                  <div
                    className={`border-2 rounded-lg p-2 h-10 flex items-center justify-center transition-all duration-300 ${
                      entry.passportDoc
                        ? "border-green-400 bg-green-50/40 shadow-sm"
                        : "border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/30"
                    }`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) =>
                      handlePersonDrop(e, section, "passportDoc", index)
                    }
                  >
                    {entry.passportDoc ? (
                      <div className="flex items-center justify-between w-full px-2">
                        <div className="flex items-center text-xs text-green-600">
                          <CheckCircleIcon className="h-3 w-3 mr-1" /> Uploaded
                          {job &&
                            job.timeline?.some((event) =>
                              event.description?.includes(
                                `${section} details auto-populated`
                              )
                            ) &&
                            typeof entry.passportDoc === "string" && (
                              <span className="ml-2 bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full text-xs">
                                Auto-filled
                              </span>
                            )}
                        </div>
                        <div className="flex items-center gap-1">
                          {typeof entry.passportDoc === "string" && (
                            <a
                              href={entry.passportDoc}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2 py-0.5 text-xs font-medium text-indigo-600 hover:text-white hover:bg-indigo-600 bg-indigo-50 rounded-lg shadow-sm border border-indigo-200 hover:shadow-md transition-all duration-200"
                            >
                              View
                            </a>
                          )}
                          {entry._id && typeof entry.passportDoc === "string" && (
                            <label className="cursor-pointer">
                              <span className="p-0.5 text-green-500 hover:text-white hover:bg-green-500 rounded-lg hover:shadow-md transition-all duration-200 inline-flex" title="Replace (archive old to Library)">
                                <ArrowPathIcon className="h-3 w-3" />
                              </span>
                              <input
                                type="file"
                                className="sr-only"
                                onChange={(e) => {
                                  if (e.target.files[0]) {
                                    handleReplacePersonDocument(section, entry._id, 'passportDoc', e.target.files[0]);
                                  }
                                }}
                              />
                            </label>
                          )}
                          <button
                            onClick={() => {
                              if (entry._id) {
                                handleDeletePersonDocument(section, entry._id, 'passportDoc')
                              } else {
                                handlePersonFileChange(section, "passportDoc", index, null)
                              }
                            }}
                            disabled={submitting}
                            className={`p-0.5 text-red-400 hover:text-white hover:bg-red-500 rounded-lg hover:shadow-md transition-all duration-200 ${
                              submitting ? "opacity-50 cursor-not-allowed" : ""
                            }`}
                            title="Delete document permanently"
                          >
                            <XMarkIcon className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <label className="cursor-pointer text-center block w-full">
                        <div className="flex items-center justify-center text-gray-400 hover:text-indigo-500 transition-colors">
                          <CloudArrowUpIcon className="h-4 w-4 mr-1" />
                          <span className="text-xs">Upload Passport</span>
                        </div>
                        <input
                          type="file"
                          className="sr-only"
                          onChange={(e) =>
                            handlePersonFileChange(
                              section,
                              "passportDoc",
                              index,
                              e.target.files[0]
                            )
                          }
                        />
                      </label>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile Number with Auto-suggestion */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">
                Mobile Number
              </label>
              <input
                type="text"
                value={entry.mobileNo || ""} // Ensure controlled input
                onChange={(e) => {
                  const newDetails = [...details];
                  newDetails[index] = {
                    ...newDetails[index],
                    mobileNo: e.target.value,
                  };
                  setDetails(newDetails);
                }}
                className={`mt-1 block w-full rounded-lg ${
                  job &&
                  job.timeline?.some((event) =>
                    event.description?.includes(
                      `${section} details auto-populated`
                    )
                  ) &&
                  entry.mobileNo
                    ? "bg-indigo-50 border-indigo-300"
                    : "border-gray-300"
                } shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition-colors`}
                placeholder="Enter mobile number"
                autoComplete="off"
                // REMOVED: onKeyDown handler
              />
            </div>
            {/* Email Field with Auto-suggestion */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <input
                type="email"
                value={entry.email || ""} // Ensure controlled input
                onChange={(e) => {
                  const newDetails = [...details];
                  newDetails[index] = {
                    ...newDetails[index],
                    email: e.target.value,
                  };
                  setDetails(newDetails);
                }}
                className={`mt-1 block w-full rounded-lg ${
                  job &&
                  job.timeline?.some((event) =>
                    event.description?.includes(
                      `${section} details auto-populated`
                    )
                  ) &&
                  entry.email
                    ? "bg-indigo-50 border-indigo-300"
                    : "border-gray-300"
                } shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition-colors`}
                placeholder="Enter email address"
                autoComplete="off"
                // REMOVED: onKeyDown handler
              />
            </div>

            {/* CV Upload */}
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                <DocumentTextIcon className="h-4 w-4 mr-1 text-indigo-500" />
                Curriculum Vitae (CV)
                {job &&
                  job.timeline?.some((event) =>
                    event.description?.includes(
                      `${section} details auto-populated`
                    )
                  ) &&
                  entry.cv && (
                    <span className="ml-2 text-xs text-indigo-600">
                      <CheckCircleIcon className="h-4 w-4 inline" /> Pre-filled
                    </span>
                  )}
              </label>
              <div
                className={`border-2 rounded-lg p-3 transition-all duration-300 ${
                  isDragging
                    ? "border-indigo-500 bg-indigo-50 shadow-md"
                    : entry.cv
                    ? "border-green-400 bg-green-50/40 shadow-md"
                    : "border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/30 hover:shadow-md"
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handlePersonDrop(e, section, "cv", index)}
              >
                {entry.cv ? (
                  <div className="flex items-center justify-between bg-white p-3 rounded-lg shadow-sm border border-gray-100">
                    <div className="flex items-center flex-1 min-w-0">
                      <div className="bg-indigo-100 p-2 rounded-lg mr-3">
                        <DocumentTextIcon className="h-5 w-5 text-indigo-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium text-gray-900 truncate block">
                          {entry.cv instanceof File
                            ? entry.cv.name
                            : "CV Document"}
                        </span>
                        <span className="text-xs text-green-600 flex items-center">
                          <CheckCircleIcon className="h-3 w-3 mr-1" /> Uploaded
                          {job &&
                            job.timeline?.some((event) =>
                              event.description?.includes(
                                `${section} details auto-populated`
                              )
                            ) &&
                            typeof entry.cv === "string" && (
                              <span className="ml-2 bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full text-xs">
                                Auto-filled
                              </span>
                            )}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 ml-4">
                      {typeof entry.cv === "string" && (
                        <a
                          href={entry.cv}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 text-xs font-medium text-indigo-600 hover:text-white hover:bg-indigo-600 bg-indigo-50 rounded-lg shadow-sm border border-indigo-200 hover:shadow-md transition-all duration-200"
                        >
                          View Document
                        </a>
                      )}
                      {entry._id && typeof entry.cv === "string" && (
                        <label className="cursor-pointer">
                          <span className="p-1.5 text-green-500 hover:text-white hover:bg-green-500 rounded-lg hover:shadow-md transition-all duration-200 inline-flex" title="Replace (archive old to Library)">
                            <ArrowPathIcon className="h-4 w-4" />
                          </span>
                          <input
                            type="file"
                            className="sr-only"
                            onChange={(e) => {
                              if (e.target.files[0]) {
                                handleReplacePersonDocument(section, entry._id, 'cv', e.target.files[0]);
                              }
                            }}
                          />
                        </label>
                      )}
                      <button
                        onClick={() => {
                          if (entry._id) {
                            handleDeletePersonDocument(section, entry._id, 'cv')
                          } else {
                            handlePersonFileChange(section, "cv", index, null)
                          }
                        }}
                        disabled={submitting}
                        className={`p-1.5 text-red-400 hover:text-white hover:bg-red-500 rounded-lg hover:shadow-md transition-all duration-200 ${
                          submitting ? "opacity-50 cursor-not-allowed" : ""
                        }`}
                        title="Delete permanently"
                      >
                        <XMarkIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <div className="bg-gray-100/80 mx-auto rounded-full w-14 h-14 flex items-center justify-center mb-2">
                      <CloudArrowUpIcon className="h-7 w-7 text-gray-400" />
                    </div>
                    <div className="mt-2">
                      <label className="cursor-pointer block">
                        <span className="relative px-4 py-2 rounded-md font-medium text-sm text-white bg-gradient-to-r from-indigo-600 to-blue-500 hover:from-indigo-700 hover:to-blue-600 shadow-sm transition-all duration-200 hover:shadow-md">
                          Upload CV
                        </span>
                        <input
                          type="file"
                          className="sr-only"
                          onChange={(e) =>
                            handlePersonFileChange(
                              section,
                              "cv",
                              index,
                              e.target.files[0]
                            )
                          }
                        />
                      </label>
                      <p className="text-xs text-gray-500 mt-2">
                        or drag and drop your CV document here
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Other Documents Section */}
            <div className="col-span-2">
              <div className="border-t border-gray-200 pt-6 mt-6">
                <div className="flex items-center justify-between mb-4">
                  <label className="block text-sm font-medium text-gray-700 flex items-center">
                    <DocumentTextIcon className="h-4 w-4 mr-1 text-indigo-500" />
                    Other Documents
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const fileInput = document.createElement("input");
                      fileInput.type = "file";
                      fileInput.accept = ".pdf,.doc,.docx,.jpg,.jpeg,.png";
                      fileInput.onchange = async (e) => {
                        const file = e.target.files[0];
                        if (file) {
                          const newDetails = [...details];
                          if (!newDetails[index].otherDocuments) {
                            newDetails[index].otherDocuments = [];
                          }
                          newDetails[index].otherDocuments.push(file);
                          setDetails(newDetails);
                        }
                      };
                      fileInput.click();
                    }}
                    className="px-3 py-1.5 text-xs font-medium text-indigo-600 hover:text-white hover:bg-indigo-600 bg-indigo-50 rounded-lg shadow-sm border border-indigo-200 hover:shadow-md transition-all duration-200 flex items-center space-x-1"
                  >
                    <PlusIcon className="h-3 w-3" />
                    <span>Add Document</span>
                  </button>
                </div>

                {entry.otherDocuments && entry.otherDocuments.length > 0 ? (
                  <div className="space-y-2">
                    {entry.otherDocuments.map((doc, docIndex) => (
                      <div
                        key={docIndex}
                        className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border border-gray-200"
                      >
                        <div className="flex items-center flex-1 min-w-0">
                          <DocumentTextIcon className="h-4 w-4 text-indigo-600 mr-2 flex-shrink-0" />
                          <span className="text-sm text-gray-900 truncate">
                            {doc instanceof File ? doc.name : doc.fileName || `Document ${docIndex + 1}`}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2 ml-2">
                          {typeof doc === "object" && doc.fileUrl && (
                            <a
                              href={doc.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2 py-1 text-xs font-medium text-indigo-600 hover:text-white hover:bg-indigo-600 bg-white rounded border border-indigo-200 hover:shadow-sm transition-all"
                            >
                              View
                            </a>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              const fileInput = document.createElement("input");
                              fileInput.type = "file";
                              fileInput.accept = ".pdf,.doc,.docx,.jpg,.jpeg,.png";
                              fileInput.onchange = (e) => {
                                const file = e.target.files[0];
                                if (file) {
                                  const newDetails = [...details];
                                  newDetails[index] = {
                                    ...newDetails[index],
                                    otherDocuments: [...(newDetails[index].otherDocuments || [])]
                                  };
                                  newDetails[index].otherDocuments[docIndex] = file;
                                  setDetails(newDetails);
                                }
                              };
                              fileInput.click();
                            }}
                            className="px-2 py-1 text-xs font-medium text-blue-600 hover:text-white hover:bg-blue-600 bg-white rounded border border-blue-200 hover:shadow-sm transition-all"
                          >
                            Replace
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const newDetails = [...details];
                              newDetails[index] = {
                                ...newDetails[index],
                                otherDocuments: [...(newDetails[index].otherDocuments || [])]
                              };
                              newDetails[index].otherDocuments.splice(docIndex, 1);
                              setDetails(newDetails);
                            }}
                            className="p-1 text-red-500 hover:text-white hover:bg-red-500 rounded hover:shadow-sm transition-all"
                            title="Delete document"
                          >
                            <XMarkIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                    <DocumentTextIcon className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                    <p className="text-sm text-gray-500">No other documents uploaded</p>
                    <p className="text-xs text-gray-400 mt-1">Click "Add Document" to upload files</p>
                  </div>
                )}
              </div>
            </div>

            {/* Clear auto-fill button for each entry */}
            {autoFilledEntries[`${section}-${index}`] && (
              <div className="col-span-2">
                <button
                  onClick={() => {
                    setAutoFilledEntries((prev) => ({
                      ...prev,
                      [`${section}-${index}`]: null,
                    }));
                    // Clear the auto-filled values
                    const newDetails = [...details];
                    newDetails[index] = {
                      ...newDetails[index],
                      name: "",
                      nationality: "",
                      email: "",
                      mobileNo: "",
                      qidNo: "",
                      passportNo: "",
                    };
                    setDetails(newDetails);
                  }}
                  className="text-sm text-gray-600 hover:text-gray-800 underline"
                >
                  Clear auto-filled data
                </button>
              </div>
            )}
          </div>

          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={() => handleSavePersonEntry(section, index)}
              disabled={submitting}
              className={`px-4 py-2 bg-gradient-to-r from-indigo-600 to-blue-500 text-white rounded-lg hover:from-indigo-700 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 shadow-md transition-all duration-200 transform hover:scale-105 ${
                submitting ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {submitting ? (
                <>
                  <span className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </button>
          </div>
        </div>
      ))}

      {/* Information note about changes affecting only current job */}
      {job &&
        job.timeline?.some((event) =>
          event.description?.includes(`${section} details auto-populated`)
        ) && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-xs text-gray-700 flex items-start">
              <InformationCircleIcon className="h-4 w-4 text-gray-500 mr-1 flex-shrink-0 mt-0.5" />
              <span>
                Changes made to these details will only affect this specific
                job. The original data used for auto-population remains
                unchanged for other jobs.
              </span>
            </p>
          </div>
        )}

      {/* Add synchronization information box for person data */}
      {job && job.gmail && (
        <SyncInformationBox personType={section} gmail={job.gmail} />
      )}

      {/* Add entry button */}
      <div className="flex justify-center pt-4">
        <button
          type="button"
          onClick={() => handleAddEntry(section)}
          className="inline-flex items-center px-5 py-3 border border-gray-200 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 transform hover:scale-105"
        >
          <PlusIcon className="h-5 w-5 mr-2 text-indigo-600" />
          Add Another Entry
        </button>
      </div>
    </div>
  );

  // KYC state
  const [kycDetails, setKycDetails] = useState({
    activeStatus: "yes",
    documents: [],
  });

  const [otherDocuments, setOtherDocuments] = useState([]);
  const [uploadingOtherDoc, setUploadingOtherDoc] = useState(false);
  const otherDocFileInputRef = useRef(null);

  // Company details state
  const [companyDetails, setCompanyDetails] = useState({
    companyName: "",
    qfcNo: "",
    registeredAddress: "",
    incorporationDate: "",
    serviceType: "Please select",
    engagementLetters: null,
    mainPurpose: "",
    expiryDate: "",
    companyComputerCard: null,
    companyComputerCardExpiry: "",
    taxCard: null,
    taxCardExpiry: "",
    crExtract: null,
    crExtractExpiry: "",
    scopeOfLicense: null,
    scopeOfLicenseExpiry: "",
    articleOfAssociate: null,
    certificateOfIncorporate: null,
    kycActiveStatus: "yes",
  });

  // Add this function to your JobDetails component
  const exportToExcel = async () => {
    try {
      setSubmitting(true);
      setActionMessage({
        type: "info",
        message: "Preparing Excel export...",
      });

      // Prepare company data
      const companyData = {
        "Job ID": job._id,
        "Company Name": companyDetails.companyName || "",
        "QFC Number": companyDetails.qfcNo || "",
        "Registered Address": companyDetails.registeredAddress || "",
        "Incorporation Date": companyDetails.incorporationDate || "",
        "Service Type": companyDetails.serviceType || "",
        "Main Purpose": companyDetails.mainPurpose || "",
        "Expiry Date": companyDetails.expiryDate || "",
        "Client Name": job.clientName || "",
        "Client Email": job.gmail || "",
        "Job Status": job.status || "",
        "Starting Point": job.startingPoint || "",
        "Created At": new Date(job.createdAt).toLocaleDateString(),
        "KYC Active Status": companyDetails.kycActiveStatus || "",
      };

      // Create workbook
      const workbook = XLSX.utils.book_new();

      // Sheet 1: Company Overview
      const companySheet = XLSX.utils.json_to_sheet([companyData]);
      XLSX.utils.book_append_sheet(workbook, companySheet, "Company Overview");

      // Sheet 2: Directors
      if (directorDetails && directorDetails.length > 0) {
        const directorsData = directorDetails.map((director, index) => ({
          Entry: index + 1,
          Name: director.name || "",
          Nationality: director.nationality || "",
          "QID Number": director.qidNo || "",
          "QID Expiry": director.qidExpiry || "",
          "National Address": director.nationalAddress || "",
          "National Address Expiry": director.nationalAddressExpiry || "",
          "Passport Number": director.passportNo || "",
          "Passport Expiry": director.passportExpiry || "",
          "Mobile Number": director.mobileNo || "",
          Email: director.email || "",
          "Has QID Document": director.qidDoc ? "Yes" : "No",
          "Has National Address Doc": director.nationalAddressDoc
            ? "Yes"
            : "No",
          "Has Passport Document": director.passportDoc ? "Yes" : "No",
          "Has CV": director.cv ? "Yes" : "No",
        }));
        const directorsSheet = XLSX.utils.json_to_sheet(directorsData);
        XLSX.utils.book_append_sheet(workbook, directorsSheet, "Directors");
      }

      // Sheet 3: Shareholders
      if (shareholderDetails && shareholderDetails.length > 0) {
        const shareholdersData = shareholderDetails.map(
          (shareholder, index) => ({
            Entry: index + 1,
            Name: shareholder.name || "",
            Nationality: shareholder.nationality || "",
            "QID Number": shareholder.qidNo || "",
            "QID Expiry": shareholder.qidExpiry || "",
            "National Address": shareholder.nationalAddress || "",
            "National Address Expiry": shareholder.nationalAddressExpiry || "",
            "Passport Number": shareholder.passportNo || "",
            "Passport Expiry": shareholder.passportExpiry || "",
            "Mobile Number": shareholder.mobileNo || "",
            Email: shareholder.email || "",
            "Has QID Document": shareholder.qidDoc ? "Yes" : "No",
            "Has National Address Doc": shareholder.nationalAddressDoc
              ? "Yes"
              : "No",
            "Has Passport Document": shareholder.passportDoc ? "Yes" : "No",
            "Has CV": shareholder.cv ? "Yes" : "No",
          })
        );
        const shareholdersSheet = XLSX.utils.json_to_sheet(shareholdersData);
        XLSX.utils.book_append_sheet(
          workbook,
          shareholdersSheet,
          "Shareholders"
        );
      }

      // Sheet 4: Secretaries
      if (secretaryDetails && secretaryDetails.length > 0) {
        const secretariesData = secretaryDetails.map((secretary, index) => ({
          Entry: index + 1,
          Name: secretary.name || "",
          Nationality: secretary.nationality || "",
          "QID Number": secretary.qidNo || "",
          "QID Expiry": secretary.qidExpiry || "",
          "National Address": secretary.nationalAddress || "",
          "National Address Expiry": secretary.nationalAddressExpiry || "",
          "Passport Number": secretary.passportNo || "",
          "Passport Expiry": secretary.passportExpiry || "",
          "Mobile Number": secretary.mobileNo || "",
          Email: secretary.email || "",
          "Has QID Document": secretary.qidDoc ? "Yes" : "No",
          "Has National Address Doc": secretary.nationalAddressDoc
            ? "Yes"
            : "No",
          "Has Passport Document": secretary.passportDoc ? "Yes" : "No",
          "Has CV": secretary.cv ? "Yes" : "No",
        }));
        const secretariesSheet = XLSX.utils.json_to_sheet(secretariesData);
        XLSX.utils.book_append_sheet(workbook, secretariesSheet, "Secretaries");
      }

      // Sheet 5: SEF Details
      if (sefDetails && sefDetails.length > 0) {
        const sefData = sefDetails.map((sef, index) => ({
          Entry: index + 1,
          Name: sef.name || "",
          Nationality: sef.nationality || "",
          "QID Number": sef.qidNo || "",
          "QID Expiry": sef.qidExpiry || "",
          "National Address": sef.nationalAddress || "",
          "National Address Expiry": sef.nationalAddressExpiry || "",
          "Passport Number": sef.passportNo || "",
          "Passport Expiry": sef.passportExpiry || "",
          "Mobile Number": sef.mobileNo || "",
          Email: sef.email || "",
          "Has QID Document": sef.qidDoc ? "Yes" : "No",
          "Has National Address Doc": sef.nationalAddressDoc ? "Yes" : "No",
          "Has Passport Document": sef.passportDoc ? "Yes" : "No",
          "Has CV": sef.cv ? "Yes" : "No",
        }));
        const sefSheet = XLSX.utils.json_to_sheet(sefData);
        XLSX.utils.book_append_sheet(workbook, sefSheet, "SEF Details");
      }

      // Sheet 6: Document Status
      const documentsData = [
        {
          "Company Computer Card": companyDetails.companyComputerCard
            ? "Available"
            : "Not Available",
          "Company Computer Card Expiry":
            companyDetails.companyComputerCardExpiry || "",
          "Tax Card": companyDetails.taxCard ? "Available" : "Not Available",
          "Tax Card Expiry": companyDetails.taxCardExpiry || "",
          "CR Extract": companyDetails.crExtract
            ? "Available"
            : "Not Available",
          "CR Extract Expiry": companyDetails.crExtractExpiry || "",
          "Scope of License": companyDetails.scopeOfLicense
            ? "Available"
            : "Not Available",
          "Scope of License Expiry": companyDetails.scopeOfLicenseExpiry || "",
          "Article of Associate": companyDetails.articleOfAssociate
            ? "Available"
            : "Not Available",
          "Certificate of Incorporate": companyDetails.certificateOfIncorporate
            ? "Available"
            : "Not Available",
          "Engagement Letters":
            Array.isArray(companyDetails.engagementLetters) &&
            companyDetails.engagementLetters.length > 0
              ? `${companyDetails.engagementLetters.length} letters`
              : "Not Available",
        },
      ];
      const documentsSheet = XLSX.utils.json_to_sheet(documentsData);
      XLSX.utils.book_append_sheet(
        workbook,
        documentsSheet,
        "Documents Status"
      );


      // Generate filename with timestamp
      const timestamp = new Date()
        .toISOString()
        .slice(0, 19)
        .replace(/:/g, "-");
      const filename = `Company_Data_${
        companyDetails.companyName || job._id
      }_${timestamp}.xlsx`;

      // Write and download the file
      XLSX.writeFile(workbook, filename);

      setActionMessage({
        type: "success",
        message: "Excel file exported successfully!",
      });

      setTimeout(() => {
        setActionMessage({ type: null, message: null });
      }, 3000);
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      setActionMessage({
        type: "error",
        message: "Failed to export Excel file. Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Add function to handle CR Extract file changes
  const handleCrExtractFileChange = (files) => {
    const fileArray = Array.from(files);
    // No limit on number of files
    setCrExtractFiles(fileArray);
  };

  // Add function to remove CR Extract file
  const removeCrExtractFile = (index) => {
    setCrExtractFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Update the company file handlers to handle CR Extract properly
  const handleCompanyFileChange = (field, file) => {
    if (field === "crExtract") {
      // Handle CR Extract separately since it supports multiple files
      return;
    }

    setCompanyDetails((prev) => ({
      ...prev,
      [field]: file,
    }));
  };

  // Delete company document function
  const handleDeleteCompanyDocument = async (documentType, documentIndex = null) => {
    const documentName = documentType.replace(/([A-Z])/g, ' $1').trim();
    
    if (!window.confirm(`Are you sure you want to delete this ${documentName}? This action cannot be undone.`)) {
      return;
    }

    try {
      setSubmitting(true);
      setActionMessage({
        type: "info",
        message: `Deleting ${documentName}...`,
      });

      const response = await axiosInstance.delete(
        `/operations/jobs/${jobId}/company-document`,
        {
          data: { documentType, documentIndex }
        }
      );

      if (response.data.success) {
        // Update local state with the returned company details
        setCompanyDetails(response.data.companyDetails);
        
        setActionMessage({
          type: "success",
          message: `${documentName} deleted successfully`,
        });

        setTimeout(() => {
          setActionMessage({ type: null, message: null });
        }, 3000);
      }
    } catch (error) {
      console.error("Error deleting document:", error);
      setActionMessage({
        type: "error",
        message: error.response?.data?.message || "Failed to delete document",
      });
      setTimeout(() => {
        setActionMessage({ type: null, message: null });
      }, 3000);
    } finally {
      setSubmitting(false);
    }
  };

  // Delete person document function
  const handleDeletePersonDocument = async (personType, personId, documentType) => {
    const documentName = documentType.replace(/([A-Z])/g, ' $1').trim();
    
    if (!window.confirm(`Are you sure you want to delete this ${documentName}? This action cannot be undone.`)) {
      return;
    }

    try {
      setSubmitting(true);
      setActionMessage({
        type: "info",
        message: `Deleting ${documentName}...`,
      });

      const response = await axiosInstance.delete(
        `/operations/jobs/${jobId}/person-document/${personType}/${personId}`,
        {
          data: { documentType }
        }
      );

      if (response.data.success) {
        // Update local state based on person type
        const updateState = {
          director: setDirectorDetails,
          shareholder: setShareholderDetails,
          secretary: setSecretaryDetails,
          sef: setSefDetails,
        }[personType];

        // Refresh person details
        await fetchPersonDetails(personType, updateState);
        
        setActionMessage({
          type: "success",
          message: `${documentName} deleted successfully`,
        });

        setTimeout(() => {
          setActionMessage({ type: null, message: null });
        }, 3000);
      }
    } catch (error) {
      console.error("Error deleting document:", error);
      setActionMessage({
        type: "error",
        message: error.response?.data?.message || "Failed to delete document",
      });
      setTimeout(() => {
        setActionMessage({ type: null, message: null });
      }, 3000);
    } finally {
      setSubmitting(false);
    }
  };

  // Replace person document function (archives old to Library)
  const handleReplacePersonDocument = async (personType, personId, documentType, file) => {
    if (!file) return;

    const documentName = documentType.replace(/([A-Z])/g, ' $1').trim();

    try {
      setSubmitting(true);
      setActionMessage({
        type: "info",
        message: `Replacing ${documentName}...`,
      });

      const formData = new FormData();
      formData.append("document", file);

      const response = await axiosInstance.put(
        `/operations/jobs/${jobId}/person-document/${personType}/${personId}/${documentType}/replace`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.data.success) {
        const updateState = {
          director: setDirectorDetails,
          shareholder: setShareholderDetails,
          secretary: setSecretaryDetails,
          sef: setSefDetails,
        }[personType];

        await fetchPersonDetails(personType, updateState);

        setActionMessage({
          type: "success",
          message: `${documentName} replaced successfully (old document archived to Library)`,
        });

        setTimeout(() => {
          setActionMessage({ type: null, message: null });
        }, 3000);
      }
    } catch (error) {
      console.error("Error replacing document:", error);
      setActionMessage({
        type: "error",
        message: error.response?.data?.message || "Failed to replace document",
      });
      setTimeout(() => {
        setActionMessage({ type: null, message: null });
      }, 3000);
    } finally {
      setSubmitting(false);
    }
  };

  // Delete KYC signed document function
  const handleDeleteKycDocument = async (documentIndex) => {
    if (!window.confirm("Are you sure you want to delete this KYC document? This action cannot be undone.")) {
      return;
    }

    try {
      setSubmitting(true);
      setActionMessage({
        type: "info",
        message: "Deleting KYC document...",
      });

      const response = await axiosInstance.delete(
        `/operations/jobs/${jobId}/kyc-document`,
        {
          data: { documentIndex }
        }
      );

      if (response.data.success) {
        // KYC documents state update removed - handled via fetchKycDetails
        
        setActionMessage({
          type: "success",
          message: "KYC document deleted successfully",
        });

        setTimeout(() => {
          setActionMessage({ type: null, message: null });
        }, 3000);
      }
    } catch (error) {
      console.error("Error deleting KYC document:", error);
      setActionMessage({
        type: "error",
        message: error.response?.data?.message || "Failed to delete KYC document",
      });
      setTimeout(() => {
        setActionMessage({ type: null, message: null });
      }, 3000);
    } finally {
      setSubmitting(false);
    }
  };

  // Enhanced export function for multiple companies (if you need to export multiple jobs)
  const exportMultipleCompaniesExcel = async (jobsList) => {
    try {
      setSubmitting(true);
      setActionMessage({
        type: "info",
        message: "Preparing multi-company Excel export...",
      });

      // Create workbook
      const workbook = XLSX.utils.book_new();

      // Sheet 1: Companies Summary
      const companiesSummary = jobsList.map((job, index) => ({
        "S.No": index + 1,
        "Job ID": job._id,
        "Company Name": job.companyName || "",
        "QFC Number": job.qfcNo || "",
        "Service Type": job.serviceType || "",
        "Client Name": job.clientName || "",
        "Client Email": job.gmail || "",
        Status: job.status || "",
        "Created Date": new Date(job.createdAt).toLocaleDateString(),
        "Starting Point": job.startingPoint || "",
      }));
      const summarySheet = XLSX.utils.json_to_sheet(companiesSummary);
      XLSX.utils.book_append_sheet(workbook, summarySheet, "Companies Summary");

      // You can add more detailed sheets here for all companies
      // This would require fetching detailed data for each job

      const timestamp = new Date()
        .toISOString()
        .slice(0, 19)
        .replace(/:/g, "-");
      const filename = `Companies_Export_${timestamp}.xlsx`;

      XLSX.writeFile(workbook, filename);

      setActionMessage({
        type: "success",
        message: "Multi-company Excel file exported successfully!",
      });

      setTimeout(() => {
        setActionMessage({ type: null, message: null });
      }, 3000);
    } catch (error) {
      console.error("Error exporting multiple companies to Excel:", error);
      setActionMessage({
        type: "error",
        message: "Failed to export Excel file. Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Person details states
  const [directorDetails, setDirectorDetails] = useState([
    {
      name: "",
      nationality: "",
      visaCopy: null,
      qidNo: "",
      qidDoc: null,
      qidExpiry: "",
      nationalAddress: "",
      nationalAddressDoc: null,
      nationalAddressExpiry: "",
      passportNo: "",
      passportDoc: null,
      passportExpiry: "",
      mobileNo: "",
      email: "",
      cv: null,
      otherDocuments: [],
    },
  ]);

  const [shareholderDetails, setShareholderDetails] = useState([
    {
      name: "",
      nationality: "",
      visaCopy: null,
      qidNo: "",
      qidDoc: null,
      qidExpiry: "",
      nationalAddress: "",
      nationalAddressDoc: null,
      nationalAddressExpiry: "",
      passportNo: "",
      passportDoc: null,
      passportExpiry: "",
      mobileNo: "",
      email: "",
      cv: null,
      otherDocuments: [],
    },
  ]);

  const [secretaryDetails, setSecretaryDetails] = useState([
    {
      name: "",
      nationality: "",
      visaCopy: null,
      qidNo: "",
      qidDoc: null,
      qidExpiry: "",
      nationalAddress: "",
      nationalAddressDoc: null,
      nationalAddressExpiry: "",
      passportNo: "",
      passportDoc: null,
      passportExpiry: "",
      mobileNo: "",
      email: "",
      cv: null,
      otherDocuments: [],
    },
  ]);

  const [sefDetails, setSefDetails] = useState([
    {
      name: "",
      nationality: "",
      visaCopy: null,
      qidNo: "",
      qidDoc: null,
      qidExpiry: "",
      nationalAddress: "",
      nationalAddressDoc: null,
      nationalAddressExpiry: "",
      passportNo: "",
      passportDoc: null,
      passportExpiry: "",
      mobileNo: "",
      email: "",
      cv: null,
      otherDocuments: [],
    },
  ]);

  const [otherDocumentsDetails, setOtherDocumentsDetails] = useState([
    {
      documentType: "",
      documentNumber: "",
      issueDate: "",
      expiryDate: "",
      uploadedFile: null,
      description: "",
    },
  ]);

  // Move the handleEngagementLetterDrop function outside of useEffect
  // so it's accessible in the component scope
  const handleEngagementLetterDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      setEngagementLetters((prev) => [...prev, ...files]);
    }
  };

  // Function to remove a specific engagement letter
  const removeEngagementLetter = (index) => {
    setEngagementLetters((prev) => prev.filter((_, i) => i !== index));
  };

  // Fetch job details
  useEffect(() => {
    const fetchJobDetails = async () => {
      try {
        setLoading(true);
        const response = await axiosInstance.get(`/jobs/${jobId}`);
        setJob(response.data);

        // Pre-populate company and director details with client data
        if (response.data) {
          setCompanyDetails((prevDetails) => ({
            ...prevDetails,
            ...response.data,
            incorporationDate: formatDateForInput(
              response.data.incorporationDate
            ),
            expiryDate: formatDateForInput(response.data.expiryDate),
            companyComputerCardExpiry: formatDateForInput(
              response.data.companyComputerCardExpiry
            ),
            taxCardExpiry: formatDateForInput(response.data.taxCardExpiry),
            crExtractExpiry: formatDateForInput(response.data.crExtractExpiry),
            scopeOfLicenseExpiry: formatDateForInput(
              response.data.scopeOfLicenseExpiry
            ),
          }));

          setDirectorDetails((prevForm) => [
            {
              ...prevForm[0],
              name: response.data.clientName || "",
              email: response.data.gmail || "",
            },
          ]);

          setOtherDocuments(response.data.otherDocuments || []);
        }

        const otherDocsResponse = await axiosInstance.get(
          `/operations/jobs/${jobId}/other-documents-details`
        );
        if (otherDocsResponse.data && otherDocsResponse.data.length > 0) {
          setOtherDocumentsDetails(
            otherDocsResponse.data.map((doc) => ({
              _id: doc._id,
              documentType: doc.documentType || "",
              documentNumber: doc.documentNumber || "",
              issueDate: doc.issueDate ? doc.issueDate.split("T")[0] : "",
              expiryDate: doc.expiryDate ? doc.expiryDate.split("T")[0] : "",
              uploadedFile: doc.uploadedFile || null,
              description: doc.description || "",
            }))
          );
        }

        setError(null);
      } catch (err) {
        console.error("Error fetching job details:", err);
        setError(err.response?.data?.message || "Failed to load job details");
      } finally {
        setLoading(false);
      }
    };

    // Add a function to add engagement letters
    const handleEngagementLetterChange = (e) => {
      const files = Array.from(e.target.files);
      if (files.length > 0) {
        setEngagementLetters((prev) => [...prev, ...files]);
      }
    };

    const fetchTimeline = async () => {
      try {
        setTimelineLoading(true);
        const response = await axiosInstance.get(`/jobs/${jobId}/timeline`);
        setTimeline(response.data);
      } catch (err) {
        console.error("Error fetching timeline:", err);
      } finally {
        setTimelineLoading(false);
      }
    };

    if (jobId) {
      fetchJobDetails();
      fetchTimeline();
    }
  }, [jobId]);

  useEffect(() => {
    if (!loading && job) {
      const expiryType = searchParams.get('expiryType');
      if (expiryType) {
        let targetTab = 'company';
        let targetFieldId = null;

        // Helper function to extract person name from expiryType
        // Format: "director QID (Tevfik Ergun)" -> "Tevfik Ergun"
        const extractPersonName = (type) => {
          const match = type.match(/\(([^)]+)\)/);
          return match ? match[1].trim() : null;
        };

        // Helper function to find person index by name
        const findPersonIndex = (details, name) => {
          if (!name || !details || details.length === 0) return 0;
          const index = details.findIndex(
            (person) => person.name && person.name.toLowerCase().includes(name.toLowerCase())
          );
          return index >= 0 ? index : 0;
        };

        // Determine target tab and field based on expiryType
        if (expiryType.includes('Trade License') || expiryType.includes('Main Document')) {
          targetTab = 'company';
          targetFieldId = 'expiry-field-tradeLicense';
        } else if (expiryType.includes('Company Computer Card')) {
          targetTab = 'company';
          targetFieldId = 'expiry-field-companyComputerCard';
        } else if (expiryType.includes('Tax Card')) {
          targetTab = 'company';
          targetFieldId = 'expiry-field-taxCard';
        } else if (expiryType.includes('CR Extract')) {
          targetTab = 'company';
          targetFieldId = 'expiry-field-crExtract';
        } else if (expiryType.includes('Scope of License')) {
          targetTab = 'company';
          targetFieldId = 'expiry-field-scopeOfLicense';
        } else if (expiryType.toLowerCase().includes('director')) {
          targetTab = 'director';
          const personName = extractPersonName(expiryType);
          const personIndex = findPersonIndex(directorDetails, personName);
          if (expiryType.toLowerCase().includes('qid')) {
            targetFieldId = `expiry-field-director-qid-${personIndex}`;
          } else if (expiryType.toLowerCase().includes('passport')) {
            targetFieldId = `expiry-field-director-passport-${personIndex}`;
          } else if (expiryType.toLowerCase().includes('national address')) {
            targetFieldId = `expiry-field-director-nationalAddress-${personIndex}`;
          }
        } else if (expiryType.toLowerCase().includes('shareholder')) {
          targetTab = 'shareholder';
          const personName = extractPersonName(expiryType);
          const personIndex = findPersonIndex(shareholderDetails, personName);
          if (expiryType.toLowerCase().includes('qid')) {
            targetFieldId = `expiry-field-shareholder-qid-${personIndex}`;
          } else if (expiryType.toLowerCase().includes('passport')) {
            targetFieldId = `expiry-field-shareholder-passport-${personIndex}`;
          } else if (expiryType.toLowerCase().includes('national address')) {
            targetFieldId = `expiry-field-shareholder-nationalAddress-${personIndex}`;
          }
        } else if (expiryType.toLowerCase().includes('secretary')) {
          targetTab = 'secretary';
          const personName = extractPersonName(expiryType);
          const personIndex = findPersonIndex(secretaryDetails, personName);
          if (expiryType.toLowerCase().includes('qid')) {
            targetFieldId = `expiry-field-secretary-qid-${personIndex}`;
          } else if (expiryType.toLowerCase().includes('passport')) {
            targetFieldId = `expiry-field-secretary-passport-${personIndex}`;
          } else if (expiryType.toLowerCase().includes('national address')) {
            targetFieldId = `expiry-field-secretary-nationalAddress-${personIndex}`;
          }
        } else if (expiryType.toLowerCase().includes('sef')) {
          targetTab = 'sef';
          const personName = extractPersonName(expiryType);
          const personIndex = findPersonIndex(sefDetails, personName);
          if (expiryType.toLowerCase().includes('qid')) {
            targetFieldId = `expiry-field-sef-qid-${personIndex}`;
          } else if (expiryType.toLowerCase().includes('passport')) {
            targetFieldId = `expiry-field-sef-passport-${personIndex}`;
          } else if (expiryType.toLowerCase().includes('national address')) {
            targetFieldId = `expiry-field-sef-nationalAddress-${personIndex}`;
          }
        }

        setActiveTab(targetTab);

        // Scroll to specific field and highlight it
        setTimeout(() => {
          if (targetFieldId) {
            const targetElement = document.getElementById(targetFieldId);
            if (targetElement) {
              targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
              setHighlightedField(targetFieldId);

              // Clear highlight after 5 seconds
              setTimeout(() => {
                setHighlightedField(null);
              }, 5000);
            } else {
              // Fallback to tab section if specific field not found
              const tabSection = document.getElementById(`tab-section-${targetTab}`);
              if (tabSection) {
                tabSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }
            }
          } else {
            // Fallback to tab section
            const tabSection = document.getElementById(`tab-section-${targetTab}`);
            if (tabSection) {
              tabSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
          }
        }, 500);
      }
    }
  }, [loading, job, searchParams, directorDetails, shareholderDetails, secretaryDetails, sefDetails]);

  // Add this utility function to JobDetails.jsx
// Replace the existing formatDateForInput function in JobDetails.jsx with this:

const formatDateForInput = (dateString) => {
  // Return empty string for null, undefined, or "undefined" string
  if (!dateString || 
      dateString === 'undefined' || 
      dateString === 'null' || 
      dateString === null || 
      dateString === undefined) {
    return "";
  }
  
  try {
    // Handle both ISO strings and Date objects
    const date = new Date(dateString);
    // Check if date is valid before formatting
    if (isNaN(date.getTime())) {
      console.warn('Invalid date provided to formatDateForInput:', dateString);
      return "";
    }

    // Format as YYYY-MM-DD for HTML date inputs
    return date.toISOString().split("T")[0];
  } catch (error) {
    console.error("Error formatting date:", error, "Input was:", dateString);
    return "";
  }
};

// Also update the useEffect that fetches company details to use the improved formatting:

useEffect(() => {
  const fetchCompanyDetails = async () => {
    if (!jobId || !job) return;

    try {
      const response = await axiosInstance.get(
        `/operations/jobs/${jobId}/company-details`
      );

      // Log the raw response to check date formats
      console.log("Raw company details response:", response.data);

      // Process company details data with improved date handling
      const formattedDetails = {
        ...response.data,
        incorporationDate: formatDateForInput(response.data.incorporationDate),
        expiryDate: formatDateForInput(response.data.expiryDate),
        companyComputerCardExpiry: formatDateForInput(response.data.companyComputerCardExpiry),
        taxCardExpiry: formatDateForInput(response.data.taxCardExpiry),
        crExtractExpiry: formatDateForInput(response.data.crExtractExpiry),
        scopeOfLicenseExpiry: formatDateForInput(response.data.scopeOfLicenseExpiry),
      };

      // Log the formatted dates for debugging
      console.log("Formatted dates:", {
        incorporationDate: formattedDetails.incorporationDate,
        expiryDate: formattedDetails.expiryDate,
        companyComputerCardExpiry: formattedDetails.companyComputerCardExpiry,
        taxCardExpiry: formattedDetails.taxCardExpiry,
        crExtractExpiry: formattedDetails.crExtractExpiry,
        scopeOfLicenseExpiry: formattedDetails.scopeOfLicenseExpiry,
      });

      setCompanyDetails((prevDetails) => ({
        ...prevDetails,
        ...formattedDetails,
      }));
    } catch (err) {
      console.error("Error fetching company details:", err);
    }
  };

  fetchCompanyDetails();
}, [jobId, job]);

  // Fetch company details
  // Enhance the useEffect that fetches company details
  useEffect(() => {
    const fetchCompanyDetails = async () => {
      if (!jobId || !job) return;

      try {
        const response = await axiosInstance.get(
          `/operations/jobs/${jobId}/company-details`
        );

        // Log the raw response to check date formats
        console.log("Raw company details response:", response.data);

        // Process company details data
        const formattedDetails = {
          ...response.data,
          incorporationDate: formatDateForInput(
            response.data.incorporationDate
          ),
          expiryDate: formatDateForInput(response.data.expiryDate),
          companyComputerCardExpiry: formatDateForInput(
            response.data.companyComputerCardExpiry
          ),
          taxCardExpiry: formatDateForInput(response.data.taxCardExpiry),
          crExtractExpiry: formatDateForInput(response.data.crExtractExpiry),
          scopeOfLicenseExpiry: formatDateForInput(
            response.data.scopeOfLicenseExpiry
          ),
        };

        // Log the formatted dates for debugging
        console.log(
          "Formatted incorporation date:",
          formattedDetails.incorporationDate
        );
        console.log("Formatted expiry date:", formattedDetails.expiryDate);

        setCompanyDetails((prevDetails) => ({
          ...prevDetails,
          ...formattedDetails,
        }));
      } catch (err) {
        console.error("Error fetching company details:", err);
      }
    };

    fetchCompanyDetails();
  }, [jobId, job]);

  // Add this debugging code after setting companyDetails in the fetchCompanyDetails function
  useEffect(() => {
    if (companyDetails) {
      console.log("Current company details state:", companyDetails);
      console.log("Incorporation date:", companyDetails.incorporationDate);
      console.log("Expiry date:", companyDetails.expiryDate);
      console.log(
        "Right before render, incorporationDate:",
        companyDetails.incorporationDate
      );
      // Check other date fields as needed
    }
  }, [companyDetails]);

  // Enhance fetchPersonDetails function
  const fetchPersonDetails = async (personType, setStateFunction) => {
    if (!jobId) return;

    try {
      console.log(`Fetching ${personType} details for job ${jobId}`);
      const response = await axiosInstance.get(
        `/operations/jobs/${jobId}/person-details/${personType}`
      );

      console.log(`Received ${personType} details:`, response.data);

      // Format dates for form inputs
      const formattedData = response.data.map((person) => ({
        ...person,
        qidExpiry: person.qidExpiry
          ? new Date(person.qidExpiry).toISOString().split("T")[0]
          : "",
        nationalAddressExpiry: person.nationalAddressExpiry
          ? new Date(person.nationalAddressExpiry).toISOString().split("T")[0]
          : "",
        passportExpiry: person.passportExpiry
          ? new Date(person.passportExpiry).toISOString().split("T")[0]
          : "",
      }));

      if (formattedData.length > 0) {
        console.log(`Setting ${personType} details with`, formattedData);
        setStateFunction(formattedData);

        // Check if this data was auto-populated
        const isAutoPopulated =
          job &&
          job.timeline?.some((event) =>
            event.description?.includes(`${personType} details auto-populated`)
          );

        // Show notification if data was auto-populated
        if (isAutoPopulated) {
          setActionMessage({
            type: "info",
            message: `${
              personType.charAt(0).toUpperCase() + personType.slice(1)
            } details were auto-populated from existing client records`,
          });
        }
      } else {
        console.log(`No ${personType} details received from API`);
      }
    } catch (err) {
      console.error(`Error fetching ${personType} details:`, err);
      // If no entries, the default empty state is already set
    }
  };

  // Update the useEffect hook for fetching person details
  useEffect(() => {
    if (activeTab === "director") {
      console.log("Fetching director details");
      fetchPersonDetails("director", setDirectorDetails);
    } else if (activeTab === "shareholder") {
      console.log("Fetching shareholder details");
      fetchPersonDetails("shareholder", setShareholderDetails);
    } else if (activeTab === "secretary") {
      console.log("Fetching secretary details");
      fetchPersonDetails("secretary", setSecretaryDetails);
    } else if (activeTab === "sef") {
      console.log("Fetching SEF details");
      fetchPersonDetails("sef", setSefDetails);
    } else if (activeTab === "kyc") {
      console.log("Fetching KYC details");
      fetchKycDetails();
    }
  }, [activeTab, jobId, job]); // Add job as a dependency to re-fetch when job data changes

  // Fetch KYC details
  const fetchKycDetails = async () => {
    if (!jobId) return;

    try {
      const response = await axiosInstance.get(
        `/operations/jobs/${jobId}/kyc-documents`
      );
      setKycDetails({
        activeStatus: response.data.activeStatus || "yes",
        documents: response.data.documents || [],
      });
    } catch (err) {
      console.error("Error fetching KYC details:", err);
    }
  };

  // File handling functions
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      setEngagementLetters((prev) => [...prev, ...files]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      setEngagementLetter(file);
    }
  };

  // const removeEngagementLetter = (index) => {
  //   setEngagementLetters((prev) => prev.filter((_, i) => i !== index));
  // };

  // Updated handleUploadEngagementLetters function for JobDetails.jsx

  const handleUploadEngagementLetters = async () => {
    if (engagementLetters.length === 0) return;

    try {
      setSubmitting(true);
      setActionMessage({
        type: "info",
        message: "Uploading engagement letters...",
      });

      // Upload each letter one by one
      for (const letter of engagementLetters) {
        const formData = new FormData();
        formData.append("engagementLetter", letter);

        // Add metadata to help the backend create proper document object
        formData.append("fileName", letter.name || "Engagement Letter");
        formData.append(
          "description",
          `Uploaded on ${new Date().toLocaleDateString()}`
        );

        console.log(`Uploading letter: ${letter.name}`);

        try {
          await axiosInstance.post(
            `/operations/jobs/${jobId}/engagement-letter`,
            formData
          );
        } catch (uploadError) {
          console.error("Error uploading letter:", uploadError);
          console.error("Error details:", uploadError.response?.data);
          throw uploadError; // Re-throw to be caught by outer catch
        }
      }

      // Show success message
      setActionMessage({
        type: "success",
        message:
          "Engagement letters uploaded successfully and will be shared across all jobs for this client",
      });

      // Refresh company details to reflect the uploads
      try {
        const response = await axiosInstance.get(
          `/operations/jobs/${jobId}/company-details`
        );

        if (response.data) {
          setCompanyDetails((prev) => ({
            ...prev,
            engagementLetters: response.data.engagementLetters,
          }));
        }
      } catch (refreshError) {
        console.error("Error refreshing company details:", refreshError);
        // Continue anyway since the upload was successful
      }

      // Clear the uploaded files
      setEngagementLetters([]);

      setTimeout(() => {
        setActionMessage({ type: null, message: null });
      }, 5000);
    } catch (err) {
      console.error("Error uploading engagement letters:", err);
      setActionMessage({
        type: "error",
        message:
          err.response?.data?.message ||
          "Failed to upload engagement letters. Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Enter edit mode for Company Details form
  const handleEnterEditMode = () => {
    setOriginalCompanyDetails({ ...companyDetails });
    setEditingCompanyDetails(true);
  };

  // Cancel edit mode and restore original values
  const handleCancelEditMode = () => {
    setCompanyDetails(originalCompanyDetails);
    setEditingCompanyDetails(false);
  };

  // Company details form submission
  // In the handleSaveCompanyDetails function, update the FormData handling for crExtract:
const handleSaveCompanyDetails = async () => {
  try {
    setSubmitting(true);

    const formData = new FormData();

    // Helper function to safely append form data
    const appendIfValid = (key, value) => {
      if (value !== null && value !== undefined && value !== 'undefined') {
        formData.append(key, value);
      }
    };

    // Add text fields with validation
    appendIfValid("companyName", companyDetails.companyName);
    appendIfValid("qfcNo", companyDetails.qfcNo);
    appendIfValid("registeredAddress", companyDetails.registeredAddress);
    appendIfValid("serviceType", companyDetails.serviceType);
    appendIfValid("mainPurpose", companyDetails.mainPurpose);
    appendIfValid("kycActiveStatus", companyDetails.kycActiveStatus);
    formData.append("syncAcrossJobs", "true");

    // Handle dates with proper formatting
    const formattedIncorporationDate = formatDateForFormData(companyDetails.incorporationDate);
    const formattedExpiryDate = formatDateForFormData(companyDetails.expiryDate);
    
    if (formattedIncorporationDate) {
      formData.append("incorporationDate", formattedIncorporationDate);
    }
    
    if (formattedExpiryDate) {
      formData.append("expiryDate", formattedExpiryDate);
    }

    // Add expiry dates with validation
    const expiries = [
      { key: "companyComputerCardExpiry", value: companyDetails.companyComputerCardExpiry },
      { key: "taxCardExpiry", value: companyDetails.taxCardExpiry },
      { key: "crExtractExpiry", value: companyDetails.crExtractExpiry },
      { key: "scopeOfLicenseExpiry", value: companyDetails.scopeOfLicenseExpiry },
    ];

    expiries.forEach(({ key, value }) => {
      const formattedDate = formatDateForFormData(value);
      if (formattedDate) {
        formData.append(key, formattedDate);
      }
    });

    // Add files if they exist and are File objects (not URLs)
    const fileFields = [
      "engagementLetters",
      "companyComputerCard",
      "taxCard",
      "scopeOfLicense",
      "articleOfAssociate",
      "certificateOfIncorporate",
    ];

    fileFields.forEach((field) => {
      if (companyDetails[field] && companyDetails[field] instanceof File) {
        formData.append(field, companyDetails[field]);
      }
    });

    // Handle multiple CR Extract files
    if (crExtractFiles.length > 0) {
      crExtractFiles.forEach((file) => {
        formData.append("crExtract", file);
      });
    }

    // Handle multiple Company Memo files
    if (companyMemoFiles.length > 0) {
      companyMemoFiles.forEach((file) => {
        formData.append("companyMemo", file);
      });
    }

    // ADD THIS: Send deleted Company Memo IDs to backend
    if (deletedCompanyMemoIds.length > 0) {
      formData.append("deletedCompanyMemoIds", JSON.stringify(deletedCompanyMemoIds));
    }

    // Send the update
    const response = await axiosInstance.put(
      `/operations/jobs/${jobId}/company-details`,
      formData
    );

    // Success handling...
    let successMessage = "Company details saved successfully";
    if (
      response.data &&
      response.data.syncResult &&
      response.data.syncResult.updatedRecords > 0
    ) {
      successMessage += ` and synchronized across ${response.data.syncResult.updatedRecords} other job(s) for this client`;
    }

    setActionMessage({
      type: "success",
      message: successMessage,
    });

    // Clear the CR Extract files after successful save
    setCrExtractFiles([]);

    // Clear the Company Memo files after successful save
    setCompanyMemoFiles([]);

    // Clear the deleted Company Memo IDs after successful save
    setDeletedCompanyMemoIds([]);

    // Refresh company details to get updated data
    const updatedResponse = await axiosInstance.get(
      `/operations/jobs/${jobId}/company-details`
    );
    setCompanyDetails(updatedResponse.data);

    // Refresh job details to update the header with new company name
    const jobResponse = await axiosInstance.get(`/jobs/${jobId}`);
    setJob(jobResponse.data);

    setEditingCompanyDetails(false);

    setTimeout(() => {
      setActionMessage({ type: null, message: null });
    }, 3000);
  } catch (err) {
    console.error("Error saving company details:", err);
    setActionMessage({
      type: "error",
      message:
        err.response?.data?.message || "Failed to save company details",
    });
  } finally {
    setSubmitting(false);
  }
};

  // Save KYC Details
  const handleSaveKycDetails = async () => {
    try {
      setSubmitting(true);

      await axiosInstance.put(`/operations/jobs/${jobId}/kyc-documents`, {
        activeStatus: kycDetails.activeStatus,
      });

      setActionMessage({
        type: "success",
        message: "KYC status updated successfully",
      });

      setTimeout(() => {
        setActionMessage({ type: null, message: null });
      }, 3000);
    } catch (err) {
      console.error("Error updating KYC details:", err);
      setActionMessage({
        type: "error",
        message: err.response?.data?.message || "Failed to update KYC details",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUploadOtherDocument = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingOtherDoc(true);
      setActionMessage({
        type: "info",
        message: "Uploading document...",
      });

      const formData = new FormData();
      formData.append("document", file);

      const response = await axiosInstance.post(
        `/jobs/${jobId}/other-documents`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      setOtherDocuments(response.data.otherDocuments || []);
      setActionMessage({
        type: "success",
        message: "Document uploaded successfully",
      });

      if (otherDocFileInputRef.current) {
        otherDocFileInputRef.current.value = "";
      }

      setTimeout(() => {
        setActionMessage({ type: null, message: null });
      }, 3000);
    } catch (err) {
      console.error("Error uploading document:", err);
      setActionMessage({
        type: "error",
        message: err.response?.data?.message || "Failed to upload document",
      });
    } finally {
      setUploadingOtherDoc(false);
    }
  };

  const handleDeleteOtherDocument = async (index) => {
    if (!window.confirm("Are you sure you want to delete this document?")) {
      return;
    }

    try {
      setSubmitting(true);
      setActionMessage({
        type: "info",
        message: "Deleting document...",
      });

      const response = await axiosInstance.delete(
        `/jobs/${jobId}/other-documents/${index}`
      );

      setOtherDocuments(response.data.otherDocuments || []);
      setActionMessage({
        type: "success",
        message: "Document deleted successfully",
      });

      setTimeout(() => {
        setActionMessage({ type: null, message: null });
      }, 3000);
    } catch (err) {
      console.error("Error deleting document:", err);
      setActionMessage({
        type: "error",
        message: err.response?.data?.message || "Failed to delete document",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleReplaceOtherDocument = async (index, file) => {
    if (!file) return;

    try {
      setSubmitting(true);
      setActionMessage({
        type: "info",
        message: "Replacing document...",
      });

      const formData = new FormData();
      formData.append("document", file);

      const response = await axiosInstance.put(
        `/jobs/${jobId}/other-documents/${index}`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      setOtherDocuments(response.data.otherDocuments || []);
      setActionMessage({
        type: "success",
        message: "Document replaced successfully",
      });

      setTimeout(() => {
        setActionMessage({ type: null, message: null });
      }, 3000);
    } catch (err) {
      console.error("Error replacing document:", err);
      setActionMessage({
        type: "error",
        message: err.response?.data?.message || "Failed to replace document",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveOtherDocumentsDetails = async () => {
    try {
      setSubmitting(true);
      setActionMessage({
        type: "info",
        message: "Saving other documents details...",
      });

      for (const entry of otherDocumentsDetails) {
        const formData = new FormData();

        if (entry.documentType) formData.append("documentType", entry.documentType);
        if (entry.documentNumber) formData.append("documentNumber", entry.documentNumber);
        if (entry.issueDate) formData.append("issueDate", entry.issueDate);
        if (entry.expiryDate) formData.append("expiryDate", entry.expiryDate);
        if (entry.description) formData.append("description", entry.description);

        if (entry.uploadedFile && entry.uploadedFile instanceof File) {
          formData.append("uploadedFile", entry.uploadedFile);
        }

        if (entry._id) {
          await axiosInstance.put(
            `/operations/jobs/${jobId}/other-documents-details/${entry._id}`,
            formData,
            {
              headers: { "Content-Type": "multipart/form-data" },
            }
          );
        } else {
          const response = await axiosInstance.post(
            `/operations/jobs/${jobId}/other-documents-details`,
            formData,
            {
              headers: { "Content-Type": "multipart/form-data" },
            }
          );
          entry._id = response.data._id;
        }
      }

      setActionMessage({
        type: "success",
        message: "Other documents details saved successfully",
      });

      setTimeout(() => {
        setActionMessage({ type: null, message: null });
      }, 3000);
    } catch (err) {
      console.error("Error saving other documents details:", err);
      setActionMessage({
        type: "error",
        message: err.response?.data?.message || "Failed to save other documents details",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Complete operation function
  const handleCompleteOperation = async () => {
    try {
      setSubmitting(true);
      await axiosInstance.put(`/operations/jobs/${jobId}/complete`);

      setActionMessage({
        type: "success",
        message: "Operation marked as complete successfully",
      });

      // Refresh job data
      const response = await axiosInstance.get(`/jobs/${jobId}`);
      setJob(response.data);

      setTimeout(() => {
        setActionMessage({ type: null, message: null });
      }, 3000);
    } catch (err) {
      console.error("Error completing operation:", err);
      setActionMessage({
        type: "error",
        message: err.response?.data?.message || "Failed to complete operation",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveCrNo = async () => {
    if (!job?.gmail) return;

    try {
      setSavingCrNo(true);
      await axiosInstance.put(`/clients/${encodeURIComponent(job.gmail)}/cr-no`, {
        crNo: crNoValue
      });

      setJob(prev => ({
        ...prev,
        clientId: {
          ...prev.clientId,
          crNo: crNoValue
        }
      }));

      setEditingCrNo(false);
      setActionMessage({
        type: "success",
        message: "CR Number updated successfully",
      });

      setTimeout(() => {
        setActionMessage({ type: null, message: null });
      }, 3000);
    } catch (err) {
      console.error("Error updating CR Number:", err);
      setActionMessage({
        type: "error",
        message: err.response?.data?.message || "Failed to update CR Number",
      });
    } finally {
      setSavingCrNo(false);
    }
  };

  // Company file handlers
  // const handleCompanyFileChange = (field, file) => {
  //   setCompanyDetails((prev) => ({
  //     ...prev,
  //     [field]: file,
  //   }));
  // };

  // Person details form handlers
  const handlePersonFileChange = (section, field, index, file) => {
    const updateState = {
      director: setDirectorDetails,
      shareholder: setShareholderDetails,
      secretary: setSecretaryDetails,
      sef: setSefDetails,
    }[section];

    updateState((prev) => {
      const newDetails = [...prev];
      newDetails[index] = {
        ...newDetails[index],
        [field]: file,
      };
      return newDetails;
    });
  };

  const handlePersonDrop = (e, section, field, index) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handlePersonFileChange(section, field, index, file);
    }
  };

  const handleAddEntry = (section) => {
    const emptyEntry = {
      name: "",
      nationality: "",
      visaCopy: null,
      qidNo: "",
      qidDoc: null,
      qidExpiry: "",
      nationalAddress: "",
      nationalAddressDoc: null,
      nationalAddressExpiry: "",
      passportNo: "",
      passportDoc: null,
      passportExpiry: "",
      mobileNo: "",
      email: "",
      cv: null,
    };

    const updateState = {
      director: setDirectorDetails,
      shareholder: setShareholderDetails,
      secretary: setSecretaryDetails,
      sef: setSefDetails,
    }[section];

    updateState((prev) => [...prev, emptyEntry]);
  };

  const handleRemoveEntry = (section, index) => {
    const updateState = {
      director: setDirectorDetails,
      shareholder: setShareholderDetails,
      secretary: setSecretaryDetails,
      sef: setSefDetails,
    }[section];

    updateState((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRenewDate = (section, field, index) => {
    const updateState = {
      director: setDirectorDetails,
      shareholder: setShareholderDetails,
      secretary: setSecretaryDetails,
      sef: setSefDetails,
    }[section];

    const newDate = new Date();
    newDate.setFullYear(newDate.getFullYear() + 1);

    updateState((prev) => {
      const newDetails = [...prev];
      newDetails[index] = {
        ...newDetails[index],
        [field]: newDate.toISOString().split("T")[0],
      };
      return newDetails;
    });
  };

  // Save person details entry
  const handleSavePersonEntry = async (section, index) => {
    try {
      setSubmitting(true);

      const details = {
        director: directorDetails,
        shareholder: shareholderDetails,
        secretary: secretaryDetails,
        sef: sefDetails,
      }[section];

      const entry = details[index];

      // Create FormData for the request
      const formData = new FormData();

      // Add text fields
      formData.append("name", entry.name || "");
      formData.append("nationality", entry.nationality || "");
      formData.append("qidNo", entry.qidNo || "");
      formData.append("qidExpiry", entry.qidExpiry || "");
      formData.append("nationalAddress", entry.nationalAddress || "");
      formData.append(
        "nationalAddressExpiry",
        entry.nationalAddressExpiry || ""
      );
      formData.append("passportNo", entry.passportNo || "");
      formData.append("passportExpiry", entry.passportExpiry || "");
      formData.append("mobileNo", entry.mobileNo || "");
      formData.append("email", entry.email || "");

      // Add synchronization option - DON'T sync across jobs by default for individual entry updates
      formData.append("syncAcrossJobs", "false");

      // Add file fields if they are File objects (not URLs)
      const fileFields = [
        "visaCopy",
        "qidDoc",
        "nationalAddressDoc",
        "passportDoc",
        "cv",
      ];

      fileFields.forEach((field) => {
        if (entry[field] && entry[field] instanceof File) {
          formData.append(field, entry[field]);
        }
      });

      // Add other documents - send with position preservation
      if (entry.otherDocuments && Array.isArray(entry.otherDocuments)) {
        const docsWithPositions = [];
        const newFilesWithIndex = [];

        entry.otherDocuments.forEach((doc, idx) => {
          if (doc instanceof File) {
            newFilesWithIndex.push({ file: doc, index: idx });
          } else if (doc.fileUrl) {
            docsWithPositions.push({
              fileUrl: doc.fileUrl,
              fileName: doc.fileName,
              uploadedAt: doc.uploadedAt,
              index: idx,
            });
          }
        });

        formData.append("otherDocumentsMetadata", JSON.stringify({
          existingDocs: docsWithPositions,
          totalCount: entry.otherDocuments.length,
        }));

        newFilesWithIndex.forEach(({ file, index }) => {
          formData.append(`otherDocument_${index}`, file);
        });
      } else {
        formData.append("otherDocumentsMetadata", JSON.stringify({
          existingDocs: [],
          totalCount: 0,
        }));
      }

      let response;

      // Update or create entry based on whether _id exists
      if (entry._id) {
        // Update existing entry
        response = await axiosInstance.put(
          `/operations/jobs/${jobId}/person-details/${section}/${entry._id}`,
          formData
        );

        // Update the entry in state with returned data
        const updateState = {
          director: setDirectorDetails,
          shareholder: setShareholderDetails,
          secretary: setSecretaryDetails,
          sef: setSefDetails,
        }[section];

        updateState((prev) => {
          const newEntries = [...prev];
          // Keep file references in the UI state
          newEntries[index] = {
            ...response.data,
            visaCopy: response.data.visaCopy || entry.visaCopy,
            qidDoc: response.data.qidDoc || entry.qidDoc,
            nationalAddressDoc:
              response.data.nationalAddressDoc || entry.nationalAddressDoc,
            passportDoc: response.data.passportDoc || entry.passportDoc,
            cv: response.data.cv || entry.cv,
            otherDocuments: response.data.otherDocuments || entry.otherDocuments || [],
          };
          return newEntries;
        });

        // Show sync information if returned from API
        if (response.data.syncResult && response.data.syncResult.success) {
          setActionMessage({
            type: "success",
            message: `${
              section.charAt(0).toUpperCase() + section.slice(1)
            } details saved successfully and synchronized across ${
              response.data.syncResult.updatedRecords
            } other jobs for the same client.`,
          });

          // If we have a successful sync, refresh data for other tabs
          // This ensures the UI is updated with synchronized data
          if (response.data.syncResult.updatedRecords > 0) {
            // Refresh data for all person types to get updated synchronized data
            await Promise.all([
              fetchPersonDetails("director", setDirectorDetails),
              fetchPersonDetails("shareholder", setShareholderDetails),
              fetchPersonDetails("secretary", setSecretaryDetails),
              fetchPersonDetails("sef", setSefDetails),
            ]);
          }
        } else {
          setActionMessage({
            type: "success",
            message: `${
              section.charAt(0).toUpperCase() + section.slice(1)
            } details saved successfully.`,
          });
        }
      } else {
        // Create new entry
        response = await axiosInstance.post(
          `/operations/jobs/${jobId}/person-details/${section}`,
          formData
        );

        // Update the entry in state with returned data including _id
        const updateState = {
          director: setDirectorDetails,
          shareholder: setShareholderDetails,
          secretary: setSecretaryDetails,
          sef: setSefDetails,
        }[section];

        updateState((prev) => {
          const newEntries = [...prev];
          // Keep file references in the UI state
          newEntries[index] = {
            ...response.data,
            visaCopy: response.data.visaCopy || entry.visaCopy,
            qidDoc: response.data.qidDoc || entry.qidDoc,
            nationalAddressDoc:
              response.data.nationalAddressDoc || entry.nationalAddressDoc,
            passportDoc: response.data.passportDoc || entry.passportDoc,
            cv: response.data.cv || entry.cv,
            otherDocuments: response.data.otherDocuments || entry.otherDocuments || [],
          };
          return newEntries;
        });

        setActionMessage({
          type: "success",
          message: `${
            section.charAt(0).toUpperCase() + section.slice(1)
          } details saved successfully.`,
        });

        // After creating a new entry, refresh all person data
        // This ensures consistent data across tabs
        await Promise.all([
          fetchPersonDetails("director", setDirectorDetails),
          fetchPersonDetails("shareholder", setShareholderDetails),
          fetchPersonDetails("secretary", setSecretaryDetails),
          fetchPersonDetails("sef", setSefDetails),
        ]);
      }
      
      setTimeout(() => {
        setActionMessage({ type: null, message: null });
      }, 3000);
    } catch (err) {
      console.error(`Error saving ${section} details:`, err);
      setActionMessage({
        type: "error",
        message:
          err.response?.data?.message || `Failed to save ${section} details`,
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Add this right after the person details form but before the Add button
  const SyncInformationBox = ({ personType, gmail }) => {
    const [showSyncInfo, setShowSyncInfo] = useState(false);
    const [syncData, setSyncData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [syncing, setSyncing] = useState(false);

    const checkInconsistencies = async () => {
      try {
        setLoading(true);
        const response = await axiosInstance.get(
          `/clients/${gmail}/check-inconsistencies`
        );
        setSyncData(response.data);
        setShowSyncInfo(true);
      } catch (err) {
        console.error("Error checking inconsistencies:", err);
        setActionMessage({
          type: "error",
          message: "Failed to check for data inconsistencies",
        });
      } finally {
        setLoading(false);
      }
    };

    // New function to trigger manual synchronization
    const handleForceSync = async () => {
      try {
        setSyncing(true);

        // Call the sync API endpoint without specifying a source record
        // This will use the most recently updated record as the source of truth
        const response = await axiosInstance.post(
          `/clients/${gmail}/sync/${personType}`
        );

        if (response.data.success) {
          setActionMessage({
            type: "success",
            message: `Successfully synchronized ${response.data.updatedRecords} ${personType} records across all jobs for this client.`,
          });

          // Refresh all person details to reflect the changes
          await Promise.all([
            fetchPersonDetails("director", setDirectorDetails),
            fetchPersonDetails("shareholder", setShareholderDetails),
            fetchPersonDetails("secretary", setSecretaryDetails),
            fetchPersonDetails("sef", setSefDetails),
          ]);

          // Re-check inconsistencies
          await checkInconsistencies();
        } else {
          setActionMessage({
            type: "error",
            message: `Synchronization failed: ${response.data.message}`,
          });
        }
      } catch (err) {
        console.error("Error during forced synchronization:", err);
        setActionMessage({
          type: "error",
          message:
            err.response?.data?.message || "Failed to synchronize records",
        });
      } finally {
        setSyncing(false);

        setTimeout(() => {
          setActionMessage({ type: null, message: null });
        }, 3000);
      }
    };

    if (!gmail) return null;

    return (
      <div className="mt-4 border border-indigo-100 rounded-lg p-4 bg-indigo-50/30">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <InformationCircleIcon className="h-5 w-5 text-indigo-600 mr-2" />
            <h3 className="text-sm font-medium text-indigo-800">
              Client Data Synchronization
            </h3>
          </div>
          {!showSyncInfo ? (
            <button
              onClick={checkInconsistencies}
              disabled={loading}
              className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center"
            >
              {loading ? (
                <>
                  <span className="animate-spin h-4 w-4 mr-1 border-b-2 border-indigo-600 rounded-full"></span>{" "}
                  Checking...
                </>
              ) : (
                <>
                  View Details
                  <ChevronDownIcon className="h-4 w-4 ml-1" />
                </>
              )}
            </button>
          ) : (
            <button
              onClick={() => setShowSyncInfo(false)}
              className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center"
            >
              Hide Details
              <ChevronUpIcon className="h-4 w-4 ml-1" />
            </button>
          )}
        </div>

        {showSyncInfo && syncData && (
          <div className="mt-3 text-sm">
            {syncData.records[personType] > 1 ? (
              <div>
                <p className="text-indigo-800">
                  <strong>Found {syncData.records[personType]} records</strong>{" "}
                  for this {personType} across different jobs for the same
                  client.
                </p>

                {syncData.hasInconsistencies &&
                  syncData.inconsistencies[personType] && (
                    <div className="mt-2 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                      <p className="font-medium text-yellow-800">
                        Inconsistencies detected:
                      </p>
                      <ul className="mt-1 list-disc pl-5 space-y-1 text-yellow-700">
                        {Object.entries(
                          syncData.inconsistencies[personType]
                        ).map(([field, values]) => (
                          <li key={field}>
                            <strong>{field}:</strong> has {values.length}{" "}
                            different values ({values.join(", ")})
                          </li>
                        ))}
                      </ul>

                      {/* New Force Sync button */}
                      <div className="mt-3">
                        <button
                          onClick={handleForceSync}
                          disabled={syncing}
                          className={`px-3 py-1.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors ${
                            syncing ? "opacity-70 cursor-not-allowed" : ""
                          }`}
                        >
                          {syncing ? (
                            <span className="flex items-center">
                              <span className="animate-spin h-4 w-4 mr-1 border-b-2 border-white rounded-full"></span>{" "}
                              Synchronizing...
                            </span>
                          ) : (
                            <span className="flex items-center">
                              <ArrowPathIcon className="h-4 w-4 mr-1" />
                              Force Synchronization
                            </span>
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                <p className="mt-2 text-indigo-700">
                  Changes to this form will be automatically synchronized across
                  all jobs for this client.
                </p>
              </div>
            ) : (
              <p className="text-indigo-700">
                There is only one {personType} record for this client. No
                synchronization needed.
              </p>
            )}
          </div>
        )}
      </div>
    );
  };

  // CompanySyncInformationBox component for JobDetails.jsx
  const CompanySyncInformationBox = ({ gmail }) => {
    const [showSyncInfo, setShowSyncInfo] = useState(false);
    const [syncData, setSyncData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [syncing, setSyncing] = useState(false);

    const checkCompanyDetails = async () => {
      try {
        setLoading(true);

        // Call the dedicated endpoint to check company details status
        const response = await axiosInstance.get(
          `/clients/${gmail}/company-details-status`
        );

        if (response.data) {
          setSyncData(response.data);
        } else {
          setSyncData({
            totalJobs: 0,
            jobsWithCompanyDetails: 0,
            hasMultipleJobs: false,
          });
        }

        setShowSyncInfo(true);
      } catch (err) {
        console.error("Error checking company details:", err);
        setActionMessage({
          type: "error",
          message: "Failed to check for company details across jobs",
        });
      } finally {
        setLoading(false);
      }
    };

    // Function to trigger manual synchronization of company details
    const handleForceSync = async () => {
      try {
        setSyncing(true);

        // Call the updateCompanyDetails endpoint with syncAcrossJobs=true
        const formData = new FormData();
        formData.append("syncAcrossJobs", "true");

        // We're just triggering a sync with current values, not changing anything
        const response = await axiosInstance.put(
          `/operations/jobs/${jobId}/company-details`,
          formData
        );

        if (
          response.data &&
          response.data.syncResult &&
          response.data.syncResult.success
        ) {
          setActionMessage({
            type: "success",
            message: `Successfully synchronized company details across ${response.data.syncResult.updatedRecords} job(s) for this client.`,
          });

          // Refresh company details
          const companyResponse = await axiosInstance.get(
            `/operations/jobs/${jobId}/company-details`
          );
          setCompanyDetails(companyResponse.data);

          // Re-check company details
          await checkCompanyDetails();
        } else {
          setActionMessage({
            type: "info",
            message:
              "No synchronization needed or no other jobs found for this client.",
          });
        }
      } catch (err) {
        console.error("Error during company details synchronization:", err);
        setActionMessage({
          type: "error",
          message:
            err.response?.data?.message ||
            "Failed to synchronize company details",
        });
      } finally {
        setSyncing(false);

        setTimeout(() => {
          setActionMessage({ type: null, message: null });
        }, 3000);
      }
    };

    if (!gmail) return null;

    return (
      <div className="mt-4 border border-indigo-100 rounded-lg p-4 bg-indigo-50/30">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <InformationCircleIcon className="h-5 w-5 text-indigo-600 mr-2" />
            <h3 className="text-sm font-medium text-indigo-800">
              Company Data Synchronization
            </h3>
          </div>
          {!showSyncInfo ? (
            <button
              onClick={checkCompanyDetails}
              disabled={loading}
              className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center"
            >
              {loading ? (
                <>
                  <span className="animate-spin h-4 w-4 mr-1 border-b-2 border-indigo-600 rounded-full"></span>{" "}
                  Checking...
                </>
              ) : (
                <>
                  View Details
                  <ChevronDownIcon className="h-4 w-4 ml-1" />
                </>
              )}
            </button>
          ) : (
            <button
              onClick={() => setShowSyncInfo(false)}
              className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center"
            >
              Hide Details
              <ChevronUpIcon className="h-4 w-4 ml-1" />
            </button>
          )}
        </div>

        {showSyncInfo && syncData && (
          <div className="mt-3 text-sm">
            {syncData.hasMultipleJobs ? (
              <div>
                <p className="text-indigo-800">
                  <strong>Found {syncData.totalJobs} job(s)</strong> for this
                  client, with {syncData.jobsWithCompanyDetails} having company
                  details.
                </p>

                <p className="mt-2 text-indigo-700">
                  Changes to company details will be automatically synchronized
                  across all jobs for this client.
                </p>

                {/* Force sync button */}
                <div className="mt-3">
                  <button
                    onClick={handleForceSync}
                    disabled={syncing}
                    className={`px-3 py-1.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors ${
                      syncing ? "opacity-70 cursor-not-allowed" : ""
                    }`}
                  >
                    {syncing ? (
                      <span className="flex items-center">
                        <span className="animate-spin h-4 w-4 mr-1 border-b-2 border-white rounded-full"></span>{" "}
                        Synchronizing...
                      </span>
                    ) : (
                      <span className="flex items-center">
                        <ArrowPathIcon className="h-4 w-4 mr-1" />
                        Force Synchronization
                      </span>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-indigo-700">
                This is the only job for this client. No synchronization needed.
              </p>
            )}
          </div>
        )}
      </div>
    );
  };

  // Bulk update all entries of a person type
  const handleBulkUpdatePersonEntries = async (section) => {
    try {
      setSubmitting(true);

      const details = {
        director: directorDetails,
        shareholder: shareholderDetails,
        secretary: secretaryDetails,
        sef: sefDetails,
      }[section];

      // Create FormData
      const formData = new FormData();

      // Add entries as JSON
      formData.append(
        "entries",
        JSON.stringify(
          details.map((entry) => ({
            _id: entry._id, // Include _id for existing entries
            name: entry.name || "",
            nationality: entry.nationality || "",
            qidNo: entry.qidNo || "",
            qidExpiry: entry.qidExpiry || "",
            nationalAddress: entry.nationalAddress || "",
            nationalAddressExpiry: entry.nationalAddressExpiry || "",
            passportNo: entry.passportNo || "",
            passportExpiry: entry.passportExpiry || "",
            mobileNo: entry.mobileNo || "",
            email: entry.email || "",
          }))
        )
      );

      // Add files with proper naming pattern
      details.forEach((entry, index) => {
        const fileFields = [
          "visaCopy",
          "qidDoc",
          "nationalAddressDoc",
          "passportDoc",
          "cv",
        ];

        fileFields.forEach((field) => {
          if (entry[field] && entry[field] instanceof File) {
            formData.append(`entry${index}_${field}`, entry[field]);
          }
        });
      });

      // Send bulk update request
      const response = await axiosInstance.post(
        `/operations/jobs/${jobId}/bulk-update/${section}`,
        formData
      );

      // Update state with response data
      const updateState = {
        director: setDirectorDetails,
        shareholder: setShareholderDetails,
        secretary: setSecretaryDetails,
        sef: setSefDetails,
      }[section];

      // Keep file references in the UI state
      updateState((prev) => {
        return response.data.map((updatedEntry, index) => {
          const originalEntry = prev[index] || {};
          return {
            ...updatedEntry,
            visaCopy: updatedEntry.visaCopy || originalEntry.visaCopy,
            qidDoc: updatedEntry.qidDoc || originalEntry.qidDoc,
            nationalAddressDoc:
              updatedEntry.nationalAddressDoc ||
              originalEntry.nationalAddressDoc,
            passportDoc: updatedEntry.passportDoc || originalEntry.passportDoc,
            cv: updatedEntry.cv || originalEntry.cv,
          };
        });
      });

      setActionMessage({
        type: "success",
        message: `All ${section} entries saved successfully`,
      });

      setTimeout(() => {
        setActionMessage({ type: null, message: null });
      }, 3000);
    } catch (err) {
      console.error(`Error saving ${section} entries:`, err);
      setActionMessage({
        type: "error",
        message:
          err.response?.data?.message || `Failed to save ${section} entries`,
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Handle person auto-fill
  const handlePersonAutoFill = (section, index, personDetails) => {
    if (!personDetails) return;
    
    const personData = {
      name: personDetails.name || '',
      nationality: personDetails.nationality || '',
      email: personDetails.email || '',
      mobileNo: personDetails.mobileNo || '',
      qidNo: personDetails.qidNo || '',
      qidExpiry: personDetails.qidExpiry || '',
      nationalAddress: personDetails.nationalAddress || '',
      nationalAddressExpiry: personDetails.nationalAddressExpiry || '',
      passportNo: personDetails.passportNo || '',
      passportExpiry: personDetails.passportExpiry || '',
    };

    // Update the appropriate section
    if (section === 'director') {
      const newDetails = [...directorDetails];
      newDetails[index] = { ...newDetails[index], ...personData };
      setDirectorDetails(newDetails);
    } else if (section === 'shareholder') {
      const newDetails = [...shareholderDetails];
      newDetails[index] = { ...newDetails[index], ...personData };
      setShareholderDetails(newDetails);
    } else if (section === 'secretary') {
      const newDetails = [...secretaryDetails];
      newDetails[index] = { ...newDetails[index], ...personData };
      setSecretaryDetails(newDetails);
    } else if (section === 'sef') {
      const newDetails = [...sefDetails];
      newDetails[index] = { ...newDetails[index], ...personData };
      setSefDetails(newDetails);
    }
  };

  // Delete person entry
  const handleDeletePersonEntry = async (section, index) => {
    try {
      const details = {
        director: directorDetails,
        shareholder: shareholderDetails,
        secretary: secretaryDetails,
        sef: sefDetails,
      }[section];

      const entry = details[index];

      // Only call API if entry has an _id (exists in database)
      if (entry._id) {
        await axiosInstance.delete(
          `/operations/jobs/${jobId}/person-details/${section}/${entry._id}`
        );
      }

      // Remove from state
      handleRemoveEntry(section, index);

      setActionMessage({
        type: "success",
        message: `${
          section.charAt(0).toUpperCase() + section.slice(1)
        } entry removed successfully`,
      });

      setTimeout(() => {
        setActionMessage({ type: null, message: null });
      }, 3000);
    } catch (err) {
      console.error(`Error deleting ${section} entry:`, err);
      setActionMessage({
        type: "error",
        message:
          err.response?.data?.message || `Failed to delete ${section} entry`,
      });
    }
  };

  // Render person details form
  const renderPersonDetails = (section, details, setDetails) => (
    <div className="space-y-6">
      {/* Add this at the top of your component's return statement */}
      {job &&
        job.timeline?.some((event) =>
          event.description?.includes("auto-populated")
        ) && (
          <div className="sticky top-0 z-50 bg-blue-100 border-l-4 border-blue-500 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <InformationCircleIcon
                  className="h-5 w-5 text-blue-500"
                  aria-hidden="true"
                />
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-700">
                  Some information has been auto-populated from other jobs for
                  the same client ({job.gmail}).
                </p>
              </div>
            </div>
          </div>
        )}

      {details.map((entry, index) => (
        <div
          key={index}
          className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-all duration-300"
        >
          <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100">
            <div className="flex items-center">
              <div className="bg-indigo-100 rounded-lg p-2 mr-3">
                <UserIcon className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-800">
                  Entry {index + 1}
                </h3>
                {/* Auto-populated badge */}
                {job &&
                  job.timeline?.some((event) =>
                    event.description?.includes(
                      `${section} details auto-populated`
                    )
                  ) && (
                    <span className="ml-2 text-xs text-green-600 bg-green-100 px-2 py-0.5 rounded-full">
                      Auto-populated
                    </span>
                  )}
              </div>
            </div>
            {details.length > 1 && (
              <button
                onClick={() => handleDeletePersonEntry(section, index)}
                className="text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-50 transition-colors"
                title="Remove entry"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">
                Name
                {/* Pre-filled indicator remains the same */}
                {job &&
                  job.timeline?.some((event) =>
                    event.description?.includes(
                      `${section} details auto-populated`
                    )
                  ) &&
                  entry.name && (
                    <span className="ml-2 text-xs text-indigo-600">
                      <CheckCircleIcon className="h-4 w-4 inline" /> Pre-filled
                    </span>
                  )}
              </label>

              {/* Replace standard input with history-aware input with auto-suggest */}
              <TextInputWithHistoryAndAutoSuggest
                fieldName="name"
                personId={entry._id}
                personType={section}
                jobId={jobId}
                value={entry.name || ""}
                onChange={(e) => {
                  const newDetails = [...details];
                  newDetails[index].name = e.target.value;
                  setDetails(newDetails);
                }}
                onAutoFill={(personDetails) => {
                  handlePersonAutoFill(section, index, personDetails);
                }}
                className={`mt-1 block w-full rounded-lg ${
                  job &&
                  job.timeline?.some((event) =>
                    event.description?.includes(
                      `${section} details auto-populated`
                    )
                  ) &&
                  entry.name
                    ? "bg-indigo-50 border-indigo-300" // Highlight auto-populated fields
                    : "border-gray-300"
                } shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition-colors`}
                placeholder="Enter full name"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">
                Nationality
                {job &&
                  job.timeline?.some((event) =>
                    event.description?.includes(
                      `${section} details auto-populated`
                    )
                  ) &&
                  entry.nationality && (
                    <span className="ml-2 text-xs text-indigo-600">
                      <CheckCircleIcon className="h-4 w-4 inline" /> Pre-filled
                    </span>
                  )}
              </label>
              <input
                type="text"
                value={entry.nationality || ""} // Ensure controlled input
                onChange={(e) => {
                  const newDetails = [...details];
                  newDetails[index] = {
                    ...newDetails[index],
                    nationality: e.target.value,
                  };
                  setDetails(newDetails);
                }}
                className={`mt-1 block w-full rounded-lg ${
                  job &&
                  job.timeline?.some((event) =>
                    event.description?.includes(
                      `${section} details auto-populated`
                    )
                  ) &&
                  entry.nationality
                    ? "bg-indigo-50 border-indigo-300"
                    : "border-gray-300"
                } shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition-colors`}
                placeholder="Enter nationality"
                autoComplete="off"
                // REMOVED: onKeyDown handler that was preventing normal typing
              />
            </div>
            {/* Visa Copy Upload - HIDDEN */}
            {/* <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                <DocumentTextIcon className="h-4 w-4 mr-1 text-indigo-500" />
                Visa Copy
                {job &&
                  job.timeline?.some((event) =>
                    event.description?.includes(
                      `${section} details auto-populated`
                    )
                  ) &&
                  entry.visaCopy && (
                    <span className="ml-2 text-xs text-indigo-600">
                      <CheckCircleIcon className="h-4 w-4 inline" /> Pre-filled
                    </span>
                  )}
              </label>
              <div
                className={`border-2 rounded-lg p-3 transition-all duration-300 ${
                  isDragging
                    ? "border-indigo-500 bg-indigo-50 shadow-md"
                    : entry.visaCopy
                    ? "border-green-400 bg-green-50/40 shadow-md"
                    : "border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/30 hover:shadow-md"
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handlePersonDrop(e, section, "visaCopy", index)}
              >
                {entry.visaCopy ? (
                  <div className="flex items-center justify-between bg-white p-3 rounded-lg shadow-sm border border-gray-100">
                    <div className="flex items-center flex-1 min-w-0">
                      <div className="bg-indigo-100 p-2 rounded-lg mr-3">
                        <DocumentTextIcon className="h-5 w-5 text-indigo-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium text-gray-900 truncate block">
                          {entry.visaCopy instanceof File
                            ? entry.visaCopy.name
                            : "Visa Copy Document"}
                        </span>
                        <span className="text-xs text-green-600 flex items-center">
                          <CheckCircleIcon className="h-3 w-3 mr-1" /> Uploaded
                          {job &&
                            job.timeline?.some((event) =>
                              event.description?.includes(
                                `${section} details auto-populated`
                              )
                            ) &&
                            typeof entry.visaCopy === "string" && (
                              <span className="ml-2 bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full text-xs">
                                Auto-filled
                              </span>
                            )}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center ml-4">
                      {typeof entry.visaCopy === "string" && (
                        <a
                          href={entry.visaCopy}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mr-2 px-3 py-1.5 text-xs font-medium text-indigo-600 hover:text-white hover:bg-indigo-600 bg-indigo-50 rounded-lg shadow-sm border border-indigo-200 hover:shadow-md transition-all duration-200"
                        >
                          View Document
                        </a>
                      )}
                      <button
                        onClick={() => {
                          if (entry._id) {
                            handleDeletePersonDocument(section, entry._id, 'visaCopy')
                          } else {
                            handlePersonFileChange(section, "visaCopy", index, null)
                          }
                        }}
                        disabled={submitting}
                        className={`p-1.5 text-red-400 hover:text-white hover:bg-red-500 rounded-lg hover:shadow-md transition-all duration-200 ${
                          submitting ? "opacity-50 cursor-not-allowed" : ""
                        }`}
                        title="Delete document permanently"
                      >
                        <XMarkIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <div className="bg-gray-100/80 mx-auto rounded-full w-14 h-14 flex items-center justify-center mb-2">
                      <CloudArrowUpIcon className="h-7 w-7 text-gray-400" />
                    </div>
                    <div className="mt-2">
                      <label className="cursor-pointer block">
                        <span className="relative px-4 py-2 rounded-md font-medium text-sm text-white bg-gradient-to-r from-indigo-600 to-blue-500 hover:from-indigo-700 hover:to-blue-600 shadow-sm transition-all duration-200 hover:shadow-md">
                          Choose File
                        </span>
                        <input
                          type="file"
                          className="sr-only"
                          onChange={(e) =>
                            handlePersonFileChange(
                              section,
                              "visaCopy",
                              index,
                              e.target.files[0]
                            )
                          }
                        />
                      </label>
                      <p className="text-xs text-gray-500 mt-2">
                        or drag and drop your Visa Copy document here
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div> */}

            {/* QID Details Section */}
            <div
              id={`expiry-field-${section}-qid-${index}`}
              data-person-name={entry.name || ''}
              className={`col-span-2 p-4 rounded-lg border transition-all duration-500 ${
                highlightedField === `expiry-field-${section}-qid-${index}`
                  ? 'ring-4 ring-yellow-400 bg-yellow-100 shadow-xl animate-pulse border-yellow-400'
                  : 'bg-gradient-to-r from-blue-50/50 to-indigo-50/50 border-indigo-100/50'
              }`}
            >
              <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center">
                <UserIcon className="h-4 w-4 mr-1 text-indigo-500" />
                QID Details
                {job &&
                  job.timeline?.some((event) =>
                    event.description?.includes(
                      `${section} details auto-populated`
                    )
                  ) &&
                  entry.qidNo && (
                    <span className="ml-2 text-xs text-indigo-600">
                      <CheckCircleIcon className="h-4 w-4 inline" /> Pre-filled
                    </span>
                  )}
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    QID Number
                  </label>
                  <TextInputWithHistory
                    fieldName="qidNo"
                    personId={entry._id}
                    personType={section}
                    jobId={jobId}
                    value={entry.qidNo || ""}
                    onChange={(e) => {
                      const newDetails = [...details];
                      newDetails[index] = {
                        ...newDetails[index],
                        qidNo: e.target.value
                      };
                      setDetails(newDetails);
                    }}
                    className={`block w-full rounded-lg ${
                      job &&
                      job.timeline?.some((event) =>
                        event.description?.includes(
                          `${section} details auto-populated`
                        )
                      ) &&
                      entry.qidNo
                        ? "bg-indigo-50 border-indigo-300"
                        : "border-gray-300"
                    } shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition-colors`}
                    placeholder="QID Number"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    Expiry Date
                  </label>
                  <div className="flex items-center space-x-2">
                    <DateInputWithHistory
                      fieldName="qidExpiry"
                      personId={entry._id}
                      personType={section}
                      jobId={jobId}
                      value={entry.qidExpiry || ""}
                      onChange={(e) => {
                        const newDetails = [...details];
                        newDetails[index] = {
                          ...newDetails[index],
                          qidExpiry: e.target.value
                        };
                        setDetails(newDetails);
                      }}
                      className={`block w-full rounded-lg ${
                        job &&
                        job.timeline?.some((event) =>
                          event.description?.includes(
                            `${section} details auto-populated`
                          )
                        ) &&
                        entry.qidExpiry
                          ? "bg-indigo-50 border-indigo-300"
                          : "border-gray-300"
                      } shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition-colors`}
                    />
                    <button
                      onClick={() =>
                        handleRenewDate(section, "qidExpiry", index)
                      }
                      className="p-2 text-gray-400 hover:text-indigo-500 rounded-lg hover:bg-indigo-50 transition-colors"
                      title="Renew for one year"
                    >
                      <ArrowPathIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    QID Document
                  </label>
                  <div
                    className={`border-2 rounded-lg p-2 h-10 flex items-center justify-center transition-all duration-300 ${
                      entry.qidDoc
                        ? "border-green-400 bg-green-50/40 shadow-sm"
                        : "border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/30"
                    }`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) =>
                      handlePersonDrop(e, section, "qidDoc", index)
                    }
                  >
                    {entry.qidDoc ? (
                      <div className="flex items-center justify-between w-full px-2">
                        <div className="flex items-center text-xs text-green-600">
                          <CheckCircleIcon className="h-3 w-3 mr-1" /> Uploaded
                          {job &&
                            job.timeline?.some((event) =>
                              event.description?.includes(
                                `${section} details auto-populated`
                              )
                            ) &&
                            typeof entry.qidDoc === "string" && (
                              <span className="ml-2 bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full text-xs">
                                Auto-filled
                              </span>
                            )}
                        </div>
                        <div className="flex items-center gap-1">
                          {typeof entry.qidDoc === "string" && (
                            <a
                              href={entry.qidDoc}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2 py-0.5 text-xs font-medium text-indigo-600 hover:text-white hover:bg-indigo-600 bg-indigo-50 rounded-lg shadow-sm border border-indigo-200 hover:shadow-md transition-all duration-200"
                            >
                              View
                            </a>
                          )}
                          {entry._id && typeof entry.qidDoc === "string" && (
                            <label className="cursor-pointer">
                              <span className="p-0.5 text-green-500 hover:text-white hover:bg-green-500 rounded-lg hover:shadow-md transition-all duration-200 inline-flex" title="Replace (archive old to Library)">
                                <ArrowPathIcon className="h-3 w-3" />
                              </span>
                              <input
                                type="file"
                                className="sr-only"
                                onChange={(e) => {
                                  if (e.target.files[0]) {
                                    handleReplacePersonDocument(section, entry._id, 'qidDoc', e.target.files[0]);
                                  }
                                }}
                              />
                            </label>
                          )}
                          <button
                            onClick={() => {
                              if (entry._id) {
                                handleDeletePersonDocument(section, entry._id, 'qidDoc')
                              } else {
                                handlePersonFileChange(section, "qidDoc", index, null)
                              }
                            }}
                            disabled={submitting}
                            className={`p-0.5 text-red-400 hover:text-white hover:bg-red-500 rounded-lg hover:shadow-md transition-all duration-200 ${
                              submitting ? "opacity-50 cursor-not-allowed" : ""
                            }`}
                            title="Delete permanently"
                          >
                            <XMarkIcon className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <label className="cursor-pointer text-center block w-full">
                        <div className="flex items-center justify-center text-gray-400 hover:text-indigo-500 transition-colors">
                          <CloudArrowUpIcon className="h-4 w-4 mr-1" />
                          <span className="text-xs">Upload QID</span>
                        </div>
                        <input
                          type="file"
                          className="sr-only"
                          onChange={(e) =>
                            handlePersonFileChange(
                              section,
                              "qidDoc",
                              index,
                              e.target.files[0]
                            )
                          }
                        />
                      </label>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* National Address Section */}
            <div
              id={`expiry-field-${section}-nationalAddress-${index}`}
              data-person-name={entry.name || ''}
              className={`col-span-2 p-4 rounded-lg border transition-all duration-500 ${
                highlightedField === `expiry-field-${section}-nationalAddress-${index}`
                  ? 'ring-4 ring-yellow-400 bg-yellow-100 shadow-xl animate-pulse border-yellow-400'
                  : 'bg-gradient-to-r from-blue-50/50 to-indigo-50/50 border-indigo-100/50'
              }`}
            >
              <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center">
                <MapPinIcon className="h-4 w-4 mr-1 text-indigo-500" />
                National Address
                {job &&
                  job.timeline?.some((event) =>
                    event.description?.includes(
                      `${section} details auto-populated`
                    )
                  ) &&
                  entry.nationalAddress && (
                    <span className="ml-2 text-xs text-indigo-600">
                      <CheckCircleIcon className="h-4 w-4 inline" /> Pre-filled
                    </span>
                  )}
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="col-span-2">
                  <div
                    className={`border-2 rounded-lg p-3 transition-all duration-300 ${
                      isDragging
                        ? "border-indigo-500 bg-indigo-50 shadow-md"
                        : entry.nationalAddressDoc
                        ? "border-green-400 bg-green-50/40 shadow-md"
                        : "border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/30 hover:shadow-md"
                    }`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) =>
                      handlePersonDrop(e, section, "nationalAddressDoc", index)
                    }
                  >
                    {entry.nationalAddressDoc ? (
                      <div className="flex items-center justify-between bg-white p-3 rounded-lg shadow-sm border border-gray-100">
                        <div className="flex items-center flex-1 min-w-0">
                          <div className="bg-indigo-100 p-2 rounded-lg mr-3">
                            <DocumentTextIcon className="h-5 w-5 text-indigo-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="text-sm font-medium text-gray-900 truncate block">
                              {entry.nationalAddressDoc instanceof File
                                ? entry.nationalAddressDoc.name
                                : "National Address Document"}
                            </span>
                            <span className="text-xs text-green-600 flex items-center">
                              <CheckCircleIcon className="h-3 w-3 mr-1" />{" "}
                              Uploaded
                              {job &&
                                job.timeline?.some((event) =>
                                  event.description?.includes(
                                    `${section} details auto-populated`
                                  )
                                ) &&
                                typeof entry.nationalAddressDoc ===
                                  "string" && (
                                  <span className="ml-2 bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full text-xs">
                                    Auto-filled
                                  </span>
                                )}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 ml-4">
                          {typeof entry.nationalAddressDoc === "string" && (
                            <a
                              href={entry.nationalAddressDoc}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-1.5 text-xs font-medium text-indigo-600 hover:text-white hover:bg-indigo-600 bg-indigo-50 rounded-lg shadow-sm border border-indigo-200 hover:shadow-md transition-all duration-200"
                            >
                              View Document
                            </a>
                          )}
                          {entry._id && typeof entry.nationalAddressDoc === "string" && (
                            <label className="cursor-pointer">
                              <span className="p-1.5 text-green-500 hover:text-white hover:bg-green-500 rounded-lg hover:shadow-md transition-all duration-200 inline-flex" title="Replace (archive old to Library)">
                                <ArrowPathIcon className="h-4 w-4" />
                              </span>
                              <input
                                type="file"
                                className="sr-only"
                                onChange={(e) => {
                                  if (e.target.files[0]) {
                                    handleReplacePersonDocument(section, entry._id, 'nationalAddressDoc', e.target.files[0]);
                                  }
                                }}
                              />
                            </label>
                          )}
                          <button
                            onClick={() => {
                              if (entry._id) {
                                handleDeletePersonDocument(section, entry._id, 'nationalAddressDoc')
                              } else {
                                handlePersonFileChange(section, "nationalAddressDoc", index, null)
                              }
                            }}
                            className="p-1.5 text-red-400 hover:text-white hover:bg-red-500 rounded-lg hover:shadow-md transition-all duration-200"
                            title="Delete document permanently"
                          >
                            <XMarkIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <div className="bg-gray-100/80 mx-auto rounded-full w-12 h-12 flex items-center justify-center mb-2">
                          <CloudArrowUpIcon className="h-6 w-6 text-gray-400" />
                        </div>
                        <div className="mt-1">
                          <label className="cursor-pointer block">
                            <span className="relative px-4 py-1.5 rounded-md font-medium text-sm text-white bg-gradient-to-r from-indigo-600 to-blue-500 hover:from-indigo-700 hover:to-blue-600 shadow-sm transition-all duration-200 hover:shadow-md">
                              Upload Address Document
                            </span>
                            <input
                              type="file"
                              className="sr-only"
                              onChange={(e) =>
                                handlePersonFileChange(
                                  section,
                                  "nationalAddressDoc",
                                  index,
                                  e.target.files[0]
                                )
                              }
                            />
                          </label>
                          <p className="text-xs text-gray-500 mt-1">
                            or drag and drop here
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="w-full space-y-1">
                    <label className="block text-xs text-gray-500">
                      Expiry Date
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="date"
                        value={entry.nationalAddressExpiry || ""}
                        onChange={(e) => {
                          const newDetails = [...details];
                          newDetails[index] = {
                            ...newDetails[index],
                            nationalAddressExpiry: e.target.value
                          };
                          setDetails(newDetails);
                        }}
                        className={`block w-full rounded-lg ${
                          job &&
                          job.timeline?.some((event) =>
                            event.description?.includes(
                              `${section} details auto-populated`
                            )
                          ) &&
                          entry.nationalAddressExpiry
                            ? "bg-indigo-50 border-indigo-300"
                            : "border-gray-300"
                        } shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition-colors`}
                      />
                      <button
                        onClick={() =>
                          handleRenewDate(
                            section,
                            "nationalAddressExpiry",
                            index
                          )
                        }
                        className="p-2 text-gray-400 hover:text-indigo-500 rounded-lg hover:bg-indigo-50 transition-colors"
                        title="Renew for one year"
                      >
                        <ArrowPathIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Passport Document - Compact Beautiful Card */}
            <div
              id={`expiry-field-${section}-passport-${index}`}
              data-person-name={entry.name || ''}
              className={`col-span-2 p-4 rounded-lg border transition-all duration-500 ${
                highlightedField === `expiry-field-${section}-passport-${index}`
                  ? 'ring-4 ring-yellow-400 bg-yellow-100 shadow-xl animate-pulse border-yellow-400'
                  : 'bg-gradient-to-r from-blue-50/50 to-indigo-50/50 border-indigo-100/50'
              }`}
            >
              <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center">
                <DocumentDuplicateIcon className="h-4 w-4 mr-1 text-indigo-500" />
                Passport Details
                {job &&
                  job.timeline?.some((event) =>
                    event.description?.includes(
                      `${section} details auto-populated`
                    )
                  ) &&
                  entry.passportNo && (
                    <span className="ml-2 text-xs text-indigo-600">
                      <CheckCircleIcon className="h-4 w-4 inline" /> Pre-filled
                    </span>
                  )}
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    Passport Number
                  </label>
                  <TextInputWithHistory
                    fieldName="passportNo"
                    personId={entry._id}
                    personType={section}
                    jobId={jobId}
                    value={entry.passportNo || ""}
                    onChange={(e) => {
                      const newDetails = [...details];
                      newDetails[index].passportNo = e.target.value;
                      setDetails(newDetails);
                    }}
                    className={`block w-full rounded-lg ${
                      job &&
                      job.timeline?.some((event) =>
                        event.description?.includes(
                          `${section} details auto-populated`
                        )
                      ) &&
                      entry.passportNo
                        ? "bg-indigo-50 border-indigo-300"
                        : "border-gray-300"
                    } shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition-colors`}
                    placeholder="Passport Number"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    Expiry Date
                  </label>
                  <div className="flex items-center space-x-2">
                    <DateInputWithHistory
                      fieldName="passportExpiry"
                      personId={entry._id}
                      personType={section}
                      jobId={jobId}
                      value={entry.passportExpiry || ""}
                      onChange={(e) => {
                        const newDetails = [...details];
                        newDetails[index] = {
                          ...newDetails[index],
                          passportExpiry: e.target.value
                        };
                        setDetails(newDetails);
                      }}
                      className={`block w-full rounded-lg ${
                        job &&
                        job.timeline?.some((event) =>
                          event.description?.includes(
                            `${section} details auto-populated`
                          )
                        ) &&
                        entry.passportExpiry
                          ? "bg-indigo-50 border-indigo-300"
                          : "border-gray-300"
                      } shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition-colors`}
                    />
                    <button
                      onClick={() =>
                        handleRenewDate(section, "passportExpiry", index)
                      }
                      className="p-2 text-gray-400 hover:text-indigo-500 rounded-lg hover:bg-indigo-50 transition-colors"
                      title="Renew for one year"
                    >
                      <ArrowPathIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    Passport Document
                  </label>
                  <div
                    className={`border-2 rounded-lg p-2 h-10 flex items-center justify-center transition-all duration-300 ${
                      entry.passportDoc
                        ? "border-green-400 bg-green-50/40 shadow-sm"
                        : "border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/30"
                    }`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) =>
                      handlePersonDrop(e, section, "passportDoc", index)
                    }
                  >
                    {entry.passportDoc ? (
                      <div className="flex items-center justify-between w-full px-2">
                        <div className="flex items-center text-xs text-green-600">
                          <CheckCircleIcon className="h-3 w-3 mr-1" /> Uploaded
                          {job &&
                            job.timeline?.some((event) =>
                              event.description?.includes(
                                `${section} details auto-populated`
                              )
                            ) &&
                            typeof entry.passportDoc === "string" && (
                              <span className="ml-2 bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full text-xs">
                                Auto-filled
                              </span>
                            )}
                        </div>
                        <div className="flex items-center gap-1">
                          {typeof entry.passportDoc === "string" && (
                            <a
                              href={entry.passportDoc}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2 py-0.5 text-xs font-medium text-indigo-600 hover:text-white hover:bg-indigo-600 bg-indigo-50 rounded-lg shadow-sm border border-indigo-200 hover:shadow-md transition-all duration-200"
                            >
                              View
                            </a>
                          )}
                          {entry._id && typeof entry.passportDoc === "string" && (
                            <label className="cursor-pointer">
                              <span className="p-0.5 text-green-500 hover:text-white hover:bg-green-500 rounded-lg hover:shadow-md transition-all duration-200 inline-flex" title="Replace (archive old to Library)">
                                <ArrowPathIcon className="h-3 w-3" />
                              </span>
                              <input
                                type="file"
                                className="sr-only"
                                onChange={(e) => {
                                  if (e.target.files[0]) {
                                    handleReplacePersonDocument(section, entry._id, 'passportDoc', e.target.files[0]);
                                  }
                                }}
                              />
                            </label>
                          )}
                          <button
                            onClick={() => {
                              if (entry._id) {
                                handleDeletePersonDocument(section, entry._id, 'passportDoc')
                              } else {
                                handlePersonFileChange(section, "passportDoc", index, null)
                              }
                            }}
                            disabled={submitting}
                            className={`p-0.5 text-red-400 hover:text-white hover:bg-red-500 rounded-lg hover:shadow-md transition-all duration-200 ${
                              submitting ? "opacity-50 cursor-not-allowed" : ""
                            }`}
                            title="Delete document permanently"
                          >
                            <XMarkIcon className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <label className="cursor-pointer text-center block w-full">
                        <div className="flex items-center justify-center text-gray-400 hover:text-indigo-500 transition-colors">
                          <CloudArrowUpIcon className="h-4 w-4 mr-1" />
                          <span className="text-xs">Upload Passport</span>
                        </div>
                        <input
                          type="file"
                          className="sr-only"
                          onChange={(e) =>
                            handlePersonFileChange(
                              section,
                              "passportDoc",
                              index,
                              e.target.files[0]
                            )
                          }
                        />
                      </label>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">
                Mobile Number
                {job &&
                  job.timeline?.some((event) =>
                    event.description?.includes(
                      `${section} details auto-populated`
                    )
                  ) &&
                  entry.mobileNo && (
                    <span className="ml-2 text-xs text-indigo-600">
                      <CheckCircleIcon className="h-4 w-4 inline" /> Pre-filled
                    </span>
                  )}
              </label>
              <TextInputWithHistory
                fieldName="mobileNo"
                personId={entry._id}
                personType={section}
                jobId={jobId}
                value={entry.mobileNo || ""}
                onChange={(e) => {
                  const newDetails = [...details];
                  newDetails[index].mobileNo = e.target.value;
                  setDetails(newDetails);
                }}
                className={`mt-1 block w-full rounded-lg ${
                  job &&
                  job.timeline?.some((event) =>
                    event.description?.includes(
                      `${section} details auto-populated`
                    )
                  ) &&
                  entry.mobileNo
                    ? "bg-indigo-50 border-indigo-300"
                    : "border-gray-300"
                } shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition-colors`}
                placeholder="Enter mobile number"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">
                Email Address
                {job &&
                  job.timeline?.some((event) =>
                    event.description?.includes(
                      `${section} details auto-populated`
                    )
                  ) &&
                  entry.email && (
                    <span className="ml-2 text-xs text-indigo-600">
                      <CheckCircleIcon className="h-4 w-4 inline" /> Pre-filled
                    </span>
                  )}
              </label>
              <input
                type="email"
                value={entry.email || ""}
                onChange={(e) => {
                  const newDetails = [...details];
                  newDetails[index].email = e.target.value;
                  setDetails(newDetails);
                }}
                className={`mt-1 block w-full rounded-lg ${
                  job &&
                  job.timeline?.some((event) =>
                    event.description?.includes(
                      `${section} details auto-populated`
                    )
                  ) &&
                  entry.email
                    ? "bg-indigo-50 border-indigo-300"
                    : "border-gray-300"
                } shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition-colors`}
                placeholder="Enter email address"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                <DocumentTextIcon className="h-4 w-4 mr-1 text-indigo-500" />
                Curriculum Vitae (CV)
                {job &&
                  job.timeline?.some((event) =>
                    event.description?.includes(
                      `${section} details auto-populated`
                    )
                  ) &&
                  entry.cv && (
                    <span className="ml-2 text-xs text-indigo-600">
                      <CheckCircleIcon className="h-4 w-4 inline" /> Pre-filled
                    </span>
                  )}
              </label>
              <div
                className={`border-2 rounded-lg p-3 transition-all duration-300 ${
                  isDragging
                    ? "border-indigo-500 bg-indigo-50 shadow-md"
                    : entry.cv
                    ? "border-green-400 bg-green-50/40 shadow-md"
                    : "border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/30 hover:shadow-md"
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handlePersonDrop(e, section, "cv", index)}
              >
                {entry.cv ? (
                  <div className="flex items-center justify-between bg-white p-3 rounded-lg shadow-sm border border-gray-100">
                    <div className="flex items-center flex-1 min-w-0">
                      <div className="bg-indigo-100 p-2 rounded-lg mr-3">
                        <DocumentTextIcon className="h-5 w-5 text-indigo-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium text-gray-900 truncate block">
                          {entry.cv instanceof File
                            ? entry.cv.name
                            : "CV Document"}
                        </span>
                        <span className="text-xs text-green-600 flex items-center">
                          <CheckCircleIcon className="h-3 w-3 mr-1" /> Uploaded
                          {job &&
                            job.timeline?.some((event) =>
                              event.description?.includes(
                                `${section} details auto-populated`
                              )
                            ) &&
                            typeof entry.cv === "string" && (
                              <span className="ml-2 bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full text-xs">
                                Auto-filled
                              </span>
                            )}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 ml-4">
                      {typeof entry.cv === "string" && (
                        <a
                          href={entry.cv}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 text-xs font-medium text-indigo-600 hover:text-white hover:bg-indigo-600 bg-indigo-50 rounded-lg shadow-sm border border-indigo-200 hover:shadow-md transition-all duration-200"
                        >
                          View Document
                        </a>
                      )}
                      {entry._id && typeof entry.cv === "string" && (
                        <label className="cursor-pointer">
                          <span className="p-1.5 text-green-500 hover:text-white hover:bg-green-500 rounded-lg hover:shadow-md transition-all duration-200 inline-flex" title="Replace (archive old to Library)">
                            <ArrowPathIcon className="h-4 w-4" />
                          </span>
                          <input
                            type="file"
                            className="sr-only"
                            onChange={(e) => {
                              if (e.target.files[0]) {
                                handleReplacePersonDocument(section, entry._id, 'cv', e.target.files[0]);
                              }
                            }}
                          />
                        </label>
                      )}
                      <button
                        onClick={() => {
                          if (entry._id) {
                            handleDeletePersonDocument(section, entry._id, 'cv')
                          } else {
                            handlePersonFileChange(section, "cv", index, null)
                          }
                        }}
                        disabled={submitting}
                        className={`p-1.5 text-red-400 hover:text-white hover:bg-red-500 rounded-lg hover:shadow-md transition-all duration-200 ${
                          submitting ? "opacity-50 cursor-not-allowed" : ""
                        }`}
                        title="Delete permanently"
                      >
                        <XMarkIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <div className="bg-gray-100/80 mx-auto rounded-full w-14 h-14 flex items-center justify-center mb-2">
                      <CloudArrowUpIcon className="h-7 w-7 text-gray-400" />
                    </div>
                    <div className="mt-2">
                      <label className="cursor-pointer block">
                        <span className="relative px-4 py-2 rounded-md font-medium text-sm text-white bg-gradient-to-r from-indigo-600 to-blue-500 hover:from-indigo-700 hover:to-blue-600 shadow-sm transition-all duration-200 hover:shadow-md">
                          Upload CV
                        </span>
                        <input
                          type="file"
                          className="sr-only"
                          onChange={(e) =>
                            handlePersonFileChange(
                              section,
                              "cv",
                              index,
                              e.target.files[0]
                            )
                          }
                        />
                      </label>
                      <p className="text-xs text-gray-500 mt-2">
                        or drag and drop your CV document here
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Other Documents Section */}
            <div className="col-span-2">
              <div className="border-t border-gray-200 pt-6 mt-6">
                <div className="flex items-center justify-between mb-4">
                  <label className="block text-sm font-medium text-gray-700 flex items-center">
                    <DocumentTextIcon className="h-4 w-4 mr-1 text-indigo-500" />
                    Other Documents
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const fileInput = document.createElement("input");
                      fileInput.type = "file";
                      fileInput.accept = ".pdf,.doc,.docx,.jpg,.jpeg,.png";
                      fileInput.onchange = async (e) => {
                        const file = e.target.files[0];
                        if (file) {
                          const newDetails = [...details];
                          if (!newDetails[index].otherDocuments) {
                            newDetails[index].otherDocuments = [];
                          }
                          newDetails[index].otherDocuments.push(file);
                          setDetails(newDetails);
                        }
                      };
                      fileInput.click();
                    }}
                    className="px-3 py-1.5 text-xs font-medium text-indigo-600 hover:text-white hover:bg-indigo-600 bg-indigo-50 rounded-lg shadow-sm border border-indigo-200 hover:shadow-md transition-all duration-200 flex items-center space-x-1"
                  >
                    <PlusIcon className="h-3 w-3" />
                    <span>Add Document</span>
                  </button>
                </div>

                {entry.otherDocuments && entry.otherDocuments.length > 0 ? (
                  <div className="space-y-2">
                    {entry.otherDocuments.map((doc, docIndex) => (
                      <div
                        key={docIndex}
                        className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border border-gray-200"
                      >
                        <div className="flex items-center flex-1 min-w-0">
                          <DocumentTextIcon className="h-4 w-4 text-indigo-600 mr-2 flex-shrink-0" />
                          <span className="text-sm text-gray-900 truncate">
                            {doc instanceof File ? doc.name : doc.fileName || `Document ${docIndex + 1}`}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2 ml-2">
                          {typeof doc === "object" && doc.fileUrl && (
                            <a
                              href={doc.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2 py-1 text-xs font-medium text-indigo-600 hover:text-white hover:bg-indigo-600 bg-white rounded border border-indigo-200 hover:shadow-sm transition-all"
                            >
                              View
                            </a>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              const fileInput = document.createElement("input");
                              fileInput.type = "file";
                              fileInput.accept = ".pdf,.doc,.docx,.jpg,.jpeg,.png";
                              fileInput.onchange = (e) => {
                                const file = e.target.files[0];
                                if (file) {
                                  const newDetails = [...details];
                                  newDetails[index] = {
                                    ...newDetails[index],
                                    otherDocuments: [...(newDetails[index].otherDocuments || [])]
                                  };
                                  newDetails[index].otherDocuments[docIndex] = file;
                                  setDetails(newDetails);
                                }
                              };
                              fileInput.click();
                            }}
                            className="px-2 py-1 text-xs font-medium text-blue-600 hover:text-white hover:bg-blue-600 bg-white rounded border border-blue-200 hover:shadow-sm transition-all"
                          >
                            Replace
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const newDetails = [...details];
                              newDetails[index] = {
                                ...newDetails[index],
                                otherDocuments: [...(newDetails[index].otherDocuments || [])]
                              };
                              newDetails[index].otherDocuments.splice(docIndex, 1);
                              setDetails(newDetails);
                            }}
                            className="p-1 text-red-500 hover:text-white hover:bg-red-500 rounded hover:shadow-sm transition-all"
                            title="Delete document"
                          >
                            <XMarkIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                    <DocumentTextIcon className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                    <p className="text-sm text-gray-500">No other documents uploaded</p>
                    <p className="text-xs text-gray-400 mt-1">Click "Add Document" to upload files</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={() => handleSavePersonEntry(section, index)}
              disabled={submitting}
              className={`px-4 py-2 bg-gradient-to-r from-indigo-600 to-blue-500 text-white rounded-lg hover:from-indigo-700 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 shadow-md transition-all duration-200 transform hover:scale-105 ${
                submitting ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {submitting ? (
                <>
                  <span className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </button>
          </div>
        </div>
      ))}

      {/* Information note about changes affecting only current job */}
      {job &&
        job.timeline?.some((event) =>
          event.description?.includes(`${section} details auto-populated`)
        ) && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-xs text-gray-700 flex items-start">
              <InformationCircleIcon className="h-4 w-4 text-gray-500 mr-1 flex-shrink-0 mt-0.5" />
              <span>
                Changes made to these details will only affect this specific
                job. The original data used for auto-population remains
                unchanged for other jobs.
              </span>
            </p>
          </div>
        )}

      {/* Add synchronization information box for person data */}
      {job && job.gmail && (
        <SyncInformationBox personType={section} gmail={job.gmail} />
      )}

      <div className="flex justify-center pt-4">
        <button
          type="button"
          onClick={() => handleAddEntry(section)}
          className="inline-flex items-center px-5 py-3 border border-gray-200 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 transform hover:scale-105"
        >
          <PencilIcon className="h-5 w-5 mr-2 text-indigo-600" />
          Add Another Entry
        </button>
      </div>
    </div>
  );

const sanitizeDateValue = (dateValue) => {
  // Return empty string for display if date is null, undefined, or invalid
  if (!dateValue || dateValue === 'undefined' || dateValue === 'null') {
    return '';
  }
  
  // If it's already in YYYY-MM-DD format, return as is
  if (typeof dateValue === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
    return dateValue;
  }
  
  // Try to parse and format the date
  try {
    const date = new Date(dateValue);
    if (isNaN(date.getTime())) {
      return '';
    }
    return date.toISOString().split('T')[0];
  } catch (error) {
    console.error('Error formatting date:', error);
    return '';
  }
};

// Helper function to safely format date for form data
const formatDateForFormData = (dateValue) => {
  if (!dateValue || dateValue === 'undefined' || dateValue === 'null' || dateValue.trim() === '') {
    return null;
  }
  
  try {
    const date = new Date(dateValue);
    if (isNaN(date.getTime())) {
      return null;
    }
    return dateValue; // Return the original string if it's valid
  } catch (error) {
    return null;
  }
};

// Add text fields with proper validation
const appendFormDataField = (formData, fieldName, value) => {
  // Only append if value exists and is not empty
  if (value && value !== 'undefined' && value !== 'null' && value.trim() !== '') {
    formData.append(fieldName, value);
  }
};

// Add date fields with proper validation  
const appendFormDataDate = (formData, fieldName, dateValue) => {
  // Only append valid dates
  if (dateValue && dateValue !== 'undefined' && dateValue !== 'null' && dateValue.trim() !== '') {
    const parsedDate = new Date(dateValue);
    if (!isNaN(parsedDate.getTime())) {
      formData.append(fieldName, dateValue);
    }
  }
};

// Enhanced renderCompanyDetailsSection function with document update/replace options

const renderCompanyDetailsSection = () => {
  // Helper function to check if a document is expired
  const isDocumentExpired = (expiryDate) => {
    if (!expiryDate) return false;
    return new Date(expiryDate) < new Date();
  };

  // Helper function to get expiry status styling
  const getExpiryStatusStyle = (expiryDate) => {
    if (!expiryDate) return "";
    
    const today = new Date();
    const expiry = new Date(expiryDate);
    const daysUntilExpiry = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry < 0) {
      return "border-red-500 bg-red-50"; // Expired
    } else if (daysUntilExpiry <= 30) {
      return "border-yellow-500 bg-yellow-50"; // Expiring soon
    }
    return "border-green-500 bg-green-50"; // Valid
  };

  // Enhanced renderDocumentSection with fixed positioning and highlight support
  const renderDocumentSection = (documentField, expiryField, label, fieldName, sectionId) => {
    const hasDocument = companyDetails[documentField];
    const expiryDate = companyDetails[expiryField];
    const isExpired = isDocumentExpired(expiryDate);
    const expiryStyle = getExpiryStatusStyle(expiryDate);
    const isHighlighted = highlightedField === sectionId;

    return (
      <div
        id={sectionId}
        className={`grid grid-cols-1 lg:grid-cols-5 gap-3 sm:gap-4 items-start p-3 sm:p-4 rounded-lg shadow-sm border-2 transition-all duration-500 ${
          isHighlighted
            ? 'ring-4 ring-yellow-400 bg-yellow-100 shadow-xl animate-pulse'
            : isExpired
            ? 'border-red-300 bg-red-50'
            : 'bg-yellow-50 border-yellow-200'
        }`}
      >
        
        {/* Document Upload Section - Takes 3 columns on large screens */}
        <div className="lg:col-span-3">
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
            {label}
            {isExpired && (
              <span className="ml-1 sm:ml-2 px-1.5 sm:px-2 py-0.5 sm:py-1 text-xs font-bold text-red-800 bg-red-200 rounded-full animate-pulse">
                EXPIRED
              </span>
            )}
          </label>
          
          <div
            className={`border-2 border-dashed rounded-lg p-2 sm:p-3 transition-all duration-300 ${
              isDragging && editingCompanyDetails
                ? "border-indigo-500 bg-indigo-50 shadow-md"
                : hasDocument
                ? `${expiryStyle} shadow-md`
                : editingCompanyDetails
                ? "border-gray-300 hover:border-indigo-300 hover:bg-indigo-50/30"
                : "border-gray-300"
            }`}
            onDragOver={editingCompanyDetails ? handleDragOver : undefined}
            onDragLeave={editingCompanyDetails ? handleDragLeave : undefined}
            onDrop={(e) => {
              if (!editingCompanyDetails) return;
              e.preventDefault();
              e.stopPropagation();
              setIsDragging(false);
              const file = e.dataTransfer.files?.[0];
              if (file) handleCompanyFileChange(documentField, file);
            }}
          >
            {hasDocument ? (
              <div className="space-y-3">
                {/* Document Info */}
                <div className="flex items-center justify-between bg-white p-3 rounded-lg shadow-sm border border-gray-100">
                  <div className="flex items-center flex-1 min-w-0">
                    <DocumentTextIcon className={`h-5 w-5 mr-2 flex-shrink-0 ${
                      isExpired ? 'text-red-600' : 'text-green-600'
                    }`} />
                    <div className="min-w-0 flex-1">
                      <span className="text-sm font-medium text-gray-900 truncate block">
                        {hasDocument instanceof File
                          ? hasDocument.name
                          : `${label} Document`}
                      </span>
                      {isExpired && (
                        <span className="text-xs text-red-600 font-medium">
                          Document Expired!
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 ml-3 flex-shrink-0">
                    {/* View Document Button */}
                    {typeof hasDocument === "string" && (
                      <a
                        href={hasDocument}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1 text-xs font-medium text-indigo-600 hover:text-white hover:bg-indigo-600 bg-indigo-50 rounded-lg shadow-sm border border-indigo-200 hover:shadow-md transition-all duration-200"
                      >
                        View
                      </a>
                    )}

                    {/* Replace Document Button */}
                    {editingCompanyDetails && (
                      <label className="cursor-pointer px-3 py-1 text-xs font-medium text-blue-600 hover:text-white hover:bg-blue-600 bg-blue-50 rounded-lg shadow-sm border border-blue-200 hover:shadow-md transition-all duration-200">
                        {isExpired ? "Re-upload" : "Replace"}
                        <input
                          type="file"
                          className="sr-only"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              handleCompanyFileChange(documentField, file);
                            }
                          }}
                        />
                      </label>
                    )}

                    {/* Delete Document Button - Always visible, not just in edit mode */}
                    <button
                      onClick={() => handleDeleteCompanyDocument(documentField)}
                      disabled={submitting}
                      className="p-1 text-red-500 hover:text-white hover:bg-red-500 rounded-lg hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Delete document permanently"
                    >
                      <XMarkIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                    </button>
                  </div>
                </div>

                {/* Expired Document Warning */}
                {isExpired && (
                  <div className="bg-red-100 border border-red-300 rounded-lg p-3">
                    <div className="flex items-center">
                      <ExclamationTriangleIcon className="h-5 w-5 text-red-500 mr-2 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-red-800">
                          This document has expired and needs to be renewed
                        </p>
                        <p className="text-xs text-red-600 mt-1">
                          Please upload a new document to maintain compliance
                        </p>
                      </div>
                    </div>
                    
                    {editingCompanyDetails && (
                      <div className="mt-3">
                        <label className="cursor-pointer inline-flex items-center px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors shadow-sm">
                          <CloudArrowUpIcon className="h-4 w-4 mr-2" />
                          Upload New Document
                          <input
                            type="file"
                            className="sr-only"
                            onChange={(e) =>
                              handleCompanyFileChange(documentField, e.target.files?.[0])
                            }
                          />
                        </label>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              /* No Document Uploaded */
              <div className="text-center py-4">
                <CloudArrowUpIcon className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                <span className="text-xs text-gray-500 block mb-2">
                  No document uploaded
                </span>
                {editingCompanyDetails ? (
                  <label className="cursor-pointer block text-xs font-medium text-indigo-600 hover:text-indigo-500 transition-colors">
                    Upload Document
                    <input
                      type="file"
                      className="sr-only"
                      onChange={(e) =>
                        handleCompanyFileChange(documentField, e.target.files?.[0])
                      }
                    />
                  </label>
                ) : (
                  <span className="text-xs text-gray-500">Click Edit to upload</span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Expiry Date Section - Takes 2 columns on large screens */}
        <div className="lg:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Expiry Date <span className="text-xs text-gray-500">(optional)</span>
            {isExpired && (
              <span className="ml-2 text-xs text-red-600 font-bold">
                EXPIRED
              </span>
            )}
          </label>
          
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <input
                type="date"
                value={companyDetails[expiryField] || ""}
                onChange={(e) =>
                  setCompanyDetails({
                    ...companyDetails,
                    [expiryField]: e.target.value,
                  })
                }
                className={`block w-full rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                  editingCompanyDetails
                    ? "border-indigo-500 ring-1 ring-indigo-500"
                    : "border-gray-300"
                } ${isExpired ? "border-red-500 bg-red-50" : ""}`}
                disabled={!editingCompanyDetails}
                required={false}
                title="Expiry date is optional"
                placeholder=""
              />
              
              {/* Renew Date Button */}
              {editingCompanyDetails && (
                <button
                  onClick={() => {
                    const newDate = new Date();
                    newDate.setFullYear(newDate.getFullYear() + 1);
                    setCompanyDetails({
                      ...companyDetails,
                      [expiryField]: newDate.toISOString().split("T")[0],
                    });
                  }}
                  className="p-2 text-gray-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors flex-shrink-0"
                  title="Renew for one year"
                >
                  <ArrowPathIcon className="h-5 w-5" />
                </button>
              )}
            </div>

            {/* Expiry Status Indicator */}
            {expiryDate && (
              <div className="flex items-center text-sm">
                {isExpired ? (
                  <div className="flex items-center text-red-600">
                    <ExclamationTriangleIcon className="h-4 w-4 mr-1 flex-shrink-0" />
                    <span className="text-xs font-medium">
                      Expired {Math.abs(Math.ceil((new Date(expiryDate) - new Date()) / (1000 * 60 * 60 * 24)))} days ago
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center text-green-600">
                    <CheckCircleIcon className="h-4 w-4 mr-1 flex-shrink-0" />
                    <span className="text-xs">
                      Valid for {Math.ceil((new Date(expiryDate) - new Date()) / (1000 * 60 * 60 * 24))} more days
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Additional Replace Button for Easy Access */}
            {editingCompanyDetails && hasDocument && (
              <div className="pt-2 border-t border-gray-200">
                <label className="cursor-pointer inline-flex items-center px-3 py-1.5 text-xs font-medium text-blue-600 hover:text-white hover:bg-blue-600 bg-blue-50 rounded-lg shadow-sm border border-blue-200 hover:shadow-md transition-all duration-200">
                  <DocumentArrowUpIcon className="h-3 w-3 mr-1" />
                  Replace Document
                  <input
                    type="file"
                    className="sr-only"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleCompanyFileChange(documentField, file);
                      }
                    }}
                  />
                </label>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6 pb-3 border-b border-gray-100">
        <h3 className="text-lg font-bold text-gray-900">a. Company Details</h3>
        <div className="flex items-center gap-2">
          {companyDetails && companyDetails.companyName && (
            <div className="flex items-center text-sm text-indigo-600">
              <CheckCircleIcon className="h-5 w-5 mr-1" />
              <span>Pre-filled from records</span>
            </div>
          )}

          {/* Edit mode toggle */}
          {!editingCompanyDetails ? (
            <button
              onClick={handleEnterEditMode}
              className="flex items-center px-3 py-1.5 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100"
            >
              <PencilIcon className="h-4 w-4 mr-1" />
              Edit
            </button>
          ) : (
            <button
              onClick={handleCancelEditMode}
              className="flex items-center px-3 py-1.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              <XMarkIcon className="h-4 w-4 mr-1" />
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* Add the synchronization component */}
      {job && job.gmail && <CompanySyncInformationBox gmail={job.gmail} />}

      {/* Auto-population notification */}
      {job &&
        job.timeline?.some((event) =>
          event.description?.includes("Company details auto-populated")
        ) && (
          <div className="mb-6 p-3 bg-blue-50 rounded-lg border border-blue-100">
            <p className="text-sm text-blue-800 flex items-start">
              <InformationCircleIcon className="h-5 w-5 text-blue-500 mr-1 flex-shrink-0 mt-0.5" />
              These fields have been auto-filled with existing company data from
              another job for this client. Any changes you make will be
              synchronized across all jobs for this client.
            </p>
          </div>
        )}

      {/* Basic Company Information */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <div className="space-y-1">
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 flex items-center">
            Company Name
            {companyDetails.companyName && !editingCompanyDetails && (
              <span className="ml-2 text-xs text-indigo-600">
                <CheckCircleIcon className="h-4 w-4 inline" /> Pre-filled
              </span>
            )}
          </label>
          <input
            type="text"
            value={companyDetails.companyName || ""}
            onChange={(e) =>
              setCompanyDetails({
                ...companyDetails,
                companyName: e.target.value,
              })
            }
            className={`block w-full rounded-lg text-sm sm:text-base px-3 py-2 sm:px-4 sm:py-3 ${
              editingCompanyDetails
                ? "border-indigo-500 ring-1 ring-indigo-500"
                : "border-gray-300"
            } shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
              companyDetails.companyName && !editingCompanyDetails
                ? "bg-indigo-50 border-indigo-300"
                : ""
            }`}
            placeholder="Enter company name"
            readOnly={!editingCompanyDetails}
          />
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
            QFC NO
            {companyDetails.qfcNo && !editingCompanyDetails && (
              <span className="ml-2 text-xs text-indigo-600">
                <CheckCircleIcon className="h-4 w-4 inline" /> Pre-filled
              </span>
            )}
          </label>
          <input
            type="text"
            value={companyDetails.qfcNo || ""}
            onChange={(e) =>
              setCompanyDetails({
                ...companyDetails,
                qfcNo: e.target.value,
              })
            }
            className={`block w-full rounded-lg ${
              editingCompanyDetails
                ? "border-indigo-500 ring-1 ring-indigo-500"
                : "border-gray-300"
            } shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
              companyDetails.qfcNo && !editingCompanyDetails
                ? "bg-indigo-50 border-indigo-300"
                : ""
            }`}
            placeholder="Enter QFC number"
            readOnly={!editingCompanyDetails}
          />
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Registered Address
          </label>
          <input
            type="text"
            value={companyDetails.registeredAddress || ""}
            onChange={(e) =>
              setCompanyDetails({
                ...companyDetails,
                registeredAddress: e.target.value,
              })
            }
            className={`block w-full rounded-lg ${
              editingCompanyDetails
                ? "border-indigo-500 ring-1 ring-indigo-500"
                : "border-gray-300"
            } shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition-colors`}
            placeholder="Enter registered address"
            readOnly={!editingCompanyDetails}
          />
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Incorporation Date
          </label>
          <div className="flex items-center space-x-2">
            <input
              type="date"
              value={sanitizeDateValue(companyDetails.incorporationDate)}
              onChange={(e) =>
                setCompanyDetails({
                  ...companyDetails,
                  incorporationDate: e.target.value || null,
                })
              }
              className={`block w-full rounded-lg ${
                editingCompanyDetails
                  ? "border-indigo-500 ring-1 ring-indigo-500"
                  : "border-gray-300"
              } shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition-colors`}
              disabled={!editingCompanyDetails}
            />
            {editingCompanyDetails && (
              <button
                onClick={() => {
                  const newDate = new Date();
                  newDate.setFullYear(newDate.getFullYear() + 1);
                  setCompanyDetails({
                    ...companyDetails,
                    incorporationDate: newDate.toISOString().split("T")[0],
                  });
                }}
                className="p-2 text-gray-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors flex-shrink-0"
                title="Renew date"
              >
                <ArrowPathIcon className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Services types (1)
          </label>
          <select
            value={companyDetails.serviceType || "Please select"}
            onChange={(e) =>
              setCompanyDetails({
                ...companyDetails,
                serviceType: e.target.value,
              })
            }
            className={`block w-full rounded-lg ${
              editingCompanyDetails
                ? "border-indigo-500 ring-1 ring-indigo-500"
                : "border-gray-300"
            } shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition-colors`}
            disabled={!editingCompanyDetails}
          >
            <option value="Please select">Please select</option>
            <option value="Accounting">Accounting</option>
            <option value="Tax">Tax</option>
            <option value="Audit">Audit</option>
            <option value="Advisory">Advisory</option>
            <option value="Consulting">Consulting</option>
            <option value="Corporate">Corporate</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Main purpose
          </label>
          <input
            type="text"
            value={companyDetails.mainPurpose || ""}
            onChange={(e) =>
              setCompanyDetails({
                ...companyDetails,
                mainPurpose: e.target.value,
              })
            }
            className={`block w-full rounded-lg ${
              editingCompanyDetails
                ? "border-indigo-500 ring-1 ring-indigo-500"
                : "border-gray-300"
            } shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition-colors`}
            placeholder="Enter main purpose"
            readOnly={!editingCompanyDetails}
          />
        </div>

        <div
          id="expiry-field-tradeLicense"
          className={`space-y-1 p-2 rounded-lg transition-all duration-500 ${
            highlightedField === 'expiry-field-tradeLicense'
              ? 'bg-yellow-100 ring-2 ring-yellow-400 shadow-lg animate-pulse'
              : ''
          }`}
        >
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Trade License Expiry Date
          </label>
          <div className="flex items-center space-x-2">
            <input
              type="date"
              value={sanitizeDateValue(companyDetails.expiryDate)}
              onChange={(e) =>
                setCompanyDetails({
                  ...companyDetails,
                  expiryDate: e.target.value || null,
                })
              }
              className={`block w-full rounded-lg ${
                editingCompanyDetails
                  ? "border-indigo-500 ring-1 ring-indigo-500"
                  : "border-gray-300"
              } shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition-colors`}
              disabled={!editingCompanyDetails}
            />
            {editingCompanyDetails && (
              <button
                onClick={() => {
                  const newDate = new Date();
                  newDate.setFullYear(newDate.getFullYear() + 1);
                  setCompanyDetails({
                    ...companyDetails,
                    expiryDate: newDate.toISOString().split("T")[0],
                  });
                }}
                className="p-2 text-gray-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors flex-shrink-0"
                title="Renew date"
              >
                <ArrowPathIcon className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Document Sections with Enhanced Upload/Replace Options */}
      <div className="space-y-6">
        {/* Company Computer Card */}
        {renderDocumentSection(
          "companyComputerCard",
          "companyComputerCardExpiry",
          "Company Computer Card",
          "companyComputerCard",
          "expiry-field-companyComputerCard"
        )}

        {/* Tax Card */}
        {renderDocumentSection(
          "taxCard",
          "taxCardExpiry",
          "Tax Card",
          "taxCard",
          "expiry-field-taxCard"
        )}

        {/* CR Extract - Special handling for multiple files */}
        <div
          id="expiry-field-crExtract"
          className={`grid grid-cols-1 lg:grid-cols-5 gap-4 items-start p-4 rounded-lg shadow-sm border transition-all duration-500 ${
            highlightedField === 'expiry-field-crExtract'
              ? 'ring-4 ring-yellow-400 bg-yellow-100 shadow-xl animate-pulse border-yellow-400'
              : 'bg-yellow-50 border-yellow-200'
          }`}
        >
          <div className="lg:col-span-3">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              CR Extract
            </label>
            <div
              className={`border-2 border-dashed rounded-lg p-3 transition-colors ${
                (Array.isArray(companyDetails.crExtract) &&
                  companyDetails.crExtract.length > 0) ||
                crExtractFiles.length > 0
                  ? "border-green-500 bg-green-50"
                  : editingCompanyDetails
                  ? "border-gray-300 hover:border-indigo-300 hover:bg-indigo-50/30"
                  : "border-gray-300"
              }`}
              onDragOver={editingCompanyDetails ? handleDragOver : undefined}
              onDragLeave={editingCompanyDetails ? handleDragLeave : undefined}
              onDrop={(e) => {
                if (!editingCompanyDetails) return;
                e.preventDefault();
                e.stopPropagation();
                setIsDragging(false);
                const files = Array.from(e.dataTransfer.files);
                if (files.length > 0) {
                  setCrExtractFiles(files);
                  // Clear existing database files when new files are dropped
                  setCompanyDetails({
                    ...companyDetails,
                    crExtract: []
                  });
                }
              }}
            >
              {/* Show existing documents only if no new files are selected */}
              {Array.isArray(companyDetails.crExtract) &&
                companyDetails.crExtract.length > 0 && 
                crExtractFiles.length === 0 && (
                  <div className="space-y-2 mb-2">
                    {companyDetails.crExtract.map((doc, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between bg-white p-2 rounded-lg shadow-sm"
                      >
                        <div className="flex items-center flex-1 min-w-0">
                          <DocumentTextIcon className="h-5 w-5 text-green-600 mr-2 flex-shrink-0" />
                          <span className="text-xs text-gray-900 font-medium truncate">
                            {doc.fileName || `CR Extract ${index + 1}`}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2 ml-2 flex-shrink-0">
                          <a
                            href={doc.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2 py-0.5 text-xs font-medium text-indigo-600 hover:text-white hover:bg-indigo-600 bg-indigo-50 rounded-lg shadow-sm border border-indigo-200 hover:shadow-md transition-all duration-200"
                          >
                            View
                          </a>
                          {/* Delete button always visible */}
                          <button
                            onClick={() => handleDeleteCompanyDocument('crExtract', index)}
                            disabled={submitting}
                            className="p-0.5 text-red-400 hover:text-white hover:bg-red-500 rounded-lg hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Delete document permanently"
                          >
                            <XMarkIcon className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                    
                    {/* Replace All Documents Button */}
                    {editingCompanyDetails && (
                      <div className="mt-2 pt-2 border-t border-gray-200">
                        <label className="cursor-pointer inline-flex items-center px-3 py-1 text-xs font-medium text-blue-600 hover:text-white hover:bg-blue-600 bg-blue-50 rounded-lg shadow-sm border border-blue-200 hover:shadow-md transition-all duration-200">
                          <ArrowPathIcon className="h-3 w-3 mr-1" />
                          Replace All Documents
                          <input
                            type="file"
                            className="sr-only"
                            multiple
                            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                            onChange={(e) => {
                              const newFiles = Array.from(e.target.files);
                              setCrExtractFiles(newFiles);
                              // Clear existing database files when replacing all
                              setCompanyDetails({
                                ...companyDetails,
                                crExtract: []
                              });
                            }}
                          />
                        </label>
                      </div>
                    )}
                  </div>
                )}

              {/* Show newly selected files for upload */}
              {crExtractFiles.length > 0 && (
                <div className="space-y-2 mb-2">
                  {crExtractFiles.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between bg-blue-50 p-2 rounded-lg shadow-sm border border-blue-200"
                    >
                      <div className="flex items-center flex-1 min-w-0">
                        <DocumentTextIcon className="h-5 w-5 text-blue-600 mr-2 flex-shrink-0" />
                        <span className="text-xs text-gray-900 font-medium truncate">
                          {file.name}
                        </span>
                        <span className="text-xs text-blue-600 ml-1">(New)</span>
                      </div>
                      <div className="flex items-center ml-2 flex-shrink-0">
                        {editingCompanyDetails && (
                          <button
                            onClick={() => removeCrExtractFile(index)}
                            className="p-0.5 text-red-400 hover:text-white hover:bg-red-500 rounded-lg hover:shadow-md transition-all duration-200"
                            title="Remove file"
                          >
                            <XMarkIcon className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Upload area */}
              {editingCompanyDetails && (
                <div className="text-center py-3">
                  <span className="text-xs text-gray-500 block mb-2">
                    (Upload documents)
                  </span>
                  <label className="cursor-pointer block text-xs font-medium text-indigo-600 hover:text-indigo-500 transition-colors">
                    Upload{" "}
                    Documents
                    <input
                      type="file"
                      className="sr-only"
                      multiple
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      onChange={(e) => {
                        const newFiles = Array.from(e.target.files);
                        setCrExtractFiles(newFiles);
                        // Clear existing database files when new files are selected
                        setCompanyDetails({
                          ...companyDetails,
                          crExtract: []
                        });
                      }}
                    />
                  </label>
                </div>
              )}

              {/* Show message when not editing and no documents */}
              {!editingCompanyDetails &&
                (!Array.isArray(companyDetails.crExtract) ||
                  companyDetails.crExtract.length === 0) &&
                crExtractFiles.length === 0 && (
                  <div className="text-center py-3">
                    <span className="text-xs text-gray-500">
                      No documents uploaded
                    </span>
                  </div>
                )}
            </div>
          </div>

          {/* CR Extract Expiry date section */}
          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Expiry Date
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="date"
                value={companyDetails.crExtractExpiry || ""}
                onChange={(e) =>
                  setCompanyDetails({
                    ...companyDetails,
                    crExtractExpiry: e.target.value,
                  })
                }
                className={`block w-full rounded-lg ${
                  editingCompanyDetails
                    ? "border-indigo-500 ring-1 ring-indigo-500"
                    : "border-gray-300"
                } shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition-colors`}
                disabled={!editingCompanyDetails}
              />
              {editingCompanyDetails && (
                <button
                  onClick={() => {
                    const newDate = new Date();
                    newDate.setFullYear(newDate.getFullYear() + 1);
                    setCompanyDetails({
                      ...companyDetails,
                      crExtractExpiry: newDate.toISOString().split("T")[0],
                    });
                  }}
                  className="p-2 text-gray-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors flex-shrink-0"
                  title="Renew date"
                >
                  <ArrowPathIcon className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Scope of License */}
        {renderDocumentSection(
          "scopeOfLicense",
          "scopeOfLicenseExpiry",
          "Scope of License",
          "scopeOfLicense",
          "expiry-field-scopeOfLicense"
        )}

        {/* Article of Associate */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 items-start bg-yellow-50 p-4 rounded-lg shadow-sm border border-yellow-200">
          <div className="lg:col-span-5">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Article of Associate (AOA)
            </label>
            <div
              className={`border-2 border-dashed rounded-lg p-3 transition-colors ${
                companyDetails.articleOfAssociate
                  ? "border-green-500 bg-green-50"
                  : editingCompanyDetails
                  ? "border-gray-300 hover:border-indigo-300 hover:bg-indigo-50/30"
                  : "border-gray-300"
              }`}
              onDragOver={editingCompanyDetails ? handleDragOver : undefined}
              onDragLeave={editingCompanyDetails ? handleDragLeave : undefined}
              onDrop={(e) => {
                if (!editingCompanyDetails) return;
                e.preventDefault();
                e.stopPropagation();
                setIsDragging(false);
                const file = e.dataTransfer.files?.[0];
                if (file) handleCompanyFileChange("articleOfAssociate", file);
              }}
            >
              {companyDetails.articleOfAssociate ? (
                <div className="flex items-center justify-between bg-white p-3 rounded-lg shadow-sm">
                  <div className="flex items-center flex-1 min-w-0">
                    <DocumentTextIcon className="h-5 w-5 text-green-600 mr-2 flex-shrink-0" />
                    <span className="text-sm text-gray-900 font-medium truncate">
                      {companyDetails.articleOfAssociate instanceof File
                        ? companyDetails.articleOfAssociate.name
                        : "Article of Associate Document"}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 ml-3 flex-shrink-0">
                    {typeof companyDetails.articleOfAssociate === "string" && (
                      <a
                        href={companyDetails.articleOfAssociate}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 text-xs font-medium text-indigo-600 hover:text-white hover:bg-indigo-600 bg-indigo-50 rounded-lg shadow-sm border border-indigo-200 hover:shadow-md transition-all duration-200"
                      >
                        View Document
                      </a>
                    )}
                    
                    {/* Replace Document Button */}
                    {editingCompanyDetails && (
                      <label className="cursor-pointer px-3 py-1.5 text-xs font-medium text-blue-600 hover:text-white hover:bg-blue-600 bg-blue-50 rounded-lg shadow-sm border border-blue-200 hover:shadow-md transition-all duration-200">
                        Replace
                        <input
                          type="file"
                          className="sr-only"
                          onChange={(e) =>
                            handleCompanyFileChange("articleOfAssociate", e.target.files?.[0])
                          }
                        />
                      </label>
                    )}

                    {/* Delete button always visible */}
                    <button
                      onClick={() => handleDeleteCompanyDocument('articleOfAssociate')}
                      disabled={submitting}
                      className="p-1 text-red-500 hover:text-white hover:bg-red-500 rounded-lg hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Delete document permanently"
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <CloudArrowUpIcon className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                  <span className="text-xs text-gray-500 block mb-2">
                    No document uploaded
                  </span>
                  {editingCompanyDetails ? (
                    <label className="cursor-pointer block text-sm font-medium text-indigo-600 hover:text-indigo-500 transition-colors">
                      Upload AOA Document
                      <input
                        type="file"
                        className="sr-only"
                        onChange={(e) =>
                          handleCompanyFileChange(
                            "articleOfAssociate",
                            e.target.files?.[0]
                          )
                        }
                      />
                    </label>
                  ) : (
                    <span className="text-sm text-gray-500">
                      Click Edit to upload
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Certificate of Incorporate */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 items-start bg-yellow-50 p-4 rounded-lg shadow-sm border border-yellow-200">
          <div className="lg:col-span-5">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Certificate of Incorporate (COI)
            </label>
            <div
              className={`border-2 border-dashed rounded-lg p-3 transition-colors ${
                companyDetails.certificateOfIncorporate
                  ? "border-green-500 bg-green-50"
                  : editingCompanyDetails
                  ? "border-gray-300 hover:border-indigo-300 hover:bg-indigo-50/30"
                  : "border-gray-300"
              }`}
              onDragOver={editingCompanyDetails ? handleDragOver : undefined}
              onDragLeave={editingCompanyDetails ? handleDragLeave : undefined}
              onDrop={(e) => {
                if (!editingCompanyDetails) return;
                e.preventDefault();
                e.stopPropagation();
                setIsDragging(false);
                const file = e.dataTransfer.files?.[0];
                if (file)
                  handleCompanyFileChange("certificateOfIncorporate", file);
              }}
            >
              {companyDetails.certificateOfIncorporate ? (
                <div className="flex items-center justify-between bg-white p-3 rounded-lg shadow-sm">
                  <div className="flex items-center flex-1 min-w-0">
                    <DocumentTextIcon className="h-5 w-5 text-green-600 mr-2 flex-shrink-0" />
                    <span className="text-sm text-gray-900 font-medium truncate">
                      {companyDetails.certificateOfIncorporate instanceof File
                        ? companyDetails.certificateOfIncorporate.name
                        : "Certificate of Incorporate Document"}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 ml-3 flex-shrink-0">
                    {typeof companyDetails.certificateOfIncorporate ===
                      "string" && (
                      <a
                        href={companyDetails.certificateOfIncorporate}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 text-xs font-medium text-indigo-600 hover:text-white hover:bg-indigo-600 bg-indigo-50 rounded-lg shadow-sm border border-indigo-200 hover:shadow-md transition-all duration-200"
                      >
                        View Document
                      </a>
                    )}
                    
                    {/* Replace Document Button */}
                    {editingCompanyDetails && (
                      <label className="cursor-pointer px-3 py-1.5 text-xs font-medium text-blue-600 hover:text-white hover:bg-blue-600 bg-blue-50 rounded-lg shadow-sm border border-blue-200 hover:shadow-md transition-all duration-200">
                        Replace
                        <input
                          type="file"
                          className="sr-only"
                          onChange={(e) =>
                            handleCompanyFileChange("certificateOfIncorporate", e.target.files?.[0])
                          }
                        />
                      </label>
                    )}

                    {/* Delete button always visible */}
                    <button
                      onClick={() => handleDeleteCompanyDocument('certificateOfIncorporate')}
                      disabled={submitting}
                      className="p-1 text-red-500 hover:text-white hover:bg-red-500 rounded-lg hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Delete document permanently"
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <CloudArrowUpIcon className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                  <span className="text-xs text-gray-500 block mb-2">
                    No document uploaded
                  </span>
                  {editingCompanyDetails ? (
                    <label className="cursor-pointer block text-sm font-medium text-indigo-600 hover:text-indigo-500 transition-colors">
                      Upload COI Document
                      <input
                        type="file"
                        className="sr-only"
                        onChange={(e) =>
                          handleCompanyFileChange(
                            "certificateOfIncorporate",
                            e.target.files?.[0]
                          )
                        }
                      />
                    </label>
                  ) : (
                    <span className="text-sm text-gray-500">
                      Click Edit to upload
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Other Documents - Multiple files support */}
<div className="grid grid-cols-1 lg:grid-cols-5 gap-4 items-start bg-yellow-50 p-4 rounded-lg shadow-sm border border-yellow-200">
  <div className="lg:col-span-5">
    <label className="block text-sm font-medium text-gray-700 mb-2">
      Other Documents (Max 10 files)
    </label>
    <div
      className={`border-2 border-dashed rounded-lg p-3 transition-colors ${
        (Array.isArray(companyDetails.companyMemo) &&
          companyDetails.companyMemo.length > 0) ||
        companyMemoFiles.length > 0
          ? "border-green-500 bg-green-50"
          : editingCompanyDetails
          ? "border-gray-300 hover:border-indigo-300 hover:bg-indigo-50/30"
          : "border-gray-300"
      }`}
      onDragOver={editingCompanyDetails ? handleDragOver : undefined}
      onDragLeave={editingCompanyDetails ? handleDragLeave : undefined}
      onDrop={(e) => {
        if (!editingCompanyDetails) return;
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        const files = Array.from(e.dataTransfer.files).slice(0, 10);
        if (files.length > 0) {
          setCompanyMemoFiles(files);
        }
      }}
    >
      {/* Show existing documents */}
      {Array.isArray(companyDetails.companyMemo) &&
        companyDetails.companyMemo.length > 0 && (
          <div className="space-y-2 mb-2">
            {companyDetails.companyMemo.map((doc, index) => (
              <div
                key={doc._id || index}
                className="flex items-center justify-between bg-white p-2 rounded-lg shadow-sm"
              >
                <div className="flex items-center flex-1 min-w-0">
                  <DocumentTextIcon className="h-5 w-5 text-green-600 mr-2 flex-shrink-0" />
                  <span className="text-xs text-gray-900 font-medium truncate">
                    {doc.fileName || `Document ${index + 1}`}
                  </span>
                  {doc.uploadedAt && (
                    <span className="text-xs text-gray-400 ml-2">
                      ({new Date(doc.uploadedAt).toLocaleDateString()})
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-2 ml-2 flex-shrink-0">
                  <a
                    href={doc.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2 py-0.5 text-xs font-medium text-indigo-600 hover:text-white hover:bg-indigo-600 bg-indigo-50 rounded-lg shadow-sm border border-indigo-200 hover:shadow-md transition-all duration-200"
                  >
                    View
                  </a>
                  {/* Delete button always visible */}
                  <button
                    onClick={() => handleDeleteCompanyDocument('companyMemo', index)}
                    disabled={submitting}
                    className={`p-0.5 text-red-400 hover:text-white hover:bg-red-500 rounded-lg hover:shadow-md transition-all duration-200 ${
                      submitting ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                    title="Delete document permanently"
                  >
                    {submitting ? (
                      <span className="inline-block animate-spin rounded-full h-3 w-3 border-b-2 border-red-400"></span>
                    ) : (
                      <XMarkIcon className="h-3 w-3" />
                    )}
                  </button>
                </div>
              </div>
            ))}
            
            {/* Replace All Documents Button */}
            {editingCompanyDetails && (
              <div className="mt-2 pt-2 border-t border-gray-200">
                <label className="cursor-pointer inline-flex items-center px-3 py-1 text-xs font-medium text-blue-600 hover:text-white hover:bg-blue-600 bg-blue-50 rounded-lg shadow-sm border border-blue-200 hover:shadow-md transition-all duration-200">
                  <ArrowPathIcon className="h-3 w-3 mr-1" />
                  Replace All Documents
                  <input
                    type="file"
                    className="sr-only"
                    multiple
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    onChange={(e) => {
                      const newFiles = Array.from(e.target.files);
                      const filesToAdd = newFiles.slice(0, 10);
                      setCompanyMemoFiles(filesToAdd);
                      // Clear existing files when replacing all
                      const allExistingIds = companyDetails.companyMemo.map(doc => doc._id);
                      setDeletedCompanyMemoIds(prev => [...prev, ...allExistingIds]);
                      setCompanyDetails({
                        ...companyDetails,
                        companyMemo: []
                      });
                    }}
                  />
                </label>
              </div>
            )}
          </div>
        )}

      {/* Show newly selected files for upload */}
      {companyMemoFiles.length > 0 && (
        <div className="space-y-2 mb-2">
          {companyMemoFiles.map((file, index) => (
            <div
              key={index}
              className="flex items-center justify-between bg-blue-50 p-2 rounded-lg shadow-sm border border-blue-200"
            >
              <div className="flex items-center flex-1 min-w-0">
                <DocumentTextIcon className="h-5 w-5 text-blue-600 mr-2 flex-shrink-0" />
                <span className="text-xs text-gray-900 font-medium truncate">
                  {file.name}
                </span>
                <span className="text-xs text-blue-600 ml-1">(New)</span>
              </div>
              <div className="flex items-center ml-2 flex-shrink-0">
                {editingCompanyDetails && (
                  <button
                    onClick={() => removeCompanyMemoFile(index)}
                    className="p-0.5 text-red-400 hover:text-white hover:bg-red-500 rounded-lg hover:shadow-md transition-all duration-200"
                    title="Remove file"
                  >
                    <XMarkIcon className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload area */}
      {editingCompanyDetails && companyMemoFiles.length < 10 && (
        <div className="text-center py-3">
          <span className="text-xs text-gray-500 block mb-2">
            {companyMemoFiles.length === 0
              ? "(Upload 1-10 documents)"
              : `(Upload ${10 - companyMemoFiles.length} more document${10 - companyMemoFiles.length !== 1 ? 's' : ''})`}
          </span>
          <label className="cursor-pointer block text-xs font-medium text-indigo-600 hover:text-indigo-500 transition-colors">
            Upload{" "}
            {companyMemoFiles.length === 0
              ? "Documents"
              : "More Documents"}
            <input
              type="file"
              className="sr-only"
              multiple
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              onChange={(e) => {
                const newFiles = Array.from(e.target.files);
                const remainingSlots = 10 - companyMemoFiles.length;
                const filesToAdd = newFiles.slice(0, remainingSlots);
                setCompanyMemoFiles((prev) => [...prev, ...filesToAdd]);
              }}
            />
          </label>
        </div>
      )}

      {/* Show message when not editing and no documents */}
      {!editingCompanyDetails &&
        (!Array.isArray(companyDetails.companyMemo) ||
          companyDetails.companyMemo.length === 0) &&
        companyMemoFiles.length === 0 && (
          <div className="text-center py-3">
            <span className="text-xs text-gray-500">
              No documents uploaded
            </span>
          </div>
        )}
    </div>
  </div>
</div>

      </div>

      {/* Company Info Message */}
      {companyDetails &&
        (companyDetails.companyName || companyDetails.qfcNo) && (
          <div className="mt-6 mb-6 p-3 bg-blue-50 rounded-lg border border-blue-100">
            <p className="text-sm text-blue-800">
              <InformationCircleIcon className="h-5 w-5 inline mr-1" />
              These fields have been pre-filled with existing company data.{" "}
              {editingCompanyDetails
                ? "You are currently in edit mode."
                : "Click the Edit button to modify values if needed."}
            </p>
          </div>
        )}

      {/* Save buttons - only shown in edit mode */}
      {editingCompanyDetails && (
        <div className="mt-8 flex justify-end space-x-4">
          <button
            type="button"
            onClick={handleCancelEditMode}
            className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSaveCompanyDetails}
            disabled={submitting}
            className={`px-6 py-3 bg-gradient-to-r from-indigo-600 to-blue-500 text-white rounded-lg hover:from-indigo-700 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 shadow-md transition-all duration-200 transform hover:scale-105 font-medium ${
              submitting ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {submitting ? (
              <>
                <span className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </button>
        </div>
      )}
    </div>
  );
};

  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
      case "om_completed":
      case "approved":
        return "bg-green-50 text-green-700 ring-green-600/20";
      case "rejected":
        return "bg-red-50 text-red-700 ring-red-600/20";
      case "pending":
        return "bg-yellow-50 text-yellow-700 ring-yellow-600/20";
      case "fully_completed_bra":
        return "bg-blue-50 text-blue-700 ring-blue-600/20";
      case "corrected":
        return "bg-purple-50 text-purple-700 ring-purple-600/20";
      case "cancelled":
        return "bg-gray-50 text-gray-700 ring-gray-600/20";
      default:
        return "bg-gray-50 text-gray-700 ring-gray-600/20";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "completed":
      case "om_completed":
      case "approved":
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case "rejected":
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />;
      case "fully_completed_bra":
        return <ClockIcon className="h-5 w-5 text-blue-500" />;
      case "pending":
      case "in-progress":
        return <ClockIcon className="h-5 w-5 text-yellow-500" />;
      default:
        return <ClockIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  // Timeline utility functions
  const getTimelineStatusIcon = (status) => {
    const s = status?.toLowerCase();
    switch (s) {
      case "created":
        return <DocumentTextIcon className="h-4 w-4 text-white" />;
      case "screening_done":
      case "om_completed":
      case "kyc_lmro_approved":
      case "kyc_dlmro_approved":
      case "kyc_ceo_approved":
      case "bra_lmro_approved":
      case "bra_dlmro_approved":
      case "bra_ceo_approved":
      case "completed":
      case "approved":
        return <CheckCircleIcon className="h-4 w-4 text-white" />;
      case "rejected":
      case "cancelled":
      case "kyc_rejected":
      case "bra_rejected":
        return <XCircleIcon className="h-4 w-4 text-white" />;
      case "corrected":
      case "updated":
        return <PencilIcon className="h-4 w-4 text-white" />;
      case "assigned":
        return <UserGroupIcon className="h-4 w-4 text-white" />;
      case "fully_completed_bra":
      case "kyc_pending":
      case "bra_pending":
      case "pending":
        return <ClockIcon className="h-4 w-4 text-white" />;
      default:
        if (s && (s.includes("_updated") || s.includes("_uploaded"))) {
          return <PencilIcon className="h-4 w-4 text-white" />;
        }
        if (s && s.includes("_deleted")) {
          return <TrashIcon className="h-4 w-4 text-white" />;
        }
        return <ClockIcon className="h-4 w-4 text-white" />;
    }
  };

  const getTimelineStatusClass = (status) => {
    const s = status?.toLowerCase();
    if (s === "rejected" || s === "cancelled" || s?.includes("_rejected") || s?.includes("_deleted")) {
      return "bg-red-500";
    }
    if (s === "created" || s === "pending" || s?.includes("_pending") || s === "fully_completed_bra") {
      return "bg-blue-500";
    }
    if (s?.includes("_approved") || s?.includes("_completed") || s === "approved" || s === "completed" || s === "screening_done" || s === "om_completed") {
      return "bg-green-500";
    }
    if (s === "corrected" || s === "updated" || s?.includes("_updated") || s?.includes("_uploaded")) {
      return "bg-yellow-500";
    }
    return "bg-gray-400";
  };

  const getTimelineTitle = (status) => {
    const s = status?.toLowerCase();
    switch (s) {
      case "created":
        return "Job Created";
      case "pending":
        return "Pending Review";
      case "approved":
        return "Job Approved";
      case "assigned":
        return "Job Assigned";
      case "screening_done":
        return "Screening Completed";
      case "rejected":
        return "Job Rejected";
      case "corrected":
        return "Job Resubmitted";
      case "cancelled":
        return "Job Cancelled";
      case "updated":
        return "Job Updated";
      case "om_completed":
        return "Operation Management Completed";
      case "kyc_pending":
        return "KYC Process Started";
      case "kyc_lmro_approved":
        return "KYC LMRO Approved";
      case "kyc_dlmro_approved":
        return "KYC DLMRO Approved";
      case "kyc_ceo_approved":
        return "KYC CEO Approved";
      case "kyc_rejected":
        return "KYC Rejected";
      case "bra_pending":
        return "BRA Process Started";
      case "bra_lmro_approved":
        return "BRA LMRO Approved";
      case "bra_dlmro_approved":
        return "BRA DLMRO Approved";
      case "bra_ceo_approved":
        return "BRA CEO Approved";
      case "bra_rejected":
        return "BRA Rejected";
      case "completed":
        return "Service Completed";
      case "fully_completed_bra":
        return "Processing";
      default:
        if (s && s.includes("director")) return "Director Details Updated";
        if (s && s.includes("shareholder")) return "Shareholder Details Updated";
        if (s && s.includes("secretary")) return "Secretary Details Updated";
        if (s && s.includes("sef")) return "SEF Details Updated";
        if (s && s.includes("company")) return "Company Details Updated";
        if (s && s.includes("engagement")) return "Engagement Letter Updated";
        if (s && s.includes("ubo")) return "UBO Document Updated";
        if (s && s.includes("cdd")) return "CDD Document Updated";
        if (s && s.includes("_updated")) {
          return s.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
        }
        if (s && s.includes("_deleted")) {
          return s.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
        }
        return s ? s.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()) : "Processing";
    }
  };

  const tabs = [
    {
      id: "company",
      name: "Company Details",
      icon: <BuildingOfficeIcon className="h-3 w-3 sm:h-4 sm:w-4" />,
    },
    {
      id: "director",
      name: "Director Details",
      icon: <UserIcon className="h-3 w-3 sm:h-4 sm:w-4" />,
    },
    {
      id: "shareholder",
      name: "Shareholder Details",
      icon: <BriefcaseIcon className="h-3 w-3 sm:h-4 sm:w-4" />,
    },
    {
      id: "secretary",
      name: "Secretary Details",
      icon: <DocumentDuplicateIcon className="h-3 w-3 sm:h-4 sm:w-4" />,
    },
    {
      id: "sef",
      name: "SEF Details",
      icon: <LightBulbIcon className="h-3 w-3 sm:h-4 sm:w-4" />,
    },
    {
      id: "kyc",
      name: "Signed KYC",
      icon: <ShieldCheckIcon className="h-3 w-3 sm:h-4 sm:w-4" />,
    },
  ];

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-indigo-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center bg-white/70 backdrop-blur-sm p-8 rounded-2xl shadow-xl">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-600 mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Loading job details
          </h2>
          <p className="text-gray-600">
            Please wait while we fetch the information...
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-indigo-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl text-center">
          <div className="bg-red-100 p-4 rounded-full inline-flex items-center justify-center mb-6">
            <ExclamationTriangleIcon className="h-12 w-12 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Error Loading Job
          </h2>
          <p className="mt-2 text-gray-600 mb-8">{error}</p>
          <div className="flex justify-center space-x-4">
            <button
              onClick={() => navigate("/operation-management")}
              className="px-6 py-3 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors shadow-sm"
            >
              Back to Jobs
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Job not found state
  if (!job) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-indigo-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl text-center">
          <div className="bg-yellow-100 p-4 rounded-full inline-flex items-center justify-center mb-6">
            <ExclamationTriangleIcon className="h-12 w-12 text-yellow-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Job Not Found
          </h2>
          <p className="mt-2 text-gray-600 mb-8">
            The requested job could not be found or you don't have access.
          </p>
          <div className="mt-6">
            <button
              onClick={() => navigate("/operation-management")}
              className="px-6 py-3 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
            >
              Back to Jobs
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main render
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-indigo-50 py-4 sm:py-8 lg:py-12 px-2 sm:px-4 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Success/Error Messages */}
        <AnimatePresence>
          {actionMessage.type && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`fixed top-20 right-2 sm:right-4 z-50 p-3 sm:p-4 rounded-xl shadow-xl max-w-xs sm:max-w-sm ${
                actionMessage.type === "success"
                  ? "bg-green-100 text-green-800 border border-green-200"
                  : actionMessage.type === "error"
                  ? "bg-red-100 text-red-800 border border-red-200"
                  : "bg-blue-100 text-blue-800 border border-blue-200"
              }`}
            >
              <div className="flex items-center">
                {actionMessage.type === "success" ? (
                  <CheckCircleIcon className="h-6 w-6 mr-3" />
                ) : actionMessage.type === "error" ? (
                  <ExclamationTriangleIcon className="h-6 w-6 mr-3" />
                ) : (
                  <InformationCircleIcon className="h-6 w-6 mr-3" />
                )}
                <p className="font-medium">{actionMessage.message}</p>
                <button
                  onClick={() =>
                    setActionMessage({ type: null, message: null })
                  }
                  className="ml-6 text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-200 transition-colors"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 sm:mb-8 bg-white p-3 sm:p-4 rounded-2xl shadow-lg border border-gray-100"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
            <button
              onClick={() => navigate("/operation-management")}
              className="inline-flex items-center px-3 py-2 sm:px-4 sm:py-2 rounded-xl text-sm sm:text-base text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-all duration-200"
            >
              <ArrowLeftIcon className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
              Back to Jobs
            </button>
            <div className="pl-0 sm:pl-2 border-l-0 sm:border-l-2 border-gray-200">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
                Job Details
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                {job._id} • {job.serviceType}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                job.status
              )} shadow-sm`}
            >
              {getStatusIcon(job.status)}
              <span className="ml-2 capitalize">{job.status === "fully_completed_bra" ? "Processing" : job.status}</span>
            </span>
            {/* Add Export Button */}
            <button
              onClick={exportToExcel}
              disabled={submitting}
              className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm"
            >
              <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
              Export Excel
            </button>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          <div className="xl:col-span-2 space-y-4 sm:space-y-6 lg:space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-white rounded-lg sm:rounded-2xl shadow-xl border border-gray-100 overflow-hidden hover:shadow-2xl transition-all duration-300"
            >
              <div className="px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
                <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mb-4 sm:mb-6 pb-2 sm:pb-3 border-b border-gray-100">
                  Job Details
                </h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                  <div className="space-y-3 sm:space-y-4">
                    <div className="flex items-center space-x-2 sm:space-x-3 p-2 sm:p-3 rounded-lg sm:rounded-xl bg-blue-50/50 border border-blue-100">
                      <div className="p-1.5 sm:p-2 bg-blue-100 rounded-md sm:rounded-lg">
                        <BuildingOfficeIcon className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs sm:text-sm font-medium text-gray-500">
                          Service Type
                        </p>
                        <p className="text-sm sm:text-base font-bold text-gray-900 truncate">
                          {job.serviceType}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 p-3 rounded-xl bg-purple-50/50 border border-purple-100">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <UserIcon className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">
                          Assigned To
                        </p>
                        <p className="text-sm font-bold text-gray-900">
                          {job.assignedPerson?.name || "Not assigned"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 p-3 rounded-xl bg-green-50/50 border border-green-100">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <CalendarIcon className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">
                          Created At
                        </p>
                        <p className="text-sm font-bold text-gray-900">
                          {new Date(job.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3 p-3 rounded-xl bg-yellow-50/50 border border-yellow-100">
                      <div className="p-2 bg-yellow-100 rounded-lg">
                        <MapPinIcon className="h-5 w-5 text-yellow-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">
                          Starting Point
                        </p>
                        <p className="text-sm font-bold text-gray-900">
                          {job.startingPoint}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 p-3 rounded-xl bg-red-50/50 border border-red-100">
                      <div className="p-2 bg-red-100 rounded-lg">
                        <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">
                          Status
                        </p>
                        <p className="text-sm font-bold text-gray-900 capitalize">
                          {job.status}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 p-3 rounded-xl bg-purple-50/50 border border-purple-100">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <DocumentTextIcon className="h-5 w-5 text-purple-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-500">
                          CR Number
                        </p>
                        {editingCrNo ? (
                          <div className="flex items-center space-x-2 mt-1">
                            <input
                              type="text"
                              value={crNoValue}
                              onChange={(e) => setCrNoValue(e.target.value)}
                              className="flex-1 text-sm border border-purple-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-purple-500"
                              placeholder="Enter CR Number"
                              autoFocus
                            />
                            <button
                              onClick={handleSaveCrNo}
                              disabled={savingCrNo}
                              className="p-1 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
                            >
                              <CheckIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => {
                                setEditingCrNo(false);
                                setCrNoValue(job.clientId?.crNo || '');
                              }}
                              className="p-1 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                            >
                              <XMarkIcon className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-2">
                            <p className="text-sm font-bold text-gray-900">
                              {job.clientId?.crNo || '-'}
                            </p>
                            <button
                              onClick={() => {
                                setCrNoValue(job.clientId?.crNo || '');
                                setEditingCrNo(true);
                              }}
                              className="p-1 text-purple-600 hover:bg-purple-100 rounded-lg transition-colors"
                              title="Edit CR Number"
                            >
                              <PencilIcon className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-8 bg-gray-50 p-6 rounded-xl border border-gray-100">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">
                    Description
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {job.jobDetails}
                  </p>
                  {job.specialDescription && (
                    <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-100">
                      <p className="text-sm text-gray-600 italic">
                        <span className="font-medium">Special Note:</span>{" "}
                        {job.specialDescription}
                      </p>
                    </div>
                  )}
                </div>

                <div className="mt-8">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">
                    Documents
                  </h3>
                  <div className="grid gap-4">
                    <div className="flex items-center justify-between p-4 bg-indigo-50 rounded-xl border border-indigo-100 hover:shadow-md transition-all duration-200">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-indigo-100 rounded-lg">
                          <DocumentTextIcon className="h-5 w-5 text-indigo-600" />
                        </div>
                        <span className="text-sm font-medium text-gray-900">
                          Passport Document
                        </span>
                      </div>
                      <a
                        href={job.documentPassport}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 bg-white rounded-lg shadow-sm border border-indigo-200 hover:shadow-md transition-all duration-200"
                      >
                        View
                      </a>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-indigo-50 rounded-xl border border-indigo-100 hover:shadow-md transition-all duration-200">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-indigo-100 rounded-lg">
                          <DocumentTextIcon className="h-5 w-5 text-indigo-600" />
                        </div>
                        <span className="text-sm font-medium text-gray-900">
                          ID Document
                        </span>
                      </div>
                      <a
                        href={job.documentID}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 bg-white rounded-lg shadow-sm border border-indigo-200 hover:shadow-md transition-all duration-200"
                      >
                        View
                      </a>
                    </div>

                    {job.otherDocuments &&
                      job.otherDocuments.length > 0 &&
                      job.otherDocuments.map((doc, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-4 bg-indigo-50 rounded-xl border border-indigo-100 hover:shadow-md transition-all duration-200"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-indigo-100 rounded-lg">
                              <DocumentTextIcon className="h-5 w-5 text-indigo-600" />
                            </div>
                            <span className="text-sm font-medium text-gray-900">
                              Additional Document {index + 1}
                            </span>
                          </div>
                          <a
                            href={doc}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-4 py-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 bg-white rounded-lg shadow-sm border border-indigo-200 hover:shadow-md transition-all duration-200"
                          >
                            View
                          </a>
                        </div>
                      ))}
                  </div>
                </div>

              </div>
            </motion.div>

            {/* Person Details Form */}
            {!["cancelled"].includes(job.status) && (
              <motion.div
                id="tab-section-container"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden hover:shadow-2xl transition-all duration-300"
              >
                <div className="px-6 py-8">
                  <h2 id="tab-section-company" className="text-2xl font-bold text-gray-900 mb-6 pb-3 border-b border-gray-100">
                    Person Details
                  </h2>

                  {/* Tabs */}
                  <div className="mb-8">
                    <div className="sm:hidden">
                      <select
                        value={activeTab}
                        onChange={(e) => setActiveTab(e.target.value)}
                        className="block w-full rounded-lg border-gray-300 focus:ring-indigo-500 focus:border-indigo-500 bg-white shadow-sm text-sm py-2.5 px-3"
                      >
                        {tabs.map((tab) => (
                          <option key={tab.id} value={tab.id}>
                            {tab.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="hidden sm:block">
                      <div className="border-b border-gray-200">
                        <nav
                          className="-mb-px flex space-x-1 sm:space-x-2 overflow-x-auto scrollbar-hide"
                          aria-label="Tabs"
                        >
                          {tabs.map((tab) => (
                            <button
                              key={tab.id}
                              onClick={() => setActiveTab(tab.id)}
                              className={`${
                                activeTab === tab.id
                                  ? "border-indigo-500 text-indigo-600 bg-indigo-50"
                                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                              } whitespace-nowrap py-2 sm:py-3 px-2 sm:px-4 border-b-2 font-medium text-xs sm:text-sm flex items-center space-x-1 sm:space-x-2 transition-all duration-200 rounded-t-lg`}
                              aria-current={
                                activeTab === tab.id ? "page" : undefined
                              }
                            >
                              <span
                                className={
                                  activeTab === tab.id
                                    ? "text-indigo-600"
                                    : "text-gray-400"
                                }
                              >
                                {tab.icon}
                              </span>
                              <span>{tab.name}</span>
                            </button>
                          ))}
                        </nav>
                      </div>
                    </div>
                  </div>

                  {/* Company Details Content */}
                  {activeTab === "company" && renderCompanyDetailsSection()}

                  {/* KYC Content */}
                  {activeTab === "kyc" && (
                    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                      <div className="grid grid-cols-1 md:grid-cols-6 gap-4 bg-blue-50 p-4 rounded-lg shadow-sm border border-blue-100 mb-6">
                        <div className="col-span-1 md:col-span-3 bg-gray-200 p-2 rounded-lg">
                          <h3 className="text-lg font-bold text-gray-900">
                            f. Signed KYC
                          </h3>
                        </div>
                        <div className="col-span-1 md:col-span-3 flex justify-end items-center">
                          <div className="flex items-center bg-white px-3 py-2 rounded-lg shadow-sm border border-gray-100">
                            <span className="text-sm font-medium text-gray-700 mr-2">
                              Active Status
                            </span>
                            <select
                              value={kycDetails.activeStatus}
                              onChange={(e) =>
                                setKycDetails({
                                  ...kycDetails,
                                  activeStatus: e.target.value,
                                })
                              }
                              className="block rounded-lg border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                            >
                              <option value="yes">yes</option>
                              <option value="no">no</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* KYC Documents List */}
                      <div className="mt-6">
                        <h4 className="text-lg font-semibold text-gray-900 mb-4">Signed KYC Documents</h4>
                        {kycDetails.documents && kycDetails.documents.length > 0 ? (
                          <div className="space-y-3">
                            {kycDetails.documents.map((doc, index) => (
                              <div
                                key={index}
                                className="flex items-center justify-between bg-gray-50 p-4 rounded-lg shadow-sm border border-gray-200"
                              >
                                <div className="flex items-center flex-1 min-w-0">
                                  <DocumentTextIcon className="h-5 w-5 text-indigo-600 mr-3 flex-shrink-0" />
                                  <div className="flex-1 min-w-0">
                                    <span className="text-sm font-medium text-gray-900 truncate block">
                                      {doc.description || `KYC Document ${index + 1}`}
                                    </span>
                                    {doc.date && (
                                      <span className="text-xs text-gray-500">
                                        {new Date(doc.date).toLocaleDateString()}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2 ml-4">
                                  {doc.file && (
                                    <a
                                      href={doc.file}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="px-3 py-1.5 text-xs font-medium text-indigo-600 hover:text-white hover:bg-indigo-600 bg-indigo-50 rounded-lg shadow-sm border border-indigo-200 hover:shadow-md transition-all duration-200"
                                    >
                                      View Document
                                    </a>
                                  )}
                                  <button
                                    onClick={() => handleDeleteKycDocument(index)}
                                    disabled={submitting}
                                    className="p-1.5 text-red-400 hover:text-white hover:bg-red-500 rounded-lg hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                    title="Delete document permanently"
                                  >
                                    <XMarkIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8">
                            <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                            <p className="text-gray-500">No KYC documents found</p>
                          </div>
                        )}
                      </div>

                      <div className="mt-6 flex justify-end">
                        <button
                          type="button"
                          onClick={handleSaveKycDetails}
                          disabled={submitting}
                          className={`px-6 py-3 bg-gradient-to-r from-indigo-600 to-blue-500 text-white rounded-lg hover:from-indigo-700 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 shadow-md transition-all duration-200 transform hover:scale-105 font-medium ${
                            submitting ? "opacity-50 cursor-not-allowed" : ""
                          }`}
                        >
                          {submitting ? (
                            <>
                              <span className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                              Saving...
                            </>
                          ) : (
                            "Save"
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Other Documents Content */}
                  {activeTab === "other" && (
                    <div className="space-y-6">
                      {otherDocumentsDetails.map((entry, index) => (
                        <div
                          key={index}
                          className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-all duration-300"
                        >
                          <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100">
                            <div className="flex items-center">
                              <div className="bg-indigo-100 rounded-lg p-2 mr-3">
                                <DocumentTextIcon className="h-5 w-5 text-indigo-600" />
                              </div>
                              <h3 className="text-lg font-bold text-gray-800">
                                Document {index + 1}
                              </h3>
                            </div>
                            {otherDocumentsDetails.length > 1 && (
                              <button
                                onClick={() => {
                                  const newDetails = otherDocumentsDetails.filter((_, i) => i !== index);
                                  setOtherDocumentsDetails(newDetails);
                                }}
                                className="text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-50 transition-colors"
                                title="Remove entry"
                              >
                                <XMarkIcon className="h-5 w-5" />
                              </button>
                            )}
                          </div>

                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                            <div className="space-y-1">
                              <label className="block text-sm font-medium text-gray-700">
                                Document Type
                              </label>
                              <input
                                type="text"
                                value={entry.documentType}
                                onChange={(e) => {
                                  const newDetails = [...otherDocumentsDetails];
                                  newDetails[index].documentType = e.target.value;
                                  setOtherDocumentsDetails(newDetails);
                                }}
                                className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                                placeholder="e.g., Passport, License, Certificate"
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="block text-sm font-medium text-gray-700">
                                Document Number
                              </label>
                              <input
                                type="text"
                                value={entry.documentNumber}
                                onChange={(e) => {
                                  const newDetails = [...otherDocumentsDetails];
                                  newDetails[index].documentNumber = e.target.value;
                                  setOtherDocumentsDetails(newDetails);
                                }}
                                className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                                placeholder="Enter document number"
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="block text-sm font-medium text-gray-700">
                                Issue Date
                              </label>
                              <input
                                type="date"
                                value={entry.issueDate}
                                onChange={(e) => {
                                  const newDetails = [...otherDocumentsDetails];
                                  newDetails[index].issueDate = e.target.value;
                                  setOtherDocumentsDetails(newDetails);
                                }}
                                className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="block text-sm font-medium text-gray-700">
                                Expiry Date
                              </label>
                              <input
                                type="date"
                                value={entry.expiryDate}
                                onChange={(e) => {
                                  const newDetails = [...otherDocumentsDetails];
                                  newDetails[index].expiryDate = e.target.value;
                                  setOtherDocumentsDetails(newDetails);
                                }}
                                className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                              />
                            </div>

                            <div className="col-span-2 space-y-1">
                              <label className="block text-sm font-medium text-gray-700">
                                Description (Optional)
                              </label>
                              <textarea
                                value={entry.description}
                                onChange={(e) => {
                                  const newDetails = [...otherDocumentsDetails];
                                  newDetails[index].description = e.target.value;
                                  setOtherDocumentsDetails(newDetails);
                                }}
                                rows={2}
                                className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                                placeholder="Add any additional details about this document"
                              />
                            </div>

                            <div className="col-span-2">
                              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                                <DocumentTextIcon className="h-4 w-4 mr-1 text-indigo-500" />
                                Upload Document
                              </label>
                              <div className="border-2 border-dashed rounded-lg p-4 text-center hover:border-indigo-500 transition-colors">
                                {entry.uploadedFile ? (
                                  <div className="flex items-center justify-between bg-green-50 p-3 rounded-lg">
                                    <div className="flex items-center">
                                      <CheckCircleIcon className="h-5 w-5 text-green-600 mr-2" />
                                      <span className="text-sm font-medium text-green-900">
                                        {entry.uploadedFile instanceof File
                                          ? entry.uploadedFile.name
                                          : "Document Uploaded"}
                                      </span>
                                    </div>
                                    <button
                                      onClick={() => {
                                        const newDetails = [...otherDocumentsDetails];
                                        newDetails[index].uploadedFile = null;
                                        setOtherDocumentsDetails(newDetails);
                                      }}
                                      className="text-red-500 hover:text-red-700"
                                    >
                                      <XMarkIcon className="h-5 w-5" />
                                    </button>
                                  </div>
                                ) : (
                                  <label className="cursor-pointer">
                                    <CloudArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
                                    <p className="mt-2 text-sm text-gray-600">
                                      Click to upload or drag and drop
                                    </p>
                                    <input
                                      type="file"
                                      onChange={(e) => {
                                        const newDetails = [...otherDocumentsDetails];
                                        newDetails[index].uploadedFile = e.target.files[0];
                                        setOtherDocumentsDetails(newDetails);
                                      }}
                                      className="hidden"
                                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                    />
                                  </label>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}

                      <button
                        onClick={() => {
                          setOtherDocumentsDetails([
                            ...otherDocumentsDetails,
                            {
                              documentType: "",
                              documentNumber: "",
                              issueDate: "",
                              expiryDate: "",
                              uploadedFile: null,
                              description: "",
                            },
                          ]);
                        }}
                        className="w-full py-3 px-4 border-2 border-dashed border-indigo-300 rounded-lg text-indigo-600 hover:border-indigo-500 hover:bg-indigo-50 transition-all duration-200 flex items-center justify-center space-x-2 font-medium"
                      >
                        <PlusIcon className="h-5 w-5" />
                        <span>Add Another Document</span>
                      </button>

                      <div className="mt-6 flex justify-end">
                        <button
                          type="button"
                          onClick={handleSaveOtherDocumentsDetails}
                          disabled={submitting}
                          className={`px-6 py-3 bg-gradient-to-r from-indigo-600 to-blue-500 text-white rounded-lg hover:from-indigo-700 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 shadow-md transition-all duration-200 transform hover:scale-105 font-medium ${
                            submitting ? "opacity-50 cursor-not-allowed" : ""
                          }`}
                        >
                          {submitting ? "Saving..." : "Save"}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Person Details Content */}
                  {activeTab === "director" && (
                    <div id="tab-section-director">
                      {renderPersonDetailsWithAutoSuggest(
                        "director",
                        directorDetails,
                        setDirectorDetails
                      )}
                    </div>
                  )}
                  {activeTab === "shareholder" && (
                    <div id="tab-section-shareholder">
                      {renderPersonDetails(
                        "shareholder",
                        shareholderDetails,
                        setShareholderDetails
                      )}
                    </div>
                  )}
                  {activeTab === "secretary" && (
                    <div id="tab-section-secretary">
                      {renderPersonDetails(
                        "secretary",
                        secretaryDetails,
                        setSecretaryDetails
                      )}
                    </div>
                  )}
                  {activeTab === "sef" && (
                    <div id="tab-section-sef">
                      {renderPersonDetails("sef", sefDetails, setSefDetails)}
                    </div>
                  )}

                </div>
              </motion.div>
            )}

            {/* Export Data Section */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden hover:shadow-2xl transition-all duration-300"
            >
              <div className="px-6 py-8">
                <h2 className="text-xl font-bold text-gray-900 mb-6 pb-3 border-b border-gray-100 flex items-center">
                  <DocumentArrowDownIcon className="h-5 w-5 text-indigo-600 mr-2" />
                  Export Data
                </h2>
                <div className="space-y-4">
                  <button
                    onClick={exportToExcel}
                    disabled={submitting}
                    className={`w-full px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-500 text-white rounded-lg hover:from-green-700 hover:to-emerald-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 shadow-md transition-all duration-200 transform hover:scale-105 font-medium flex items-center justify-center ${
                      submitting ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                  >
                    {submitting ? (
                      <>
                        <span className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                        Exporting...
                      </>
                    ) : (
                      <>
                        <svg
                          className="h-5 w-5 mr-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                        Export to Excel
                      </>
                    )}
                  </button>

                  <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
                    <p className="font-medium mb-1">Export includes:</p>
                    <ul className="list-disc pl-4 space-y-1">
                      <li>Company overview and details</li>
                      <li>Director information</li>
                      <li>Shareholder details</li>
                      <li>Secretary information</li>
                      <li>SEF details</li>
                      <li>Document status</li>
                    </ul>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          <div className="space-y-8">
            <motion.div
              key={job.clientName}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden hover:shadow-2xl transition-all duration-300"
            >
              <div className="px-6 py-8">
                <h2 className="text-xl font-bold text-gray-900 mb-6 pb-3 border-b border-gray-100 flex items-center">
                  <UserIcon className="h-5 w-5 text-indigo-600 mr-2" />
                  Client Information
                </h2>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3 p-3 bg-indigo-50 rounded-xl border border-indigo-100">
                    <div className="p-2 bg-indigo-100 rounded-lg">
                      <UserIcon className="h-5 w-5 text-indigo-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Name</p>
                      <p className="text-sm font-bold text-gray-900">
                        {job.clientName}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-xl border border-green-100">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <EnvelopeIcon className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Email</p>
                      <p className="text-sm font-bold text-gray-900">
                        {job.gmail}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Engagement Letter Component */}
            {!["cancelled"].includes(job.status) && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden hover:shadow-2xl transition-all duration-300"
              >
                <div className="px-6 py-8">
                  <h2 className="text-xl font-bold text-gray-900 mb-6 pb-3 border-b border-gray-100 flex items-center">
                    <DocumentCheckIcon className="h-5 w-5 text-indigo-600 mr-2" />
                    Engagement Letters
                    {companyDetails?.engagementLetters?.length > 0 &&
                      job?.status === "pending" &&
                      job?.timeline?.some((event) =>
                        event.description?.includes("auto-populated")
                      ) && (
                        <span className="ml-2 text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">
                          Auto-populated
                        </span>
                      )}
                  </h2>

                  {/* Info box for auto-populated letters */}
                  {companyDetails?.engagementLetters?.length > 0 &&
                    job?.status === "pending" &&
                    job?.timeline?.some((event) =>
                      event.description?.includes("auto-populated")
                    ) && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                        <div className="flex">
                          <InformationCircleIcon className="h-6 w-6 text-blue-600 mr-2" />
                          <div>
                            <h3 className="text-sm font-medium text-blue-800">
                              Engagement Letter Auto-Populated
                            </h3>
                            <p className="mt-1 text-sm text-blue-700">
                              This engagement letter was automatically found
                              from another job for the same client. All jobs for
                              the same client use the same engagement letter.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                 {Array.isArray(companyDetails?.engagementLetters) &&
companyDetails.engagementLetters.length > 0 ? (
  <div className="space-y-4">
    <div className="bg-green-50 p-4 rounded-xl border border-green-100">
      <div className="flex items-center space-x-3">
        <CheckCircleIcon className="h-6 w-6 text-green-600" />
        <span className="font-medium text-green-800">
          {companyDetails.engagementLetters.length}{" "}
          {companyDetails.engagementLetters.length === 1
            ? "letter"
            : "letters"}{" "}
          uploaded
        </span>
      </div>
    </div>

    {companyDetails.engagementLetters.map((letter, index) => {
      return (
      <div
        key={letter._id || index}
        className="p-3 sm:p-4 bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
      >
        <div className="flex items-start space-x-3">
          <DocumentTextIcon className="h-5 w-5 text-indigo-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-gray-900 break-words">
              {letter.fileName ||
               letter.filename ||
               letter.originalname ||
               letter.name ||
               (letter.fileUrl && letter.fileUrl.split('/').pop()) ||
               `Engagement Letter ${index + 1}`}
            </p>
            {letter.description && (
              <p className="text-xs text-gray-500 mt-0.5">
                {letter.description}
              </p>
            )}
            {letter.uploadedAt && (
              <p className="text-xs text-gray-400 mt-0.5">
                {new Date(letter.uploadedAt).toLocaleString()}
              </p>
            )}

            <div className="flex items-center flex-wrap gap-2 mt-3">
              <a
                href={letter.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-700 bg-indigo-50 rounded-lg border border-indigo-200 hover:shadow-md transition-all duration-200"
              >
                <EyeIcon className="h-3.5 w-3.5 mr-1" />
                View
              </a>

              <label
                className={`inline-flex items-center px-3 py-1.5 text-xs font-medium text-amber-600 hover:text-white hover:bg-amber-600 bg-amber-50 rounded-lg border border-amber-200 hover:shadow-md transition-all duration-200 cursor-pointer ${
                  submitting ? "opacity-50 cursor-not-allowed" : ""
                }`}
                title="Replace (old version will be archived)"
              >
                <ArrowPathIcon className="h-3.5 w-3.5 mr-1" />
                Replace
                <input
                  type="file"
                  className="sr-only"
                  accept=".pdf,.doc,.docx"
                  disabled={submitting}
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleReplaceEngagementLetter(letter._id, letter.fileName, e.target.files[0]);
                      e.target.value = '';
                    }
                  }}
                />
              </label>

              <button
                onClick={() => handleDeleteEngagementLetter(letter._id, letter.fileName)}
                disabled={submitting}
                className={`inline-flex items-center px-3 py-1.5 text-xs font-medium text-red-600 hover:text-white hover:bg-red-600 bg-red-50 rounded-lg border border-red-200 hover:shadow-md transition-all duration-200 ${
                  submitting ? "opacity-50 cursor-not-allowed" : ""
                }`}
                title="Delete permanently"
              >
                {submitting ? (
                  <span className="inline-block animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-red-600"></span>
                ) : (
                  <>
                    <XMarkIcon className="h-3.5 w-3.5 mr-1" />
                    Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
      );
    })}

    {/* Add button to upload additional engagement letters */}
    <div className="mt-4">
      <label className="cursor-pointer flex items-center justify-center px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors border border-indigo-200">
        <PlusIcon className="h-4 w-4 mr-1" />
        Upload Additional Letters
        <input
          type="file"
          className="sr-only"
          onChange={handleFileChange}
          multiple
          accept=".pdf,.doc,.docx"
        />
      </label>
    </div>

    {/* Show newly selected files if any */}
    {engagementLetters.length > 0 && (
      <div className="mt-4 space-y-3">
        <div className="text-sm font-medium text-gray-700 mb-2">
          Additional files to upload:
        </div>
        {engagementLetters.map((letter, index) => (
          <div
            key={index}
            className="flex items-center justify-between bg-white p-3 sm:p-4 rounded-lg shadow-sm border border-gray-200 gap-3"
          >
            <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
              <DocumentTextIcon className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <span className="text-sm font-medium text-gray-900 block truncate">
                  {letter.name}
                </span>
                <span className="text-xs text-gray-500">
                  {(letter.size / 1024).toFixed(1)}KB
                </span>
              </div>
            </div>
            <button
              onClick={() => removeEngagementLetter(index)}
              className="p-1.5 sm:p-2 text-gray-400 hover:text-red-500 rounded-full hover:bg-red-50 transition-colors flex-shrink-0"
              title="Remove file"
            >
              <XMarkIcon className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
          </div>
        ))}

        {/* Upload button for additional letters */}
        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={handleUploadEngagementLetters}
            disabled={submitting}
            className={`px-6 py-3 bg-gradient-to-r from-indigo-600 to-blue-500 text-white rounded-lg hover:from-indigo-700 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 shadow-md transition-all duration-200 transform hover:scale-105 font-medium ${
              submitting
                ? "opacity-50 cursor-not-allowed"
                : ""
            }`}
          >
            {submitting ? (
              <>
                <span className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                Uploading...
              </>
            ) : (
              `Upload ${engagementLetters.length} ${
                engagementLetters.length > 1
                  ? "Letters"
                  : "Letter"
              }`
            )}
          </button>
        </div>
      </div>
    )}
  </div>
) : (
                    <div
                      className={`border-2 border-dashed rounded-xl p-6 transition-all duration-200 ${
                        isDragging
                          ? "border-indigo-500 bg-indigo-50"
                          : engagementLetters.length > 0
                          ? "border-green-500 bg-green-50"
                          : "border-gray-300 hover:border-indigo-300 hover:bg-indigo-50/30"
                      }`}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleEngagementLetterDrop}
                    >
                      {engagementLetters.length > 0 ? (
                        <div className="space-y-3">
                          <div className="text-sm font-medium text-gray-700 mb-2">
                            Selected files:
                          </div>
                          {engagementLetters.map((letter, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between bg-white p-3 sm:p-4 rounded-lg shadow-sm gap-3"
                            >
                              <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                                <DocumentTextIcon className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 flex-shrink-0" />
                                <div className="min-w-0 flex-1">
                                  <span className="text-sm font-medium text-gray-900 block truncate">
                                    {letter.name}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    {(letter.size / 1024).toFixed(1)}KB
                                  </span>
                                </div>
                              </div>
                              <button
                                onClick={() => removeEngagementLetter(index)}
                                className="p-1.5 sm:p-2 text-gray-400 hover:text-red-500 rounded-full hover:bg-red-50 transition-colors flex-shrink-0"
                                title="Remove file"
                              >
                                <XMarkIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                              </button>
                            </div>
                          ))}

                          <div className="mt-4 flex items-center justify-center">
                            <label className="cursor-pointer flex items-center px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors">
                              <PlusIcon className="h-4 w-4 mr-1" />
                              Add More Files
                              <input
                                type="file"
                                className="sr-only"
                                onChange={handleFileChange}
                                multiple
                                accept=".pdf,.doc,.docx"
                              />
                            </label>
                          </div>

                          <div className="mt-6 flex justify-end">
                            <button
                              type="button"
                              onClick={handleUploadEngagementLetters}
                              disabled={submitting}
                              className={`px-6 py-3 bg-gradient-to-r from-indigo-600 to-blue-500 text-white rounded-lg hover:from-indigo-700 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 shadow-md transition-all duration-200 transform hover:scale-105 font-medium ${
                                submitting
                                  ? "opacity-50 cursor-not-allowed"
                                  : ""
                              }`}
                            >
                              {submitting ? (
                                <>
                                  <span className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                                  Uploading...
                                </>
                              ) : (
                                `Upload ${engagementLetters.length} ${
                                  engagementLetters.length > 1
                                    ? "Letters"
                                    : "Letter"
                                }`
                              )}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-4">
                          <CloudArrowUpIcon className="mx-auto h-14 w-14 text-gray-400" />
                          <div className="mt-4">
                            <label className="block text-sm font-medium text-indigo-600 hover:text-indigo-500 cursor-pointer transition-colors">
                              <span>Upload files</span>
                              <input
                                type="file"
                                className="sr-only"
                                onChange={handleFileChange}
                                multiple
                                accept=".pdf,.doc,.docx"
                              />
                            </label>
                            <p className="mt-1 text-xs text-gray-500">
                              or drag and drop
                            </p>
                            <p className="text-xs text-gray-500">
                              PDF, DOC up to 10MB (multiple files allowed)
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Information about shared engagement letters */}
                  <div className="mt-4 bg-gray-50 p-3 rounded-lg border border-gray-200">
                    <p className="text-xs text-gray-600 flex items-start">
                      <InformationCircleIcon className="h-4 w-4 text-gray-500 mr-1 flex-shrink-0 mt-0.5" />
                      <span>
                        All engagement letters uploaded here will be
                        automatically shared with all jobs for this client.
                      </span>
                    </p>
                  </div>

                  {/* Upload button for new letters */}
                  {engagementLetters.length > 0 && !submitting && (
                    <div className="mt-6 flex justify-end">
                      <button
                        type="button"
                        onClick={handleUploadEngagementLetters}
                        className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-blue-500 text-white rounded-lg hover:from-indigo-700 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 shadow-md transition-all duration-200 transform hover:scale-105 font-medium"
                      >
                        Upload{" "}
                        {engagementLetters.length > 1
                          ? `${engagementLetters.length} Letters`
                          : "Letter"}
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Service Timeline Section */}
            {showTimeline && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden hover:shadow-2xl transition-all duration-300"
              >
                <div className="px-6 py-8">
                  <div className="flex items-center justify-between mb-6 pb-3 border-b border-gray-100">
                    <h2 className="text-xl font-bold text-gray-900 flex items-center">
                      <ClockIcon className="h-5 w-5 text-indigo-600 mr-2" />
                      Service Timeline
                    </h2>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setShowTimeline(false)}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Hide Timeline"
                      >
                        <ChevronUpIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                      </button>
                    </div>
                  </div>

                  {timelineLoading ? (
                    <div className="space-y-4">
                      {[...Array(3)].map((_, index) => (
                        <div key={index} className="animate-pulse">
                          <div className="flex items-start space-x-3">
                            <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
                            <div className="flex-1 space-y-2">
                              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : timeline.length > 0 ? (
                    <div className="space-y-4">
                      {timeline.map((event, index) => (
                        <div
                          key={index}
                          className="relative bg-gradient-to-r from-gray-50 to-white rounded-xl p-4 border border-gray-100 hover:shadow-md transition-all duration-200"
                        >
                          <div className="flex items-start space-x-4">
                            <div className={`flex-shrink-0 h-10 w-10 rounded-full ${getTimelineStatusClass(event.status)} flex items-center justify-center shadow-lg`}>
                              {getTimelineStatusIcon(event.status)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <p className="text-sm font-semibold text-gray-900">
                                  {event.description ? event.description : getTimelineTitle(event.status)}
                                </p>
                                <span className="text-xs text-gray-400 whitespace-nowrap ml-2">
                                  {new Date(event.timestamp).toLocaleDateString(undefined, {
                                    year: "numeric",
                                    month: "short",
                                    day: "numeric",
                                  })}
                                </span>
                              </div>
                              {event.description && (
                                <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                                  {event.updatedBy?.name ? `by ${event.updatedBy.name}` : event.updatedBy?.email ? `by ${event.updatedBy.email}` : ""}
                                </p>
                              )}
                              <div className="flex items-center mt-2 text-xs text-gray-500">
                                <ClockIcon className="h-3.5 w-3.5 mr-1" />
                                <span>
                                  {new Date(event.timestamp).toLocaleTimeString(undefined, {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                    timeZoneName: "short",
                                  })}
                                </span>
                                {event.updatedBy?.name && (
                                  <>
                                    <span className="mx-2">•</span>
                                    <UserIcon className="h-3.5 w-3.5 mr-1" />
                                    <span>{event.updatedBy.name}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                          {index !== timeline.length - 1 && (
                            <div className="absolute left-9 top-14 bottom-0 w-0.5 bg-gradient-to-b from-gray-200 to-transparent h-4" />
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <ClockIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-sm text-gray-500">No timeline events yet</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Show Timeline Button when hidden */}
            {!showTimeline && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
                className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden"
              >
                <div className="px-6 py-4">
                  <button
                    onClick={() => setShowTimeline(true)}
                    className="w-full flex items-center justify-center space-x-2 text-gray-600 hover:text-indigo-600 transition-colors"
                  >
                    <ChevronDownIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="text-sm font-medium">Show Service Timeline</span>
                  </button>
                </div>
              </motion.div>
            )}

            {/* Complete Operation Info Message - Only shown for approved jobs without engagement letter */}
            {job.status === "approved" && !companyDetails.engagementLetters && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden hover:shadow-2xl transition-all duration-300"
              >
                <div className="px-6 py-8">
                  <h2 className="text-xl font-bold text-gray-900 mb-6 pb-3 border-b border-gray-100 flex items-center">
                    <InformationCircleIcon className="h-5 w-5 text-blue-600 mr-2" />
                    Operation Status
                  </h2>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex">
                      <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600 mr-2" />
                      <div>
                        <h3 className="text-sm font-medium text-yellow-800">
                          Requirements to Complete Operation
                        </h3>
                        <div className="mt-2 text-sm text-yellow-700">
                          <ul className="list-disc pl-5 space-y-1">
                            <li>
                              Job Status:{" "}
                              {job.status === "approved" ? (
                                <span className="text-green-700">
                                  ✓ Approved
                                </span>
                              ) : (
                                <span className="text-red-700">
                                  ✗ Not Approved
                                </span>
                              )}
                            </li>
                            <li>
                              Engagement Letter:{" "}
                              {companyDetails.engagementLetters ? (
                                <span className="text-green-700">
                                  ✓ Uploaded
                                </span>
                              ) : (
                                <span className="text-red-700">
                                  ✗ Not Uploaded
                                </span>
                              )}
                            </li>
                          </ul>
                          <p className="mt-3 font-medium">
                            Please upload an engagement letter to mark this
                            operation as complete.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
            {/* Complete Operation Button - Only shown for approved jobs with engagement letter */}
            {job.status === "approved" && companyDetails.engagementLetters && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden hover:shadow-2xl transition-all duration-300"
              >
                <div className="px-6 py-8">
                  <h2 className="text-xl font-bold text-gray-900 mb-6 pb-3 border-b border-gray-100 flex items-center">
                    <DocumentCheckIcon className="h-5 w-5 text-indigo-600 mr-2" />
                    Operation Status
                  </h2>
                  <div className="space-y-4">
                    <button
                      className="w-full px-6 py-3 bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-lg hover:from-emerald-600 hover:to-green-600 transition-all duration-200 flex items-center justify-center shadow-md transform hover:scale-105 font-medium"
                      onClick={handleCompleteOperation}
                      disabled={submitting}
                    >
                      {submitting ? (
                        <>
                          <span className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                          Processing...
                        </>
                      ) : (
                        <>
                          <CheckIcon className="h-5 w-5 mr-2" />
                          Mark Operation as Complete
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Action Buttons Section */}
            {job.status === "pending" && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden hover:shadow-2xl transition-all duration-300"
              >
                <div className="px-6 py-8">
                  <h2 className="text-xl font-bold text-gray-900 mb-6 pb-3 border-b border-gray-100 flex items-center">
                    <DocumentDuplicateIcon className="h-5 w-5 text-indigo-600 mr-2" />
                    Job Actions
                  </h2>
                  <div className="space-y-4">
                    <button
                      className="w-full px-6 py-3 bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-lg hover:from-emerald-600 hover:to-green-600 transition-all duration-200 flex items-center justify-center shadow-md transform hover:scale-105 font-medium"
                      onClick={async () => {
                        try {
                          setSubmitting(true);
                          await axiosInstance.put(`/jobs/${jobId}/approve`);
                          setActionMessage({
                            type: "success",
                            message: "Job approved successfully",
                          });

                          // Refresh job data
                          const response = await axiosInstance.get(
                            `/jobs/${jobId}`
                          );
                          setJob(response.data);

                          setTimeout(() => {
                            setActionMessage({ type: null, message: null });
                          }, 3000);
                        } catch (err) {
                          console.error("Error approving job:", err);
                          setActionMessage({
                            type: "error",
                            message:
                              err.response?.data?.message ||
                              "Failed to approve job",
                          });
                        } finally {
                          setSubmitting(false);
                        }
                      }}
                      disabled={submitting}
                    >
                      {submitting ? (
                        <>
                          <span className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                          Processing...
                        </>
                      ) : (
                        <>
                          <CheckIcon className="h-5 w-5 mr-2" />
                          Approve Job
                        </>
                      )}
                    </button>

                    <button
                      className="w-full px-6 py-3 bg-gradient-to-r from-rose-500 to-red-500 text-white rounded-lg hover:from-rose-600 hover:to-red-600 transition-all duration-200 flex items-center justify-center shadow-md transform hover:scale-105 font-medium"
                      onClick={() => {
                        // This would typically open a modal to enter rejection reason
                        setActionMessage({
                          type: "error",
                          message:
                            "Rejection requires a reason. Please implement a modal for this action.",
                        });

                        setTimeout(() => {
                          setActionMessage({ type: null, message: null });
                        }, 3000);
                      }}
                      disabled={submitting}
                    >
                      <XMarkIcon className="h-5 w-5 mr-2" />
                      Reject Job
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}

export default JobDetails;
