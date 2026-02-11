import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion"; // eslint-disable-line no-unused-vars
import AutoSuggestPersonInput from "../../../components/AutoSuggestPersonInput";
import { toast } from "react-hot-toast";
import {
  BriefcaseIcon,
  DocumentTextIcon,
  UserIcon,
  BuildingOfficeIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  XCircleIcon,
  PlusCircleIcon,
  TrashIcon,
  PaperClipIcon,
  ArrowLeftIcon,
  HashtagIcon,
  CheckIcon,
  ArrowPathIcon,
  CloudArrowUpIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import axiosInstance from "../../../utils/axios";
import { useAuth } from "../../../context/AuthContext";

const CreatePreApprovedJob = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [assignableUsers, setAssignableUsers] = useState([]);
  const [services, setServices] = useState([]);
  const [loadingServices, setLoadingServices] = useState(false);
  const [serviceUsers, setServiceUsers] = useState([]);
  const [loadingServiceUsers, setLoadingServiceUsers] = useState(false);
  const [selectedServiceUsers, setSelectedServiceUsers] = useState([]);

  // New state for job number availability checking
  const [jobNumberStatus, setJobNumberStatus] = useState({
    checking: false,
    available: null,
    message: "",
  });

  // Email auto-fill state
  const [emailAutoFill, setEmailAutoFill] = useState({
    checking: false,
    found: false,
    data: null,
    message: "",
  });

  // Add state for CR Extract files
  const [crExtractFiles, setCrExtractFiles] = useState([]);
  const [companyMemoFiles, setCompanyMemoFiles] = useState([]);

  const [files, setFiles] = useState({
    documentPassport: null,
    documentID: null,
    otherDocuments: [],
    engagementLetters: null,
    companyComputerCard: null,
    taxCard: null,
    crExtract: null,
    scopeOfLicense: null,
    articleOfAssociate: null,
    certificateOfIncorporate: null,
    kycDocuments: [],
    braDocuments: [],
  });

  // Form state
  const [formData, setFormData] = useState({
    // Add job number field
    jobNumber: "",

    // Basic job info
    serviceType: "",
    assignedPerson: "",
    jobDetails: "",
    specialDescription: "",
    clientName: "",
    gmail: "",
    startingPoint: "QFC",
    crNo: "",
    contactNumber: "",

    // Document URLs for display
    documentPassportUrl: "",
    documentIDUrl: "",
    otherDocumentsUrls: [],
    
    // Company Document URLs for display
    engagementLettersUrls: [],
    companyComputerCardUrl: "",
    taxCardUrl: "",
    crExtractUrls: [],
    companyMemoUrls: [],
    scopeOfLicenseUrl: "",
    articleOfAssociateUrl: "",
    certificateOfIncorporateUrl: "",

    // Company details
    companyDetails: {
      companyName: "",
      qfcNo: "",
      registeredAddress: "",
      incorporationDate: "",
      serviceType: "",
      mainPurpose: "",
      expiryDate: "",
      companyComputerCardExpiry: "",
      taxCardExpiry: "",
      crExtractExpiry: "",
      scopeOfLicenseExpiry: "",
      kycActiveStatus: "yes",
    },

    // Person details
    directors: [
      {
        name: "",
        nationality: "",
        qidNo: "",
        qidExpiry: "",
        nationalAddress: "",
        nationalAddressExpiry: "",
        passportNo: "",
        passportExpiry: "",
        mobileNo: "",
        email: "",
      },
    ],
    shareholders: [],
    secretaries: [],
    sefs: [],

    // KYC documents info
    kycDocumentInfo: [
      {
        description: "",
        date: "",
      },
    ],

    // BRA documents info
    braDocumentInfo: [
      {
        description: "",
        date: "",
      },
    ],
  });

  // Person document states
  const [directorDocs, setDirectorDocs] = useState([
    {
      visaCopy: null,
      qidDoc: null,
      nationalAddressDoc: null,
      passportDoc: null,
      cv: null,
    },
  ]);

  const [shareholderDocs, setShareholderDocs] = useState([]);
  const [secretaryDocs, setSecretaryDocs] = useState([]);
  const [sefDocs, setSefDocs] = useState([]);

  // Add these helper functions for Company Memo
  const handleCompanyMemoFileChange = (files) => {
    const fileArray = Array.from(files);
    // Limit to 5 files maximum
    const limitedFiles = fileArray.slice(0, 5);
    setCompanyMemoFiles(limitedFiles);
  };

  const removeCompanyMemoFile = (index) => {
    setCompanyMemoFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Add CR Extract helper functions
  const handleCrExtractFileChange = (files) => {
    const fileArray = Array.from(files);
    // No limit on number of files
    setCrExtractFiles(fileArray);
  };

  const removeCrExtractFile = (index) => {
    setCrExtractFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Function to check job number availability
  const checkJobNumberAvailability = async (jobNumber) => {
    if (!jobNumber || jobNumber.length < 3) {
      setJobNumberStatus({
        checking: false,
        available: null,
        message: "",
      });
      return;
    }

    setJobNumberStatus((prev) => ({ ...prev, checking: true }));

    try {
      const response = await axiosInstance.get(
        `/operations/check-job-number/${encodeURIComponent(jobNumber)}`
      );
      setJobNumberStatus({
        checking: false,
        available: response.data.available,
        message: response.data.message,
      });
    } catch (error) {
      console.error("Error checking job number:", error);
      setJobNumberStatus({
        checking: false,
        available: false,
        message: "Error checking job number availability",
      });
    }
  };

  // Email lookup for auto-fill functionality
  const lookupJobByEmail = async (email) => {
    if (!email || !email.includes('@')) {
      setEmailAutoFill({
        checking: false,
        found: false,
        data: null,
        message: "",
      });
      return;
    }

    setEmailAutoFill((prev) => ({ ...prev, checking: true }));

    try {
      const response = await axiosInstance.get(
        `/operations/lookup-by-email/${encodeURIComponent(email)}`
      );
      
      if (response.data.found) {
        setEmailAutoFill({
          checking: false,
          found: true,
          data: response.data,
          message: `Found previous job: ${response.data.jobNumber}`,
        });
      } else {
        setEmailAutoFill({
          checking: false,
          found: false,
          data: null,
          message: "No previous jobs found for this email",
        });
      }
    } catch (error) {
      console.error("Error looking up job by email:", error);
      setEmailAutoFill({
        checking: false,
        found: false,
        data: null,
        message: error.response?.status === 404 ? "No previous jobs found" : "Error looking up email",
      });
    }
  };

  // Auto-fill form data from email lookup
  const applyEmailAutoFill = () => {
    const data = emailAutoFill.data;
    if (!data || !data.found) return;

    // Auto-fill basic job information
    setFormData(prev => ({
      ...prev,
      clientName: data.basicInfo?.clientName || prev.clientName,
      jobDetails: data.basicInfo?.jobDetails || prev.jobDetails,
      specialDescription: data.basicInfo?.specialDescription || prev.specialDescription,
      startingPoint: data.basicInfo?.startingPoint || prev.startingPoint,
      crNo: data.basicInfo?.crNo || prev.crNo,
      contactNumber: data.basicInfo?.contactNumber || prev.contactNumber,
      // Auto-fill document references
      documentPassportUrl: data.documents?.documentPassport || prev.documentPassportUrl,
      documentIDUrl: data.documents?.documentID || prev.documentIDUrl,
      otherDocumentsUrls: data.documents?.otherDocuments || prev.otherDocumentsUrls || [],
    }));

    // Set company document URLs for display (if they exist from previous job)
    if (data.documents) {
      const docs = data.documents;
      
      setFormData(prev => ({
        ...prev,
        // Set single file document URLs
        companyComputerCardUrl: docs.companyComputerCard || prev.companyComputerCardUrl,
        taxCardUrl: docs.taxCard || prev.taxCardUrl,
        scopeOfLicenseUrl: docs.scopeOfLicense || prev.scopeOfLicenseUrl,
        articleOfAssociateUrl: docs.articleOfAssociate || prev.articleOfAssociateUrl,
        certificateOfIncorporateUrl: docs.certificateOfIncorporate || prev.certificateOfIncorporateUrl,
        
        // Handle engagement letters (array of objects)
        engagementLettersUrls: docs.engagementLetters && Array.isArray(docs.engagementLetters) 
          ? docs.engagementLetters.map(doc => ({
              url: doc.fileUrl,
              fileName: doc.fileName,
              description: doc.description || `From job ${data.jobNumber}`
            })) 
          : prev.engagementLettersUrls,
        
        // Handle CR Extract files (array of objects)
        crExtractUrls: docs.crExtract && Array.isArray(docs.crExtract)
          ? docs.crExtract.map(doc => ({
              url: doc.fileUrl,
              fileName: doc.fileName,
              description: doc.description || `From job ${data.jobNumber}`
            }))
          : prev.crExtractUrls,
        
        // Handle Company Memo files (array of objects)
        companyMemoUrls: docs.companyMemo && Array.isArray(docs.companyMemo)
          ? docs.companyMemo.map(doc => ({
              url: doc.fileUrl,
              fileName: doc.fileName,
              description: doc.description || `From job ${data.jobNumber}`
            }))
          : prev.companyMemoUrls,
      }));
    }

    // Auto-fill company details with all fields
    if (data.companyDetails) {
      setFormData(prev => ({
        ...prev,
        companyDetails: {
          companyName: data.companyDetails.companyName || '',
          qfcNo: data.companyDetails.qfcNo || '',
          registeredAddress: data.companyDetails.registeredAddress || '',
          incorporationDate: data.companyDetails.incorporationDate || '',
          serviceType: data.companyDetails.serviceType || '',
          mainPurpose: data.companyDetails.mainPurpose || '',
          expiryDate: data.companyDetails.expiryDate || '',
          kycActiveStatus: data.companyDetails.kycActiveStatus || 'yes',
          // Company document expiry dates
          companyComputerCardExpiry: data.companyDetails.companyComputerCardExpiry || '',
          taxCardExpiry: data.companyDetails.taxCardExpiry || '',
          crExtractExpiry: data.companyDetails.crExtractExpiry || '',
          scopeOfLicenseExpiry: data.companyDetails.scopeOfLicenseExpiry || '',
        }
      }));
    }

    // Auto-fill directors
    if (data.directors && data.directors.length > 0) {
      setFormData(prev => ({
        ...prev,
        directors: data.directors.map(director => ({
          name: director.name || '',
          nationality: director.nationality || '',
          email: director.email || '',
          mobileNo: director.mobileNo || '',
          qidNo: director.qidNo || '',
          qidExpiry: director.qidExpiry || '',
          nationalAddress: director.nationalAddress || '',
          nationalAddressExpiry: director.nationalAddressExpiry || '',
          passportNo: director.passportNo || '',
          passportExpiry: director.passportExpiry || '',
          // Document URLs for display
          visaCopyUrl: director.visaCopy || '',
          qidDocUrl: director.qidDoc || '',
          nationalAddressDocUrl: director.nationalAddressDoc || '',
          passportDocUrl: director.passportDoc || '',
          cvUrl: director.cv || '',
        }))
      }));
      
      // Set director document states (references only)
      setDirectorDocs(data.directors.map(director => ({
        visaCopy: null,
        qidDoc: null,
        nationalAddressDoc: null,
        passportDoc: null,
        cv: null,
      })));
    }

    // Auto-fill shareholders
    if (data.shareholders && data.shareholders.length > 0) {
      setFormData(prev => ({
        ...prev,
        shareholders: data.shareholders.map(shareholder => ({
          name: shareholder.name || '',
          nationality: shareholder.nationality || '',
          email: shareholder.email || '',
          mobileNo: shareholder.mobileNo || '',
          qidNo: shareholder.qidNo || '',
          qidExpiry: shareholder.qidExpiry || '',
          nationalAddress: shareholder.nationalAddress || '',
          nationalAddressExpiry: shareholder.nationalAddressExpiry || '',
          passportNo: shareholder.passportNo || '',
          passportExpiry: shareholder.passportExpiry || '',
          // Document URLs for display
          visaCopyUrl: shareholder.visaCopy || '',
          qidDocUrl: shareholder.qidDoc || '',
          nationalAddressDocUrl: shareholder.nationalAddressDoc || '',
          passportDocUrl: shareholder.passportDoc || '',
          cvUrl: shareholder.cv || '',
        }))
      }));
      
      setShareholderDocs(data.shareholders.map(() => ({
        visaCopy: null,
        qidDoc: null,
        nationalAddressDoc: null,
        passportDoc: null,
        cv: null,
      })));
    }

    // Auto-fill secretaries
    if (data.secretaries && data.secretaries.length > 0) {
      setFormData(prev => ({
        ...prev,
        secretaries: data.secretaries.map(secretary => ({
          name: secretary.name || '',
          nationality: secretary.nationality || '',
          email: secretary.email || '',
          mobileNo: secretary.mobileNo || '',
          qidNo: secretary.qidNo || '',
          qidExpiry: secretary.qidExpiry || '',
          nationalAddress: secretary.nationalAddress || '',
          nationalAddressExpiry: secretary.nationalAddressExpiry || '',
          passportNo: secretary.passportNo || '',
          passportExpiry: secretary.passportExpiry || '',
          // Document URLs for display
          visaCopyUrl: secretary.visaCopy || '',
          qidDocUrl: secretary.qidDoc || '',
          nationalAddressDocUrl: secretary.nationalAddressDoc || '',
          passportDocUrl: secretary.passportDoc || '',
          cvUrl: secretary.cv || '',
        }))
      }));
      
      setSecretaryDocs(data.secretaries.map(() => ({
        visaCopy: null,
        qidDoc: null,
        nationalAddressDoc: null,
        passportDoc: null,
        cv: null,
      })));
    }

    // Auto-fill SEFs
    if (data.sefs && data.sefs.length > 0) {
      setFormData(prev => ({
        ...prev,
        sefs: data.sefs.map(sef => ({
          name: sef.name || '',
          nationality: sef.nationality || '',
          email: sef.email || '',
          mobileNo: sef.mobileNo || '',
          qidNo: sef.qidNo || '',
          qidExpiry: sef.qidExpiry || '',
          nationalAddress: sef.nationalAddress || '',
          nationalAddressExpiry: sef.nationalAddressExpiry || '',
          passportNo: sef.passportNo || '',
          passportExpiry: sef.passportExpiry || '',
          // Document URLs for display
          visaCopyUrl: sef.visaCopy || '',
          qidDocUrl: sef.qidDoc || '',
          nationalAddressDocUrl: sef.nationalAddressDoc || '',
          passportDocUrl: sef.passportDoc || '',
          cvUrl: sef.cv || '',
        }))
      }));
      
      setSefDocs(data.sefs.map(() => ({
        visaCopy: null,
        qidDoc: null,
        nationalAddressDoc: null,
        passportDoc: null,
        cv: null,
      })));
    }

    // Show document information in toast
    const docCount = Object.values(data.documents || {}).filter(doc => 
      doc && (Array.isArray(doc) ? doc.length > 0 : doc)
    ).length;
    
    const message = `Auto-filled data from job: ${data.jobNumber}${docCount > 0 ? ` (${docCount} document references found)` : ''}`;
    toast.success(message);
    
    // Show document references in console for debugging
    if (data.documents && docCount > 0) {
      console.log('📄 Document references from previous job:', data.documents);
      toast(`Previous documents: ${Object.keys(data.documents).filter(key => 
        data.documents[key] && (Array.isArray(data.documents[key]) ? data.documents[key].length > 0 : true)
      ).join(', ')}`, { 
        duration: 4000,
        icon: '📄'
      });
    }
  };

  // Debounce function for job number checking
  const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        func(...args);
      }, delay);
    };
  };

  // Create debounced versions
  const debouncedCheckJobNumber = debounce(checkJobNumberAvailability, 500);
  const debouncedLookupEmail = debounce(lookupJobByEmail, 800);

  // Fetch assignable users for the dropdown
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axiosInstance.get("/users?role=operation");
        setAssignableUsers(response.data);
      } catch (error) {
        console.error("Error fetching assignable users:", error);
        toast.error("Failed to load assignable users");
      }
    };

    fetchUsers();
  }, []);

  // Fetch services from the API
  useEffect(() => {
    const fetchServices = async () => {
      try {
        setLoadingServices(true);
        const response = await axiosInstance.get("/services");
        // Only use active services
        let activeServices = response.data.filter(
          (service) => service.status === "active"
        );

        // Filter services based on user's role (admin sees all)
        if (user && user.role && user.role.name !== "admin") {
          activeServices = activeServices.filter((service) => {
            // If service has no roles assigned, show it to everyone
            if (!service.roles || service.roles.length === 0) {
              return true;
            }
            // Check if user's role is in the service's roles
            return service.roles.some(
              (role) => role._id === user.role._id || role === user.role._id
            );
          });
        }

        setServices(activeServices);
      } catch (error) {
        console.error("Error fetching services:", error);
        toast.error("Failed to load services");
      } finally {
        setLoadingServices(false);
      }
    };

    if (user) {
      fetchServices();
    }
  }, [user]);

  // Fetch users when service type changes
  useEffect(() => {
    const fetchUsersByService = async () => {
      if (!formData.serviceType) {
        setServiceUsers([]);
        setSelectedServiceUsers([]);
        return;
      }

      try {
        setLoadingServiceUsers(true);
        setSelectedServiceUsers([]);
        const response = await axiosInstance.get(
          `/users/by-service/${encodeURIComponent(formData.serviceType)}`
        );
        setServiceUsers(response.data || []);
      } catch (error) {
        console.error("Error fetching users by service:", error);
        setServiceUsers([]);
      } finally {
        setLoadingServiceUsers(false);
      }
    };

    fetchUsersByService();
  }, [formData.serviceType]);

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;

    // Check job number availability when job number changes
    if (name === "jobNumber") {
      debouncedCheckJobNumber(value);
    }

    // Lookup job by email when email changes
    if (name === "gmail") {
      debouncedLookupEmail(value);
    }

    // Handle nested fields with dot notation (e.g., "companyDetails.companyName")
    if (name.includes(".")) {
      const [parent, child] = name.split(".");
      setFormData({
        ...formData,
        [parent]: {
          ...formData[parent],
          [child]: value,
        },
      });

      // If company service type is being changed, update main service type for consistency
      if (name === "companyDetails.serviceType") {
        setFormData((prevState) => ({
          ...prevState,
          serviceType: value,
        }));
      }
    } else {
      // Handle flat fields
      setFormData({
        ...formData,
        [name]: value,
      });

      // If main service type is being changed, update company service type for consistency
      if (name === "serviceType") {
        setFormData((prevState) => ({
          ...prevState,
          companyDetails: {
            ...prevState.companyDetails,
            serviceType: value,
          },
        }));
      }

      // Auto-populate client name as company name when client name is changed
      if (name === "clientName" && value) {
        setFormData((prevState) => ({
          ...prevState,
          companyDetails: {
            ...prevState.companyDetails,
            companyName: value,
          },
        }));
      }
    }
  };

  // Handle job number field blur
  const handleJobNumberBlur = () => {
    if (formData.jobNumber && formData.jobNumber.length >= 3) {
      checkJobNumberAvailability(formData.jobNumber);
    }
  };

  // Handle array field changes (e.g., directors, shareholders)
  const handleArrayChange = (arrayName, index, field, value) => {
    const newArray = [...formData[arrayName]];
    newArray[index] = {
      ...newArray[index],
      [field]: value,
    };

    setFormData({
      ...formData,
      [arrayName]: newArray,
    });
  };

  // Add new item to an array field
  const addArrayItem = (arrayName, docsStateUpdater = null) => {
    const emptyItem = {
      name: "",
      nationality: "",
      qidNo: "",
      qidExpiry: "",
      nationalAddress: "",
      nationalAddressExpiry: "",
      passportNo: "",
      passportExpiry: "",
      mobileNo: "",
      email: "",
    };

    setFormData({
      ...formData,
      [arrayName]: [...formData[arrayName], emptyItem],
    });

    // If there's a document state updater, also add empty docs
    if (docsStateUpdater) {
      docsStateUpdater((prev) => [
        ...prev,
        {
          visaCopy: null,
          qidDoc: null,
          nationalAddressDoc: null,
          passportDoc: null,
          cv: null,
        },
      ]);
    }
  };

  // Remove item from an array field
  const removeArrayItem = (arrayName, index, docsStateUpdater = null) => {
    if (formData[arrayName].length <= 1) {
      return; // Keep at least one item
    }

    const newArray = [...formData[arrayName]];
    newArray.splice(index, 1);

    setFormData({
      ...formData,
      [arrayName]: newArray,
    });

    // If there's a document state updater, also remove docs
    if (docsStateUpdater) {
      docsStateUpdater((prev) => {
        const newDocs = [...prev];
        newDocs.splice(index, 1);
        return newDocs;
      });
    }
  };

  // Handle file upload changes
  const handleFileChange = (e) => {
    const { name, files: uploadedFiles } = e.target;

    if (
      name === "otherDocuments" ||
      name === "kycDocuments" ||
      name === "braDocuments"
    ) {
      // These fields accept multiple files
      setFiles({
        ...files,
        [name]: [...files[name], ...Array.from(uploadedFiles)],
      });
    } else {
      // Single file fields
      setFiles({
        ...files,
        [name]: uploadedFiles[0],
      });
    }
  };

  // Handle person document changes
  const handlePersonDocChange = (personType, index, docType, file) => {
    let updater;
    let stateArray;

    switch (personType) {
      case "director":
        updater = setDirectorDocs;
        stateArray = directorDocs;
        break;
      case "shareholder":
        updater = setShareholderDocs;
        stateArray = shareholderDocs;
        break;
      case "secretary":
        updater = setSecretaryDocs;
        stateArray = secretaryDocs;
        break;
      case "sef":
        updater = setSefDocs;
        stateArray = sefDocs;
        break;
      default:
        return;
    }

    const newDocs = [...stateArray];
    newDocs[index] = {
      ...newDocs[index],
      [docType]: file,
    };

    updater(newDocs);
  };

  // Handle auto-fill for person details
  const handlePersonAutoFill = (personType, index, personDetails) => {
    if (!personDetails) return;

    const personData = {
      name: personDetails.name || '',
      nationality: personDetails.nationality || '',
      qidNo: personDetails.qidNo || '',
      qidExpiry: personDetails.qidExpiry || '',
      nationalAddress: personDetails.nationalAddress || '',
      nationalAddressExpiry: personDetails.nationalAddressExpiry || '',
      passportNo: personDetails.passportNo || '',
      passportExpiry: personDetails.passportExpiry || '',
      mobileNo: personDetails.mobileNo || '',
      email: personDetails.email || '',
    };

    setFormData(prev => ({
      ...prev,
      [personType]: prev[personType].map((person, i) => 
        i === index ? { ...person, ...personData } : person
      )
    }));

    toast.success(`${personType.charAt(0).toUpperCase() + personType.slice(1)} details auto-filled successfully!`);
  };

  // Add person to array
  const addPersonToArray = (personType) => {
    const newPerson = {
      name: '',
      nationality: '',
      qidNo: '',
      qidExpiry: '',
      nationalAddress: '',
      nationalAddressExpiry: '',
      passportNo: '',
      passportExpiry: '',
      mobileNo: '',
      email: '',
    };

    setFormData(prev => ({
      ...prev,
      [personType]: [...prev[personType], newPerson]
    }));
  };

  // Remove person from array
  const removePersonFromArray = (personType, index) => {
    setFormData(prev => ({
      ...prev,
      [personType]: prev[personType].filter((_, i) => i !== index)
    }));
  };

  // Remove a file from array
  const removeFile = (fieldName, index) => {
    const newFiles = [...files[fieldName]];
    newFiles.splice(index, 1);
    setFiles({
      ...files,
      [fieldName]: newFiles,
    });
  };

  // Add KYC document info field
  const addKycDocumentInfo = () => {
    setFormData({
      ...formData,
      kycDocumentInfo: [
        ...formData.kycDocumentInfo,
        { description: "", date: "" },
      ],
    });
  };

  // Remove KYC document info field
  const removeKycDocumentInfo = (index) => {
    if (formData.kycDocumentInfo.length <= 1) {
      return; // Keep at least one item
    }

    const newInfo = [...formData.kycDocumentInfo];
    newInfo.splice(index, 1);

    setFormData({
      ...formData,
      kycDocumentInfo: newInfo,
    });
  };

  // Handle KYC document info changes
  const handleKycInfoChange = (index, field, value) => {
    const newInfo = [...formData.kycDocumentInfo];
    newInfo[index] = {
      ...newInfo[index],
      [field]: value,
    };

    setFormData({
      ...formData,
      kycDocumentInfo: newInfo,
    });
  };

  // Add BRA document info field
  const addBraDocumentInfo = () => {
    setFormData({
      ...formData,
      braDocumentInfo: [
        ...formData.braDocumentInfo,
        { description: "", date: "" },
      ],
    });
  };

  // Remove BRA document info field
  const removeBraDocumentInfo = (index) => {
    if (formData.braDocumentInfo.length <= 1) {
      return; // Keep at least one item
    }

    const newInfo = [...formData.braDocumentInfo];
    newInfo.splice(index, 1);

    setFormData({
      ...formData,
      braDocumentInfo: newInfo,
    });
  };

  // Handle BRA document info changes
  const handleBraInfoChange = (index, field, value) => {
    const newInfo = [...formData.braDocumentInfo];
    newInfo[index] = {
      ...newInfo[index],
      [field]: value,
    };

    setFormData({
      ...formData,
      braDocumentInfo: newInfo,
    });
  };

  // Drag and drop handlers
  const [isDragging, setIsDragging] = useState(false);

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

  // Create the job - FIXED VERSION WITH PROPER DIRECTOR DOCUMENT HANDLING
  const handleSubmit = async (e) => {
    e.preventDefault();

    console.log("🚀 Starting form submission...");
    console.log("📧 Email being submitted:", formData.gmail);
    console.log("👥 Directors to process:", formData.directors.length);

    try {
      setLoading(true);
      console.log("✅ About to validate required fields");

      // Validate required fields (removed passport and ID document validation)
      if (
        !formData.jobNumber ||
        !formData.serviceType ||
        !formData.assignedPerson ||
        !formData.jobDetails ||
        !formData.clientName ||
        !formData.gmail ||
        !formData.startingPoint
      ) {
        toast.error("Please fill out all required fields");
        setLoading(false);
        return;
      }

      // Validate job number format
      if (!/^[A-Za-z0-9-]+$/.test(formData.jobNumber)) {
        toast.error(
          "Job number must contain only letters, numbers, and hyphens"
        );
        setLoading(false);
        return;
      }

      // Check if job number is available
      if (jobNumberStatus.available === false) {
        toast.error("This job number is already in use");
        setLoading(false);
        return;
      }

      // Validate email format
      if (
        !/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(formData.gmail)
      ) {
        toast.error("Please provide a valid email address");
        setLoading(false);
        return;
      }

      console.log("✅ Validation passed, continuing submission");

      // Create FormData for file uploads
      const formDataToSend = new FormData();

      // Add job number
      formDataToSend.append("jobNumber", formData.jobNumber);

      // Add basic job info
      formDataToSend.append("serviceType", formData.serviceType);
      formDataToSend.append("assignedPerson", formData.assignedPerson);
      if (selectedServiceUsers && selectedServiceUsers.length > 0) {
        formDataToSend.append("selectedServiceUsers", JSON.stringify(selectedServiceUsers));
      }
      formDataToSend.append("jobDetails", formData.jobDetails);
      formDataToSend.append("specialDescription", formData.specialDescription);
      formDataToSend.append("clientName", formData.clientName);
      formDataToSend.append("gmail", formData.gmail);
      formDataToSend.append("startingPoint", formData.startingPoint);
      formDataToSend.append("crNo", formData.crNo || "");
      formDataToSend.append("contactNumber", formData.contactNumber || "");

      // Add company details
      formDataToSend.append(
        "companyDetails",
        JSON.stringify(formData.companyDetails)
      );

      // Add person details
      formDataToSend.append("directors", JSON.stringify(formData.directors));
      formDataToSend.append(
        "shareholders",
        JSON.stringify(formData.shareholders)
      );
      formDataToSend.append(
        "secretaries",
        JSON.stringify(formData.secretaries)
      );
      formDataToSend.append("sefs", JSON.stringify(formData.sefs));

      // Add KYC document info
      formDataToSend.append(
        "kycDocumentInfo",
        JSON.stringify(formData.kycDocumentInfo)
      );

      // Add BRA document info
      formDataToSend.append(
        "braDocumentInfo",
        JSON.stringify(formData.braDocumentInfo)
      );

      // Add optional job documents (now optional)
      if (files.documentPassport) {
        formDataToSend.append("documentPassport", files.documentPassport);
      } else if (formData.documentPassportUrl) {
        // Send existing document URL if no new file uploaded
        formDataToSend.append("documentPassportUrl", formData.documentPassportUrl);
      }
      
      if (files.documentID) {
        formDataToSend.append("documentID", files.documentID);
      } else if (formData.documentIDUrl) {
        // Send existing document URL if no new file uploaded
        formDataToSend.append("documentIDUrl", formData.documentIDUrl);
      }

      // Add other job documents
      if (files.otherDocuments.length > 0) {
        files.otherDocuments.forEach((file) => {
          formDataToSend.append("otherDocuments", file);
        });
      } else if (formData.otherDocumentsUrls && formData.otherDocumentsUrls.length > 0) {
        // Send existing document URLs if no new files uploaded
        formDataToSend.append("otherDocumentsUrls", JSON.stringify(formData.otherDocumentsUrls));
      }

      // Add company documents
      if (files.engagementLetters) {
        formDataToSend.append("engagementLetters", files.engagementLetters);
      } else if (formData.engagementLettersUrls && formData.engagementLettersUrls.length > 0) {
        formDataToSend.append("engagementLettersUrls", JSON.stringify(formData.engagementLettersUrls));
      }
      
      if (files.companyComputerCard) {
        formDataToSend.append("companyComputerCard", files.companyComputerCard);
      } else if (formData.companyComputerCardUrl) {
        formDataToSend.append("companyComputerCardUrl", formData.companyComputerCardUrl);
      }
      
      if (files.taxCard) {
        formDataToSend.append("taxCard", files.taxCard);
      } else if (formData.taxCardUrl) {
        formDataToSend.append("taxCardUrl", formData.taxCardUrl);
      }

      // Handle multiple CR Extract files
      if (crExtractFiles.length > 0) {
        crExtractFiles.forEach((file) => {
          formDataToSend.append("crExtract", file);
        });
        console.log(
          `📄 Adding ${crExtractFiles.length} CR Extract files to form data`
        );
      } else if (formData.crExtractUrls && formData.crExtractUrls.length > 0) {
        formDataToSend.append("crExtractUrls", JSON.stringify(formData.crExtractUrls));
      }

      if (files.scopeOfLicense) {
        formDataToSend.append("scopeOfLicense", files.scopeOfLicense);
      } else if (formData.scopeOfLicenseUrl) {
        formDataToSend.append("scopeOfLicenseUrl", formData.scopeOfLicenseUrl);
      }
      
      if (files.articleOfAssociate) {
        formDataToSend.append("articleOfAssociate", files.articleOfAssociate);
      } else if (formData.articleOfAssociateUrl) {
        formDataToSend.append("articleOfAssociateUrl", formData.articleOfAssociateUrl);
      }
      
      if (files.certificateOfIncorporate) {
        formDataToSend.append("certificateOfIncorporate", files.certificateOfIncorporate);
      } else if (formData.certificateOfIncorporateUrl) {
        formDataToSend.append("certificateOfIncorporateUrl", formData.certificateOfIncorporateUrl);
      }

      // ADD COMPANY MEMO FILES HERE:
      if (companyMemoFiles.length > 0) {
        companyMemoFiles.forEach((file) => {
          formDataToSend.append("companyMemo", file);
        });
        console.log(`📄 Adding ${companyMemoFiles.length} Company Memo files to form data`);
      } else if (formData.companyMemoUrls && formData.companyMemoUrls.length > 0) {
        formDataToSend.append("companyMemoUrls", JSON.stringify(formData.companyMemoUrls));
      }

      // 🔥 FIXED: Add director documents with proper indexing
      console.log("👥 Processing director documents...");
      formData.directors.forEach((director, directorIndex) => {
        console.log(`📋 Processing director ${directorIndex}: ${director.name || 'Unnamed'}`);
        
        // Handle both new file uploads AND existing document URLs
        if (directorDocs[directorIndex]) {
          // Add new file uploads with index for multiple directors support
          if (directorDocs[directorIndex].visaCopy) {
            formDataToSend.append(
              `directorVisaCopy_${directorIndex}`,
              directorDocs[directorIndex].visaCopy
            );
            console.log(`📄 Added new visa copy for director ${directorIndex}`);
          } else if (director.visaCopyUrl) {
            formDataToSend.append(
              `directorVisaCopyUrl_${directorIndex}`,
              director.visaCopyUrl
            );
            console.log(`📄 Added existing visa copy URL for director ${directorIndex}`);
          }
          
          if (directorDocs[directorIndex].qidDoc) {
            formDataToSend.append(
              `directorQidDoc_${directorIndex}`, 
              directorDocs[directorIndex].qidDoc
            );
            console.log(`📄 Added new QID doc for director ${directorIndex}`);
          } else if (director.qidDocUrl) {
            formDataToSend.append(
              `directorQidDocUrl_${directorIndex}`,
              director.qidDocUrl
            );
            console.log(`📄 Added existing QID doc URL for director ${directorIndex}`);
          }
          
          if (directorDocs[directorIndex].nationalAddressDoc) {
            formDataToSend.append(
              `directorNationalAddressDoc_${directorIndex}`,
              directorDocs[directorIndex].nationalAddressDoc
            );
            console.log(`📄 Added new national address doc for director ${directorIndex}`);
          } else if (director.nationalAddressDocUrl) {
            formDataToSend.append(
              `directorNationalAddressDocUrl_${directorIndex}`,
              director.nationalAddressDocUrl
            );
            console.log(`📄 Added existing national address doc URL for director ${directorIndex}`);
          }
          
          if (directorDocs[directorIndex].passportDoc) {
            formDataToSend.append(
              `directorPassportDoc_${directorIndex}`,
              directorDocs[directorIndex].passportDoc
            );
            console.log(`📄 Added new passport doc for director ${directorIndex}`);
          } else if (director.passportDocUrl) {
            formDataToSend.append(
              `directorPassportDocUrl_${directorIndex}`,
              director.passportDocUrl
            );
            console.log(`📄 Added existing passport doc URL for director ${directorIndex}`);
          }
          
          if (directorDocs[directorIndex].cv) {
            formDataToSend.append(
              `directorCv_${directorIndex}`, 
              directorDocs[directorIndex].cv
            );
            console.log(`📄 Added new CV for director ${directorIndex}`);
          } else if (director.cvUrl) {
            formDataToSend.append(
              `directorCvUrl_${directorIndex}`,
              director.cvUrl
            );
            console.log(`📄 Added existing CV URL for director ${directorIndex}`);
          }
        } else {
          // If no new document uploads, check for existing URLs
          if (director.visaCopyUrl) {
            formDataToSend.append(
              `directorVisaCopyUrl_${directorIndex}`,
              director.visaCopyUrl
            );
            console.log(`📄 Added existing visa copy URL for director ${directorIndex}`);
          }
          if (director.qidDocUrl) {
            formDataToSend.append(
              `directorQidDocUrl_${directorIndex}`,
              director.qidDocUrl
            );
            console.log(`📄 Added existing QID doc URL for director ${directorIndex}`);
          }
          if (director.nationalAddressDocUrl) {
            formDataToSend.append(
              `directorNationalAddressDocUrl_${directorIndex}`,
              director.nationalAddressDocUrl
            );
            console.log(`📄 Added existing national address doc URL for director ${directorIndex}`);
          }
          if (director.passportDocUrl) {
            formDataToSend.append(
              `directorPassportDocUrl_${directorIndex}`,
              director.passportDocUrl
            );
            console.log(`📄 Added existing passport doc URL for director ${directorIndex}`);
          }
          if (director.cvUrl) {
            formDataToSend.append(
              `directorCvUrl_${directorIndex}`,
              director.cvUrl
            );
            console.log(`📄 Added existing CV URL for director ${directorIndex}`);
          }
          
          if (!director.visaCopyUrl && !director.qidDocUrl && !director.nationalAddressDocUrl && !director.passportDocUrl && !director.cvUrl) {
            console.log(`⚠️ No documents found for director ${directorIndex}`);
          }
        }
      });

      console.log(`✅ Processed documents for ${formData.directors.length} directors`);

      // Add shareholder documents with proper indexing
      formData.shareholders.forEach((shareholder, shareholderIndex) => {
        console.log(`📋 Processing shareholder ${shareholderIndex}: ${shareholder.name || 'Unnamed'}`);
        console.log(`🔍 Shareholder ${shareholderIndex} data:`, {
          name: shareholder.name,
          visaCopyUrl: shareholder.visaCopyUrl,
          qidDocUrl: shareholder.qidDocUrl,
          nationalAddressDocUrl: shareholder.nationalAddressDocUrl,
          passportDocUrl: shareholder.passportDocUrl,
          cvUrl: shareholder.cvUrl,
          visaCopy: shareholder.visaCopy,
          qidDoc: shareholder.qidDoc
        });
        
        console.log(`🔍 shareholderDocs[${shareholderIndex}]:`, shareholderDocs[shareholderIndex]);
        
        // Check if there are any actual file uploads for this shareholder
        const hasFileUploads = shareholderDocs[shareholderIndex] && (
          shareholderDocs[shareholderIndex].visaCopy ||
          shareholderDocs[shareholderIndex].qidDoc ||
          shareholderDocs[shareholderIndex].nationalAddressDoc ||
          shareholderDocs[shareholderIndex].passportDoc ||
          shareholderDocs[shareholderIndex].cv
        );
        
        if (hasFileUploads) {
          console.log(`📁 Processing file uploads for shareholder ${shareholderIndex}`);
          if (shareholderDocs[shareholderIndex].visaCopy)
            formDataToSend.append(
              `shareholderVisaCopy_${shareholderIndex}`,
              shareholderDocs[shareholderIndex].visaCopy
            );
          if (shareholderDocs[shareholderIndex].qidDoc)
            formDataToSend.append(
              `shareholderQidDoc_${shareholderIndex}`,
              shareholderDocs[shareholderIndex].qidDoc
            );
          if (shareholderDocs[shareholderIndex].nationalAddressDoc)
            formDataToSend.append(
              `shareholderNationalAddressDoc_${shareholderIndex}`,
              shareholderDocs[shareholderIndex].nationalAddressDoc
            );
          if (shareholderDocs[shareholderIndex].passportDoc)
            formDataToSend.append(
              `shareholderPassportDoc_${shareholderIndex}`,
              shareholderDocs[shareholderIndex].passportDoc
            );
          if (shareholderDocs[shareholderIndex].cv)
            formDataToSend.append(
              `shareholderCv_${shareholderIndex}`, 
              shareholderDocs[shareholderIndex].cv
            );
        } else {
          console.log(`📋 No file uploads for shareholder ${shareholderIndex}, checking for existing URLs`);
          // If no new document uploads, check for existing URLs from auto-fill
          if (shareholder.visaCopyUrl && shareholder.visaCopyUrl.trim() !== '') {
            formDataToSend.append(
              `shareholderVisaCopyUrl_${shareholderIndex}`,
              shareholder.visaCopyUrl
            );
            console.log(`📄 Added existing visa copy URL for shareholder ${shareholderIndex}`);
          }
          if (shareholder.qidDocUrl && shareholder.qidDocUrl.trim() !== '') {
            formDataToSend.append(
              `shareholderQidDocUrl_${shareholderIndex}`,
              shareholder.qidDocUrl
            );
            console.log(`📄 Added existing QID doc URL for shareholder ${shareholderIndex}`);
          }
          if (shareholder.nationalAddressDocUrl && shareholder.nationalAddressDocUrl.trim() !== '') {
            formDataToSend.append(
              `shareholderNationalAddressDocUrl_${shareholderIndex}`,
              shareholder.nationalAddressDocUrl
            );
            console.log(`📄 Added existing national address doc URL for shareholder ${shareholderIndex}`);
          }
          if (shareholder.passportDocUrl && shareholder.passportDocUrl.trim() !== '') {
            formDataToSend.append(
              `shareholderPassportDocUrl_${shareholderIndex}`,
              shareholder.passportDocUrl
            );
            console.log(`📄 Added existing passport doc URL for shareholder ${shareholderIndex}`);
          }
          if (shareholder.cvUrl && shareholder.cvUrl.trim() !== '') {
            formDataToSend.append(
              `shareholderCvUrl_${shareholderIndex}`,
              shareholder.cvUrl
            );
            console.log(`📄 Added existing CV URL for shareholder ${shareholderIndex}`);
          }
        }
      });

      // Add secretary documents with proper indexing
      formData.secretaries.forEach((secretary, secretaryIndex) => {
        console.log(`📋 Processing secretary ${secretaryIndex}: ${secretary.name || 'Unnamed'}`);
        console.log(`🔍 Secretary ${secretaryIndex} data:`, {
          name: secretary.name,
          visaCopyUrl: secretary.visaCopyUrl,
          qidDocUrl: secretary.qidDocUrl,
          nationalAddressDocUrl: secretary.nationalAddressDocUrl,
          passportDocUrl: secretary.passportDocUrl,
          cvUrl: secretary.cvUrl
        });
        
        console.log(`🔍 secretaryDocs[${secretaryIndex}]:`, secretaryDocs[secretaryIndex]);
        
        // Check if there are any actual file uploads for this secretary
        const hasFileUploads = secretaryDocs[secretaryIndex] && (
          secretaryDocs[secretaryIndex].visaCopy ||
          secretaryDocs[secretaryIndex].qidDoc ||
          secretaryDocs[secretaryIndex].nationalAddressDoc ||
          secretaryDocs[secretaryIndex].passportDoc ||
          secretaryDocs[secretaryIndex].cv
        );
        
        if (hasFileUploads) {
          console.log(`📁 Processing file uploads for secretary ${secretaryIndex}`);
          if (secretaryDocs[secretaryIndex].visaCopy)
            formDataToSend.append(
              `secretaryVisaCopy_${secretaryIndex}`,
              secretaryDocs[secretaryIndex].visaCopy
            );
          if (secretaryDocs[secretaryIndex].qidDoc)
            formDataToSend.append(
              `secretaryQidDoc_${secretaryIndex}`,
              secretaryDocs[secretaryIndex].qidDoc
            );
          if (secretaryDocs[secretaryIndex].nationalAddressDoc)
            formDataToSend.append(
              `secretaryNationalAddressDoc_${secretaryIndex}`,
              secretaryDocs[secretaryIndex].nationalAddressDoc
            );
          if (secretaryDocs[secretaryIndex].passportDoc)
            formDataToSend.append(
              `secretaryPassportDoc_${secretaryIndex}`,
              secretaryDocs[secretaryIndex].passportDoc
            );
          if (secretaryDocs[secretaryIndex].cv)
            formDataToSend.append(
              `secretaryCv_${secretaryIndex}`, 
              secretaryDocs[secretaryIndex].cv
            );
        } else {
          console.log(`📋 No file uploads for secretary ${secretaryIndex}, checking for existing URLs`);
          // If no new document uploads, check for existing URLs from auto-fill
          if (secretary.visaCopyUrl && secretary.visaCopyUrl.trim() !== '') {
            formDataToSend.append(
              `secretaryVisaCopyUrl_${secretaryIndex}`,
              secretary.visaCopyUrl
            );
            console.log(`📄 Added existing visa copy URL for secretary ${secretaryIndex}`);
          }
          if (secretary.qidDocUrl && secretary.qidDocUrl.trim() !== '') {
            formDataToSend.append(
              `secretaryQidDocUrl_${secretaryIndex}`,
              secretary.qidDocUrl
            );
            console.log(`📄 Added existing QID doc URL for secretary ${secretaryIndex}`);
          }
          if (secretary.nationalAddressDocUrl && secretary.nationalAddressDocUrl.trim() !== '') {
            formDataToSend.append(
              `secretaryNationalAddressDocUrl_${secretaryIndex}`,
              secretary.nationalAddressDocUrl
            );
            console.log(`📄 Added existing national address doc URL for secretary ${secretaryIndex}`);
          }
          if (secretary.passportDocUrl && secretary.passportDocUrl.trim() !== '') {
            formDataToSend.append(
              `secretaryPassportDocUrl_${secretaryIndex}`,
              secretary.passportDocUrl
            );
            console.log(`📄 Added existing passport doc URL for secretary ${secretaryIndex}`);
          }
          if (secretary.cvUrl && secretary.cvUrl.trim() !== '') {
            formDataToSend.append(
              `secretaryCvUrl_${secretaryIndex}`,
              secretary.cvUrl
            );
            console.log(`📄 Added existing CV URL for secretary ${secretaryIndex}`);
          }
        }
      });

      // Add SEF documents with proper indexing
      formData.sefs.forEach((sef, sefIndex) => {
        console.log(`📋 Processing SEF ${sefIndex}: ${sef.name || 'Unnamed'}`);
        console.log(`🔍 SEF ${sefIndex} data:`, {
          name: sef.name,
          visaCopyUrl: sef.visaCopyUrl,
          qidDocUrl: sef.qidDocUrl,
          nationalAddressDocUrl: sef.nationalAddressDocUrl,
          passportDocUrl: sef.passportDocUrl,
          cvUrl: sef.cvUrl
        });
        
        console.log(`🔍 sefDocs[${sefIndex}]:`, sefDocs[sefIndex]);
        
        // Check if there are any actual file uploads for this SEF
        const hasFileUploads = sefDocs[sefIndex] && (
          sefDocs[sefIndex].visaCopy ||
          sefDocs[sefIndex].qidDoc ||
          sefDocs[sefIndex].nationalAddressDoc ||
          sefDocs[sefIndex].passportDoc ||
          sefDocs[sefIndex].cv
        );
        
        if (hasFileUploads) {
          console.log(`📁 Processing file uploads for SEF ${sefIndex}`);
          if (sefDocs[sefIndex].visaCopy)
            formDataToSend.append(
              `sefVisaCopy_${sefIndex}`, 
              sefDocs[sefIndex].visaCopy
            );
          if (sefDocs[sefIndex].qidDoc)
            formDataToSend.append(
              `sefQidDoc_${sefIndex}`, 
              sefDocs[sefIndex].qidDoc
            );
          if (sefDocs[sefIndex].nationalAddressDoc)
            formDataToSend.append(
              `sefNationalAddressDoc_${sefIndex}`,
              sefDocs[sefIndex].nationalAddressDoc
            );
          if (sefDocs[sefIndex].passportDoc)
            formDataToSend.append(
              `sefPassportDoc_${sefIndex}`, 
              sefDocs[sefIndex].passportDoc
            );
          if (sefDocs[sefIndex].cv)
            formDataToSend.append(
              `sefCv_${sefIndex}`, 
              sefDocs[sefIndex].cv
            );
        } else {
          console.log(`📋 No file uploads for SEF ${sefIndex}, checking for existing URLs`);
          // If no new document uploads, check for existing URLs from auto-fill
          if (sef.visaCopyUrl && sef.visaCopyUrl.trim() !== '') {
            formDataToSend.append(
              `sefVisaCopyUrl_${sefIndex}`,
              sef.visaCopyUrl
            );
            console.log(`📄 Added existing visa copy URL for SEF ${sefIndex}`);
          }
          if (sef.qidDocUrl && sef.qidDocUrl.trim() !== '') {
            formDataToSend.append(
              `sefQidDocUrl_${sefIndex}`,
              sef.qidDocUrl
            );
            console.log(`📄 Added existing QID doc URL for SEF ${sefIndex}`);
          }
          if (sef.nationalAddressDocUrl && sef.nationalAddressDocUrl.trim() !== '') {
            formDataToSend.append(
              `sefNationalAddressDocUrl_${sefIndex}`,
              sef.nationalAddressDocUrl
            );
            console.log(`📄 Added existing national address doc URL for SEF ${sefIndex}`);
          }
          if (sef.passportDocUrl && sef.passportDocUrl.trim() !== '') {
            formDataToSend.append(
              `sefPassportDocUrl_${sefIndex}`,
              sef.passportDocUrl
            );
            console.log(`📄 Added existing passport doc URL for SEF ${sefIndex}`);
          }
          if (sef.cvUrl && sef.cvUrl.trim() !== '') {
            formDataToSend.append(
              `sefCvUrl_${sefIndex}`,
              sef.cvUrl
            );
            console.log(`📄 Added existing CV URL for SEF ${sefIndex}`);
          }
        }
      });

      // Add KYC documents
      if (files.kycDocuments.length > 0) {
        files.kycDocuments.forEach((file) => {
          formDataToSend.append("kycDocuments", file);
        });
      }

      // Add BRA documents
      if (files.braDocuments.length > 0) {
        files.braDocuments.forEach((file) => {
          formDataToSend.append("braDocuments", file);
        });
      }

      console.log("🚀 Sending request to backend...");

      // Send request to the backend
      const response = await axiosInstance.post(
        "/operations/pre-approved-job",
        formDataToSend,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      console.log("✅ Pre-approved job created successfully!");
      toast.success("Pre-approved job created successfully!");

      // Navigate to the job details page
      navigate(`/job/${response.data.job._id}`);
    } catch (error) {
      console.error("❌ Error creating pre-approved job:", error);

      // Handle API error response
      const errorMessage =
        error.response?.data?.message || "Failed to create pre-approved job";
      const detailedError = error.response?.data?.error;

      toast.error(errorMessage);

      if (detailedError) {
        console.error("Detailed error:", detailedError);
      }
    } finally {
      setLoading(false);
    }
  };

  // Format the date string for input fields
  const formatDateForInput = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "";
    return date.toISOString().split("T")[0];
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-50 via-indigo-50 to-slate-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="inline-flex items-center text-gray-600 hover:text-gray-900"
            >
              <ArrowLeftIcon className="h-5 w-5 mr-1" />
              <span>Back</span>
            </button>
            <h1 className="mt-2 text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent tracking-tight">
              Create Pre-Approved Job
            </h1>
            <p className="mt-2 text-lg text-gray-600">
              Create a new job with all approvals pre-completed
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Job Number Section */}
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
            <div className="flex items-center mb-6">
              <HashtagIcon className="h-6 w-6 text-purple-600 mr-2" />
              <h2 className="text-xl font-semibold text-gray-900">
                Job Identification
              </h2>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Job Number <span className="text-red-500">*</span>
              </label>
              <div className="relative mt-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <HashtagIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  name="jobNumber"
                  value={formData.jobNumber}
                  onChange={handleChange}
                  onBlur={handleJobNumberBlur}
                  className={`block w-full pl-10 pr-10 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                    jobNumberStatus.available === true
                      ? "border-green-300 bg-green-50"
                      : jobNumberStatus.available === false
                      ? "border-red-300 bg-red-50"
                      : "border-gray-300"
                  }`}
                  placeholder="Enter unique job number (e.g., JOB-2024-001)"
                  required
                />
                {jobNumberStatus.checking && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <ArrowPathIcon className="h-5 w-5 text-blue-500 animate-spin" />
                  </div>
                )}
                {!jobNumberStatus.checking &&
                  jobNumberStatus.available === true && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <CheckIcon className="h-5 w-5 text-green-500" />
                    </div>
                  )}
                {!jobNumberStatus.checking &&
                  jobNumberStatus.available === false && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <ExclamationCircleIcon className="h-5 w-5 text-red-500" />
                    </div>
                  )}
              </div>
              {jobNumberStatus.message && (
                <p
                  className={`mt-1 text-sm ${
                    jobNumberStatus.available === true
                      ? "text-green-600"
                      : jobNumberStatus.available === false
                      ? "text-red-600"
                      : "text-gray-600"
                  }`}
                >
                  {jobNumberStatus.message}
                </p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                Use letters, numbers, and hyphens only. Example: JOB-2024-001,
                PROJECT-ABC-123
              </p>
            </div>
          </div>

          {/* Basic Job Information */}
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
            <div className="flex items-center mb-6">
              <BriefcaseIcon className="h-6 w-6 text-blue-600 mr-2" />
              <h2 className="text-xl font-semibold text-gray-900">
                Basic Job Information
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Service Type <span className="text-red-500">*</span>
                </label>
                <select
                  name="serviceType"
                  value={formData.serviceType}
                  onChange={handleChange}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md shadow-sm"
                  required
                  disabled={loadingServices}
                >
                  <option value="">Select Service Type</option>
                  {loadingServices ? (
                    <option value="" disabled>
                      Loading services...
                    </option>
                  ) : (
                    services.map((service) => (
                      <option key={service._id} value={service.name}>
                        {service.name}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Assigned Person{" "}
                  <span className="text-gray-500 text-xs">(Optional)</span>
                </label>
                <select
                  name="assignedPerson"
                  value={formData.assignedPerson}
                  onChange={handleChange}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md shadow-sm"
                >
                  <option value="">Select Assigned Person</option>
                  {assignableUsers.map((user) => (
                    <option key={user._id} value={user._id}>
                      {user.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Multi-Select Users for This Service */}
              {formData.serviceType && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Users for This Service
                    <span className="text-gray-500 text-xs ml-1">(Optional - Select multiple)</span>
                  </label>
                  {loadingServiceUsers ? (
                    <div className="flex items-center space-x-2 text-gray-500">
                      <ArrowPathIcon className="h-4 w-4 animate-spin" />
                      <span className="text-sm">Loading users...</span>
                    </div>
                  ) : serviceUsers.length > 0 ? (
                    <>
                      <div className="border border-gray-300 rounded-lg p-3 max-h-48 overflow-y-auto bg-white">
                        {serviceUsers.map((serviceUser) => (
                          <label
                            key={serviceUser._id}
                            className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
                          >
                            <input
                              type="checkbox"
                              checked={selectedServiceUsers.includes(serviceUser._id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedServiceUsers([...selectedServiceUsers, serviceUser._id]);
                                } else {
                                  setSelectedServiceUsers(
                                    selectedServiceUsers.filter((id) => id !== serviceUser._id)
                                  );
                                }
                              }}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <div className="flex-1">
                              <span className="text-sm font-medium text-gray-700">
                                {serviceUser.name}
                              </span>
                              <span className="text-xs text-gray-500 ml-2">
                                ({serviceUser.role?.name || "N/A"})
                              </span>
                            </div>
                          </label>
                        ))}
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        <p className="text-xs text-gray-500">
                          {serviceUsers.length} user{serviceUsers.length !== 1 ? "s" : ""} available
                        </p>
                        {selectedServiceUsers.length > 0 && (
                          <p className="text-xs text-blue-600 font-medium">
                            {selectedServiceUsers.length} selected
                          </p>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <p className="text-sm text-yellow-700">
                        No specific users assigned to this service.
                      </p>
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Client Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="clientName"
                  value={formData.clientName}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="email"
                    name="gmail"
                    value={formData.gmail}
                    onChange={handleChange}
                    className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                      emailAutoFill.found
                        ? "border-green-300 bg-green-50"
                        : emailAutoFill.checking
                        ? "border-yellow-300 bg-yellow-50"
                        : "border-gray-300"
                    }`}
                    required
                  />
                  {emailAutoFill.checking && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                      <ArrowPathIcon className="h-4 w-4 text-yellow-500 animate-spin" />
                    </div>
                  )}
                  {emailAutoFill.found && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                      <CheckCircleIcon className="h-4 w-4 text-green-500" />
                    </div>
                  )}
                </div>
                
                {/* Email auto-fill status and button */}
                {emailAutoFill.found && (
                  <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <CheckCircleIcon className="h-5 w-5 text-green-600 mr-2" />
                        <div>
                          <p className="text-sm font-medium text-green-800">
                            Previous Job Found
                          </p>
                          <p className="text-xs text-green-600">
                            {emailAutoFill.message}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={applyEmailAutoFill}
                        className="bg-green-600 text-white px-3 py-1 rounded-md text-sm hover:bg-green-700 transition-colors"
                      >
                        Auto-Fill Data
                      </button>
                    </div>
                  </div>
                )}
                
                {emailAutoFill.message && !emailAutoFill.found && !emailAutoFill.checking && (
                  <p className="mt-1 text-xs text-gray-500">
                    {emailAutoFill.message}
                  </p>
                )}
                
                {!emailAutoFill.message && !emailAutoFill.checking && (
                  <p className="mt-1 text-xs text-gray-500">
                    Must be a valid email address
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Starting Point <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="startingPoint"
                  value={formData.startingPoint}
                  onChange={handleChange}
                  placeholder="Enter starting point (e.g., QFC, Ministry, Free Zone)"
                  className="mt-1 block w-full pl-3 pr-3 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md shadow-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  CR Number <span className="text-gray-500">(Optional)</span>
                </label>
                <input
                  type="text"
                  name="crNo"
                  value={formData.crNo}
                  onChange={handleChange}
                  placeholder="Enter CR number"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Contact Number <span className="text-gray-500">(Optional)</span>
                </label>
                <input
                  type="text"
                  name="contactNumber"
                  value={formData.contactNumber}
                  onChange={handleChange}
                  placeholder="Enter contact number"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Special Description
                </label>
                <input
                  type="text"
                  name="specialDescription"
                  value={formData.specialDescription}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700">
                Job Details <span className="text-red-500">*</span>
              </label>
              <textarea
                name="jobDetails"
                value={formData.jobDetails}
                onChange={handleChange}
                rows={3}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              ></textarea>
            </div>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Passport Document{" "}
                  <span className="text-gray-500">(Optional)</span>
                </label>
                <input
                  type="file"
                  onChange={(e) =>
                    handleFileChange({
                      target: {
                        name: "documentPassport",
                        files: e.target.files,
                      },
                    })
                  }
                  className="mt-1 block w-full px-3 py-2"
                />
                {files.documentPassport && (
                  <div className="mt-2 flex items-center text-sm text-gray-500">
                    <PaperClipIcon className="h-4 w-4 mr-1" />
                    <span className="truncate">
                      {files.documentPassport.name}
                    </span>
                  </div>
                )}
                {!files.documentPassport && formData.documentPassportUrl && (
                  <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-sm text-blue-800">
                        <PaperClipIcon className="h-4 w-4 mr-2" />
                        <span>Previous Passport Document</span>
                      </div>
                      <a
                        href={formData.documentPassportUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        View
                      </a>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  ID Document <span className="text-gray-500">(Optional)</span>
                </label>
                <input
                  type="file"
                  onChange={(e) =>
                    handleFileChange({
                      target: {
                        name: "documentID",
                        files: e.target.files,
                      },
                    })
                  }
                  className="mt-1 block w-full px-3 py-2"
                />
                {files.documentID && (
                  <div className="mt-2 flex items-center text-sm text-gray-500">
                    <PaperClipIcon className="h-4 w-4 mr-1" />
                    <span className="truncate">{files.documentID.name}</span>
                  </div>
                )}
                {!files.documentID && formData.documentIDUrl && (
                  <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-sm text-blue-800">
                        <PaperClipIcon className="h-4 w-4 mr-2" />
                        <span>Previous ID Document</span>
                      </div>
                      <a
                        href={formData.documentIDUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        View
                      </a>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Other Documents
                </label>
                <input
                  type="file"
                  onChange={(e) =>
                    handleFileChange({
                      target: {
                        name: "otherDocuments",
                        files: e.target.files,
                      },
                    })
                  }
                  className="mt-1 block w-full px-3 py-2"
                  multiple
                />
                {files.otherDocuments.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {files.otherDocuments.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between text-sm text-gray-500 bg-gray-50 p-2 rounded-md"
                      >
                        <div className="flex items-center truncate">
                          <PaperClipIcon className="h-4 w-4 mr-1" />
                          <span className="truncate">{file.name}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFile("otherDocuments", index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {files.otherDocuments.length === 0 && formData.otherDocumentsUrls && formData.otherDocumentsUrls.length > 0 && (
                  <div className="mt-2 space-y-2">
                    <div className="text-xs font-medium text-blue-700 mb-2">Previous Other Documents:</div>
                    {formData.otherDocumentsUrls.map((url, index) => (
                      <div key={index} className="p-2 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center text-sm text-blue-800">
                            <PaperClipIcon className="h-4 w-4 mr-2" />
                            <span>Other Document {index + 1}</span>
                          </div>
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                          >
                            View
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Company Details */}
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
            <div className="flex items-center mb-6">
              <BuildingOfficeIcon className="h-6 w-6 text-blue-600 mr-2" />
              <h2 className="text-xl font-semibold text-gray-900">
                Company Details
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Company Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="companyDetails.companyName"
                  value={formData.companyDetails.companyName}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  QFC Number
                </label>
                <input
                  type="text"
                  name="companyDetails.qfcNo"
                  value={formData.companyDetails.qfcNo}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Registered Address
                </label>
                <input
                  type="text"
                  name="companyDetails.registeredAddress"
                  value={formData.companyDetails.registeredAddress}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Incorporation Date
                </label>
                <input
                  type="date"
                  name="companyDetails.incorporationDate"
                  value={formatDateForInput(
                    formData.companyDetails.incorporationDate
                  )}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Service Type
                </label>
                <select
                  name="companyDetails.serviceType"
                  value={formData.companyDetails.serviceType}
                  onChange={handleChange}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md shadow-sm"
                  disabled={loadingServices}
                >
                  <option value="">Select Service Type</option>
                  {loadingServices ? (
                    <option value="" disabled>
                      Loading services...
                    </option>
                  ) : (
                    services.map((service) => (
                      <option key={service._id} value={service.name}>
                        {service.name}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Engagement Letters
                </label>
                <input
                  type="file"
                  onChange={(e) =>
                    handleFileChange({
                      target: {
                        name: "engagementLetters",
                        files: e.target.files,
                      },
                    })
                  }
                  className="mt-1 block w-full px-3 py-2"
                />
                {files.engagementLetters ? (
                  <div className="mt-2 flex items-center text-sm text-gray-500">
                    <PaperClipIcon className="h-4 w-4 mr-1" />
                    <span className="truncate">
                      {files.engagementLetters.name}
                    </span>
                  </div>
                ) : formData.engagementLettersUrls && formData.engagementLettersUrls.length > 0 ? (
                  <div className="mt-2 space-y-1">
                    {formData.engagementLettersUrls.map((doc, index) => (
                      <div key={index} className="flex items-center text-sm text-blue-600">
                        <PaperClipIcon className="h-4 w-4 mr-1" />
                        <a
                          href={doc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="truncate hover:underline"
                        >
                          {doc.fileName}
                        </a>
                        <span className="ml-2 text-xs text-gray-500">
                          (Previous job)
                        </span>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Main Purpose
                </label>
                <input
                  type="text"
                  name="companyDetails.mainPurpose"
                  value={formData.companyDetails.mainPurpose}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Expiry Date
                </label>
                <input
                  type="date"
                  name="companyDetails.expiryDate"
                  value={formatDateForInput(formData.companyDetails.expiryDate)}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="mt-6 space-y-4">
              {/* Company Computer Card */}
              <div className="grid grid-cols-5 items-center bg-yellow-50 p-4 rounded-lg shadow-sm border border-yellow-200">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Company Computer Card
                  </label>
                  <input
                    type="file"
                    onChange={(e) =>
                      handleFileChange({
                        target: {
                          name: "companyComputerCard",
                          files: e.target.files,
                        },
                      })
                    }
                    className="mt-1 block w-full px-3 py-2"
                  />
                  {files.companyComputerCard ? (
                    <div className="mt-2 flex items-center text-sm text-gray-500">
                      <PaperClipIcon className="h-4 w-4 mr-1" />
                      <span className="truncate">
                        {files.companyComputerCard.name}
                      </span>
                    </div>
                  ) : formData.companyComputerCardUrl ? (
                    <div className="mt-2 flex items-center text-sm text-blue-600">
                      <PaperClipIcon className="h-4 w-4 mr-1" />
                      <a
                        href={formData.companyComputerCardUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="truncate hover:underline"
                      >
                        View existing document
                      </a>
                      <span className="ml-2 text-xs text-gray-500">
                        (Previous job)
                      </span>
                    </div>
                  ) : null}
                </div>
                <div className="col-span-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Expiry Date
                  </label>
                  <input
                    type="date"
                    name="companyDetails.companyComputerCardExpiry"
                    value={formatDateForInput(
                      formData.companyDetails.companyComputerCardExpiry
                    )}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Tax Card */}
              <div className="grid grid-cols-5 items-center bg-yellow-50 p-4 rounded-lg shadow-sm border border-yellow-200">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Tax Card
                  </label>
                  <input
                    type="file"
                    onChange={(e) =>
                      handleFileChange({
                        target: {
                          name: "taxCard",
                          files: e.target.files,
                        },
                      })
                    }
                    className="mt-1 block w-full px-3 py-2"
                  />
                  {files.taxCard ? (
                    <div className="mt-2 flex items-center text-sm text-gray-500">
                      <PaperClipIcon className="h-4 w-4 mr-1" />
                      <span className="truncate">{files.taxCard.name}</span>
                    </div>
                  ) : formData.taxCardUrl ? (
                    <div className="mt-2 flex items-center text-sm text-blue-600">
                      <PaperClipIcon className="h-4 w-4 mr-1" />
                      <a
                        href={formData.taxCardUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="truncate hover:underline"
                      >
                        View existing document
                      </a>
                      <span className="ml-2 text-xs text-gray-500">
                        (Previous job)
                      </span>
                    </div>
                  ) : null}
                </div>
                <div className="col-span-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Expiry Date
                  </label>
                  <input
                    type="date"
                    name="companyDetails.taxCardExpiry"
                    value={formatDateForInput(
                      formData.companyDetails.taxCardExpiry
                    )}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* CR Extract - Updated Section */}
              <div className="grid grid-cols-5 items-center bg-yellow-50 p-4 rounded-lg shadow-sm border border-yellow-200">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700">
                    CR Extract
                  </label>
                  <div
                    className={`mt-1 border-2 border-dashed rounded-lg p-2 transition-colors ${
                      crExtractFiles.length > 0
                        ? "border-green-500 bg-green-50"
                        : "border-gray-300 hover:border-indigo-300 hover:bg-indigo-50/30"
                    }`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsDragging(false);
                      const files = Array.from(e.dataTransfer.files).slice(
                        0,
                        2
                      );
                      if (files.length > 0) {
                        setCrExtractFiles(files);
                      }
                    }}
                  >
                    {/* Show selected files OR existing files */}
                    {crExtractFiles.length > 0 ? (
                      <div className="space-y-2">
                        {crExtractFiles.map((file, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between bg-white p-2 rounded-lg shadow-sm border border-gray-100"
                          >
                            <div className="flex items-center">
                              <DocumentTextIcon className="h-5 w-5 text-green-600 mr-2" />
                              <span className="text-xs text-gray-900 font-medium truncate max-w-[100px]">
                                {file.name}
                              </span>
                              <span className="text-xs text-gray-500 ml-1">
                                ({(file.size / 1024).toFixed(1)}KB)
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeCrExtractFile(index)}
                              className="p-0.5 text-red-400 hover:text-white hover:bg-red-500 rounded-lg hover:shadow-md transition-all duration-200"
                              title="Remove file"
                            >
                              <XMarkIcon className="h-3 w-3" />
                            </button>
                          </div>
                        ))}

                        {/* Add more files button */}
                        <div className="text-center pt-2">
                          <label className="cursor-pointer block text-xs font-medium text-indigo-600 hover:text-indigo-500 transition-colors">
                            + Add another document
                            <input
                              type="file"
                              className="sr-only"
                              multiple
                              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                              onChange={(e) => {
                                const newFiles = Array.from(e.target.files);
                                setCrExtractFiles((prev) => [
                                  ...prev,
                                  ...newFiles,
                                ]);
                              }}
                            />
                          </label>
                        </div>
                      </div>
                    ) : formData.crExtractUrls && formData.crExtractUrls.length > 0 ? (
                      <div className="space-y-2">
                        {formData.crExtractUrls.map((doc, index) => (
                          <div key={index} className="flex items-center justify-between bg-blue-50 p-2 rounded-lg shadow-sm border border-blue-100">
                            <div className="flex items-center">
                              <DocumentTextIcon className="h-5 w-5 text-blue-600 mr-2" />
                              <a
                                href={doc.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-blue-900 font-medium truncate max-w-[100px] hover:underline"
                              >
                                {doc.fileName}
                              </a>
                              <span className="text-xs text-gray-500 ml-1">
                                (Previous job)
                              </span>
                            </div>
                          </div>
                        ))}
                        <div className="text-center py-2">
                          <label className="cursor-pointer block text-xs font-medium text-indigo-600 hover:text-indigo-500 transition-colors">
                            Upload new CR Extract Documents
                            <input
                              type="file"
                              className="sr-only"
                              multiple
                              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                              onChange={(e) =>
                                handleCrExtractFileChange(e.target.files)
                              }
                            />
                          </label>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-3">
                        <CloudArrowUpIcon className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                        <div>
                          <label className="cursor-pointer block text-xs font-medium text-indigo-600 hover:text-indigo-500 transition-colors">
                            Upload CR Extract Documents
                            <input
                              type="file"
                              className="sr-only"
                              multiple
                              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                              onChange={(e) =>
                                handleCrExtractFileChange(e.target.files)
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

                {/* CR Extract Expiry Date */}
                <div className="col-span-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Expiry Date
                  </label>
                  <div className="flex items-center space-x-2 mt-1">
                    <input
                      type="date"
                      name="companyDetails.crExtractExpiry"
                      value={formatDateForInput(
                        formData.companyDetails.crExtractExpiry
                      )}
                      onChange={handleChange}
                      className="block w-full rounded-lg border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const newDate = new Date();
                        newDate.setFullYear(newDate.getFullYear() + 1);
                        const dateString = newDate.toISOString().split("T")[0];

                        // Update the companyDetails state
                        setFormData((prev) => ({
                          ...prev,
                          companyDetails: {
                            ...prev.companyDetails,
                            crExtractExpiry: dateString,
                          },
                        }));
                      }}
                      className="p-2 text-gray-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors"
                      title="Renew for one year"
                    >
                      <ArrowPathIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Scope of License */}
              <div className="grid grid-cols-5 items-center bg-yellow-50 p-4 rounded-lg shadow-sm border border-yellow-200">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Scope of License
                  </label>
                  <input
                    type="file"
                    onChange={(e) =>
                      handleFileChange({
                        target: {
                          name: "scopeOfLicense",
                          files: e.target.files,
                        },
                      })
                    }
                    className="mt-1 block w-full px-3 py-2"
                  />
                  {files.scopeOfLicense ? (
                    <div className="mt-2 flex items-center text-sm text-gray-500">
                      <PaperClipIcon className="h-4 w-4 mr-1" />
                      <span className="truncate">
                        {files.scopeOfLicense.name}
                      </span>
                    </div>
                  ) : formData.scopeOfLicenseUrl ? (
                    <div className="mt-2 flex items-center text-sm text-blue-600">
                      <PaperClipIcon className="h-4 w-4 mr-1" />
                      <a
                        href={formData.scopeOfLicenseUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="truncate hover:underline"
                      >
                        View existing document
                      </a>
                      <span className="ml-2 text-xs text-gray-500">
                        (Previous job)
                      </span>
                    </div>
                  ) : null}
                </div>
                <div className="col-span-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Expiry Date
                  </label>
                  <input
                    type="date"
                    name="companyDetails.scopeOfLicenseExpiry"
                    value={formatDateForInput(
                      formData.companyDetails.scopeOfLicenseExpiry
                    )}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Article of Associate */}
              <div className="grid grid-cols-5 items-center bg-yellow-50 p-4 rounded-lg shadow-sm border border-yellow-200">
                <div className="col-span-5">
                  <label className="block text-sm font-medium text-gray-700">
                    Article of Associate (AOA)
                  </label>
                  <input
                    type="file"
                    onChange={(e) =>
                      handleFileChange({
                        target: {
                          name: "articleOfAssociate",
                          files: e.target.files,
                        },
                      })
                    }
                    className="mt-1 block w-full px-3 py-2"
                  />
                  {files.articleOfAssociate ? (
                    <div className="mt-2 flex items-center text-sm text-gray-500">
                      <PaperClipIcon className="h-4 w-4 mr-1" />
                      <span className="truncate">
                        {files.articleOfAssociate.name}
                      </span>
                    </div>
                  ) : formData.articleOfAssociateUrl ? (
                    <div className="mt-2 flex items-center text-sm text-blue-600">
                      <PaperClipIcon className="h-4 w-4 mr-1" />
                      <a
                        href={formData.articleOfAssociateUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="truncate hover:underline"
                      >
                        View existing document
                      </a>
                      <span className="ml-2 text-xs text-gray-500">
                        (Previous job)
                      </span>
                    </div>
                  ) : null}
                </div>
              </div>

              {/* Certificate of Incorporate */}
              <div className="grid grid-cols-5 items-center bg-yellow-50 p-4 rounded-lg shadow-sm border border-yellow-200">
                <div className="col-span-5">
                  <label className="block text-sm font-medium text-gray-700">
                    Certificate of Incorporate (COI)
                  </label>
                  <input
                    type="file"
                    onChange={(e) =>
                      handleFileChange({
                        target: {
                          name: "certificateOfIncorporate",
                          files: e.target.files,
                        },
                      })
                    }
                    className="mt-1 block w-full px-3 py-2"
                  />
                  {files.certificateOfIncorporate ? (
                    <div className="mt-2 flex items-center text-sm text-gray-500">
                      <PaperClipIcon className="h-4 w-4 mr-1" />
                      <span className="truncate">
                        {files.certificateOfIncorporate.name}
                      </span>
                    </div>
                  ) : formData.certificateOfIncorporateUrl ? (
                    <div className="mt-2 flex items-center text-sm text-blue-600">
                      <PaperClipIcon className="h-4 w-4 mr-1" />
                      <a
                        href={formData.certificateOfIncorporateUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="truncate hover:underline"
                      >
                        View existing document
                      </a>
                      <span className="ml-2 text-xs text-gray-500">
                        (Previous job)
                      </span>
                    </div>
                  ) : null}
                </div>
              </div>

              {/* Company Memo - NEW SECTION */}
              <div className="grid grid-cols-5 items-center bg-yellow-50 p-4 rounded-lg shadow-sm border border-yellow-200">
                <div className="col-span-5">
                  <label className="block text-sm font-medium text-gray-700">
                    Company Memo (Max 5 files)
                  </label>
                  <div
                    className={`mt-1 border-2 border-dashed rounded-lg p-3 transition-colors ${
                      companyMemoFiles.length > 0
                        ? "border-green-500 bg-green-50"
                        : "border-gray-300 hover:border-indigo-300 hover:bg-indigo-50/30"
                    }`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsDragging(false);
                      const files = Array.from(e.dataTransfer.files).slice(0, 5);
                      if (files.length > 0) {
                        setCompanyMemoFiles(files);
                      }
                    }}
                  >
                    {/* Show selected files */}
                    {companyMemoFiles.length > 0 ? (
                      <div className="space-y-2">
                        {companyMemoFiles.map((file, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between bg-white p-3 rounded-lg shadow-sm border border-gray-100"
                          >
                            <div className="flex items-center">
                              <DocumentTextIcon className="h-5 w-5 text-blue-600 mr-2" />
                              <span className="text-sm text-gray-900 font-medium truncate max-w-[200px]">
                                {file.name}
                              </span>
                              <span className="text-xs text-gray-500 ml-2">
                                ({(file.size / 1024).toFixed(1)}KB)
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeCompanyMemoFile(index)}
                              className="p-1 text-red-400 hover:text-white hover:bg-red-500 rounded-lg hover:shadow-md transition-all duration-200"
                              title="Remove file"
                            >
                              <XMarkIcon className="h-4 w-4" />
                            </button>
                          </div>
                        ))}

                        {/* Add more files button if less than 5 files */}
                        {companyMemoFiles.length < 5 && (
                          <div className="text-center pt-2">
                            <label className="cursor-pointer block text-sm font-medium text-indigo-600 hover:text-indigo-500 transition-colors">
                              + Add {companyMemoFiles.length === 4 ? "1 more" : "more"} documents
                              <input
                                type="file"
                                className="sr-only"
                                multiple
                                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                onChange={(e) => {
                                  const newFiles = Array.from(e.target.files);
                                  const remainingSlots = 5 - companyMemoFiles.length;
                                  const filesToAdd = newFiles.slice(0, remainingSlots);
                                  setCompanyMemoFiles((prev) => [...prev, ...filesToAdd]);
                                }}
                              />
                            </label>
                          </div>
                        )}
                      </div>
                    ) : formData.companyMemoUrls && formData.companyMemoUrls.length > 0 ? (
                      <div className="space-y-2">
                        {formData.companyMemoUrls.map((doc, index) => (
                          <div key={index} className="flex items-center justify-between bg-blue-50 p-3 rounded-lg shadow-sm border border-blue-100">
                            <div className="flex items-center">
                              <DocumentTextIcon className="h-5 w-5 text-blue-600 mr-2" />
                              <a
                                href={doc.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-blue-900 font-medium truncate max-w-[200px] hover:underline"
                              >
                                {doc.fileName}
                              </a>
                              <span className="text-xs text-gray-500 ml-2">
                                (Previous job)
                              </span>
                            </div>
                          </div>
                        ))}
                        <div className="text-center py-2">
                          <label className="cursor-pointer block text-sm font-medium text-indigo-600 hover:text-indigo-500 transition-colors">
                            Upload new Company Memo Documents
                            <input
                              type="file"
                              className="sr-only"
                              multiple
                              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                              onChange={(e) => handleCompanyMemoFileChange(e.target.files)}
                            />
                          </label>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <CloudArrowUpIcon className="mx-auto h-10 w-10 text-gray-400 mb-3" />
                        <div>
                          <label className="cursor-pointer block text-sm font-medium text-indigo-600 hover:text-indigo-500 transition-colors">
                            Upload Company Memo Documents (1-5 files)
                            <input
                              type="file"
                              className="sr-only"
                              multiple
                              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                              onChange={(e) => handleCompanyMemoFileChange(e.target.files)}
                            />
                          </label>
                          <p className="text-xs text-gray-500 mt-1">
                            or drag and drop here • PDF, DOC, DOCX, JPG, PNG
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Upload up to 5 company memo documents. Supported formats: PDF, DOC, DOCX, JPG, PNG
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Directors */}
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <UserIcon className="h-6 w-6 text-blue-600 mr-2" />
                <h2 className="text-xl font-semibold text-gray-900">
                  Directors
                </h2>
              </div>
              <button
                type="button"
                onClick={() => addArrayItem("directors", setDirectorDocs)}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <PlusCircleIcon className="h-5 w-5 mr-1" />
                Add Director
              </button>
            </div>

            {formData.directors.map((director, index) => (
              <div
                key={index}
                className="mb-8 pb-6 border-b border-gray-200 last:border-b-0 last:mb-0 last:pb-0"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Director {index + 1}
                  </h3>
                  {formData.directors.length > 1 && (
                    <button
                      type="button"
                      onClick={() =>
                        removeArrayItem("directors", index, setDirectorDocs)
                      }
                      className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      <TrashIcon className="h-4 w-4 mr-1" />
                      Remove
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <AutoSuggestPersonInput
                      label="Name"
                      value={director.name}
                      onChange={(name) =>
                        handleArrayChange("directors", index, "name", name)
                      }
                      onAutoFill={(personDetails) =>
                        handlePersonAutoFill("directors", index, personDetails)
                      }
                      placeholder="Enter director name..."
                      personType="Director"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Nationality
                    </label>
                    <input
                      type="text"
                      value={director.nationality}
                      onChange={(e) =>
                        handleArrayChange(
                          "directors",
                          index,
                          "nationality",
                          e.target.value
                        )
                      }
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      QID Number
                    </label>
                    <input
                      type="text"
                      value={director.qidNo}
                      onChange={(e) =>
                        handleArrayChange(
                          "directors",
                          index,
                          "qidNo",
                          e.target.value
                        )
                      }
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      QID Expiry
                    </label>
                    <input
                      type="date"
                      value={formatDateForInput(director.qidExpiry)}
                      onChange={(e) =>
                        handleArrayChange(
                          "directors",
                          index,
                          "qidExpiry",
                          e.target.value
                        )
                      }
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      National Address
                    </label>
                    <input
                      type="text"
                      value={director.nationalAddress}
                      onChange={(e) =>
                        handleArrayChange(
                          "directors",
                          index,
                          "nationalAddress",
                          e.target.value
                        )
                      }
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      National Address Expiry
                    </label>
                    <input
                      type="date"
                      value={formatDateForInput(director.nationalAddressExpiry)}
                      onChange={(e) =>
                        handleArrayChange(
                          "directors",
                          index,
                          "nationalAddressExpiry",
                          e.target.value
                        )
                      }
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Passport Number
                    </label>
                    <input
                      type="text"
                      value={director.passportNo}
                      onChange={(e) =>
                        handleArrayChange(
                          "directors",
                          index,
                          "passportNo",
                          e.target.value
                        )
                      }
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Passport Expiry
                    </label>
                    <input
                      type="date"
                      value={formatDateForInput(director.passportExpiry)}
                      onChange={(e) =>
                        handleArrayChange(
                          "directors",
                          index,
                          "passportExpiry",
                          e.target.value
                        )
                      }
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Mobile Number
                    </label>
                    <input
                      type="text"
                      value={director.mobileNo}
                      onChange={(e) =>
                        handleArrayChange(
                          "directors",
                          index,
                          "mobileNo",
                          e.target.value
                        )
                      }
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Email
                    </label>
                    <input
                      type="email"
                      value={director.email}
                      onChange={(e) =>
                        handleArrayChange(
                          "directors",
                          index,
                          "email",
                          e.target.value
                        )
                      }
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Director Documents */}
                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Visa Copy
                    </label>
                    <input
                      type="file"
                      onChange={(e) =>
                        handlePersonDocChange(
                          "director",
                          index,
                          "visaCopy",
                          e.target.files[0]
                        )
                      }
                      className="mt-1 block w-full px-3 py-2"
                    />
                    {directorDocs[index]?.visaCopy ? (
                      <div className="mt-2 flex items-center text-sm text-gray-500">
                        <PaperClipIcon className="h-4 w-4 mr-1" />
                        <span className="truncate">
                          {directorDocs[index].visaCopy.name}
                        </span>
                      </div>
                    ) : director.visaCopyUrl ? (
                      <div className="mt-2 flex items-center text-sm text-blue-600">
                        <PaperClipIcon className="h-4 w-4 mr-1" />
                        <a
                          href={director.visaCopyUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="truncate hover:underline"
                        >
                          View existing document
                        </a>
                        <span className="ml-2 text-xs text-gray-500">
                          (Previous job)
                        </span>
                      </div>
                    ) : null}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      QID Document
                    </label>
                    <input
                      type="file"
                      onChange={(e) =>
                        handlePersonDocChange(
                          "director",
                          index,
                          "qidDoc",
                          e.target.files[0]
                        )
                      }
                      className="mt-1 block w-full px-3 py-2"
                    />
                    {directorDocs[index]?.qidDoc ? (
                      <div className="mt-2 flex items-center text-sm text-gray-500">
                        <PaperClipIcon className="h-4 w-4 mr-1" />
                        <span className="truncate">
                          {directorDocs[index].qidDoc.name}
                        </span>
                      </div>
                    ) : director.qidDocUrl ? (
                      <div className="mt-2 flex items-center text-sm text-blue-600">
                        <PaperClipIcon className="h-4 w-4 mr-1" />
                        <a
                          href={director.qidDocUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="truncate hover:underline"
                        >
                          View existing document
                        </a>
                        <span className="ml-2 text-xs text-gray-500">
                          (Previous job)
                        </span>
                      </div>
                    ) : null}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      National Address Document
                    </label>
                    <input
                      type="file"
                      onChange={(e) =>
                        handlePersonDocChange(
                          "director",
                          index,
                          "nationalAddressDoc",
                          e.target.files[0]
                        )
                      }
                      className="mt-1 block w-full px-3 py-2"
                    />
                    {directorDocs[index]?.nationalAddressDoc ? (
                      <div className="mt-2 flex items-center text-sm text-gray-500">
                        <PaperClipIcon className="h-4 w-4 mr-1" />
                        <span className="truncate">
                          {directorDocs[index].nationalAddressDoc.name}
                        </span>
                      </div>
                    ) : director.nationalAddressDocUrl ? (
                      <div className="mt-2 flex items-center text-sm text-blue-600">
                        <PaperClipIcon className="h-4 w-4 mr-1" />
                        <a
                          href={director.nationalAddressDocUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="truncate hover:underline"
                        >
                          View existing document
                        </a>
                        <span className="ml-2 text-xs text-gray-500">
                          (Previous job)
                        </span>
                      </div>
                    ) : null}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Passport Document
                    </label>
                    <input
                      type="file"
                      onChange={(e) =>
                        handlePersonDocChange(
                          "director",
                          index,
                          "passportDoc",
                          e.target.files[0]
                        )
                      }
                      className="mt-1 block w-full px-3 py-2"
                    />
                    {directorDocs[index]?.passportDoc && (
                      <div className="mt-2 flex items-center text-sm text-gray-500">
                        <PaperClipIcon className="h-4 w-4 mr-1" />
                        <span className="truncate">
                          {directorDocs[index].passportDoc.name}
                        </span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      CV
                    </label>
                    <input
                      type="file"
                      onChange={(e) =>
                        handlePersonDocChange(
                          "director",
                          index,
                          "cv",
                          e.target.files[0]
                        )
                      }
                      className="mt-1 block w-full px-3 py-2"
                    />
                    {directorDocs[index]?.cv && (
                      <div className="mt-2 flex items-center text-sm text-gray-500">
                        <PaperClipIcon className="h-4 w-4 mr-1" />
                        <span className="truncate">
                          {directorDocs[index].cv.name}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Shareholders */}
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <UserIcon className="h-6 w-6 text-blue-600 mr-2" />
                <h2 className="text-xl font-semibold text-gray-900">
                  Shareholders
                </h2>
              </div>
              <button
                type="button"
                onClick={() => addArrayItem("shareholders", setShareholderDocs)}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <PlusCircleIcon className="h-5 w-5 mr-1" />
                Add Shareholder
              </button>
            </div>

            {formData.shareholders.length === 0 ? (
              <p className="text-sm text-gray-500 italic">
                No shareholders added yet. Click the button above to add a
                shareholder.
              </p>
            ) : (
              formData.shareholders.map((shareholder, index) => (
                <div
                  key={index}
                  className="mb-8 pb-6 border-b border-gray-200 last:border-b-0 last:mb-0 last:pb-0"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      Shareholder {index + 1}
                    </h3>
                    <button
                      type="button"
                      onClick={() =>
                        removeArrayItem(
                          "shareholders",
                          index,
                          setShareholderDocs
                        )
                      }
                      className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      <TrashIcon className="h-4 w-4 mr-1" />
                      Remove
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <AutoSuggestPersonInput
                        label="Name"
                        value={shareholder.name}
                        onChange={(name) =>
                          handleArrayChange("shareholders", index, "name", name)
                        }
                        onAutoFill={(personDetails) =>
                          handlePersonAutoFill("shareholders", index, personDetails)
                        }
                        placeholder="Enter shareholder name..."
                        personType="Shareholder"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Nationality
                      </label>
                      <input
                        type="text"
                        value={shareholder.nationality}
                        onChange={(e) =>
                          handleArrayChange(
                            "shareholders",
                            index,
                            "nationality",
                            e.target.value
                          )
                        }
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        QID Number
                      </label>
                      <input
                        type="text"
                        value={shareholder.qidNo}
                        onChange={(e) =>
                          handleArrayChange(
                            "shareholders",
                            index,
                            "qidNo",
                            e.target.value
                          )
                        }
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Mobile Number
                      </label>
                      <input
                        type="text"
                        value={shareholder.mobileNo}
                        onChange={(e) =>
                          handleArrayChange(
                            "shareholders",
                            index,
                            "mobileNo",
                            e.target.value
                          )
                        }
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Email
                      </label>
                      <input
                        type="email"
                        value={shareholder.email}
                        onChange={(e) =>
                          handleArrayChange(
                            "shareholders",
                            index,
                            "email",
                            e.target.value
                          )
                        }
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Passport Number
                      </label>
                      <input
                        type="text"
                        value={shareholder.passportNo}
                        onChange={(e) =>
                          handleArrayChange(
                            "shareholders",
                            index,
                            "passportNo",
                            e.target.value
                          )
                        }
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  {/* Shareholder Documents */}
                  <div className="mt-6 space-y-4">
                    <h4 className="text-md font-medium text-gray-900">
                      Documents for Shareholder {index + 1}
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Visa Copy
                        </label>
                        <input
                          type="file"
                          onChange={(e) =>
                            handlePersonDocChange(
                              "shareholders",
                              index,
                              "visaCopy",
                              e.target.files[0]
                            )
                          }
                          className="mt-1 block w-full px-3 py-2"
                        />
                        {shareholderDocs[index]?.visaCopy ? (
                          <div className="mt-2 flex items-center text-sm text-gray-500">
                            <PaperClipIcon className="h-4 w-4 mr-1" />
                            <span className="truncate">
                              {shareholderDocs[index].visaCopy.name}
                            </span>
                          </div>
                        ) : shareholder.visaCopyUrl ? (
                          <div className="mt-2 flex items-center text-sm text-blue-600">
                            <PaperClipIcon className="h-4 w-4 mr-1" />
                            <a
                              href={shareholder.visaCopyUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="truncate hover:underline"
                            >
                              View existing document
                            </a>
                            <span className="ml-2 text-xs text-gray-500">
                              (Previous job)
                            </span>
                          </div>
                        ) : null}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          QID Document
                        </label>
                        <input
                          type="file"
                          onChange={(e) =>
                            handlePersonDocChange(
                              "shareholders",
                              index,
                              "qidDoc",
                              e.target.files[0]
                            )
                          }
                          className="mt-1 block w-full px-3 py-2"
                        />
                        {shareholderDocs[index]?.qidDoc ? (
                          <div className="mt-2 flex items-center text-sm text-gray-500">
                            <PaperClipIcon className="h-4 w-4 mr-1" />
                            <span className="truncate">
                              {shareholderDocs[index].qidDoc.name}
                            </span>
                          </div>
                        ) : shareholder.qidDocUrl ? (
                          <div className="mt-2 flex items-center text-sm text-blue-600">
                            <PaperClipIcon className="h-4 w-4 mr-1" />
                            <a
                              href={shareholder.qidDocUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="truncate hover:underline"
                            >
                              View existing document
                            </a>
                            <span className="ml-2 text-xs text-gray-500">
                              (Previous job)
                            </span>
                          </div>
                        ) : null}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          National Address Document
                        </label>
                        <input
                          type="file"
                          onChange={(e) =>
                            handlePersonDocChange(
                              "shareholders",
                              index,
                              "nationalAddressDoc",
                              e.target.files[0]
                            )
                          }
                          className="mt-1 block w-full px-3 py-2"
                        />
                        {shareholderDocs[index]?.nationalAddressDoc ? (
                          <div className="mt-2 flex items-center text-sm text-gray-500">
                            <PaperClipIcon className="h-4 w-4 mr-1" />
                            <span className="truncate">
                              {shareholderDocs[index].nationalAddressDoc.name}
                            </span>
                          </div>
                        ) : shareholder.nationalAddressDocUrl ? (
                          <div className="mt-2 flex items-center text-sm text-blue-600">
                            <PaperClipIcon className="h-4 w-4 mr-1" />
                            <a
                              href={shareholder.nationalAddressDocUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="truncate hover:underline"
                            >
                              View existing document
                            </a>
                            <span className="ml-2 text-xs text-gray-500">
                              (Previous job)
                            </span>
                          </div>
                        ) : null}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Passport Document
                        </label>
                        <input
                          type="file"
                          onChange={(e) =>
                            handlePersonDocChange(
                              "shareholders",
                              index,
                              "passportDoc",
                              e.target.files[0]
                            )
                          }
                          className="mt-1 block w-full px-3 py-2"
                        />
                        {shareholderDocs[index]?.passportDoc ? (
                          <div className="mt-2 flex items-center text-sm text-gray-500">
                            <PaperClipIcon className="h-4 w-4 mr-1" />
                            <span className="truncate">
                              {shareholderDocs[index].passportDoc.name}
                            </span>
                          </div>
                        ) : shareholder.passportDocUrl ? (
                          <div className="mt-2 flex items-center text-sm text-blue-600">
                            <PaperClipIcon className="h-4 w-4 mr-1" />
                            <a
                              href={shareholder.passportDocUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="truncate hover:underline"
                            >
                              View existing document
                            </a>
                            <span className="ml-2 text-xs text-gray-500">
                              (Previous job)
                            </span>
                          </div>
                        ) : null}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          CV
                        </label>
                        <input
                          type="file"
                          onChange={(e) =>
                            handlePersonDocChange(
                              "shareholders",
                              index,
                              "cv",
                              e.target.files[0]
                            )
                          }
                          className="mt-1 block w-full px-3 py-2"
                        />
                        {shareholderDocs[index]?.cv ? (
                          <div className="mt-2 flex items-center text-sm text-gray-500">
                            <PaperClipIcon className="h-4 w-4 mr-1" />
                            <span className="truncate">
                              {shareholderDocs[index].cv.name}
                            </span>
                          </div>
                        ) : shareholder.cvUrl ? (
                          <div className="mt-2 flex items-center text-sm text-blue-600">
                            <PaperClipIcon className="h-4 w-4 mr-1" />
                            <a
                              href={shareholder.cvUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="truncate hover:underline"
                            >
                              View existing document
                            </a>
                            <span className="ml-2 text-xs text-gray-500">
                              (Previous job)
                            </span>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Secretaries */}
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <UserIcon className="h-6 w-6 text-green-600 mr-2" />
                <h2 className="text-xl font-semibold text-gray-900">
                  Secretaries
                </h2>
              </div>
              <button
                type="button"
                onClick={() => addPersonToArray("secretaries")}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                <PlusCircleIcon className="h-5 w-5 mr-1" />
                Add Secretary
              </button>
            </div>

            {formData.secretaries.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <UserIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No secretaries added yet. Click "Add Secretary" to get started.</p>
              </div>
            ) : (
              formData.secretaries.map((secretary, index) => (
                <div
                  key={index}
                  className="relative bg-green-50 rounded-xl p-6 mb-6 border border-green-200"
                >
                  <div className="absolute top-4 right-4">
                    <button
                      type="button"
                      onClick={() => removePersonFromArray("secretaries", index)}
                      className="text-red-500 hover:text-red-700 p-1"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <AutoSuggestPersonInput
                        label="Name"
                        value={secretary.name}
                        onChange={(name) =>
                          handleArrayChange("secretaries", index, "name", name)
                        }
                        onAutoFill={(personDetails) =>
                          handlePersonAutoFill("secretaries", index, personDetails)
                        }
                        placeholder="Enter secretary name..."
                        personType="Secretary"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Nationality
                      </label>
                      <input
                        type="text"
                        value={secretary.nationality}
                        onChange={(e) =>
                          handleArrayChange(
                            "secretaries",
                            index,
                            "nationality",
                            e.target.value
                          )
                        }
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        QID Number
                      </label>
                      <input
                        type="text"
                        value={secretary.qidNo}
                        onChange={(e) =>
                          handleArrayChange(
                            "secretaries",
                            index,
                            "qidNo",
                            e.target.value
                          )
                        }
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Mobile Number
                      </label>
                      <input
                        type="text"
                        value={secretary.mobileNo}
                        onChange={(e) =>
                          handleArrayChange(
                            "secretaries",
                            index,
                            "mobileNo",
                            e.target.value
                          )
                        }
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Email
                      </label>
                      <input
                        type="email"
                        value={secretary.email}
                        onChange={(e) =>
                          handleArrayChange(
                            "secretaries",
                            index,
                            "email",
                            e.target.value
                          )
                        }
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  {/* Secretary Documents */}
                  <div className="mt-6 space-y-4">
                    <h4 className="text-md font-medium text-gray-900">
                      Documents for Secretary {index + 1}
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Visa Copy
                        </label>
                        <input
                          type="file"
                          onChange={(e) =>
                            handlePersonDocChange(
                              "secretaries",
                              index,
                              "visaCopy",
                              e.target.files[0]
                            )
                          }
                          className="mt-1 block w-full px-3 py-2"
                        />
                        {secretaryDocs[index]?.visaCopy ? (
                          <div className="mt-2 flex items-center text-sm text-gray-500">
                            <PaperClipIcon className="h-4 w-4 mr-1" />
                            <span className="truncate">
                              {secretaryDocs[index].visaCopy.name}
                            </span>
                          </div>
                        ) : secretary.visaCopyUrl ? (
                          <div className="mt-2 flex items-center text-sm text-blue-600">
                            <PaperClipIcon className="h-4 w-4 mr-1" />
                            <a
                              href={secretary.visaCopyUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="truncate hover:underline"
                            >
                              View existing document
                            </a>
                            <span className="ml-2 text-xs text-gray-500">
                              (Previous job)
                            </span>
                          </div>
                        ) : null}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          QID Document
                        </label>
                        <input
                          type="file"
                          onChange={(e) =>
                            handlePersonDocChange(
                              "secretaries",
                              index,
                              "qidDoc",
                              e.target.files[0]
                            )
                          }
                          className="mt-1 block w-full px-3 py-2"
                        />
                        {secretaryDocs[index]?.qidDoc ? (
                          <div className="mt-2 flex items-center text-sm text-gray-500">
                            <PaperClipIcon className="h-4 w-4 mr-1" />
                            <span className="truncate">
                              {secretaryDocs[index].qidDoc.name}
                            </span>
                          </div>
                        ) : secretary.qidDocUrl ? (
                          <div className="mt-2 flex items-center text-sm text-blue-600">
                            <PaperClipIcon className="h-4 w-4 mr-1" />
                            <a
                              href={secretary.qidDocUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="truncate hover:underline"
                            >
                              View existing document
                            </a>
                            <span className="ml-2 text-xs text-gray-500">
                              (Previous job)
                            </span>
                          </div>
                        ) : null}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          National Address Document
                        </label>
                        <input
                          type="file"
                          onChange={(e) =>
                            handlePersonDocChange(
                              "secretaries",
                              index,
                              "nationalAddressDoc",
                              e.target.files[0]
                            )
                          }
                          className="mt-1 block w-full px-3 py-2"
                        />
                        {secretaryDocs[index]?.nationalAddressDoc ? (
                          <div className="mt-2 flex items-center text-sm text-gray-500">
                            <PaperClipIcon className="h-4 w-4 mr-1" />
                            <span className="truncate">
                              {secretaryDocs[index].nationalAddressDoc.name}
                            </span>
                          </div>
                        ) : secretary.nationalAddressDocUrl ? (
                          <div className="mt-2 flex items-center text-sm text-blue-600">
                            <PaperClipIcon className="h-4 w-4 mr-1" />
                            <a
                              href={secretary.nationalAddressDocUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="truncate hover:underline"
                            >
                              View existing document
                            </a>
                            <span className="ml-2 text-xs text-gray-500">
                              (Previous job)
                            </span>
                          </div>
                        ) : null}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Passport Document
                        </label>
                        <input
                          type="file"
                          onChange={(e) =>
                            handlePersonDocChange(
                              "secretaries",
                              index,
                              "passportDoc",
                              e.target.files[0]
                            )
                          }
                          className="mt-1 block w-full px-3 py-2"
                        />
                        {secretaryDocs[index]?.passportDoc ? (
                          <div className="mt-2 flex items-center text-sm text-gray-500">
                            <PaperClipIcon className="h-4 w-4 mr-1" />
                            <span className="truncate">
                              {secretaryDocs[index].passportDoc.name}
                            </span>
                          </div>
                        ) : secretary.passportDocUrl ? (
                          <div className="mt-2 flex items-center text-sm text-blue-600">
                            <PaperClipIcon className="h-4 w-4 mr-1" />
                            <a
                              href={secretary.passportDocUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="truncate hover:underline"
                            >
                              View existing document
                            </a>
                            <span className="ml-2 text-xs text-gray-500">
                              (Previous job)
                            </span>
                          </div>
                        ) : null}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          CV
                        </label>
                        <input
                          type="file"
                          onChange={(e) =>
                            handlePersonDocChange(
                              "secretaries",
                              index,
                              "cv",
                              e.target.files[0]
                            )
                          }
                          className="mt-1 block w-full px-3 py-2"
                        />
                        {secretaryDocs[index]?.cv ? (
                          <div className="mt-2 flex items-center text-sm text-gray-500">
                            <PaperClipIcon className="h-4 w-4 mr-1" />
                            <span className="truncate">
                              {secretaryDocs[index].cv.name}
                            </span>
                          </div>
                        ) : secretary.cvUrl ? (
                          <div className="mt-2 flex items-center text-sm text-blue-600">
                            <PaperClipIcon className="h-4 w-4 mr-1" />
                            <a
                              href={secretary.cvUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="truncate hover:underline"
                            >
                              View existing document
                            </a>
                            <span className="ml-2 text-xs text-gray-500">
                              (Previous job)
                            </span>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* SEFs */}
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <UserIcon className="h-6 w-6 text-purple-600 mr-2" />
                <h2 className="text-xl font-semibold text-gray-900">
                  SEFs (Signatory and Economic File)
                </h2>
              </div>
              <button
                type="button"
                onClick={() => addPersonToArray("sefs")}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
              >
                <PlusCircleIcon className="h-5 w-5 mr-1" />
                Add SEF
              </button>
            </div>

            {formData.sefs.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <UserIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No SEFs added yet. Click "Add SEF" to get started.</p>
              </div>
            ) : (
              formData.sefs.map((sef, index) => (
                <div
                  key={index}
                  className="relative bg-purple-50 rounded-xl p-6 mb-6 border border-purple-200"
                >
                  <div className="absolute top-4 right-4">
                    <button
                      type="button"
                      onClick={() => removePersonFromArray("sefs", index)}
                      className="text-red-500 hover:text-red-700 p-1"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <AutoSuggestPersonInput
                        label="Name"
                        value={sef.name}
                        onChange={(name) =>
                          handleArrayChange("sefs", index, "name", name)
                        }
                        onAutoFill={(personDetails) =>
                          handlePersonAutoFill("sefs", index, personDetails)
                        }
                        placeholder="Enter SEF name..."
                        personType="SEF"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Nationality
                      </label>
                      <input
                        type="text"
                        value={sef.nationality}
                        onChange={(e) =>
                          handleArrayChange(
                            "sefs",
                            index,
                            "nationality",
                            e.target.value
                          )
                        }
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        QID Number
                      </label>
                      <input
                        type="text"
                        value={sef.qidNo}
                        onChange={(e) =>
                          handleArrayChange(
                            "sefs",
                            index,
                            "qidNo",
                            e.target.value
                          )
                        }
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Mobile Number
                      </label>
                      <input
                        type="text"
                        value={sef.mobileNo}
                        onChange={(e) =>
                          handleArrayChange(
                            "sefs",
                            index,
                            "mobileNo",
                            e.target.value
                          )
                        }
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Email
                      </label>
                      <input
                        type="email"
                        value={sef.email}
                        onChange={(e) =>
                          handleArrayChange(
                            "sefs",
                            index,
                            "email",
                            e.target.value
                          )
                        }
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  {/* SEF Documents */}
                  <div className="mt-6 space-y-4">
                    <h4 className="text-md font-medium text-gray-900">
                      Documents for SEF {index + 1}
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Visa Copy
                        </label>
                        <input
                          type="file"
                          onChange={(e) =>
                            handlePersonDocChange(
                              "sefs",
                              index,
                              "visaCopy",
                              e.target.files[0]
                            )
                          }
                          className="mt-1 block w-full px-3 py-2"
                        />
                        {sefDocs[index]?.visaCopy ? (
                          <div className="mt-2 flex items-center text-sm text-gray-500">
                            <PaperClipIcon className="h-4 w-4 mr-1" />
                            <span className="truncate">
                              {sefDocs[index].visaCopy.name}
                            </span>
                          </div>
                        ) : sef.visaCopyUrl ? (
                          <div className="mt-2 flex items-center text-sm text-blue-600">
                            <PaperClipIcon className="h-4 w-4 mr-1" />
                            <a
                              href={sef.visaCopyUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="truncate hover:underline"
                            >
                              View existing document
                            </a>
                            <span className="ml-2 text-xs text-gray-500">
                              (Previous job)
                            </span>
                          </div>
                        ) : null}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          QID Document
                        </label>
                        <input
                          type="file"
                          onChange={(e) =>
                            handlePersonDocChange(
                              "sefs",
                              index,
                              "qidDoc",
                              e.target.files[0]
                            )
                          }
                          className="mt-1 block w-full px-3 py-2"
                        />
                        {sefDocs[index]?.qidDoc ? (
                          <div className="mt-2 flex items-center text-sm text-gray-500">
                            <PaperClipIcon className="h-4 w-4 mr-1" />
                            <span className="truncate">
                              {sefDocs[index].qidDoc.name}
                            </span>
                          </div>
                        ) : sef.qidDocUrl ? (
                          <div className="mt-2 flex items-center text-sm text-blue-600">
                            <PaperClipIcon className="h-4 w-4 mr-1" />
                            <a
                              href={sef.qidDocUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="truncate hover:underline"
                            >
                              View existing document
                            </a>
                            <span className="ml-2 text-xs text-gray-500">
                              (Previous job)
                            </span>
                          </div>
                        ) : null}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          National Address Document
                        </label>
                        <input
                          type="file"
                          onChange={(e) =>
                            handlePersonDocChange(
                              "sefs",
                              index,
                              "nationalAddressDoc",
                              e.target.files[0]
                            )
                          }
                          className="mt-1 block w-full px-3 py-2"
                        />
                        {sefDocs[index]?.nationalAddressDoc ? (
                          <div className="mt-2 flex items-center text-sm text-gray-500">
                            <PaperClipIcon className="h-4 w-4 mr-1" />
                            <span className="truncate">
                              {sefDocs[index].nationalAddressDoc.name}
                            </span>
                          </div>
                        ) : sef.nationalAddressDocUrl ? (
                          <div className="mt-2 flex items-center text-sm text-blue-600">
                            <PaperClipIcon className="h-4 w-4 mr-1" />
                            <a
                              href={sef.nationalAddressDocUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="truncate hover:underline"
                            >
                              View existing document
                            </a>
                            <span className="ml-2 text-xs text-gray-500">
                              (Previous job)
                            </span>
                          </div>
                        ) : null}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Passport Document
                        </label>
                        <input
                          type="file"
                          onChange={(e) =>
                            handlePersonDocChange(
                              "sefs",
                              index,
                              "passportDoc",
                              e.target.files[0]
                            )
                          }
                          className="mt-1 block w-full px-3 py-2"
                        />
                        {sefDocs[index]?.passportDoc ? (
                          <div className="mt-2 flex items-center text-sm text-gray-500">
                            <PaperClipIcon className="h-4 w-4 mr-1" />
                            <span className="truncate">
                              {sefDocs[index].passportDoc.name}
                            </span>
                          </div>
                        ) : sef.passportDocUrl ? (
                          <div className="mt-2 flex items-center text-sm text-blue-600">
                            <PaperClipIcon className="h-4 w-4 mr-1" />
                            <a
                              href={sef.passportDocUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="truncate hover:underline"
                            >
                              View existing document
                            </a>
                            <span className="ml-2 text-xs text-gray-500">
                              (Previous job)
                            </span>
                          </div>
                        ) : null}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          CV
                        </label>
                        <input
                          type="file"
                          onChange={(e) =>
                            handlePersonDocChange(
                              "sefs",
                              index,
                              "cv",
                              e.target.files[0]
                            )
                          }
                          className="mt-1 block w-full px-3 py-2"
                        />
                        {sefDocs[index]?.cv ? (
                          <div className="mt-2 flex items-center text-sm text-gray-500">
                            <PaperClipIcon className="h-4 w-4 mr-1" />
                            <span className="truncate">
                              {sefDocs[index].cv.name}
                            </span>
                          </div>
                        ) : sef.cvUrl ? (
                          <div className="mt-2 flex items-center text-sm text-blue-600">
                            <PaperClipIcon className="h-4 w-4 mr-1" />
                            <a
                              href={sef.cvUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="truncate hover:underline"
                            >
                              View existing document
                            </a>
                            <span className="ml-2 text-xs text-gray-500">
                              (Previous job)
                            </span>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* KYC Documents */}
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <DocumentTextIcon className="h-6 w-6 text-blue-600 mr-2" />
                <h2 className="text-xl font-semibold text-gray-900">
                  KYC Documents
                </h2>
              </div>
              <button
                type="button"
                onClick={addKycDocumentInfo}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <PlusCircleIcon className="h-5 w-5 mr-1" />
                Add Document Info
              </button>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700">
                Upload KYC Documents
              </label>
              <input
                type="file"
                onChange={(e) =>
                  handleFileChange({
                    target: {
                      name: "kycDocuments",
                      files: e.target.files,
                    },
                  })
                }
                className="mt-1 block w-full px-3 py-2"
                multiple
              />
              {files.kycDocuments.length > 0 && (
                <div className="mt-2 space-y-1">
                  {files.kycDocuments.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between text-sm text-gray-500 bg-gray-50 p-2 rounded-md"
                    >
                      <div className="flex items-center truncate">
                        <PaperClipIcon className="h-4 w-4 mr-1" />
                        <span className="truncate">{file.name}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile("kycDocuments", index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {formData.kycDocumentInfo.map((info, index) => (
              <div key={index} className="mt-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-900">
                    Document Info #{index + 1}
                  </h3>
                  {formData.kycDocumentInfo.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeKycDocumentInfo(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700">
                      Description
                    </label>
                    <input
                      type="text"
                      value={info.description}
                      onChange={(e) =>
                        handleKycInfoChange(
                          index,
                          "description",
                          e.target.value
                        )
                      }
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700">
                      Date
                    </label>
                    <input
                      type="date"
                      value={formatDateForInput(info.date)}
                      onChange={(e) =>
                        handleKycInfoChange(index, "date", e.target.value)
                      }
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* BRA Documents */}
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <DocumentTextIcon className="h-6 w-6 text-purple-600 mr-2" />
                <h2 className="text-xl font-semibold text-gray-900">
                  BRA Documents
                </h2>
              </div>
              <button
                type="button"
                onClick={addBraDocumentInfo}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
              >
                <PlusCircleIcon className="h-5 w-5 mr-1" />
                Add Document Info
              </button>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700">
                Upload BRA Documents
              </label>
              <input
                type="file"
                onChange={(e) =>
                  handleFileChange({
                    target: {
                      name: "braDocuments",
                      files: e.target.files,
                    },
                  })
                }
                className="mt-1 block w-full px-3 py-2"
                multiple
              />
              {files.braDocuments.length > 0 && (
                <div className="mt-2 space-y-1">
                  {files.braDocuments.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between text-sm text-gray-500 bg-gray-50 p-2 rounded-md"
                    >
                      <div className="flex items-center truncate">
                        <PaperClipIcon className="h-4 w-4 mr-1" />
                        <span className="truncate">{file.name}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile("braDocuments", index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {formData.braDocumentInfo.map((info, index) => (
              <div key={index} className="mt-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-900">
                    Document Info #{index + 1}
                  </h3>
                  {formData.braDocumentInfo.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeBraDocumentInfo(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700">
                      Description
                    </label>
                    <input
                      type="text"
                      value={info.description}
                      onChange={(e) =>
                        handleBraInfoChange(
                          index,
                          "description",
                          e.target.value
                        )
                      }
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700">
                      Date
                    </label>
                    <input
                      type="date"
                      value={formatDateForInput(info.date)}
                      onChange={(e) =>
                        handleBraInfoChange(index, "date", e.target.value)
                      }
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <motion.button
              type="submit"
              disabled={loading || jobNumberStatus.available === false}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white ${
                loading || jobNumberStatus.available === false
                  ? "bg-blue-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              }`}
            >
              {loading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircleIcon className="h-5 w-5 mr-2" />
                  Create Pre-Approved Job
                </>
              )}
            </motion.button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePreApprovedJob;