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

const BRASheet = ({ client }) => {
  const [activeSection, setActiveSection] = useState('personal');
  const [braApprovals, setBraApprovals] = useState([]);
  const [loadingBra, setLoadingBra] = useState(false);
  const [riskLevel, setRiskLevel] = useState(client?.riskLevel || 'Medium');
  const [updatingRiskLevel, setUpdatingRiskLevel] = useState(false);

  const [uploadModal, setUploadModal] = useState({ open: false, jobId: null });
  const [replaceModal, setReplaceModal] = useState({ open: false, document: null, jobId: null, documentIndex: null, braStage: null });
  const [deleteModal, setDeleteModal] = useState({ open: false, document: null, jobId: null, documentIndex: null });
  const [uploading, setUploading] = useState(false);
  const [generalBraDocuments, setGeneralBraDocuments] = useState({});

  const isOfficeFile = (url) => {
    if (!url) return false;
    const extension = url.toLowerCase().split('.').pop().split('?')[0];
    return ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(extension);
  };

  const isPublicUrl = (url) => {
    return url && (url.includes('cloudinary.com') || url.includes('res.cloudinary.com'));
  };

  const openDocument = (url, fileName) => {
    console.log('Opening document:', { url, fileName });
    if (!url) {
      alert('Document not available');
      return;
    }

    if (isOfficeFile(url) && isPublicUrl(url)) {
      const viewerUrl = `https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(url)}`;
      console.log('Opening in Office Viewer:', viewerUrl);
      window.open(viewerUrl, '_blank');
    } else {
      console.log('Opening directly:', url);
      window.open(url, '_blank');
    }
  };

  useEffect(() => {
    if (client?.riskLevel) {
      setRiskLevel(client.riskLevel);
    }
  }, [client?.riskLevel]);


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

  useEffect(() => {
    const fetchBraDocuments = async () => {
      if (client?.jobs && Array.isArray(client.jobs)) {
        setLoadingBra(true);
        const approvals = [];
        const generalDocs = {};

        console.log('Fetching BRA documents for jobs:', client.jobs.map(j => ({ id: j._id, number: j.jobNumber })));

        for (const job of client.jobs) {
          try {
            console.log(`Fetching BRA for job ${job._id}...`);
            const response = await axios.get(`/bra/compliance/jobs/${job._id}/status`);
            console.log(`BRA response for job ${job._id}:`, response.data);

            if (response.data) {
              approvals.push({
                jobId: job._id,
                jobNumber: job.jobNumber,
                braApproval: response.data
              });
            }
          } catch (error) {
            console.log(`No BRA approval found for job ${job._id}:`, error.message);
          }

          try {
            const generalDocsResponse = await axios.get(`/operations/jobs/${job._id}/bra-documents`);
            if (generalDocsResponse.data && generalDocsResponse.data.documents) {
              console.log(`📄 COMPLIANCE PAGE - Job ${job.jobNumber}: Found ${generalDocsResponse.data.documents.length} general BRA documents`);
              console.log('📄 Documents:', generalDocsResponse.data.documents);
              generalDocs[job._id] = generalDocsResponse.data.documents;
            }
          } catch (error) {
            console.log(`No general BRA documents found for job ${job._id}:`, error.message);
          }
        }

        console.log('Total BRA approvals found:', approvals);
        console.log('General BRA documents found:', generalDocs);
        setBraApprovals(approvals);
        setGeneralBraDocuments(generalDocs);
        setLoadingBra(false);
      }
    };

    fetchBraDocuments();
  }, [client]);

  const initializeDocuments = () => {
    const clientDocuments = [];
    let docId = 1;

    console.log('Processing BRA approvals:', braApprovals);
    braApprovals.forEach(approval => {
      const bra = approval.braApproval;
      console.log('Processing BRA approval:', bra);

      if (bra.lmroApproval?.document?.fileUrl) {
        console.log('Found LMRO document:', bra.lmroApproval.document);
        clientDocuments.push({
          id: docId++,
          name: bra.lmroApproval.document.fileName || 'LMRO BRA Document',
          status: 'verified',
          uploadDate: bra.lmroApproval.document.uploadedAt ? new Date(bra.lmroApproval.document.uploadedAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          verifiedBy: bra.lmroApproval.approvedBy?.name || 'LMRO',
          type: 'bra',
          url: bra.lmroApproval.document.fileUrl,
          jobNumber: approval.jobNumber,
          stage: 'LMRO Approval'
        });
      }

      if (bra.dlmroApproval?.document?.fileUrl) {
        console.log('Found DLMRO document:', bra.dlmroApproval.document);
        clientDocuments.push({
          id: docId++,
          name: bra.dlmroApproval.document.fileName || 'DLMRO BRA Document',
          status: 'verified',
          uploadDate: bra.dlmroApproval.document.uploadedAt ? new Date(bra.dlmroApproval.document.uploadedAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          verifiedBy: bra.dlmroApproval.approvedBy?.name || 'DLMRO',
          type: 'bra',
          url: bra.dlmroApproval.document.fileUrl,
          jobNumber: approval.jobNumber,
          stage: 'DLMRO Approval'
        });
      }

      if (bra.ceoApproval?.document?.fileUrl) {
        console.log('Found CEO document:', bra.ceoApproval.document);
        clientDocuments.push({
          id: docId++,
          name: bra.ceoApproval.document.fileName || 'CEO BRA Document',
          status: 'verified',
          uploadDate: bra.ceoApproval.document.uploadedAt ? new Date(bra.ceoApproval.document.uploadedAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          verifiedBy: bra.ceoApproval.approvedBy?.name || 'CEO',
          type: 'bra',
          url: bra.ceoApproval.document.fileUrl,
          jobNumber: approval.jobNumber,
          stage: 'CEO Approval'
        });
      }
    });

    console.log('BRA Documents found:', clientDocuments.length);

    return clientDocuments;
  };

  const [documents, setDocuments] = useState([]);

  useEffect(() => {
    if (!loadingBra) {
      setDocuments(initializeDocuments());
    }
  }, [client, braApprovals, loadingBra]);

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

  const handleUploadGeneralDocument = async (jobId, documentName, file, notes) => {
    if (!file) {
      toast.error('Please select a file');
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();

      formData.append('braDocuments', file);
      const description = notes ? `${documentName} - ${notes}` : documentName;
      formData.append('braDocumentDescriptions', JSON.stringify([description]));
      formData.append('braDocumentTypes', JSON.stringify(['BRA Document']));

      await fileUploadInstance.post(
        `/operations/jobs/${jobId}/bra-documents`,
        formData
      );

      toast.success('Document uploaded successfully');
      setUploadModal({ open: false, jobId: null });
      document.getElementById('uploadDocumentName').value = '';
      document.getElementById('uploadFile').value = '';
      document.getElementById('uploadNotes').value = '';

      const updatedResponse = await axios.get(`/operations/jobs/${jobId}/bra-documents`);
      setGeneralBraDocuments(prev => ({
        ...prev,
        [jobId]: updatedResponse.data.documents || []
      }));
    } catch (error) {
      console.error('Error uploading document:', error);
      toast.error(error.response?.data?.message || 'Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  const handleReplaceGeneralDocument = async (jobId, documentIndex, file, documentName, notes) => {
    try {
      setUploading(true);

      const formData = new FormData();
      if (file) {
        formData.append('braDocument', file);
      }
      formData.append('documentName', documentName);
      if (notes) {
        formData.append('notes', notes);
      }

      await fileUploadInstance.put(
        `/operations/jobs/${jobId}/bra-documents/${documentIndex}/replace`,
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

      const updatedResponse = await axios.get(`/operations/jobs/${jobId}/bra-documents`);
      setGeneralBraDocuments(prev => ({
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

  const handleReplaceBraApprovalDocument = async (jobId, braStage, file) => {
    if (!file) {
      toast.error('Please select a file');
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('document', file);

      await fileUploadInstance.put(
        `/bra/compliance/jobs/${jobId}/documents/${braStage}/update`,
        formData
      );

      toast.success('BRA approval document replaced successfully');
      setReplaceModal({ open: false, document: null, jobId: null, braStage: null });

      const fileInput = document.getElementById('replaceFile');
      if (fileInput) fileInput.value = '';

      const updatedBraResponse = await axios.get(`/bra/compliance/jobs/${jobId}/status`);
      if (updatedBraResponse.data) {
        setBraApprovals(prev => prev.map(approval =>
          approval.jobId === jobId
            ? { ...approval, braApproval: updatedBraResponse.data }
            : approval
        ));
      }
    } catch (error) {
      console.error('Error replacing BRA approval document:', error);
      toast.error(error.response?.data?.message || 'Failed to replace BRA approval document');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteGeneralDocument = async (jobId, documentIndex) => {
    try {
      setUploading(true);
      const response = await axios.get(`/operations/jobs/${jobId}/bra-documents`);
      const existingDocs = response.data.documents || [];
      const docToDelete = existingDocs[documentIndex];

      if (docToDelete) {
        await axios.delete(`/operations/jobs/${jobId}/bra-documents`, {
          data: { fileUrl: docToDelete.file }
        });
      }

      toast.success('Document deleted successfully');
      setDeleteModal({ open: false, document: null, jobId: null, documentIndex: null });

      const updatedResponse = await axios.get(`/operations/jobs/${jobId}/bra-documents`);
      setGeneralBraDocuments(prev => ({
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

  const renderAllBraDocuments = (jobId) => {
    const approval = braApprovals.find(a => a.jobId === jobId);
    const braData = approval?.braApproval;
    const generalDocs = generalBraDocuments[jobId] || [];

    const managementDocuments = [];

    if (braData?.lmroApproval?.document?.fileUrl) {
      managementDocuments.push({
        id: `lmro-${jobId}`,
        type: 'management',
        stage: 'lmro',
        stageLabel: 'LMRO',
        document: braData.lmroApproval.document,
        approval: braData.lmroApproval,
        name: braData.lmroApproval.document.fileName || 'LMRO BRA Document',
        url: braData.lmroApproval.document.fileUrl,
        uploadDate: braData.lmroApproval.document.uploadedAt || braData.lmroApproval.approvedAt,
        docType: 'LMRO Approval'
      });
    }

    if (braData?.dlmroApproval?.document?.fileUrl) {
      managementDocuments.push({
        id: `dlmro-${jobId}`,
        type: 'management',
        stage: 'dlmro',
        stageLabel: 'DLMRO',
        document: braData.dlmroApproval.document,
        approval: braData.dlmroApproval,
        name: braData.dlmroApproval.document.fileName || 'DLMRO BRA Document',
        url: braData.dlmroApproval.document.fileUrl,
        uploadDate: braData.dlmroApproval.document.uploadedAt || braData.dlmroApproval.approvedAt,
        docType: 'DLMRO Approval'
      });
    }

    if (braData?.ceoApproval?.document?.fileUrl) {
      managementDocuments.push({
        id: `ceo-${jobId}`,
        type: 'management',
        stage: 'ceo',
        stageLabel: 'CEO',
        document: braData.ceoApproval.document,
        approval: braData.ceoApproval,
        name: braData.ceoApproval.document.fileName || 'CEO BRA Document',
        url: braData.ceoApproval.document.fileUrl,
        uploadDate: braData.ceoApproval.document.uploadedAt || braData.ceoApproval.approvedAt,
        docType: 'CEO Approval'
      });
    }

    const generalDocuments = generalDocs.map((doc, idx) => ({
      id: doc._id || `general-${idx}`,
      type: 'general',
      name: doc.description || doc.name || `Document ${idx + 1}`,
      url: doc.file || doc.fileUrl || doc.url,
      uploadDate: doc.date || doc.uploadedAt || doc.createdAt,
      docType: doc.documentType || doc.docType || 'BRA Document',
      originalIndex: idx,
      file: doc.file,
      description: doc.description,
      date: doc.date
    }));

    const allDocuments = [...managementDocuments, ...generalDocuments];

    if (allDocuments.length === 0) {
      return (
        <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
          <div className="bg-gray-100 rounded-full h-12 w-12 flex items-center justify-center mx-auto mb-3 shadow-sm">
            <DocumentTextIcon className="h-6 w-6 text-gray-400" />
          </div>
          <h5 className="text-sm font-medium text-gray-700 mb-2">
            No BRA Documents
          </h5>
          <p className="text-xs text-gray-500 mb-4">
            No BRA documents have been uploaded yet for this job.
          </p>
          <button
            onClick={() => setUploadModal({ open: true, jobId })}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors shadow-sm"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Upload BRA Document
          </button>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-end mb-2">
          <button
            onClick={() => setUploadModal({ open: true, jobId })}
            className="inline-flex items-center text-xs text-purple-600 hover:text-purple-800 bg-white rounded-md px-2 py-1 border border-purple-200 hover:shadow-sm transition-all"
          >
            <PlusIcon className="h-3.5 w-3.5 mr-1" />
            Upload Document
          </button>
        </div>
        <div className="grid grid-cols-1 gap-3">
          {allDocuments.map((doc) => (
            <div
              key={doc.id}
              className="group relative bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4 transition-all duration-200 hover:shadow-md border border-purple-200"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start flex-1">
                  <div className="flex-shrink-0">
                    <span className="flex h-10 w-10 items-center justify-center rounded-md bg-white text-purple-600 shadow-sm">
                      {doc.type === 'management' ? (
                        doc.stage === 'lmro' ? <UserGroupIcon className="h-5 w-5" /> :
                        doc.stage === 'dlmro' ? <ClipboardDocumentCheckIcon className="h-5 w-5" /> :
                        <LockClosedIcon className="h-5 w-5" />
                      ) : (
                        <DocumentTextIcon className="h-5 w-5" />
                      )}
                    </span>
                  </div>
                  <div className="ml-4 flex-1">
                    <h6 className="text-sm font-medium text-purple-900">
                      {doc.name}
                    </h6>
                    <div className="mt-1 space-y-1">
                      {doc.uploadDate && (
                        <p className="text-xs text-gray-600">
                          <CalendarIcon className="h-3 w-3 inline mr-1" />
                          {new Date(doc.uploadDate).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </p>
                      )}
                    </div>
                    <span className={`mt-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      doc.type === 'management'
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-indigo-100 text-indigo-800'
                    }`}>
                      {doc.docType}
                    </span>
                    <div className="mt-3 flex items-center gap-2">
                      <button
                        onClick={() => openDocument(doc.url, doc.name)}
                        className="inline-flex items-center text-xs text-purple-600 hover:text-purple-800 bg-white rounded-md px-2 py-1 border border-purple-200 hover:shadow-sm transition-all"
                      >
                        <EyeIcon className="h-3.5 w-3.5 mr-1" />
                        View
                      </button>
                      {doc.type === 'general' && (
                        <>
                          <button
                            onClick={() => setReplaceModal({ open: true, document: doc, jobId, documentIndex: doc.originalIndex })}
                            className="inline-flex items-center text-xs text-green-600 hover:text-green-800 bg-white rounded-md px-2 py-1 border border-green-200 hover:shadow-sm transition-all"
                          >
                            <ArrowPathIcon className="h-3.5 w-3.5 mr-1" />
                            Replace
                          </button>
                          <button
                            onClick={() => setDeleteModal({ open: true, document: doc, jobId, documentIndex: doc.originalIndex })}
                            className="inline-flex items-center text-xs text-red-600 hover:text-red-800 bg-white rounded-md px-2 py-1 border border-red-200 hover:shadow-sm transition-all"
                          >
                            <TrashIcon className="h-3.5 w-3.5 mr-1" />
                            Delete
                          </button>
                        </>
                      )}
                      {doc.type === 'management' && (
                        <button
                          onClick={() => setReplaceModal({
                            open: true,
                            document: doc.document,
                            jobId,
                            braStage: doc.stage,
                            documentType: 'braApproval'
                          })}
                          className="inline-flex items-center text-xs text-green-600 hover:text-green-800 bg-white rounded-md px-2 py-1 border border-green-200 hover:shadow-sm transition-all"
                        >
                          <ArrowPathIcon className="h-3.5 w-3.5 mr-1" />
                          Replace
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderBraDocumentSection = (braData, jobId) => {
    if (!braData) return null;

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

    if (braData.lmroApproval?.document?.fileUrl) {
      documents.push(createDocumentInfo("lmro", braData.lmroApproval));
    }

    if (braData.dlmroApproval?.document?.fileUrl) {
      documents.push(createDocumentInfo("dlmro", braData.dlmroApproval));
    }

    if (braData.ceoApproval?.document?.fileUrl) {
      documents.push(createDocumentInfo("ceo", braData.ceoApproval));
    }

    if (documents.length === 0) {
      return null;
    }

    return (
      <div className="space-y-3">
        {documents.map((doc) => {
          const stageColors = {
            lmro: {
              bg: "bg-purple-50",
              border: "border-purple-200",
              text: "text-purple-800",
              icon: "text-purple-600",
            },
            dlmro: {
              bg: "bg-pink-50",
              border: "border-pink-200",
              text: "text-pink-800",
              icon: "text-pink-600",
            },
            ceo: {
              bg: "bg-fuchsia-50",
              border: "border-fuchsia-200",
              text: "text-fuchsia-800",
              icon: "text-fuchsia-600",
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
                          braStage: doc.stage,
                          documentType: 'braApproval'
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
          <DocumentTextIcon className="h-8 w-8 mr-3 text-purple-600" />
          BRA Verification Sheet
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
            </div>
          </div>

          <div className="space-y-4">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                <DocumentTextIcon className="h-5 w-5 mr-2 text-purple-600" />
                BRA Documents
              </h3>
            </div>

            <div className="space-y-4">
              {client?.jobs && client.jobs.length > 0 ? (
                client.jobs.map((job) => {
                  const hasApproval = braApprovals.find(a => a.jobId === job._id);
                  const hasGeneralDocs = generalBraDocuments[job._id] && generalBraDocuments[job._id].length > 0;

                  if (!hasApproval && !hasGeneralDocs) return null;

                  return (
                    <div key={job._id} className="border border-gray-200 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-3">
                        Job: {job.jobNumber || job._id}
                      </h4>
                      {renderAllBraDocuments(job._id)}
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-6 bg-gray-50/80 rounded-lg border border-gray-200">
                  <DocumentTextIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">
                    {loadingBra ? 'Loading BRA documents...' : 'No BRA documents found for this client.'}
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
              setUploadModal({ open: false, jobId: null });
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
                <h3 className="text-lg font-semibold text-gray-900">Upload New BRA Document</h3>
                <button
                  onClick={() => {
                    setUploadModal({ open: false, jobId: null });
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
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 text-sm px-3 py-2 border"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Document
                  </label>
                  <input
                    type="file"
                    id="uploadFile"
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.xls,.xlsx"
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
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 text-sm px-3 py-2 border resize-none"
                  ></textarea>
                </div>
              </div>

              <div className="flex gap-3 justify-end mt-6">
                <button
                  onClick={() => {
                    setUploadModal({ open: false, jobId: null });
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
                  className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 disabled:opacity-50"
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
              setReplaceModal({ open: false, document: null, jobId: null, documentIndex: null, braStage: null });
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
              setReplaceModal({ open: false, document: null, jobId: null, documentIndex: null, braStage: null });
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
                      className="inline-flex items-center text-xs text-purple-600 hover:text-purple-800 bg-white rounded-md px-2 py-1 border border-purple-200 hover:shadow-sm transition-all"
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
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 text-sm px-3 py-2 border"
                    />
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select New Document <span className="text-gray-500 text-xs font-normal">(Optional - leave empty to keep current file)</span>
                    </label>
                    <input
                      type="file"
                      id="replaceFile"
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.xls,.xlsx"
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
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 text-sm px-3 py-2 border resize-none"
                    ></textarea>
                  </div>
                </>
              )}

              {replaceModal.documentType === 'braApproval' && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select New Document <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="file"
                    id="replaceFile"
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.xls,.xlsx"
                  />
                </div>
              )}

              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setReplaceModal({ open: false, document: null, jobId: null, documentIndex: null, braStage: null });
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

                    if (replaceModal.documentType === 'braApproval') {
                      if (!file) {
                        toast.error('Please select a file');
                        return;
                      }
                      handleReplaceBraApprovalDocument(
                        replaceModal.jobId,
                        replaceModal.braStage,
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
                    }
                  }}
                  className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 disabled:opacity-50"
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
            onClick={() => setDeleteModal({ open: false, document: null, jobId: null, documentIndex: null })}
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
                  onClick={() => setDeleteModal({ open: false, document: null, jobId: null, documentIndex: null })}
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
                  onClick={() => setDeleteModal({ open: false, document: null, jobId: null, documentIndex: null })}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                  disabled={uploading}
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (deleteModal.jobId !== null && deleteModal.documentIndex !== null) {
                      handleDeleteGeneralDocument(deleteModal.jobId, deleteModal.documentIndex);
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

export default BRASheet;
