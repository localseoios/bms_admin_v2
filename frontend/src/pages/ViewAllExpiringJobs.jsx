// // ViewAllExpiringJobsModal.jsx - Fixed with proper array handling
// import { useState, useEffect } from "react";
// import { Dialog, Transition } from "@headlessui/react";
// import { Fragment } from "react";
// import {
//   XMarkIcon,
//   ExclamationTriangleIcon,
//   ClockIcon,
//   CheckCircleIcon,
//   BuildingOfficeIcon,
//   UserIcon,
//   CalendarIcon,
//   DocumentTextIcon,
//   ArrowDownTrayIcon,
//   BellIcon,
//   FunnelIcon,
//   MagnifyingGlassIcon,
// } from "@heroicons/react/24/outline";
// import axiosInstance from "../utils/axios";

// const ViewAllExpiringJobsModal = ({ isOpen, onClose, initialJobs = [] }) => {
//   // FIXED: Ensure all state values are always arrays
//   const [expiringJobs, setExpiringJobs] = useState(
//     Array.isArray(initialJobs) ? initialJobs : []
//   );
//   const [filteredJobs, setFilteredJobs] = useState(
//     Array.isArray(initialJobs) ? initialJobs : []
//   );
//   const [isLoading, setIsLoading] = useState(false);
//   const [searchTerm, setSearchTerm] = useState("");
//   const [urgencyFilter, setUrgencyFilter] = useState("all");
//   const [sortBy, setSortBy] = useState("urgency");

//   // FORCED EXPIRY CONFIGURATION
//   const FORCED_EXPIRY_OFFSET_DAYS = 37; // 1 month + 1 week

//   useEffect(() => {
//     if (isOpen && (!initialJobs || initialJobs.length === 0)) {
//       fetchAllExpiringJobs();
//     }
//   }, [isOpen, initialJobs]);

//   useEffect(() => {
//     // FIXED: Ensure we always work with arrays
//     const jobsArray = Array.isArray(initialJobs) ? initialJobs : [];
//     setExpiringJobs(jobsArray);
//     setFilteredJobs(jobsArray);
//   }, [initialJobs]);

//   useEffect(() => {
//     filterAndSortJobs();
//   }, [expiringJobs, searchTerm, urgencyFilter, sortBy]);

//   const fetchAllExpiringJobs = async () => {
//     try {
//       setIsLoading(true);
//       console.log("Fetching all expiring jobs from modal...");

//       const response = await axiosInstance.get("/operations/expiring-jobs");
//       console.log("Modal API response:", response.data);

//       // FIXED: Handle different response structures
//       let jobsData = [];

//       if (response.data) {
//         if (response.data.success && Array.isArray(response.data.data)) {
//           // Backend API response structure
//           jobsData = response.data.data;
//         } else if (Array.isArray(response.data)) {
//           // Direct array response
//           jobsData = response.data;
//         } else {
//           console.warn("Unexpected response structure:", response.data);
//           jobsData = [];
//         }
//       }

//       console.log("Setting expiring jobs:", jobsData.length, "jobs");
//       setExpiringJobs(jobsData);
//     } catch (error) {
//       console.error("Error fetching all expiring jobs:", error);
//       // Set empty array on error
//       setExpiringJobs([]);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const filterAndSortJobs = () => {
//     // FIXED: Ensure expiringJobs is always an array
//     const jobsArray = Array.isArray(expiringJobs) ? expiringJobs : [];
//     let filtered = [...jobsArray];

//     // Apply search filter
//     if (searchTerm) {
//       filtered = filtered.filter(
//         (job) =>
//           job &&
//           ((job.clientName &&
//             job.clientName.toLowerCase().includes(searchTerm.toLowerCase())) ||
//             (job.jobNumber &&
//               job.jobNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
//             (job.serviceType &&
//               job.serviceType
//                 .toLowerCase()
//                 .includes(searchTerm.toLowerCase())) ||
//             (job.companyName &&
//               job.companyName.toLowerCase().includes(searchTerm.toLowerCase())))
//       );
//     }

