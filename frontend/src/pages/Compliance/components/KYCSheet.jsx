import React, { useState, useEffect } from 'react';
import {
  DocumentTextIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  PaperClipIcon,
  CalendarIcon,
  UserIcon,
  IdentificationIcon,
  BanknotesIcon,
  BuildingLibraryIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  ChevronDownIcon,
  UserGroupIcon,
  ClipboardDocumentCheckIcon,
  LockClosedIcon,
  CheckIcon,
  PencilIcon,
  PlusIcon,
  TrashIcon,
  ArrowPathIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion'; // eslint-disable-line no-unused-vars
import axios, { fileUploadInstance } from '../../../utils/axios';
import { toast } from 'react-toastify';

const KYCSheet = ({ client }) => {
  const [activeSection, setActiveSection] = useState('personal');
  const [kycApprovals, setKycApprovals] = useState([]);
  const [loadingKyc, setLoadingKyc] = useState(false);
  const [riskLevel, setRiskLevel] = useState(client?.riskLevel || 'Pending');
  const [updatingRiskLevel, setUpdatingRiskLevel] = useState(false);
  const [personDetailsDocuments, setPersonDetailsDocuments] = useState([]);

  const [uploadModal, setUploadModal] = useState({ open: false, jobId: null, personId: null, personType: null, documentType: null });
  const [replaceModal, setReplaceModal] = useState({ open: false, document: null, personId: null, documentType: null, jobId: null, documentIndex: null, kycStage: null });
  const [deleteModal, setDeleteModal] = useState({ open: false, document: null, personId: null, documentType: null, jobId: null, documentIndex: null });
  const [uploading, setUploading] = useState(false);
  const [jobPersons, setJobPersons] = useState({});
  const [generalKycDocuments, setGeneralKycDocuments] = useState({});

  const isOfficeFile = (url) => {
    if (!url) return false;
    const extension = url.toLowerCase().split('.').pop().split('?')[0];
    return ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(extension);
  };

  const isPublicUrl = (url) => {
    return url && (url.includes('cloudinary.com') || url.includes('res.cloudinary.com'));
  };

  const openDocument = (url, fileName) => {
    if (!url) {
      alert('Document not available');
      return;
    }

    if (isOfficeFile(url) && isPublicUrl(url)) {
      window.open(`https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(url)}`, '_blank');
    } else {
      window.open(url, '_blank');
    }
  };

  // Update risk level when client changes
  useEffect(() => {
    if (client?.riskLevel) {
      setRiskLevel(client.riskLevel);
    }
  }, [client?.riskLevel]);

  // Update person details documents when client changes
  useEffect(() => {
    if (client?.personDetailsDocuments) {
      setPersonDetailsDocuments(client.personDetailsDocuments);
    }
  }, [client?.personDetailsDocuments]);


  const updateRiskLevel = async (newRiskLevel) => {
    if (!client) return;

    try {
      setUpdatingRiskLevel(true);
      const clientEmail = client.email;

      const response = await axios.put(`/clients/${encodeURIComponent(clientEmail)}/risk-level`, {
        riskLevel: newRiskLevel
      });

      if (response.data.success !== false) {
        setRiskLevel(newRiskLevel);
        console.log('Risk level updated successfully');
      }
    } catch (error) {
      console.error('Error updating risk level:', error);
    } finally {
      setUpdatingRiskLevel(false);
    }
  };

  // Fetch KYC approval documents for all jobs
  useEffect(() => {
    const fetchKycDocuments = async () => {
      if (client?.jobs && Array.isArray(client.jobs)) {
        setLoadingKyc(true);
        const approvals = [];
        const generalDocs = {};

        console.log('Fetching KYC documents for jobs:', client.jobs.map(j => ({ id: j._id, number: j.jobNumber })));

        for (const job of client.jobs) {
          try {
            console.log(`Fetching KYC for job ${job._id}...`);
            const response = await axios.get(`/kyc/compliance/jobs/${job._id}/status`);
            console.log(`KYC response for job ${job._id}:`, response.data);

            if (response.data) {
              approvals.push({
                jobId: job._id,
                jobNumber: job.jobNumber,
                kycApproval: response.data
              });
            }
          } catch (error) {
            console.log(`No KYC approval found for job ${job._id}:`, error.message);
          }

          try {
            const generalDocsResponse = await axios.get(`/operations/jobs/${job._id}/kyc-documents`);
            if (generalDocsResponse.data && generalDocsResponse.data.documents) {
              console.log(`📄 COMPLIANCE PAGE - Job ${job.jobNumber}: Found ${generalDocsResponse.data.documents.length} general KYC documents`);
              console.log('📄 Documents:', generalDocsResponse.data.documents);
              generalDocs[job._id] = generalDocsResponse.data.documents;
            }
          } catch (error) {
            console.log(`No general KYC documents found for job ${job._id}:`, error.message);
          }
        }

        console.log('Total KYC approvals found:', approvals);
        console.log('General KYC documents found:', generalDocs);
        setKycApprovals(approvals);
        setGeneralKycDocuments(generalDocs);
        setLoadingKyc(false);
      }
    };
    
    fetchKycDocuments();
  }, [client]);
  
  // Initialize documents with actual client data if available
  const initializeDocuments = () => {
    const clientDocuments = [];
    let docId = 1;

    // Add KYC approval documents
    console.log('Processing KYC approvals:', kycApprovals);
    kycApprovals.forEach(approval => {
      const kyc = approval.kycApproval;
      console.log('Processing KYC approval:', kyc);

      // Only show the final CEO signed document (contains all signatures)
      if (kyc.ceoApproval?.document?.fileUrl) {
        console.log('Found CEO document (final signed):', kyc.ceoApproval.document);
        clientDocuments.push({
          id: docId++,
          name: kyc.ceoApproval.document.fileName || 'Signed KYC Document',
          status: 'verified',
          uploadDate: kyc.ceoApproval.document.uploadedAt ? new Date(kyc.ceoApproval.document.uploadedAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          verifiedBy: kyc.ceoApproval.approvedBy?.name || 'CEO',
          type: 'kyc',
          url: kyc.ceoApproval.document.fileUrl,
          jobNumber: approval.jobNumber,
          stage: 'Fully Signed'
        });
      }
    });

    // Always return actual documents only, no demo data
    console.log('KYC Documents found:', clientDocuments.length);

    return clientDocuments;
  };

  const [documents, setDocuments] = useState([]);

  // Update documents when client data or KYC approvals change
  useEffect(() => {
    if (!loadingKyc) {
      setDocuments(initializeDocuments());
    }
  }, [client, kycApprovals, loadingKyc]);

  const kycSections = [
    { id: 'personal', name: 'Personal Information', icon: UserIcon, progress: 100 },
    { id: 'identification', name: 'Identification', icon: IdentificationIcon, progress: 90 },
    { id: 'financial', name: 'Financial Information', icon: BanknotesIcon, progress: 75 },
    { id: 'business', name: 'Business Details', icon: BuildingLibraryIcon, progress: 60 }
  ];

  const getStatusIcon = (status) => {
    switch (status) {
      case 'verified':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'pending':
        return <ClockIcon className="h-5 w-5 text-yellow-500" />;
      case 'rejected':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status) => {
    const statusStyles = {
      verified: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      rejected: 'bg-red-100 text-red-800'
    };
    return statusStyles[status] || 'bg-gray-100 text-gray-800';
  };


  const handleViewDocument = (doc) => {
    const url = doc.fileUrl || doc.url;
    const fileName = doc.fileName || doc.name || '';
    openDocument(url, fileName);
  };

  const handleDownloadDocument = (doc) => {
    if (doc.fileUrl) {
      const link = document.createElement('a');
      link.href = doc.fileUrl;
      link.download = doc.name;
      link.click();
    } else if (doc.url) {
      const link = document.createElement('a');
      link.href = doc.url;
      link.download = doc.name;
      link.click();
    } else {
      alert('Document download not available');
    }
  };

  const getStageDisplayName = (stage) => {
    const stageNames = {
      lmro: "LMRO",
      dlmro: "DLMRO",
      ceo: "CEO",
    };
    return stageNames[stage] || stage.toUpperCase();
  };

  const getPersonTypeLabel = (personType) => {
    const labels = {
      director: "Director",
      shareholder: "Shareholder",
      secretary: "Secretary",
      sef: "SEF"
    };
    return labels[personType] || personType;
  };

  const getDocumentTypeLabel = (documentType) => {
    const labels = {
      passport: "Passport",
      qid: "QID",
      nationalAddress: "National Address",
      cv: "CV",
      other: "Document"
    };
    return labels[documentType] || "Document";
  };

  const refreshClientData = async () => {
    try {
      const clientEmail = client.email;
      const response = await axios.get(`/clients/compliance/${encodeURIComponent(clientEmail)}`);
      if (response.data && response.data.personDetailsDocuments) {
        setPersonDetailsDocuments(response.data.personDetailsDocuments);
      }
    } catch (error) {
      console.error('Error refreshing client data:', error);
    }
  };

  const fetchJobPersons = async (jobId) => {
    if (jobPersons[jobId]) return jobPersons[jobId];

    try {
      const personTypes = ['director', 'shareholder', 'secretary', 'sef'];
      const allPersons = [];

      for (const personType of personTypes) {
        try {
          const response = await axios.get(`/operations/jobs/${jobId}/person-details/${personType}`);
          if (response.data && Array.isArray(response.data) && response.data.length > 0) {
            response.data.forEach(person => {
              allPersons.push({
                ...person,
                personType
              });
            });
          }
        } catch (error) {
          console.log(`No ${personType} details found for job ${jobId}`);
        }
      }

      setJobPersons(prev => ({ ...prev, [jobId]: allPersons }));
      return allPersons;
    } catch (error) {
      console.error('Error fetching job persons:', error);
      return [];
    }
  };

  const handleUploadGeneralDocument = async (jobId, documentName, file, notes) => {
    if (!file) {
      toast.error('Please select a file');
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();

      formData.append('kycDocuments', file);
      const description = notes ? `${documentName} - ${notes}` : documentName;
      formData.append('description_0', description);
      formData.append('date_0', new Date().toISOString());

      await fileUploadInstance.put(
        `/operations/jobs/${jobId}/kyc-documents`,
        formData
      );

      toast.success('Document uploaded successfully');
      setUploadModal({ open: false, jobId: null, personId: null, personType: null, documentType: null });
      document.getElementById('uploadDocumentName').value = '';
      document.getElementById('uploadFile').value = '';
      document.getElementById('uploadNotes').value = '';

      const updatedResponse = await axios.get(`/operations/jobs/${jobId}/kyc-documents`);
      setGeneralKycDocuments(prev => ({
        ...prev,
        [jobId]: updatedResponse.data.documents || []
      }));
      await refreshClientData();
    } catch (error) {
      console.error('Error uploading document:', error);
      toast.error(error.response?.data?.message || 'Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  const handleUploadDocument = async (jobId, personId, personType, documentType, file) => {
    if (!file) {
      toast.error('Please select a file');
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();

      const fieldName = documentType === 'other' ? 'otherDocument_0' :
                       documentType === 'passport' ? 'passportDoc' :
                       documentType === 'qid' ? 'qidDoc' :
                       documentType === 'nationalAddress' ? 'nationalAddressDoc' :
                       documentType === 'cv' ? 'cv' : documentType;

      formData.append(fieldName, file);

      if (documentType === 'other') {
        const existingDocs = personDetailsDocuments.filter(
          doc => doc.personId === personId && doc.documentType === 'other'
        );
        const metadata = {
          existingDocs: existingDocs.map(doc => ({ fileUrl: doc.fileUrl, fileName: doc.fileName })),
          totalCount: existingDocs.length + 1
        };
        formData.append('otherDocumentsMetadata', JSON.stringify(metadata));
      }

      await fileUploadInstance.put(
        `/operations/jobs/${jobId}/person-details/${personType}/${personId}`,
        formData
      );

      toast.success('Document uploaded successfully');
      setUploadModal({ open: false, jobId: null, personId: null, personType: null, documentType: null });
      await refreshClientData();
    } catch (error) {
      console.error('Error uploading document:', error);
      toast.error('Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  const handleReplaceDocument = async (personId, jobId, personType, documentType, file) => {
    if (!file) {
      toast.error('Please select a file');
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();

      const fieldName = documentType === 'other' ? 'otherDocument_0' :
                       documentType === 'passport' ? 'passportDoc' :
                       documentType === 'qid' ? 'qidDoc' :
                       documentType === 'nationalAddress' ? 'nationalAddressDoc' :
                       documentType === 'cv' ? 'cv' : documentType;

      formData.append(fieldName, file);

      if (documentType === 'other') {
        const existingDocs = personDetailsDocuments.filter(
          doc => doc.jobId === jobId && doc.documentType === 'other'
        );
        const metadata = {
          existingDocs: existingDocs.map(doc => ({ fileUrl: doc.fileUrl, fileName: doc.fileName })),
          totalCount: existingDocs.length
        };
        formData.append('otherDocumentsMetadata', JSON.stringify(metadata));
      }

      await fileUploadInstance.put(
        `/operations/jobs/${jobId}/person-details/${personType}/${personId}`,
        formData
      );

      toast.success('Document replaced successfully');
      setReplaceModal({ open: false, document: null, personId: null, documentType: null, jobId: null, documentIndex: null, kycStage: null });
      await refreshClientData();
    } catch (error) {
      console.error('Error replacing document:', error);
      toast.error('Failed to replace document');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDocument = async (personId, jobId, personType, documentType) => {
    try {
      setUploading(true);
      const formData = new FormData();

      const fieldName = documentType === 'passport' ? 'passportDoc' :
                       documentType === 'qid' ? 'qidDoc' :
                       documentType === 'nationalAddress' ? 'nationalAddressDoc' :
                       documentType === 'cv' ? 'cv' : null;

      if (fieldName) {
        formData.append(fieldName, '');
      }

      await fileUploadInstance.put(
        `/operations/jobs/${jobId}/person-details/${personType}/${personId}`,
        formData
      );

      toast.success('Document deleted successfully');
      setDeleteModal({ open: false, document: null, personId: null, documentType: null });
      await refreshClientData();
    } catch (error) {
      console.error('Error deleting document:', error);
      toast.error('Failed to delete document');
    } finally {
      setUploading(false);
    }
  };

  const handleReplaceGeneralDocument = async (jobId, documentIndex, file, documentName, notes) => {
    try {
      setUploading(true);

      const formData = new FormData();
      if (file) {
        formData.append('kycDocument', file);
      }
      formData.append('documentName', documentName);
      if (notes) {
        formData.append('notes', notes);
      }

      await fileUploadInstance.put(
        `/operations/jobs/${jobId}/kyc-documents/${documentIndex}/replace`,
        formData
      );

      toast.success('Document replaced successfully');
      setReplaceModal({ open: false, document: null, jobId: null, documentIndex: null });

      const fileInput = document.getElementById('replaceFile');
      if (fileInput) fileInput.value = '';
      const docNameInput = document.getElementById('replaceDocumentName');
      if (docNameInput) docNameInput.value = '';
      const notesInput = document.getElementById('replaceNotes');
      if (notesInput) notesInput.value = '';

      const updatedResponse = await axios.get(`/operations/jobs/${jobId}/kyc-documents`);
      setGeneralKycDocuments(prev => ({
        ...prev,
        [jobId]: updatedResponse.data.documents || []
      }));
    } catch (error) {
      console.error('Error replacing document:', error);
      toast.error(error.response?.data?.message || 'Failed to replace document');
    } finally {
      setUploading(false);
    }
  };

  const handleReplaceKycApprovalDocument = async (jobId, kycStage, file) => {
    if (!file) {
      toast.error('Please select a file');
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('document', file);

      await fileUploadInstance.put(
        `/kyc/compliance/jobs/${jobId}/documents/${kycStage}/update`,
        formData
      );

      toast.success('KYC approval document replaced successfully');
      setReplaceModal({ open: false, document: null, jobId: null, kycStage: null, documentType: null });

      const fileInput = document.getElementById('replaceFile');
      if (fileInput) fileInput.value = '';

      await refreshClientData();

      const updatedKycResponse = await axios.get(`/kyc/compliance/jobs/${jobId}/status`);
      if (updatedKycResponse.data) {
        setKycApprovals(prev => prev.map(approval =>
          approval.jobId === jobId
            ? { ...approval, kycApproval: updatedKycResponse.data }
            : approval
        ));
      }
    } catch (error) {
      console.error('Error replacing KYC approval document:', error);
      toast.error(error.response?.data?.message || 'Failed to replace KYC approval document');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteGeneralDocument = async (jobId, documentIndex) => {
    try {
      setUploading(true);
      const response = await axios.get(`/operations/jobs/${jobId}/kyc-documents`);
      const existingDocs = response.data.documents || [];

      const updatedDocs = existingDocs.filter((_, index) => index !== documentIndex);

      await axios.put(
        `/operations/jobs/${jobId}/kyc-documents`,
        { documents: updatedDocs }
      );

      toast.success('Document deleted successfully');
      setDeleteModal({ open: false, document: null, jobId: null, documentIndex: null });

      const updatedResponse = await axios.get(`/operations/jobs/${jobId}/kyc-documents`);
      setGeneralKycDocuments(prev => ({
        ...prev,
        [jobId]: updatedResponse.data.documents || []
      }));
    } catch (error) {
      console.error('Error deleting document:', error);
      toast.error(error.response?.data?.message || 'Failed to delete document');
    } finally {
      setUploading(false);
    }
  };

  const renderGeneralKycDocuments = (jobId) => {
    const jobDocs = generalKycDocuments[jobId] || [];

    return (
      <div className="mt-4 space-y-2">
        <div className="flex items-center justify-between mb-2">
          <h5 className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
            General KYC Documents
          </h5>
          <button
            onClick={() => {
              setUploadModal({ open: true, jobId, personId: null, personType: null, documentType: null });
            }}
            className="inline-flex items-center text-xs text-green-600 hover:text-green-800 bg-white rounded-md px-2 py-1 border border-green-200 hover:shadow-sm transition-all"
          >
            <PlusIcon className="h-3.5 w-3.5 mr-1" />
            Upload Document
          </button>
        </div>
        {jobDocs.length === 0 ? (
          <div className="text-center py-4 bg-gray-50 rounded-lg border border-gray-200">
            <DocumentTextIcon className="h-6 w-6 text-gray-400 mx-auto mb-1" />
            <p className="text-xs text-gray-500">No general KYC documents uploaded yet.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {jobDocs.map((doc, index) => (
              <div
                key={index}
                className="group bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-3 transition-all duration-200 hover:shadow-md border border-blue-200"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start flex-1">
                    <div className="flex-shrink-0">
                      <span className="flex h-8 w-8 items-center justify-center rounded-md bg-white text-blue-600 shadow-sm">
                        <DocumentTextIcon className="h-4 w-4" />
                      </span>
                    </div>
                    <div className="ml-3 flex-1 min-w-0">
                      <h6 className="text-sm font-medium text-blue-900 truncate">
                        {doc.description || 'KYC Document'}
                      </h6>
                      <div className="mt-1 space-y-1">
                        {doc.date && (
                          <p className="text-xs text-gray-600">
                            <CalendarIcon className="h-3 w-3 inline mr-1" />
                            {new Date(doc.date).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </p>
                        )}
                      </div>
                      <div className="mt-2 flex gap-2">
                        <button
                          onClick={() => openDocument(doc.file, doc.description || doc.fileName)}
                          className="inline-flex items-center text-xs text-blue-600 hover:text-blue-800 bg-white rounded-md px-2 py-1 border border-blue-200 hover:shadow-sm transition-all"
                        >
                          <EyeIcon className="h-3.5 w-3.5 mr-1" />
                          View
                        </button>
                        <button
                          onClick={() => setReplaceModal({ open: true, document: doc, jobId, documentIndex: index })}
                          className="inline-flex items-center text-xs text-green-600 hover:text-green-800 bg-white rounded-md px-2 py-1 border border-green-200 hover:shadow-sm transition-all"
                        >
                          <ArrowPathIcon className="h-3.5 w-3.5 mr-1" />
                          Replace
                        </button>
                        <button
                          onClick={() => setDeleteModal({ open: true, document: doc, jobId, documentIndex: index })}
                          className="inline-flex items-center text-xs text-red-600 hover:text-red-800 bg-white rounded-md px-2 py-1 border border-red-200 hover:shadow-sm transition-all"
                        >
                          <TrashIcon className="h-3.5 w-3.5 mr-1" />
                          Delete
                        </button>
                      </div>
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

  const renderPersonDetailsDocuments = (jobId) => {
    const jobDocs = personDetailsDocuments.filter(doc => doc.jobId === jobId);

    return (
      <div className="mt-4 space-y-2">
        <div className="flex items-center justify-between mb-2">
          <h5 className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
            Person Details Documents
          </h5>
        </div>
        {jobDocs.length === 0 ? (
          <div className="text-center py-4 bg-gray-50 rounded-lg border border-gray-200">
            <DocumentTextIcon className="h-6 w-6 text-gray-400 mx-auto mb-1" />
            <p className="text-xs text-gray-500">No person details documents uploaded yet.</p>
          </div>
        ) : (
          <div className="space-y-2">
          {jobDocs.map((doc, index) => (
            <div
              key={index}
              className="group bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-3 transition-all duration-200 hover:shadow-md border border-purple-200"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start flex-1">
                  <div className="flex-shrink-0">
                    <span className="flex h-8 w-8 items-center justify-center rounded-md bg-white text-purple-600 shadow-sm">
                      <DocumentTextIcon className="h-4 w-4" />
                    </span>
                  </div>
                  <div className="ml-3 flex-1 min-w-0">
                    <h6 className="text-sm font-medium text-purple-900 truncate">
                      {doc.fileName}
                    </h6>
                    <div className="mt-1 space-y-1">
                      <p className="text-xs text-gray-600">
                        <span className="font-medium">{getPersonTypeLabel(doc.personType)}:</span> {doc.personName}
                      </p>
                      <p className="text-xs text-gray-600">
                        <span className="font-medium">Type:</span> {getDocumentTypeLabel(doc.documentType)}
                      </p>
                      {doc.uploadedAt && (
                        <p className="text-xs text-gray-600">
                          <CalendarIcon className="h-3 w-3 inline mr-1" />
                          {new Date(doc.uploadedAt).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </p>
                      )}
                    </div>
                    <div className="mt-2 flex gap-2">
                      <button
                        onClick={() => openDocument(doc.fileUrl, doc.fileName)}
                        className="inline-flex items-center text-xs text-purple-600 hover:text-purple-800 bg-white rounded-md px-2 py-1 border border-purple-200 hover:shadow-sm transition-all"
                      >
                        <EyeIcon className="h-3.5 w-3.5 mr-1" />
                        View
                      </button>
                      <button
                        onClick={() => setReplaceModal({ open: true, document: doc, personId: doc.personId, documentType: doc.documentType })}
                        className="inline-flex items-center text-xs text-blue-600 hover:text-blue-800 bg-white rounded-md px-2 py-1 border border-blue-200 hover:shadow-sm transition-all"
                      >
                        <ArrowPathIcon className="h-3.5 w-3.5 mr-1" />
                        Replace
                      </button>
                      <button
                        onClick={() => setDeleteModal({ open: true, document: doc, personId: doc.personId, documentType: doc.documentType })}
                        className="inline-flex items-center text-xs text-red-600 hover:text-red-800 bg-white rounded-md px-2 py-1 border border-red-200 hover:shadow-sm transition-all"
                      >
                        <TrashIcon className="h-3.5 w-3.5 mr-1" />
                        Delete
                      </button>
                    </div>
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

  const renderKycDocumentSection = (kycData, jobId) => {
    if (!kycData) return null;

    const documents = [];

    const createDocumentInfo = (stage, approval) => {
      if (!approval?.document?.fileUrl) return null;

      return {
        stage,
        stageLabel: getStageDisplayName(stage),
        document: approval.document,
        approval: approval,
      };
    };

    // Only show the final CEO signed document (contains all signatures)
    if (kycData.ceoApproval?.document?.fileUrl) {
      documents.push(createDocumentInfo("ceo", kycData.ceoApproval));
    }

    if (documents.length === 0) {
      return (
        <div className="text-center py-6 bg-gray-50/80 rounded-lg border border-gray-200">
          <DocumentTextIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-500">
            No KYC approval documents have been uploaded yet.
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {documents.map((doc) => {
          const stageColors = {
            lmro: {
              bg: "bg-blue-50",
              border: "border-blue-200",
              text: "text-blue-800",
              icon: "text-blue-600",
            },
            dlmro: {
              bg: "bg-purple-50",
              border: "border-purple-200",
              text: "text-purple-800",
              icon: "text-purple-600",
            },
            ceo: {
              bg: "bg-indigo-50",
              border: "border-indigo-200",
              text: "text-indigo-800",
              icon: "text-indigo-600",
            },
          };
          const colors = stageColors[doc.stage];

          return (
            <div
              key={doc.stage}
              className={`group relative ${colors.bg} rounded-lg p-4 transition-all duration-200 hover:shadow-md ${colors.border}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start flex-1">
                  <div className="flex-shrink-0">
                    <span
                      className={`flex h-10 w-10 items-center justify-center rounded-md bg-white ${colors.icon} shadow-sm`}
                    >
                      {doc.stage === "lmro" && (
                        <UserGroupIcon className="h-5 w-5" />
                      )}
                      {doc.stage === "dlmro" && (
                        <ClipboardDocumentCheckIcon className="h-5 w-5" />
                      )}
                      {doc.stage === "ceo" && (
                        <LockClosedIcon className="h-5 w-5" />
                      )}
                    </span>
                  </div>
                  <div className="ml-4 flex-1">
                    <h6 className={`text-sm font-medium ${colors.text}`}>
                      {doc.stageLabel} Document
                    </h6>
                    <p className={`mt-1 text-xs flex items-center flex-wrap gap-2`}>
                      <span className="flex items-center">
                        <DocumentTextIcon className="h-3 w-3 mr-1" />
                        {doc.document.fileName || "Document"}
                      </span>
                      <span className="mx-1">•</span>
                      {doc.approval.approved ? (
                        <span className="inline-flex items-center text-green-700">
                          <CheckIcon className="h-3 w-3 mr-0.5" /> Approved
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-yellow-700">
                          <ClockIcon className="h-3 w-3 mr-0.5" /> Pending
                        </span>
                      )}
                    </p>

                    <div className="mt-2 space-y-1">
                      {doc.document.uploadedBy && (
                        <p className="text-xs text-gray-600">
                          <UserIcon className="h-3 w-3 inline mr-1" />
                          Uploaded by:{" "}
                          <span className="font-medium">
                            {doc.document.uploadedBy.name || "Unknown User"}
                          </span>
                        </p>
                      )}
                      {doc.document.uploadedAt && (
                        <p className="text-xs text-gray-600">
                          <CalendarIcon className="h-3 w-3 inline mr-1" />
                          Uploaded:{" "}
                          {new Date(doc.document.uploadedAt).toLocaleDateString(
                            "en-US",
                            {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )}
                        </p>
                      )}
                    </div>

                    <div className="mt-3 flex items-center gap-2">
                      <button
                        onClick={() => openDocument(doc.document.fileUrl, doc.document.fileName)}
                        className={`inline-flex items-center text-xs ${colors.icon} hover:opacity-80 bg-white rounded-md px-2 py-1 ${colors.border} hover:shadow-sm transition-all`}
                      >
                        <EyeIcon className="h-3.5 w-3.5 mr-1" />
                        View
                      </button>
                      <a
                        href={doc.document.fileUrl}
                        download
                        className={`inline-flex items-center text-xs ${colors.icon} hover:opacity-80 bg-white rounded-md px-2 py-1 ${colors.border} hover:shadow-sm transition-all`}
                      >
                        <ArrowDownTrayIcon className="h-3.5 w-3.5 mr-1" />
                        Download
                      </a>
                      <button
                        onClick={() => setReplaceModal({
                          open: true,
                          document: doc.document,
                          jobId,
                          kycStage: doc.stage,
                          documentType: 'kycApproval'
                        })}
                        className={`inline-flex items-center text-xs text-green-600 hover:text-green-800 bg-white rounded-md px-2 py-1 border border-green-200 hover:shadow-sm transition-all`}
                      >
                        <ArrowPathIcon className="h-3.5 w-3.5 mr-1" />
                        Replace
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-xl p-6"
      >
        <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
          <DocumentTextIcon className="h-8 w-8 mr-3 text-blue-600" />
          KYC Verification Sheet
        </h2>


        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Client Information</h3>

            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Client Name:</span>
                <span className="font-medium">{client?.name || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Email:</span>
                <span className="font-medium">{client?.email || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Phone:</span>
                <span className="font-medium">{client?.phone || client?.contactNumber || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Address:</span>
                <span className="font-medium">{client?.address || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Starting Point:</span>
                <span className="font-medium">{client?.startingPoint || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">CR Number:</span>
                <span className="font-medium">{client?.crNo || 'N/A'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Risk Level:</span>
                <div className="relative">
                  <select
                    value={riskLevel}
                    onChange={(e) => updateRiskLevel(e.target.value)}
                    disabled={updatingRiskLevel}
                    className={`px-3 py-1 rounded-full text-xs font-semibold border-none outline-none cursor-pointer pr-6 ${
                      riskLevel === 'High' ? 'bg-red-100 text-red-800' :
                      riskLevel === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                      riskLevel === 'Low' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    } ${updatingRiskLevel ? 'opacity-50' : ''}`}
                    style={{ appearance: 'none' }}
                  >
                    <option value="Pending" className="bg-white text-gray-900">Pending</option>
                    <option value="Low" className="bg-white text-gray-900">Low Risk</option>
                    <option value="Medium" className="bg-white text-gray-900">Medium Risk</option>
                    <option value="High" className="bg-white text-gray-900">High Risk</option>
                  </select>
                  <ChevronDownIcon className="h-3 w-3 absolute right-1 top-1/2 transform -translate-y-1/2 text-gray-600 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                <DocumentTextIcon className="h-5 w-5 mr-2 text-blue-600" />
                KYC Documents
              </h3>
            </div>

            <div className="space-y-4">
              {kycApprovals.length > 0 ? (
                kycApprovals.map((approval) => (
                  <div key={approval.jobId} className="border border-gray-200 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">
                      Job: {approval.jobNumber || approval.jobId}
                    </h4>
                    {renderKycDocumentSection(approval.kycApproval, approval.jobId)}
                    {renderGeneralKycDocuments(approval.jobId)}
                  </div>
                ))
              ) : Object.keys(generalKycDocuments).length > 0 ? (
                client?.jobs?.map((job) => {
                  const hasGeneralDocs = generalKycDocuments[job._id] && generalKycDocuments[job._id].length > 0;
                  if (!hasGeneralDocs) return null;
                  return (
                    <div key={job._id} className="border border-gray-200 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-3">
                        Job: {job.jobNumber || job._id}
                      </h4>
                      <div className="text-center py-6 bg-gray-50/80 rounded-lg border border-gray-200 mb-4">
                        <DocumentTextIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">
                          No KYC approval documents have been uploaded yet.
                        </p>
                      </div>
                      {renderGeneralKycDocuments(job._id)}
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-6 bg-gray-50/80 rounded-lg border border-gray-200">
                  <DocumentTextIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">
                    {loadingKyc ? 'Loading KYC documents...' : 'No KYC documents found for this client.'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

      </motion.div>

      <AnimatePresence>
        {uploadModal.open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => {
              setUploadModal({ open: false, jobId: null, personId: null, personType: null, documentType: null });
              document.getElementById('uploadDocumentName').value = '';
              document.getElementById('uploadFile').value = '';
              document.getElementById('uploadNotes').value = '';
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-lg p-6 max-w-lg w-full shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Upload New Document</h3>
                <button
                  onClick={() => {
                    setUploadModal({ open: false, jobId: null, personId: null, personType: null, documentType: null });
                    document.getElementById('uploadDocumentName').value = '';
                    document.getElementById('uploadFile').value = '';
                    document.getElementById('uploadNotes').value = '';
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Document Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="uploadDocumentName"
                    placeholder="Enter document name..."
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 text-sm px-3 py-2 border"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Document
                  </label>
                  <input
                    type="file"
                    id="uploadFile"
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes (Optional)
                  </label>
                  <textarea
                    id="uploadNotes"
                    rows="3"
                    placeholder="Add any notes or description..."
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 text-sm px-3 py-2 border resize-none"
                  ></textarea>
                </div>
              </div>

              <div className="flex gap-3 justify-end mt-6">
                <button
                  onClick={() => {
                    setUploadModal({ open: false, jobId: null, personId: null, personType: null, documentType: null });
                    document.getElementById('uploadDocumentName').value = '';
                    document.getElementById('uploadFile').value = '';
                    document.getElementById('uploadNotes').value = '';
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                  disabled={uploading}
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    const documentNameInput = document.getElementById('uploadDocumentName');
                    const fileInput = document.getElementById('uploadFile');
                    const notesInput = document.getElementById('uploadNotes');

                    const documentName = documentNameInput.value.trim();
                    const file = fileInput.files[0];
                    const notes = notesInput.value.trim();

                    if (!documentName) {
                      toast.error('Please enter document name');
                      return;
                    }

                    if (!file) {
                      toast.error('Please select a file');
                      return;
                    }

                    handleUploadGeneralDocument(uploadModal.jobId, documentName, file, notes);
                  }}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50"
                  disabled={uploading}
                >
                  {uploading ? 'Uploading...' : 'Upload'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {replaceModal.open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => {
              setReplaceModal({ open: false, document: null, personId: null, documentType: null, jobId: null, documentIndex: null, kycStage: null });
              const fileInput = document.getElementById('replaceFile');
              if (fileInput) fileInput.value = '';
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Replace Document</h3>
                <button
                  onClick={() => {
              setReplaceModal({ open: false, document: null, personId: null, documentType: null, jobId: null, documentIndex: null, kycStage: null });
              const fileInput = document.getElementById('replaceFile');
              if (fileInput) fileInput.value = '';
            }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">Current Document:</p>
                <div className="flex items-center justify-between bg-gray-50 p-3 rounded-md">
                  <p className="text-sm font-medium text-gray-900">
                    {replaceModal.document?.fileName || replaceModal.document?.description || 'Document'}
                  </p>
                  {(replaceModal.document?.file || replaceModal.document?.fileUrl) && (
                    <button
                      onClick={() => openDocument(
                        replaceModal.document?.file || replaceModal.document?.fileUrl,
                        replaceModal.document?.fileName || replaceModal.document?.description
                      )}
                      className="inline-flex items-center text-xs text-blue-600 hover:text-blue-800 bg-white rounded-md px-2 py-1 border border-blue-200 hover:shadow-sm transition-all"
                    >
                      <EyeIcon className="h-3.5 w-3.5 mr-1" />
                      View
                    </button>
                  )}
                </div>
              </div>

              {replaceModal.jobId !== null && replaceModal.documentIndex !== null && (
                <>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Document Name <span className="text-gray-500 text-xs font-normal">(You can edit this)</span>
                    </label>
                    <input
                      type="text"
                      id="replaceDocumentName"
                      defaultValue={replaceModal.document?.description || ''}
                      placeholder="Enter new document name or keep existing..."
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 text-sm px-3 py-2 border"
                    />
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select New Document <span className="text-gray-500 text-xs font-normal">(Optional - leave empty to keep current file)</span>
                    </label>
                    <input
                      type="file"
                      id="replaceFile"
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    />
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Notes (Optional)
                    </label>
                    <textarea
                      id="replaceNotes"
                      rows="3"
                      placeholder="Add any notes or description..."
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 text-sm px-3 py-2 border resize-none"
                    ></textarea>
                  </div>
                </>
              )}

              {replaceModal.personId && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select New Document
                  </label>
                  <input
                    type="file"
                    id="replaceFile"
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  />
                </div>
              )}

              {replaceModal.documentType === 'kycApproval' && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select New Document <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="file"
                    id="replaceFile"
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  />
                </div>
              )}

              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setReplaceModal({ open: false, document: null, personId: null, documentType: null, jobId: null, documentIndex: null, kycStage: null });
                    const fileInput = document.getElementById('replaceFile');
                    if (fileInput) fileInput.value = '';
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                  disabled={uploading}
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    const fileInput = document.getElementById('replaceFile');
                    const file = fileInput.files[0];

                    if (replaceModal.documentType === 'kycApproval') {
                      if (!file) {
                        toast.error('Please select a file');
                        return;
                      }
                      handleReplaceKycApprovalDocument(
                        replaceModal.jobId,
                        replaceModal.kycStage,
                        file
                      );
                    } else if (replaceModal.jobId !== null && replaceModal.documentIndex !== null) {
                      const documentNameInput = document.getElementById('replaceDocumentName');
                      const notesInput = document.getElementById('replaceNotes');
                      const documentName = documentNameInput.value.trim();
                      const notes = notesInput.value.trim();

                      if (!documentName) {
                        toast.error('Please enter document name');
                        return;
                      }

                      handleReplaceGeneralDocument(
                        replaceModal.jobId,
                        replaceModal.documentIndex,
                        file,
                        documentName,
                        notes
                      );
                    } else if (replaceModal.personId) {
                      if (!file) {
                        toast.error('Please select a file');
                        return;
                      }
                      handleReplaceDocument(
                        replaceModal.personId,
                        replaceModal.document.jobId,
                        replaceModal.document.personType,
                        replaceModal.documentType,
                        file
                      );
                    }
                  }}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
                  disabled={uploading}
                >
                  {uploading ? 'Updating...' : 'Update'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deleteModal.open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setDeleteModal({ open: false, document: null, personId: null, documentType: null, jobId: null, documentIndex: null })}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <TrashIcon className="h-5 w-5 text-red-500 mr-2" />
                  Delete Document
                </h3>
                <button
                  onClick={() => setDeleteModal({ open: false, document: null, personId: null, documentType: null, jobId: null, documentIndex: null })}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="mb-6">
                <p className="text-sm text-gray-600 mb-2">Are you sure you want to delete this document?</p>
                <p className="text-sm font-medium text-gray-900 bg-gray-50 p-3 rounded-md">
                  {deleteModal.document?.fileName || deleteModal.document?.description || 'Document'}
                </p>
                <p className="text-sm text-red-600 mt-2">This action cannot be undone.</p>
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setDeleteModal({ open: false, document: null, personId: null, documentType: null, jobId: null, documentIndex: null })}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                  disabled={uploading}
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (deleteModal.jobId !== null && deleteModal.documentIndex !== null) {
                      handleDeleteGeneralDocument(deleteModal.jobId, deleteModal.documentIndex);
                    } else if (deleteModal.personId) {
                      handleDeleteDocument(
                        deleteModal.personId,
                        deleteModal.document.jobId,
                        deleteModal.document.personType,
                        deleteModal.documentType
                      );
                    }
                  }}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50"
                  disabled={uploading}
                >
                  {uploading ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default KYCSheet;