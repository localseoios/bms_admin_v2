// import React, { useState, useEffect } from "react";
// import { motion } from "framer-motion";
// import axiosInstance from "../../utils/axios";
// import {
//   CheckIcon,
//   XMarkIcon,
//   UserGroupIcon,
//   ClipboardDocumentCheckIcon,
//   LockClosedIcon,
//   ShieldExclamationIcon,
//   DocumentTextIcon,
//   ArrowDownTrayIcon,
//   ClockIcon,
//   InformationCircleIcon,
//   ArrowPathIcon,
//   ExclamationTriangleIcon,
// } from "@heroicons/react/24/outline";

// const EnhancedClientKYC = ({ jobId }) => {
//   const [kycDetails, setKycDetails] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [timeline, setTimeline] = useState([]);
//   const [loadingTimeline, setLoadingTimeline] = useState(false);
//   const [refreshing, setRefreshing] = useState(false);

//   // Fetch KYC status on initial load
//   useEffect(() => {
//     if (jobId) {
//       fetchKYCStatus();
//     }
//   }, [jobId]);

//   // Fetch KYC status
//   const fetchKYCStatus = async () => {
//     setLoading(true);
//     try {
//       // Fetch KYC status from API
//       const response = await axiosInstance.get(`/kyc/jobs/${jobId}/status`);

//       // Set KYC details
//       setKycDetails(response.data);

//       // If KYC exists, also fetch its timeline
//       if (response.data && response.data.exists) {
//         fetchKYCTimeline();
//       }

//       setError(null);
//     } catch (err) {
//       console.error("Error fetching KYC details:", err);
//       setError("Failed to load KYC details");
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Fetch KYC timeline
//   const fetchKYCTimeline = async () => {
//     setLoadingTimeline(true);
//     try {
//       const response = await axiosInstance.get(`/kyc/jobs/${jobId}/timeline`);
//       if (response.data) {
//         setTimeline(response.data);
//       }
//     } catch (err) {
//       console.error("Error fetching KYC timeline:", err);
//     } finally {
//       setLoadingTimeline(false);
//     }
//   };

//   // Handle refresh KYC data
//   const handleRefresh = async () => {
//     setRefreshing(true);
//     await fetchKYCStatus();
//     setRefreshing(false);
//   };

//   // Format date function
//   const formatDate = (dateString) => {
//     if (!dateString) return "N/A";
//     return new Date(dateString).toLocaleDateString("en-US", {
//       year: "numeric",
//       month: "long",
//       day: "numeric",
//       hour: "2-digit",
//       minute: "2-digit",
//     });
//   };

//   // Get KYC status display info
//   const getKYCStatusInfo = () => {
//     // If no KYC approval, show appropriate status
//     if (!kycDetails || !kycDetails.exists) {
//       if (kycDetails && kycDetails.canInitialize) {
//         return {
//           label: "Ready for KYC",
//           color: "bg-blue-50 text-blue-700 ring-blue-600/20",
//           icon: <ArrowPathIcon className="h-5 w-5 text-blue-500" />,
//         };
//       }
//       return {
//         label: "KYC Not Started",
//         color: "bg-gray-50 text-gray-700 ring-gray-600/20",
//         icon: <ShieldExclamationIcon className="h-5 w-5 text-gray-500" />,
//       };
//     }

//     // Determine status based on KYC state
//     if (kycDetails.status === "rejected") {
//       return {
//         label: "KYC Rejected",
//         color: "bg-red-50 text-red-700 ring-red-600/20",
//         icon: <XMarkIcon className="h-5 w-5 text-red-500" />,
//       };
//     } else if (kycDetails.status === "completed") {
//       return {
//         label: "KYC Completed",
//         color: "bg-green-50 text-green-700 ring-green-600/20",
//         icon: <CheckIcon className="h-5 w-5 text-green-500" />,
//       };
//     }

//     // Based on current approval stage
//     const stage = kycDetails.currentApprovalStage;
//     if (stage === "lmro") {
//       return {
//         label: "LMRO Review",
//         color: "bg-blue-50 text-blue-700 ring-blue-600/20",
//         icon: <UserGroupIcon className="h-5 w-5 text-blue-500" />,
//       };
//     } else if (stage === "dlmro") {
//       return {
//         label: "DLMRO Review",
//         color: "bg-purple-50 text-purple-700 ring-purple-600/20",
//         icon: (
//           <ClipboardDocumentCheckIcon className="h-5 w-5 text-purple-500" />
//         ),
//       };
//     } else if (stage === "ceo") {
//       return {
//         label: "CEO Review",
//         color: "bg-indigo-50 text-indigo-700 ring-indigo-600/20",
//         icon: <LockClosedIcon className="h-5 w-5 text-indigo-500" />,
//       };
//     }