//     // Apply urgency filter
//     if (urgencyFilter !== "all") {
//       filtered = filtered.filter((job) => {
//         if (!job || !job.expiryDate) return false;

//         // Calculate urgency for filtering
//         const urgencyData = getForcedExpiryUrgency(job.expiryDate);
//         return urgencyData.level === urgencyFilter;
//       });
//     }

//     // Apply sorting
//     filtered.sort((a, b) => {
//       // Safety checks for job objects
//       if (!a || !b) return 0;

//       switch (sortBy) {
//         case "urgency":
//           const urgencyOrder = {
//             expired: 0,
//             critical: 1,
//             warning: 2,
//             normal: 3,
//           };

//           const aUrgency = a.expiryDate
//             ? getForcedExpiryUrgency(a.expiryDate).level
//             : "normal";
//           const bUrgency = b.expiryDate
//             ? getForcedExpiryUrgency(b.expiryDate).level
//             : "normal";

//           if (urgencyOrder[aUrgency] !== urgencyOrder[bUrgency]) {
//             return urgencyOrder[aUrgency] - urgencyOrder[bUrgency];
//           }
//           return new Date(a.expiryDate || 0) - new Date(b.expiryDate || 0);
//         case "expiry":
//           return new Date(a.expiryDate || 0) - new Date(b.expiryDate || 0);
//         case "client":
//           return (a.clientName || "").localeCompare(b.clientName || "");
//         case "service":
//           return (a.serviceType || "").localeCompare(b.serviceType || "");
//         default:
//           return 0;
//       }
//     });

//     setFilteredJobs(filtered);
//   };

//   // UPDATED: Helper function to calculate forced expiry urgency
//   const getForcedExpiryUrgency = (actualExpiryDate) => {
//     if (!actualExpiryDate) {
//       return {
//         level: "normal",
//         daysUntilForcedExpiry: 999,
//         daysUntilActualExpiry: 999,
//       };
//     }

//     const currentDate = new Date();
//     const forcedExpiryDate = new Date(actualExpiryDate);
//     forcedExpiryDate.setDate(
//       forcedExpiryDate.getDate() - FORCED_EXPIRY_OFFSET_DAYS
//     );

//     const daysUntilForcedExpiry = Math.ceil(
//       (forcedExpiryDate - currentDate) / (1000 * 60 * 60 * 24)
//     );

//     const daysUntilActualExpiry = Math.ceil(
//       (new Date(actualExpiryDate) - currentDate) / (1000 * 60 * 60 * 24)
//     );

//     if (daysUntilForcedExpiry <= 0) {
//       return {
//         level: "expired",
//         daysUntilForcedExpiry,
//         daysUntilActualExpiry,
//       };
//     } else if (daysUntilForcedExpiry <= 7) {
//       return {
//         level: "critical",
//         daysUntilForcedExpiry,
//         daysUntilActualExpiry,
//       };
//     } else if (daysUntilForcedExpiry <= 30) {
//       return {
//         level: "warning",
//         daysUntilForcedExpiry,
//         daysUntilActualExpiry,
//       };
//     } else {
//       return {
//         level: "normal",
//         daysUntilForcedExpiry,
//         daysUntilActualExpiry,
//       };
//     }
//   };

//   const getUrgencyConfig = (urgencyLevel) => {
//     switch (urgencyLevel) {
//       case "expired":
//         return {
//           color: "bg-red-100 text-red-800 border-red-200",
//           icon: ExclamationTriangleIcon,
//           label: "Expired (Forced)",
//           textColor: "text-red-600",
//         };
//       case "critical":
//         return {
//           color: "bg-orange-100 text-orange-800 border-orange-200",
//           icon: ExclamationTriangleIcon,
//           label: "Critical (Forced)",
//           textColor: "text-orange-600",
//         };
//       case "warning":
//         return {
//           color: "bg-yellow-100 text-yellow-800 border-yellow-200",
//           icon: ClockIcon,
//           label: "Warning (Forced)",
//           textColor: "text-yellow-600",
//         };
//       default:
//         return {
//           color: "bg-green-100 text-green-800 border-green-200",
//           icon: CheckCircleIcon,
//           label: "Normal",
//           textColor: "text-green-600",
//         };
//     }
//   };

