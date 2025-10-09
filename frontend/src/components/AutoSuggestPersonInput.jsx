import React, { useState, useRef, useEffect } from 'react';
import { CheckCircleIcon, UserIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { getPersonSuggestionsArray } from '../utils/personSuggestions';

const AutoSuggestPersonInput = ({ 
  label = "Name", 
  value, 
  onChange, 
  onAutoFill,
  placeholder = "Enter name...",
  personType = "Person"
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState([]);
  const [isAutoFilled, setIsAutoFilled] = useState(false);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  const suggestions = getPersonSuggestionsArray();

  useEffect(() => {
    const filtered = suggestions.filter(person =>
      person.name.toLowerCase().includes((value || '').toLowerCase())
    );
    setFilteredSuggestions(filtered);
  }, [value]);

  const handleInputChange = (e) => {
    const inputValue = e.target.value;
    console.log('AutoSuggest Debug - Input changed:', inputValue);
    
    // Calculate filtered suggestions immediately
    const filtered = suggestions.filter(person =>
      person.name.toLowerCase().includes((inputValue || '').toLowerCase())
    );
    
    console.log('AutoSuggest Debug - Immediate filtered suggestions:', filtered);
    
    onChange(inputValue);
    
    // Use the immediate filtered results for dropdown
    const shouldOpen = inputValue.length > 0 && filtered.length > 0;
    console.log('AutoSuggest Debug - Should open dropdown:', shouldOpen);
    
    setIsOpen(shouldOpen);
    setIsAutoFilled(false);
  };

  const handleSuggestionClick = (suggestion) => {
    onChange(suggestion.name);
    setIsOpen(false);
    setIsAutoFilled(true);
    
    // Call the auto-fill callback with complete person details
    if (onAutoFill) {
      onAutoFill(suggestion);
    }
  };

  const clearAutoFill = () => {
    onChange('');
    setIsAutoFilled(false);
    if (onAutoFill) {
      onAutoFill(null);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target) &&
        !inputRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} *
      </label>
      
      {/* Auto-fill success banner */}
      {isAutoFilled && (
        <div className="mb-2 p-2 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between">
          <div className="flex items-center">
            <CheckCircleIcon className="h-4 w-4 text-green-600 mr-2" />
            <span className="text-sm text-green-800">
              {personType} details auto-filled successfully!
            </span>
          </div>
          <button
            type="button"
            onClick={clearAutoFill}
            className="text-green-600 hover:text-green-800"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={value || ''}
          onChange={handleInputChange}
          onFocus={() => {
            const shouldOpen = value && filteredSuggestions.length > 0;
            console.log('AutoSuggest Debug - Focus event - Should open:', shouldOpen, 'Value:', value, 'Suggestions:', filteredSuggestions.length);
            setIsOpen(shouldOpen);
          }}
          placeholder={placeholder}
          className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            isAutoFilled ? 'bg-green-50 border-green-300' : ''
          }`}
          required
        />
        
        {/* Dropdown */}
        {isOpen && filteredSuggestions.length > 0 && (
          <div 
            ref={dropdownRef}
            className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto"
          >
            {filteredSuggestions.map((suggestion, index) => (
              <div
                key={index}
                onClick={() => handleSuggestionClick(suggestion)}
                className="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0"
              >
                <div className="flex items-center">
                  <UserIcon className="h-4 w-4 text-gray-400 mr-3" />
                  <div>
                    <div className="font-medium text-gray-900">{suggestion.name}</div>
                    <div className="text-sm text-gray-500">
                      {suggestion.nationality} • {suggestion.email}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AutoSuggestPersonInput;