//     return {
//       label: "Processing",
//       color: "bg-gray-50 text-gray-700 ring-gray-600/20",
//       icon: <ArrowPathIcon className="h-5 w-5 text-gray-500" />,
//     };
//   };

//   // Render document link
//   const renderDocumentLink = () => {
//     if (!kycDetails || !kycDetails.exists) return null;

//     // Determine which document to show based on approval stage
//     let document = null;
//     let stageLabel = "";

//     // For completed KYC, show CEO document
//     if (kycDetails.status === "completed" && kycDetails.ceoApproval?.document) {
//       document = kycDetails.ceoApproval.document;
//       stageLabel = "Final Approved";
//     }
//     // For CEO stage, show DLMRO document
//     else if (
//       kycDetails.currentApprovalStage === "ceo" &&
//       kycDetails.dlmroApproval?.document
//     ) {
//       document = kycDetails.dlmroApproval.document;
//       stageLabel = "DLMRO";
//     }
//     // For DLMRO stage, show LMRO document
//     else if (
//       kycDetails.currentApprovalStage === "dlmro" &&
//       kycDetails.lmroApproval?.document
//     ) {
//       document = kycDetails.lmroApproval.document;
//       stageLabel = "LMRO";
//     }
//     // For LMRO stage with document
//     else if (
//       kycDetails.currentApprovalStage === "lmro" &&
//       kycDetails.lmroApproval?.document
//     ) {
//       document = kycDetails.lmroApproval.document;
//       stageLabel = "LMRO";
//     }

//     if (!document || !document.fileUrl) return null;

//     return (
//       <a
//         href={document.fileUrl}
//         target="_blank"
//         rel="noopener noreferrer"
//         className="flex items-center text-sm text-blue-600 hover:text-blue-800 mt-2 bg-blue-50 px-3 py-2 rounded-lg shadow-sm hover:shadow-md transition-all border border-blue-100"
//       >
//         <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
//         <div>
//           <span className="font-medium">{stageLabel} Document:</span>
//           <span className="block text-xs text-blue-700">
//             {document.fileName}
//           </span>
//         </div>
//       </a>
//     );
//   };

//   // Loading state
//   if (loading) {
//     return (
//       <div className="py-10 text-center bg-white rounded-xl shadow-md">
//         <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600 mx-auto"></div>
//         <p className="mt-4 text-sm text-gray-500">Loading KYC details...</p>
//       </div>
//     );
//   }

//   // Error state
//   if (error) {
//     return (
//       <div className="py-10 text-center bg-white rounded-xl shadow-md">
//         <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto" />
//         <p className="mt-4 text-sm text-red-500">{error}</p>
//         <button
//           onClick={handleRefresh}
//           className="mt-4 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
//         >
//           Try Again
//         </button>
//       </div>
//     );
//   }

//   // Empty state - No KYC
//   if (!kycDetails || !kycDetails.exists) {
//     return (
//       <motion.div
//         initial={{ opacity: 0, y: 10 }}
//         animate={{ opacity: 1, y: 0 }}
//         transition={{ duration: 0.3 }}
//         className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200/60 overflow-hidden hover:shadow-xl transition-all duration-300"
//       >
//         <div className="bg-gradient-to-r from-gray-600 to-gray-700 px-6 py-5">
//           <div className="flex justify-between items-center">
//             <div className="flex items-center">
//               <div className="bg-white rounded-xl p-2.5 mr-4 shadow-md">
//                 <ShieldExclamationIcon className="h-6 w-6 text-gray-600" />
//               </div>
//               <div>
//                 <h3 className="text-xl font-bold text-white">
//                   KYC Not Started
//                 </h3>
//                 <p className="text-sm text-gray-100 mt-0.5">
//                   No KYC process has been initiated for this job
//                 </p>
//               </div>
//             </div>
//             {kycDetails && kycDetails.canInitialize && (
//               <div className="bg-blue-500 px-4 py-2 rounded-full text-white shadow-sm">
//                 <span className="font-medium">Ready for Initialization</span>
//               </div>
//             )}
//           </div>
//         </div>