//   const getStatusColor = (status) => {
//     const statusColors = {
//       pending: "bg-yellow-100 text-yellow-800",
//       approved: "bg-blue-100 text-blue-800",
//       completed: "bg-green-100 text-green-800",
//       rejected: "bg-red-100 text-red-800",
//       om_completed: "bg-purple-100 text-purple-800",
//       kyc_pending: "bg-indigo-100 text-indigo-800",
//       bra_pending: "bg-pink-100 text-pink-800",
//     };
//     return statusColors[status] || "bg-gray-100 text-gray-800";
//   };

//   const exportToExcel = async () => {
//     try {
//       const response = await axiosInstance.get(
//         "/operations/expiring-jobs/export",
//         {
//           responseType: "blob",
//         }
//       );

//       const url = window.URL.createObjectURL(new Blob([response.data]));
//       const link = document.createElement("a");
//       link.href = url;
//       link.setAttribute(
//         "download",
//         `expiring-jobs-forced-${new Date().toISOString().split("T")[0]}.xlsx`
//       );
//       document.body.appendChild(link);
//       link.click();
//       link.remove();
//       window.URL.revokeObjectURL(url);
//     } catch (error) {
//       console.error("Error exporting data:", error);
//       alert("Failed to export data. Please try again.");
//     }
//   };

//   const sendNotifications = async () => {
//     try {
//       const response = await axiosInstance.post(
//         "/operations/expiring-jobs/notify"
//       );
//       alert(
//         `Notifications sent successfully! ${response.data.notificationsSent} notifications were sent using forced expiry schedule (${FORCED_EXPIRY_OFFSET_DAYS} days early).`
//       );
//     } catch (error) {
//       console.error("Error sending notifications:", error);
//       alert("Failed to send notifications. Please try again.");
//     }
//   };

//   // UPDATED: Format days until expiry with forced logic explanation
//   const formatDaysUntilExpiry = (job) => {
//     if (!job || !job.expiryDate) {
//       return {
//         main: "No expiry date",
//         sub: "Expiry date not set",
//       };
//     }

//     const urgencyData = getForcedExpiryUrgency(job.expiryDate);

//     if (urgencyData.daysUntilForcedExpiry <= 0) {
//       const daysOverdue = Math.abs(urgencyData.daysUntilForcedExpiry);
//       return {
//         main: `${daysOverdue} day${
//           daysOverdue !== 1 ? "s" : ""
//         } overdue (forced)`,
//         sub: `Actual: ${urgencyData.daysUntilActualExpiry} days left`,
//       };
//     } else {
//       return {
//         main: `${urgencyData.daysUntilActualExpiry} day${
//           urgencyData.daysUntilActualExpiry !== 1 ? "s" : ""
//         } left`,
//         sub: `Forced schedule: ${urgencyData.daysUntilForcedExpiry} days`,
//       };
//     }
//   };

//   // FIXED: Calculate urgency counts with proper array handling and null checks
//   const urgencyCounts = {
//     expired: Array.isArray(expiringJobs)
//       ? expiringJobs.filter((job) => {
//           if (!job || !job.expiryDate) return false;
//           const urgencyData = getForcedExpiryUrgency(job.expiryDate);
//           return urgencyData.level === "expired";
//         }).length
//       : 0,
//     critical: Array.isArray(expiringJobs)
//       ? expiringJobs.filter((job) => {
//           if (!job || !job.expiryDate) return false;
//           const urgencyData = getForcedExpiryUrgency(job.expiryDate);
//           return urgencyData.level === "critical";
//         }).length
//       : 0,
//     warning: Array.isArray(expiringJobs)
//       ? expiringJobs.filter((job) => {
//           if (!job || !job.expiryDate) return false;
//           const urgencyData = getForcedExpiryUrgency(job.expiryDate);
//           return urgencyData.level === "warning";
//         }).length
//       : 0,
//     normal: Array.isArray(expiringJobs)
//       ? expiringJobs.filter((job) => {
//           if (!job || !job.expiryDate) return false;
//           const urgencyData = getForcedExpiryUrgency(job.expiryDate);
//           return urgencyData.level === "normal";
//         }).length
//       : 0,
//   };

