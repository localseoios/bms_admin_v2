// Shared person suggestions for auto-fill functionality
export const PERSON_SUGGESTIONS = {
  "Mr Sarath Kumara Ganegoda Hitiarachchige": {
    name: "Mr Sarath Kumara Ganegoda Hitiarachchige",
    nationality: "Sri Lankan",
    email: "sarath@newoon.com",
    mobileNo: "33631831",
    qidNo: "27914405663",
    qidExpiry: "",
    nationalAddress: "",
    nationalAddressExpiry: "",
    passportNo: "P0196918",
    passportExpiry: "",
  }
};

// Helper function to get person suggestions as array
export const getPersonSuggestionsArray = () => {
  return Object.values(PERSON_SUGGESTIONS);
};

// Helper function to auto-fill person details
export const autoFillPersonDetails = (personName) => {
  return PERSON_SUGGESTIONS[personName] || null;
};