//         <div className="p-6">
//           <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
//             <ShieldExclamationIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
//             <p className="text-lg font-medium text-gray-700 mb-2">
//               No KYC Process Found
//             </p>
//             <p className="text-sm text-gray-500 max-w-md mx-auto mb-6">
//               The KYC verification process has not been initiated for this job
//               yet. KYC verification is required for compliance with regulatory
//               requirements.
//             </p>
//             {kycDetails && kycDetails.canInitialize && (
//               <p className="text-sm text-blue-600 font-medium">
//                 This job is ready for KYC initialization by authorized personnel
//                 in the KYC Management section.
//               </p>
//             )}
//           </div>

//           <div className="mt-6 bg-blue-50 rounded-lg border border-blue-100 p-4">
//             <div className="flex items-start">
//               <div className="flex-shrink-0">
//                 <InformationCircleIcon className="h-5 w-5 text-blue-600" />
//               </div>
//               <div className="ml-3">
//                 <h5 className="text-sm font-medium text-blue-800">
//                   About KYC Verification
//                 </h5>
//                 <p className="mt-1 text-sm text-blue-700">
//                   KYC (Know Your Customer) verification is a mandatory process
//                   to verify the identity of clients and assess potential risks
//                   of illegal intentions for business relationships.
//                 </p>
//               </div>
//             </div>
//           </div>
//         </div>
//       </motion.div>
//     );
//   }

//   // KYC exists - show full details
//   const statusInfo = getKYCStatusInfo();

//   return (
//     <motion.div
//       initial={{ opacity: 0, y: 10 }}
//       animate={{ opacity: 1, y: 0 }}
//       transition={{ duration: 0.3 }}
//       className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200/60 overflow-hidden hover:shadow-xl transition-all duration-300"
//     >
//       {/* KYC Header */}
//       <div
//         className={`bg-gradient-to-r ${
//           kycDetails.status === "completed"
//             ? "from-green-600 to-emerald-700"
//             : kycDetails.status === "rejected"
//             ? "from-red-600 to-rose-700"
//             : "from-blue-600 to-indigo-700"
//         } px-6 py-5`}
//       >
//         <div className="flex justify-between items-center">
//           <div className="flex items-center">
//             <div className="bg-white rounded-xl p-2.5 mr-4 shadow-md">
//               {statusInfo.icon}
//             </div>
//             <div>
//               <h3 className="text-xl font-bold text-white">KYC Verification</h3>
//               <p className="text-sm text-blue-100 mt-0.5">{statusInfo.label}</p>
//             </div>
//           </div>
//           <button
//             onClick={handleRefresh}
//             disabled={refreshing}
//             className="bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full text-white text-sm hover:bg-white/30 transition-colors flex items-center disabled:opacity-50"
//           >
//             {refreshing ? (
//               <ArrowPathIcon className="h-4 w-4 mr-1.5 animate-spin" />
//             ) : (
//               <ArrowPathIcon className="h-4 w-4 mr-1.5" />
//             )}
//             Refresh
//           </button>
//         </div>
//       </div>

//       <div className="p-6">
//         {/* KYC Progress Indicators */}
//         <div className="mb-6">
//           <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
//             <ClipboardDocumentCheckIcon className="h-4 w-4 mr-2 text-indigo-600" />
//             KYC Approval Progress
//           </h4>

//           <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
//             <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
//               <span>LMRO</span>
//               <span>DLMRO</span>
//               <span>CEO</span>
//             </div>
//             <div className="flex items-center gap-1">
//               {/* LMRO */}
//               <div
//                 className={`h-2 flex-1 rounded-l-full ${
//                   kycDetails.lmroApproval && kycDetails.lmroApproval.approved
//                     ? "bg-green-500"
//                     : "bg-gray-200"
//                 }`}
//               ></div>

//               {/* DLMRO */}
//               <div
//                 className={`h-2 flex-1 ${
//                   kycDetails.dlmroApproval && kycDetails.dlmroApproval.approved
//                     ? "bg-green-500"
//                     : "bg-gray-200"
//                 }`}
//               ></div>

//               {/* CEO */}
//               <div
//                 className={`h-2 flex-1 rounded-r-full ${
//                   kycDetails.ceoApproval && kycDetails.ceoApproval.approved
//                     ? "bg-green-500"
//                     : "bg-gray-200"
//                 }`}
//               ></div>
//             </div>
//           </div>
//         </div>