//   return (
//     <Transition appear show={isOpen} as={Fragment}>
//       <Dialog as="div" className="relative z-50" onClose={onClose}>
//         <Transition.Child
//           as={Fragment}
//           enter="ease-out duration-300"
//           enterFrom="opacity-0"
//           enterTo="opacity-100"
//           leave="ease-in duration-200"
//           leaveFrom="opacity-100"
//           leaveTo="opacity-0"
//         >
//           <div className="fixed inset-0 bg-black bg-opacity-25" />
//         </Transition.Child>

//         <div className="fixed inset-0 overflow-y-auto">
//           <div className="flex min-h-full items-center justify-center p-4 text-center">
//             <Transition.Child
//               as={Fragment}
//               enter="ease-out duration-300"
//               enterFrom="opacity-0 scale-95"
//               enterTo="opacity-100 scale-100"
//               leave="ease-in duration-200"
//               leaveFrom="opacity-100 scale-100"
//               leaveTo="opacity-0 scale-95"
//             >
//               <Dialog.Panel className="w-full max-w-6xl transform overflow-hidden rounded-2xl bg-white text-left align-middle shadow-xl transition-all">
//                 {/* Header */}
//                 <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
//                   <div className="flex items-center justify-between">
//                     <div className="flex items-center space-x-3">
//                       <div className="p-2 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg">
//                         <ExclamationTriangleIcon className="h-6 w-6 text-white" />
//                       </div>
//                       <div>
//                         <Dialog.Title
//                           as="h3"
//                           className="text-xl font-bold text-gray-900"
//                         >
//                           All Expiring Jobs (Forced Schedule)
//                         </Dialog.Title>
//                         <p className="text-sm text-gray-600">
//                           Monitor jobs with forced expiry alerts (
//                           {FORCED_EXPIRY_OFFSET_DAYS} days early warning)
//                         </p>
//                       </div>
//                     </div>
//                     <button
//                       onClick={onClose}
//                       className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
//                     >
//                       <XMarkIcon className="h-6 w-6" />
//                     </button>
//                   </div>
//                 </div>

//                 {/* Stats Bar */}
//                 <div className="px-6 py-4 bg-gray-50 border-b">
//                   <div className="grid grid-cols-4 gap-4">
//                     <div className="flex items-center space-x-2">
//                       <div className="w-3 h-3 bg-red-500 rounded-full"></div>
//                       <span className="text-sm font-medium text-gray-700">
//                         Expired (Forced): {urgencyCounts.expired}
//                       </span>
//                     </div>
//                     <div className="flex items-center space-x-2">
//                       <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
//                       <span className="text-sm font-medium text-gray-700">
//                         Critical (Forced): {urgencyCounts.critical}
//                       </span>
//                     </div>
//                     <div className="flex items-center space-x-2">
//                       <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
//                       <span className="text-sm font-medium text-gray-700">
//                         Warning (Forced): {urgencyCounts.warning}
//                       </span>
//                     </div>
//                     <div className="flex items-center space-x-2">
//                       <div className="w-3 h-3 bg-green-500 rounded-full"></div>
//                       <span className="text-sm font-medium text-gray-700">
//                         Normal: {urgencyCounts.normal}
//                       </span>
//                     </div>
//                   </div>
//                   <div className="mt-2 text-xs text-gray-500">
//                     * Forced schedule shows items as expiring{" "}
//                     {FORCED_EXPIRY_OFFSET_DAYS} days before actual expiry date
//                   </div>
//                 </div>

//                 {/* Controls */}
//                 <div className="px-6 py-4 bg-white border-b">
//                   <div className="flex flex-wrap items-center justify-between gap-4">
//                     {/* Search and Filters */}
//                     <div className="flex items-center space-x-4 flex-1">
//                       {/* Search */}
//                       <div className="relative min-w-[250px]">
//                         <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
//                           <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
//                         </div>
//                         <input
//                           type="text"
//                           placeholder="Search jobs..."
//                           value={searchTerm}
//                           onChange={(e) => setSearchTerm(e.target.value)}
//                           className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
//                         />
//                       </div>

