import React, { useState, useRef, useEffect } from 'react';
import { CheckCircleIcon, UserIcon, XMarkIcon } from '@heroicons/react/24/outline';

// Predefined director suggestions
const DIRECTOR_SUGGESTIONS = [
  {
    name: "Mr Sarath Kumara Ganegoda Hitiarachchige",
    nationality: "Sri Lankan",
    email: "sarath@newoon.com",
    mobileNo: "33631831",
    qidNo: "27914405663",
    passportNo: "P0196918"
  }
];

const AutoSuggestInput = ({ 
  label, 
  value, 
  onChange, 
  onSuggestionSelect, 
  suggestions = [],
  fieldKey,
  placeholder,
  className = "",
  disabled = false 
}) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState([]);
  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);

  useEffect(() => {
    if (value && value.length > 0) {
      const filtered = suggestions.filter(suggestion => 
        suggestion[fieldKey]?.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setFilteredSuggestions(suggestions);
      setShowSuggestions(false);
    }
  }, [value, suggestions, fieldKey]);

  const handleInputChange = (e) => {
    const inputValue = e.target.value;
    onChange(e);
    
    if (inputValue.length > 0) {
      setShowSuggestions(true);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    onChange({ target: { value: suggestion[fieldKey] } });
    onSuggestionSelect(suggestion);
    setShowSuggestions(false);
  };

  const handleInputFocus = () => {
    if (suggestions.length > 0 && value.length === 0) {
      setFilteredSuggestions(suggestions);
      setShowSuggestions(true);
    }
  };

  const handleClickOutside = (e) => {
    if (
      inputRef.current && !inputRef.current.contains(e.target) &&
      suggestionsRef.current && !suggestionsRef.current.contains(e.target)
    ) {
      setShowSuggestions(false);
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleInputChange}
        onFocus={handleInputFocus}
        className={`block w-full rounded-lg border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${className}`}
        placeholder={placeholder}
        disabled={disabled}
      />
      
      {showSuggestions && filteredSuggestions.length > 0 && (
        <div 
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto"
        >
          {filteredSuggestions.map((suggestion, index) => (
            <div
              key={index}
              onClick={() => handleSuggestionClick(suggestion)}
              className="px-4 py-3 cursor-pointer hover:bg-indigo-50 border-b border-gray-100 last:border-b-0"
            >
              <div className="flex items-start space-x-3">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <UserIcon className="h-4 w-4 text-indigo-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {suggestion.name}
                  </p>
                  <div className="text-xs text-gray-500 space-y-1 mt-1">
                    <p>Nationality: {suggestion.nationality}</p>
                    <p>Email: {suggestion.email}</p>
                    <p>Mobile: {suggestion.mobileNo}</p>
                    <p>QID: {suggestion.qidNo}</p>
                    <p>Passport: {suggestion.passportNo}</p>
                  </div>
                </div>
                <CheckCircleIcon className="h-5 w-5 text-green-500" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const DirectorAutoSuggestForm = () => {
  const [directorDetails, setDirectorDetails] = useState({
    name: "",
    nationality: "",
    email: "",
    mobileNo: "",
    qidNo: "",
    passportNo: "",
    qidExpiry: "",
    nationalAddress: "",
    nationalAddressExpiry: "",
    passportExpiry: "",
    visaCopy: null,
    qidDoc: null,
    nationalAddressDoc: null,
    passportDoc: null,
    cv: null
  });

  const [showAutoFillBanner, setShowAutoFillBanner] = useState(false);
  const [autoFilledFrom, setAutoFilledFrom] = useState(null);

  const handleFieldChange = (field, value) => {
    setDirectorDetails(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSuggestionSelect = (suggestion) => {
    setDirectorDetails(prev => ({
      ...prev,
      name: suggestion.name,
      nationality: suggestion.nationality,
      email: suggestion.email,
      mobileNo: suggestion.mobileNo,
      qidNo: suggestion.qidNo,
      passportNo: suggestion.passportNo
    }));
    
    setAutoFilledFrom(suggestion);
    setShowAutoFillBanner(true);
    
    // Hide the banner after 5 seconds
    setTimeout(() => {
      setShowAutoFillBanner(false);
    }, 5000);
  };

  const clearAutoFill = () => {
    setDirectorDetails({
      name: "",
      nationality: "",
      email: "",
      mobileNo: "",
      qidNo: "",
      passportNo: "",
      qidExpiry: "",
      nationalAddress: "",
      nationalAddressExpiry: "",
      passportExpiry: "",
      visaCopy: null,
      qidDoc: null,
      nationalAddressDoc: null,
      passportDoc: null,
      cv: null
    });
    setShowAutoFillBanner(false);
    setAutoFilledFrom(null);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-xl shadow-lg">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Director Details</h2>
        <p className="text-sm text-gray-600">
          Start typing to see suggestions, or click on any field to see available options.
        </p>
      </div>

      {/* Auto-fill notification banner */}
      {showAutoFillBanner && autoFilledFrom && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <CheckCircleIcon className="h-5 w-5 text-green-600 mr-2" />
              <span className="text-sm font-medium text-green-800">
                Director details auto-filled from suggestions
              </span>
            </div>
            <button
              onClick={() => setShowAutoFillBanner(false)}
              className="text-green-600 hover:text-green-800"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>
          <p className="text-sm text-green-700 mt-1">
            Details for "{autoFilledFrom.name}" have been populated. You can edit any field as needed.
          </p>
          <button
            onClick={clearAutoFill}
            className="mt-2 text-sm text-green-600 hover:text-green-800 underline"
          >
            Clear auto-filled data
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Name Field with Auto-suggestion */}
        <div className="col-span-2">
          <AutoSuggestInput
            label="Name"
            value={directorDetails.name}
            onChange={(e) => handleFieldChange('name', e.target.value)}
            onSuggestionSelect={handleSuggestionSelect}
            suggestions={DIRECTOR_SUGGESTIONS}
            fieldKey="name"
            placeholder="Enter director name or click to see suggestions"
            className={autoFilledFrom ? "bg-green-50 border-green-300" : ""}
          />
        </div>

        {/* Nationality */}
        <AutoSuggestInput
          label="Nationality"
          value={directorDetails.nationality}
          onChange={(e) => handleFieldChange('nationality', e.target.value)}
          onSuggestionSelect={handleSuggestionSelect}
          suggestions={DIRECTOR_SUGGESTIONS}
          fieldKey="nationality"
          placeholder="Enter nationality"
          className={autoFilledFrom ? "bg-green-50 border-green-300" : ""}
        />

        {/* Email */}
        <AutoSuggestInput
          label="Email"
          value={directorDetails.email}
          onChange={(e) => handleFieldChange('email', e.target.value)}
          onSuggestionSelect={handleSuggestionSelect}
          suggestions={DIRECTOR_SUGGESTIONS}
          fieldKey="email"
          placeholder="Enter email address"
          className={autoFilledFrom ? "bg-green-50 border-green-300" : ""}
        />

        {/* Mobile Number */}
        <AutoSuggestInput
          label="Mobile Number"
          value={directorDetails.mobileNo}
          onChange={(e) => handleFieldChange('mobileNo', e.target.value)}
          onSuggestionSelect={handleSuggestionSelect}
          suggestions={DIRECTOR_SUGGESTIONS}
          fieldKey="mobileNo"
          placeholder="Enter mobile number"
          className={autoFilledFrom ? "bg-green-50 border-green-300" : ""}
        />

        {/* QID Number */}
        <AutoSuggestInput
          label="QID Number"
          value={directorDetails.qidNo}
          onChange={(e) => handleFieldChange('qidNo', e.target.value)}
          onSuggestionSelect={handleSuggestionSelect}
          suggestions={DIRECTOR_SUGGESTIONS}
          fieldKey="qidNo"
          placeholder="Enter QID number"
          className={autoFilledFrom ? "bg-green-50 border-green-300" : ""}
        />

        {/* Passport Number */}
        <AutoSuggestInput
          label="Passport Number"
          value={directorDetails.passportNo}
          onChange={(e) => handleFieldChange('passportNo', e.target.value)}
          onSuggestionSelect={handleSuggestionSelect}
          suggestions={DIRECTOR_SUGGESTIONS}
          fieldKey="passportNo"
          placeholder="Enter passport number"
          className={autoFilledFrom ? "bg-green-50 border-green-300" : ""}
        />

        {/* Regular input fields for dates and other details */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            QID Expiry Date
          </label>
          <input
            type="date"
            value={directorDetails.qidExpiry}
            onChange={(e) => handleFieldChange('qidExpiry', e.target.value)}
            className="block w-full rounded-lg border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Passport Expiry Date
          </label>
          <input
            type="date"
            value={directorDetails.passportExpiry}
            onChange={(e) => handleFieldChange('passportExpiry', e.target.value)}
            className="block w-full rounded-lg border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            National Address
          </label>
          <input
            type="text"
            value={directorDetails.nationalAddress}
            onChange={(e) => handleFieldChange('nationalAddress', e.target.value)}
            className="block w-full rounded-lg border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Enter national address"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            National Address Expiry
          </label>
          <input
            type="date"
            value={directorDetails.nationalAddressExpiry}
            onChange={(e) => handleFieldChange('nationalAddressExpiry', e.target.value)}
            className="block w-full rounded-lg border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Current Values Display */}
      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-medium text-gray-900 mb-3">Current Values</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div><strong>Name:</strong> {directorDetails.name || 'Not set'}</div>
          <div><strong>Nationality:</strong> {directorDetails.nationality || 'Not set'}</div>
          <div><strong>Email:</strong> {directorDetails.email || 'Not set'}</div>
          <div><strong>Mobile:</strong> {directorDetails.mobileNo || 'Not set'}</div>
          <div><strong>QID:</strong> {directorDetails.qidNo || 'Not set'}</div>
          <div><strong>Passport:</strong> {directorDetails.passportNo || 'Not set'}</div>
        </div>
      </div>

      {/* Save Button */}
      <div className="mt-6 flex justify-end">
        <button className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
          Save Director Details
        </button>
      </div>
    </div>
  );
};

export default DirectorAutoSuggestForm;