//         {/* KYC Status Details */}
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
//           {/* LMRO Approval */}
//           <div
//             className={`rounded-lg p-4 ${
//               kycDetails.lmroApproval
//                 ? "bg-green-50 border-green-100"
//                 : "bg-gray-50 border-gray-100"
//             } border shadow-sm`}
//           >
//             <div className="flex items-center">
//               <div
//                 className={`p-2 rounded-full ${
//                   kycDetails.lmroApproval ? "bg-green-100" : "bg-gray-200"
//                 } mr-3`}
//               >
//                 <UserGroupIcon
//                   className={`h-5 w-5 ${
//                     kycDetails.lmroApproval ? "text-green-600" : "text-gray-500"
//                   }`}
//                 />
//               </div>
//               <div>
//                 <h5 className="text-sm font-medium text-gray-800">
//                   LMRO Approval
//                 </h5>
//                 <p className="text-xs text-gray-600">
//                   {kycDetails.lmroApproval
//                     ? formatDate(kycDetails.lmroApproval.timestamp)
//                     : "Pending approval"}
//                 </p>
//               </div>
//             </div>
//             {kycDetails.lmroApproval && kycDetails.lmroApproval.notes && (
//               <div className="mt-2 pl-10">
//                 <p className="text-xs text-gray-600 italic">
//                   "{kycDetails.lmroApproval.notes}"
//                 </p>
//               </div>
//             )}
//           </div>

//           {/* DLMRO Approval */}
//           <div
//             className={`rounded-lg p-4 ${
//               kycDetails.dlmroApproval
//                 ? "bg-green-50 border-green-100"
//                 : "bg-gray-50 border-gray-100"
//             } border shadow-sm`}
//           >
//             <div className="flex items-center">
//               <div
//                 className={`p-2 rounded-full ${
//                   kycDetails.dlmroApproval ? "bg-green-100" : "bg-gray-200"
//                 } mr-3`}
//               >
//                 <ClipboardDocumentCheckIcon
//                   className={`h-5 w-5 ${
//                     kycDetails.dlmroApproval
//                       ? "text-green-600"
//                       : "text-gray-500"
//                   }`}
//                 />
//               </div>
//               <div>
//                 <h5 className="text-sm font-medium text-gray-800">
//                   DLMRO Approval
//                 </h5>
//                 <p className="text-xs text-gray-600">
//                   {kycDetails.dlmroApproval
//                     ? formatDate(kycDetails.dlmroApproval.timestamp)
//                     : "Pending approval"}
//                 </p>
//               </div>
//             </div>
//             {kycDetails.dlmroApproval && kycDetails.dlmroApproval.notes && (
//               <div className="mt-2 pl-10">
//                 <p className="text-xs text-gray-600 italic">
//                   "{kycDetails.dlmroApproval.notes}"
//                 </p>
//               </div>
//             )}
//           </div>
//         </div>

//         {/* CEO & Current Status */}
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
//           {/* CEO Approval */}
//           <div
//             className={`rounded-lg p-4 ${
//               kycDetails.ceoApproval
//                 ? "bg-green-50 border-green-100"
//                 : "bg-gray-50 border-gray-100"
//             } border shadow-sm`}
//           >
//             <div className="flex items-center">
//               <div
//                 className={`p-2 rounded-full ${
//                   kycDetails.ceoApproval ? "bg-green-100" : "bg-gray-200"
//                 } mr-3`}
//               >
//                 <LockClosedIcon
//                   className={`h-5 w-5 ${
//                     kycDetails.ceoApproval ? "text-green-600" : "text-gray-500"
//                   }`}
//                 />
//               </div>
//               <div>
//                 <h5 className="text-sm font-medium text-gray-800">
//                   CEO Approval
//                 </h5>
//                 <p className="text-xs text-gray-600">
//                   {kycDetails.ceoApproval
//                     ? formatDate(kycDetails.ceoApproval.timestamp)
//                     : "Pending approval"}
//                 </p>
//               </div>
//             </div>
//             {kycDetails.ceoApproval && kycDetails.ceoApproval.notes && (
//               <div className="mt-2 pl-10">
//                 <p className="text-xs text-gray-600 italic">
//                   "{kycDetails.ceoApproval.notes}"
//                 </p>
//               </div>
//             )}
//           </div>