//                       {/* Urgency Filter */}
//                       <select
//                         value={urgencyFilter}
//                         onChange={(e) => setUrgencyFilter(e.target.value)}
//                         className="block py-2 px-3 border border-gray-300 bg-white rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
//                       >
//                         <option value="all">All Urgency Levels</option>
//                         <option value="expired">Expired (Forced)</option>
//                         <option value="critical">Critical (Forced)</option>
//                         <option value="warning">Warning (Forced)</option>
//                         <option value="normal">Normal</option>
//                       </select>

//                       {/* Sort By */}
//                       <select
//                         value={sortBy}
//                         onChange={(e) => setSortBy(e.target.value)}
//                         className="block py-2 px-3 border border-gray-300 bg-white rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
//                       >
//                         <option value="urgency">
//                           Sort by Urgency (Forced)
//                         </option>
//                         <option value="expiry">Sort by Expiry Date</option>
//                         <option value="client">Sort by Client</option>
//                         <option value="service">Sort by Service</option>
//                       </select>
//                     </div>

//                     {/* Action Buttons */}
//                     <div className="flex items-center space-x-3">
//                       <button
//                         onClick={sendNotifications}
//                         className="inline-flex items-center px-3 py-2 border border-orange-300 rounded-lg text-sm font-medium text-orange-700 bg-orange-50 hover:bg-orange-100 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-colors"
//                       >
//                         <BellIcon className="h-4 w-4 mr-2" />
//                         Send Alerts (Forced)
//                       </button>
//                       <button
//                         onClick={exportToExcel}
//                         className="inline-flex items-center px-3 py-2 border border-blue-300 rounded-lg text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
//                       >
//                         <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
//                         Export Excel
//                       </button>
//                     </div>
//                   </div>
//                 </div>

//                 {/* Content */}
//                 <div className="px-6 py-4 max-h-[600px] overflow-y-auto">
//                   {isLoading ? (
//                     <div className="space-y-4">
//                       {Array(5)
//                         .fill(0)
//                         .map((_, index) => (
//                           <div
//                             key={index}
//                             className="animate-pulse bg-gray-100 rounded-lg p-4 h-24"
//                           ></div>
//                         ))}
//                     </div>
//                   ) : Array.isArray(filteredJobs) && filteredJobs.length > 0 ? (
//                     <div className="space-y-4">
//                       {filteredJobs.map((job, index) => {
//                         // Safety check for job object
//                         if (!job) return null;

//                         const urgencyData = getForcedExpiryUrgency(
//                           job.expiryDate
//                         );
//                         const urgencyConfig = getUrgencyConfig(
//                           urgencyData.level
//                         );
//                         const UrgencyIcon = urgencyConfig.icon;
//                         const formattedDays = formatDaysUntilExpiry(job);

//                         return (
//                           <div
//                             key={job.jobId || `job-${index}`}
//                             className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all duration-200 hover:border-blue-300"
//                           >
//                             <div className="flex items-start justify-between">
//                               {/* Job Info */}
//                               <div className="flex-1 min-w-0">
//                                 <div className="flex items-start space-x-4">
//                                   {/* Company Icon */}
//                                   <div className="flex-shrink-0 p-2 bg-gray-100 rounded-lg">
//                                     <BuildingOfficeIcon className="h-5 w-5 text-gray-600" />
//                                   </div>

//                                   {/* Details */}
//                                   <div className="flex-1 min-w-0">
//                                     <div className="flex items-center space-x-3 mb-2">
//                                       <h4 className="text-lg font-semibold text-gray-900 truncate">
//                                         {job.clientName || "Unknown Client"}
//                                       </h4>
//                                       <span
//                                         className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full border ${urgencyConfig.color}`}
//                                       >
//                                         <UrgencyIcon className="h-3 w-3 mr-1" />
//                                         {urgencyConfig.label}
//                                       </span>
//                                     </div>

