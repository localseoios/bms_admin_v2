// components/FileUploader.jsx
import React, { useState, useRef } from "react";
import {
  CloudArrowUpIcon,
  XMarkIcon,
  DocumentIcon,
  CheckIcon,
} from "@heroicons/react/24/outline";

function FileUploader({
  onFileChange,
  currentFile,
  label = "Upload a file",
  accept = ".pdf,.doc,.docx,.jpg,.jpeg,.png",
  maxSize = 10 * 1024 * 1024, // 10MB default
  required = false,
  showPreview = true,
  className = "",
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  // Calculate file size display
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + " bytes";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  // Get file name for display
  const getFileName = (file) => {
    if (!file) return "";
    if (typeof file === "string") {
      // It's a URL, extract the filename from the end
      const parts = file.split("/");
      return parts[parts.length - 1].split("?")[0];
    }
    // It's a File object
    return file.name;
  };

  // Handle drag events
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

  // Handle file drop
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      validateAndSetFile(file);
    }
  };

  // Handle file selection via input
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      validateAndSetFile(file);
    }
  };

  // Validate file and set it if valid
  const validateAndSetFile = (file) => {
    setError(null);

    // Check file size
    if (file.size > maxSize) {
      setError(`File too large. Maximum size is ${formatFileSize(maxSize)}.`);
      return;
    }

    // Check file type based on accept prop
    if (accept && accept !== "*") {
      const fileExtension = "." + file.name.split(".").pop().toLowerCase();
      const acceptedTypes = accept
        .split(",")
        .map((type) => type.trim().toLowerCase());

      // Check if file extension is in accepted types
      const isValidType = acceptedTypes.some((type) => {
        // If type starts with a dot, compare with file extension
        if (type.startsWith(".")) {
          return type === fileExtension;
        }
        // If type is a mime type (e.g., 'image/*'), check if file.type matches
        return file.type.match(new RegExp(type.replace("*", ".*")));
      });

      if (!isValidType) {
        setError(`Invalid file type. Accepted types: ${accept}`);
        return;
      }
    }

    // File is valid, call the parent component's handler
    onFileChange(file);
  };

  // Handle file removal
  const removeFile = (e) => {
    e.stopPropagation();
    onFileChange(null);
    setError(null);

    // Reset the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Render file preview if there's a file
  const renderFilePreview = () => {
    if (!currentFile) return null;

    const isImage =
      typeof currentFile === "object"
        ? currentFile.type.startsWith("image/")
        : /\.(jpe?g|png|gif|bmp)$/i.test(currentFile);

    return (
      <div className="flex items-center justify-between w-full bg-white p-3 rounded-lg shadow-sm">
        <div className="flex items-center flex-1 min-w-0">
          {isImage && showPreview && typeof currentFile === "string" ? (
            <div className="h-10 w-10 rounded-md overflow-hidden mr-3 bg-gray-100 flex-shrink-0">
              <img
                src={currentFile}
                alt="Preview"
                className="h-full w-full object-cover"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src =
                    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z'%3E%3C/path%3E%3Cpolyline points='14 2 14 8 20 8'%3E%3C/polyline%3E%3C/svg%3E";
                }}
              />
            </div>
          ) : (
            <div className="p-2 bg-indigo-100 rounded-lg mr-3 flex-shrink-0">
              <DocumentIcon className="h-5 w-5 text-indigo-600" />
            </div>
          )}

          <div className="flex-1 min-w-0">
            <span className="text-sm font-medium text-gray-900 truncate block">
              {getFileName(currentFile)}
            </span>
            {typeof currentFile === "object" && (
              <span className="text-xs text-gray-500">
                {formatFileSize(currentFile.size)}
              </span>
            )}
            <span className="text-xs text-green-600 flex items-center">
              <CheckIcon className="h-3 w-3 mr-1" /> File ready
            </span>
          </div>
        </div>

        <div className="flex items-center ml-4">
          {typeof currentFile === "string" && (
            <a
              href={currentFile}
              target="_blank"
              rel="noopener noreferrer"
              className="mr-2 px-3 py-1.5 text-xs font-medium text-indigo-600 hover:text-white hover:bg-indigo-600 bg-indigo-50 rounded-lg shadow-sm border border-indigo-200 hover:shadow-md transition-all duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              View
            </a>
          )}

          <button
            onClick={removeFile}
            className="p-1.5 text-red-400 hover:text-white hover:bg-red-500 rounded-lg hover:shadow-md transition-all duration-200"
            title="Remove file"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className={`w-full ${className}`}>
      <div
        className={`border-2 ${
          error
            ? "border-red-500 bg-red-50/30"
            : isDragging
            ? "border-indigo-500 bg-indigo-50"
            : currentFile
            ? "border-green-500 bg-green-50/40"
            : "border-gray-300 hover:border-indigo-300 hover:bg-indigo-50/30"
        } border-dashed rounded-lg p-4 transition-all duration-200`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        {currentFile ? (
          renderFilePreview()
        ) : (
          <div className="text-center py-4">
            <div className="bg-gray-100/80 mx-auto rounded-full w-12 h-12 flex items-center justify-center mb-2">
              <CloudArrowUpIcon className="h-6 w-6 text-gray-400" />
            </div>
            <div className="mt-1">
              <label className="cursor-pointer block">
                <span className="relative px-4 py-1.5 rounded-md font-medium text-sm text-white bg-gradient-to-r from-indigo-600 to-blue-500 hover:from-indigo-700 hover:to-blue-600 shadow-sm transition-all duration-200 hover:shadow-md">
                  {label}
                </span>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="sr-only"
                  onChange={handleFileChange}
                  accept={accept}
                  required={required}
                />
              </label>
              <p className="text-xs text-gray-500 mt-1">
                or drag and drop here
              </p>
              {error ? (
                <p className="text-xs text-red-600 mt-1">{error}</p>
              ) : (
                <p className="text-xs text-gray-500">
                  Max size: {formatFileSize(maxSize)}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default FileUploader;