//           {/* Current Status */}
//           <div
//             className={`rounded-lg p-4 ${
//               kycDetails.status === "completed"
//                 ? "bg-green-50 border-green-100"
//                 : kycDetails.status === "rejected"
//                 ? "bg-red-50 border-red-100"
//                 : "bg-blue-50 border-blue-100"
//             } border shadow-sm`}
//           >
//             <div className="flex items-center">
//               <div
//                 className={`p-2 rounded-full ${
//                   kycDetails.status === "completed"
//                     ? "bg-green-100"
//                     : kycDetails.status === "rejected"
//                     ? "bg-red-100"
//                     : "bg-blue-100"
//                 } mr-3`}
//               >
//                 {kycDetails.status === "completed" ? (
//                   <CheckIcon className="h-5 w-5 text-green-600" />
//                 ) : kycDetails.status === "rejected" ? (
//                   <XMarkIcon className="h-5 w-5 text-red-600" />
//                 ) : (
//                   <ClockIcon className="h-5 w-5 text-blue-600" />
//                 )}
//               </div>
//               <div>
//                 <h5 className="text-sm font-medium text-gray-800">
//                   Overall Status
//                 </h5>
//                 <p className="text-xs font-medium">
//                   {kycDetails.status === "completed"
//                     ? "Complete"
//                     : kycDetails.status === "rejected"
//                     ? "Rejected"
//                     : `In Progress - ${statusInfo.label}`}
//                 </p>
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Documents Section */}
//         <div className="mb-6">
//           <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
//             <DocumentTextIcon className="h-4 w-4 mr-2 text-indigo-600" />
//             KYC Documents
//           </h4>

//           <div className="space-y-3">
//             {/* Show current document */}
//             {renderDocumentLink()}

//             {/* If no document is available */}
//             {!renderDocumentLink() && (
//               <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 text-center">
//                 <p className="text-sm text-gray-500">
//                   No documents available for the current stage
//                 </p>
//               </div>
//             )}
//           </div>
//         </div>

//         {/* Rejection Reason (if rejected) */}
//         {kycDetails.status === "rejected" && (
//           <div className="mb-6 p-4 bg-red-50 rounded-lg border border-red-200">
//             <h4 className="text-sm font-semibold text-red-700 mb-2 flex items-center">
//               <XMarkIcon className="h-4 w-4 mr-2" />
//               Rejection Reason
//             </h4>
//             <p className="text-sm text-red-700">
//               {kycDetails.rejectionReason || "No specific reason provided"}
//             </p>
//           </div>
//         )}

//         {/* KYC Timeline */}
//         {timeline && timeline.length > 0 && (
//           <div className="mt-6">
//             <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
//               <ClockIcon className="h-4 w-4 mr-2 text-indigo-600" />
//               KYC Timeline
//             </h4>

//             {loadingTimeline ? (
//               <div className="text-center py-4">
//                 <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-indigo-600 mx-auto"></div>
//                 <p className="mt-2 text-xs text-gray-500">
//                   Loading timeline...
//                 </p>
//               </div>
//             ) : timeline.length === 0 ? (
//               <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 text-center">
//                 <p className="text-sm text-gray-500">
//                   No timeline events available
//                 </p>
//               </div>
//             ) : (
//               <div className="flow-root">
//                 <ul className="-mb-8">
//                   {timeline.map((event, index) => (
//                     <li key={index}>
//                       <div className="relative pb-8">
//                         {index !== timeline.length - 1 && (
//                           <span
//                             className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
//                             aria-hidden="true"
//                           />
//                         )}
//                         <div className="relative flex space-x-3">
//                           <div>
//                             <span className="h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center ring-8 ring-white">
//                               <ClockIcon className="h-5 w-5 text-blue-600" />
//                             </span>
//                           </div>
//                           <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
//                             <div>
//                               <p className="text-sm text-gray-800 font-medium">
//                                 {event.title || event.status || "KYC Update"}
//                               </p>
//                               <p className="text-xs text-gray-500 mt-0.5">
//                                 {event.description || "Status updated"}
//                               </p>
//                             </div>
//                             <div className="text-right text-xs text-gray-500 whitespace-nowrap">
//                               {formatDate(event.timestamp)}
//                             </div>
//                           </div>
//                         </div>
//                       </div>
//                     </li>
//                   ))}
//                 </ul>
//               </div>
//             )}
//           </div>
//         )}

//         {/* KYC Information Box */}
//         <div className="mt-6 bg-blue-50 rounded-lg border border-blue-100 p-4">
//           <div className="flex items-start">
//             <div className="flex-shrink-0">
//               <InformationCircleIcon className="h-5 w-5 text-blue-600" />
//             </div>
//             <div className="ml-3">
//               <h5 className="text-sm font-medium text-blue-800">
//                 About KYC Verification
//               </h5>
//               <p className="mt-1 text-sm text-blue-700">
//                 KYC (Know Your Customer) verification is a mandatory process to
//                 verify the identity of clients and assess potential risks of
//                 illegal intentions for business relationships.
//               </p>
//             </div>
//           </div>
//         </div>
//       </div>
//     </motion.div>
//   );





  
// };

// export default EnhancedClientKYC;