//                                     <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
//                                       <div className="flex items-center space-x-1">
//                                         <DocumentTextIcon className="h-4 w-4" />
//                                         <span>#{job.jobNumber || "N/A"}</span>
//                                       </div>
//                                       <div className="flex items-center space-x-1">
//                                         <BuildingOfficeIcon className="h-4 w-4" />
//                                         <span className="truncate">
//                                           {job.serviceType || "Unknown Service"}
//                                         </span>
//                                       </div>
//                                       <div className="flex items-center space-x-1">
//                                         <UserIcon className="h-4 w-4" />
//                                         <span className="truncate">
//                                           {job.assignedPerson?.name ||
//                                             "Unassigned"}
//                                         </span>
//                                       </div>
//                                       <div className="flex items-center space-x-1">
//                                         <CalendarIcon className="h-4 w-4" />
//                                         <span>
//                                           {job.expiryDate
//                                             ? new Date(
//                                                 job.expiryDate
//                                               ).toLocaleDateString()
//                                             : "No date set"}
//                                         </span>
//                                       </div>
//                                     </div>

//                                     {job.companyName && (
//                                       <p className="mt-1 text-sm text-gray-500">
//                                         Company: {job.companyName}
//                                       </p>
//                                     )}
//                                   </div>
//                                 </div>
//                               </div>

//                               {/* Status and Urgency */}
//                               <div className="flex flex-col items-end space-y-2 ml-4">
//                                 <span
//                                   className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
//                                     job.status || "unknown"
//                                   )}`}
//                                 >
//                                   {(job.status || "unknown")
//                                     .replace("_", " ")
//                                     .toUpperCase()}
//                                 </span>
//                                 <div
//                                   className={`text-right ${urgencyConfig.textColor}`}
//                                 >
//                                   <div className="text-sm font-medium">
//                                     {formattedDays.main}
//                                   </div>
//                                   <div className="text-xs">
//                                     {formattedDays.sub}
//                                   </div>
//                                   {job.expiryType && (
//                                     <div className="text-xs mt-1">
//                                       {job.expiryType}
//                                     </div>
//                                   )}
//                                 </div>
//                               </div>
//                             </div>
//                           </div>
//                         );
//                       })}
//                     </div>
//                   ) : (
//                     <div className="text-center py-12">
//                       <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto mb-4" />
//                       <h3 className="text-lg font-medium text-gray-900 mb-2">
//                         No expiring jobs found
//                       </h3>
//                       <p className="text-gray-500">
//                         {searchTerm || urgencyFilter !== "all"
//                           ? "Try adjusting your filters to see more results."
//                           : `All jobs are within the forced expiry schedule (${FORCED_EXPIRY_OFFSET_DAYS} days early warning).`}
//                       </p>
//                       {/* Debug info */}
//                       <div className="mt-4 text-xs text-gray-400">
//                         Debug: Jobs array length:{" "}
//                         {Array.isArray(expiringJobs)
//                           ? expiringJobs.length
//                           : "Not an array"}
//                       </div>
//                     </div>
//                   )}
//                 </div>

//                 {/* Footer */}
//                 <div className="px-6 py-4 bg-gray-50 border-t">
//                   <div className="flex items-center justify-between">
//                     <div className="text-sm text-gray-600">
//                       Showing{" "}
//                       {Array.isArray(filteredJobs) ? filteredJobs.length : 0} of{" "}
//                       {Array.isArray(expiringJobs) ? expiringJobs.length : 0}{" "}
//                       jobs (with {FORCED_EXPIRY_OFFSET_DAYS}-day forced
//                       schedule)
//                     </div>
//                     <div className="flex space-x-3">
//                       <button
//                         onClick={onClose}
//                         className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
//                       >
//                         Close
//                       </button>
//                       <button
//                         onClick={() =>
//                           (window.location.href = "/expiring-jobs")
//                         }
//                         className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
//                       >
//                         View Full Page
//                       </button>
//                     </div>
//                   </div>
//                 </div>
//               </Dialog.Panel>
//             </Transition.Child>
//           </div>
//         </div>
//       </Dialog>
//     </Transition>
//   );
// };

// export default ViewAllExpiringJobsModal;
