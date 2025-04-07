// import { useState, useEffect } from "react";
// import { useNavigate } from "react-router-dom";
// import { motion } from "framer-motion";
// import {
//   MagnifyingGlassIcon,
//   DocumentTextIcon,
//   ArrowPathIcon,
//   ExclamationCircleIcon,
//   CurrencyDollarIcon,
//   CalendarIcon,
//   UserIcon,
//   BriefcaseIcon,
//   ChevronDownIcon,
//   ChevronUpIcon,
//   ArrowDownTrayIcon,
//   EyeIcon,
// } from "@heroicons/react/24/outline";
// import accountService from "../../utils/accountService";
// import { toast } from "react-toastify";

// const AllPaymentRecords = () => {
//   const navigate = useNavigate();
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [payments, setPayments] = useState([]);
//   const [searchQuery, setSearchQuery] = useState("");
//   const [expandedPayment, setExpandedPayment] = useState(null);
//   const [pagination, setPagination] = useState({
//     currentPage: 1,
//     totalPages: 1,
//     totalItems: 0,
//     itemsPerPage: 10,
//   });
//   const [filterYear, setFilterYear] = useState(new Date().getFullYear());

//   // Get current year and previous years for filtering
//   const currentYear = new Date().getFullYear();
//   const yearOptions = [currentYear, currentYear - 1, currentYear - 2];

//   // Fetch all payment records
//   useEffect(() => {
//     const fetchPaymentRecords = async () => {
//       try {
//         setLoading(true);
//         const response = await accountService.getAllPaymentRecords(
//           pagination.currentPage,
//           pagination.itemsPerPage,
//           searchQuery,
//           filterYear
//         );

//         if (response && response.payments) {
//           setPayments(response.payments);
//           setPagination(response.pagination || pagination);
//         } else if (Array.isArray(response)) {
//           setPayments(response);
//           setPagination((prev) => ({
//             ...prev,
//             totalItems: response.length,
//             totalPages: Math.ceil(response.length / prev.itemsPerPage) || 1,
//           }));
//         } else {
//           console.warn("Unexpected response format:", response);
//           setPayments([]);
//         }

//         setError(null);
//       } catch (err) {
//         console.error("Error fetching payment records:", err);
//         setError("Failed to load payment records. Please try again.");
//         setPayments([]);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchPaymentRecords();
//   }, [
//     pagination.currentPage,
//     pagination.itemsPerPage,
//     searchQuery,
//     filterYear,
//   ]);

//   // Handle refresh
//   const handleRefresh = () => {
//     setPagination((prev) => ({ ...prev, currentPage: 1 }));
//     toast.info("Refreshing payment records...");
//   };

//   // Format currency
//   const formatCurrency = (amount) => {
//     return new Intl.NumberFormat("en-US", {
//       style: "currency",
//       currency: "USD",
//     }).format(amount || 0);
//   };

//   // Format date
//   const formatDate = (dateString) => {
//     if (!dateString) return "N/A";
//     return new Date(dateString).toLocaleDateString();
//   };

//   // Get month name
//   const getMonthName = (monthNum) => {
//     const months = [
//       "January",
//       "February",
//       "March",
//       "April",
//       "May",
//       "June",
//       "July",
//       "August",
//       "September",
//       "October",
//       "November",
//       "December",
//     ];
//     return months[monthNum] || "Unknown";
//   };

//   // Toggle payment details
//   const toggleExpand = (paymentId) => {
//     setExpandedPayment(expandedPayment === paymentId ? null : paymentId);
//   };

//   // Navigate to client profile
//   const viewClient = (gmail) => {
//     navigate(`/account-management/client/${gmail}`);
//   };

//   // Handle search
//   const handleSearch = (e) => {
//     setSearchQuery(e.target.value);
//     setPagination((prev) => ({ ...prev, currentPage: 1 }));
//   };

//   return (
//     <div className="bg-white rounded-xl shadow-lg border border-gray-200 mb-8">
//       <div className="p-6 border-b border-gray-200">
//         <div className="flex flex-col md:flex-row justify-between items-center mb-4">
//           <h2 className="text-xl font-bold text-gray-900 flex items-center mb-4 md:mb-0">
//             <DocumentTextIcon className="h-6 w-6 mr-2 text-indigo-600" />
//             All Payment Records
//           </h2>

//           <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 w-full md:w-auto">
//             <div className="relative flex-grow">
//               <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
//                 <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
//               </div>
//               <input
//                 type="text"
//                 className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
//                 placeholder="Search payments..."
//                 value={searchQuery}
//                 onChange={handleSearch}
//               />
//             </div>

//             <select
//               value={filterYear}
//               onChange={(e) => setFilterYear(Number(e.target.value))}
//               className="block w-full sm:w-auto pl-3 pr-10 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
//             >
//               <option value="">All Years</option>
//               {yearOptions.map((year) => (
//                 <option key={year} value={year}>
//                   {year}
//                 </option>
//               ))}
//             </select>

//             <button
//               onClick={handleRefresh}
//               className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
//             >
//               <ArrowPathIcon className="h-5 w-5 mr-1.5" />
//               Refresh
//             </button>
//           </div>
//         </div>
//       </div>

//       {loading ? (
//         <div className="text-center py-12">
//           <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto mb-3"></div>
//           <p className="text-gray-500">Loading payment records...</p>
//         </div>
//       ) : error ? (
//         <div className="text-center py-12">
//           <ExclamationCircleIcon className="h-12 w-12 text-red-500 mx-auto mb-3" />
//           <h3 className="text-lg font-medium text-gray-900 mb-2">
//             Error Loading Records
//           </h3>
//           <p className="text-gray-500 mb-4">{error}</p>
//           <button
//             onClick={handleRefresh}
//             className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
//           >
//             <ArrowPathIcon className="h-5 w-5 mr-1.5" />
//             Try Again
//           </button>
//         </div>
//       ) : payments.length === 0 ? (
//         <div className="text-center py-12">
//           <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
//           <h3 className="text-lg font-medium text-gray-900 mb-2">
//             No Payment Records Found
//           </h3>
//           <p className="text-gray-500">
//             {searchQuery || filterYear
//               ? "Try adjusting your search or filters."
//               : "No payment records have been added yet."}
//           </p>
//         </div>
//       ) : (
//         <>
//           {/* Payment records list */}
//           <div className="overflow-x-auto">
//             <table className="min-w-full divide-y divide-gray-200">
//               <thead className="bg-gray-50">
//                 <tr>
//                   <th
//                     scope="col"
//                     className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
//                   >
//                     Month/Year
//                   </th>
//                   <th
//                     scope="col"
//                     className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
//                   >
//                     Client
//                   </th>
//                   <th
//                     scope="col"
//                     className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
//                   >
//                     Service Type
//                   </th>
//                   <th
//                     scope="col"
//                     className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
//                   >
//                     Total Amount
//                   </th>
//                   <th
//                     scope="col"
//                     className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
//                   >
//                     Status
//                   </th>
//                   <th
//                     scope="col"
//                     className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
//                   >
//                     Date Added
//                   </th>
//                   <th
//                     scope="col"
//                     className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
//                   >
//                     Actions
//                   </th>
//                 </tr>
//               </thead>
//               <tbody className="bg-white divide-y divide-gray-200">
//                 {payments.map((payment) => (
//                   <React.Fragment key={payment.id || payment._id}>
//                     <tr
//                       className="hover:bg-gray-50 cursor-pointer"
//                       onClick={() => toggleExpand(payment.id || payment._id)}
//                     >
//                       <td className="px-4 py-4 whitespace-nowrap">
//                         <div className="flex items-center">
//                           <CalendarIcon className="h-5 w-5 text-indigo-500 mr-2" />
//                           <span className="text-sm font-medium text-gray-900">
//                             {getMonthName(payment.month)} {payment.year}
//                           </span>
//                         </div>
//                       </td>
//                       <td className="px-4 py-4 whitespace-nowrap">
//                         <div
//                           className="flex items-center cursor-pointer text-indigo-600 hover:text-indigo-800"
//                           onClick={(e) => {
//                             e.stopPropagation();
//                             viewClient(payment.clientEmail);
//                           }}
//                         >
//                           <UserIcon className="h-5 w-5 mr-2" />
//                           <div className="text-sm">
//                             <p className="font-medium">{payment.clientName}</p>
//                             <p className="text-gray-500">
//                               {payment.clientEmail}
//                             </p>
//                           </div>
//                         </div>
//                       </td>
//                       <td className="px-4 py-4 whitespace-nowrap">
//                         <div className="flex items-center">
//                           <BriefcaseIcon className="h-5 w-5 text-gray-400 mr-2" />
//                           <span className="text-sm text-gray-900">
//                             {payment.jobType}
//                           </span>
//                         </div>
//                       </td>
//                       <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
//                         {formatCurrency(payment.totalAmount)}
//                       </td>
//                       <td className="px-4 py-4 whitespace-nowrap">
//                         <span
//                           className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
//                             payment.status === "Paid"
//                               ? "bg-green-100 text-green-800"
//                               : payment.status === "Pending"
//                               ? "bg-yellow-100 text-yellow-800"
//                               : "bg-red-100 text-red-800"
//                           }`}
//                         >
//                           {payment.status}
//                         </span>
//                       </td>
//                       <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
//                         {formatDate(payment.createdAt)}
//                       </td>
//                       <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
//                         <button
//                           className="text-indigo-600 hover:text-indigo-900 mr-3"
//                           onClick={(e) => {
//                             e.stopPropagation();
//                             viewClient(payment.clientEmail);
//                           }}
//                         >
//                           <EyeIcon className="h-5 w-5" />
//                         </button>
//                         <button
//                           onClick={(e) => {
//                             e.stopPropagation();
//                             toggleExpand(payment.id || payment._id);
//                           }}
//                         >
//                           {expandedPayment === (payment.id || payment._id) ? (
//                             <ChevronUpIcon className="h-5 w-5 text-gray-500" />
//                           ) : (
//                             <ChevronDownIcon className="h-5 w-5 text-gray-500" />
//                           )}
//                         </button>
//                       </td>
//                     </tr>

//                     {/* Expanded details */}
//                     {expandedPayment === (payment.id || payment._id) && (
//                       <tr>
//                         <td colSpan="7" className="px-4 py-4 bg-gray-50">
//                           <div className="border border-gray-200 rounded-md p-4">
//                             <h4 className="text-sm font-medium text-gray-900 mb-3">
//                               Invoice Details
//                             </h4>

//                             <div className="overflow-x-auto">
//                               <table className="min-w-full divide-y divide-gray-200">
//                                 <thead className="bg-gray-100">
//                                   <tr>
//                                     <th
//                                       scope="col"
//                                       className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
//                                     >
//                                       Date
//                                     </th>
//                                     <th
//                                       scope="col"
//                                       className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
//                                     >
//                                       Description
//                                     </th>
//                                     <th
//                                       scope="col"
//                                       className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
//                                     >
//                                       Amount
//                                     </th>
//                                     <th
//                                       scope="col"
//                                       className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
//                                     >
//                                       Option
//                                     </th>
//                                     <th
//                                       scope="col"
//                                       className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
//                                     >
//                                       Payment Method
//                                     </th>
//                                     <th
//                                       scope="col"
//                                       className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
//                                     >
//                                       Document
//                                     </th>
//                                   </tr>
//                                 </thead>
//                                 <tbody className="bg-white divide-y divide-gray-200">
//                                   {payment.invoices &&
//                                     payment.invoices.map((invoice, idx) => (
//                                       <tr
//                                         key={idx}
//                                         className="hover:bg-gray-50"
//                                       >
//                                         <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
//                                           {formatDate(invoice.invoiceDate)}
//                                         </td>
//                                         <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
//                                           {invoice.description}
//                                         </td>
//                                         <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
//                                           {formatCurrency(invoice.amount)}
//                                         </td>
//                                         <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
//                                           {invoice.option || "-"}
//                                         </td>
//                                         <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
//                                           {invoice.paymentMethod}
//                                         </td>
//                                         <td className="px-3 py-2 whitespace-nowrap text-sm text-indigo-600">
//                                           {invoice.fileUrl ? (
//                                             <a
//                                               href={invoice.fileUrl}
//                                               target="_blank"
//                                               rel="noopener noreferrer"
//                                               className="inline-flex items-center hover:text-indigo-800"
//                                             >
//                                               <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
//                                               {invoice.fileName || "Download"}
//                                             </a>
//                                           ) : (
//                                             <span className="text-gray-400">
//                                               No document
//                                             </span>
//                                           )}
//                                         </td>
//                                       </tr>
//                                     ))}

//                                   {(!payment.invoices ||
//                                     payment.invoices.length === 0) && (
//                                     <tr>
//                                       <td
//                                         colSpan="6"
//                                         className="px-3 py-4 text-center text-sm text-gray-500"
//                                       >
//                                         No invoice details available
//                                       </td>
//                                     </tr>
//                                   )}
//                                 </tbody>
//                               </table>
//                             </div>

//                             {payment.notes && (
//                               <div className="mt-4 bg-yellow-50 p-3 rounded-md">
//                                 <h5 className="text-xs font-medium text-yellow-800 mb-1">
//                                   Notes:
//                                 </h5>
//                                 <p className="text-sm text-yellow-800">
//                                   {payment.notes}
//                                 </p>
//                               </div>
//                             )}
//                           </div>
//                         </td>
//                       </tr>
//                     )}
//                   </React.Fragment>
//                 ))}
//               </tbody>
//             </table>
//           </div>

//           {/* Pagination Controls */}
//           {pagination.totalPages > 1 && (
//             <div className="px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
//               <div className="flex-1 flex justify-between sm:hidden">
//                 <button
//                   onClick={() =>
//                     setPagination({
//                       ...pagination,
//                       currentPage: Math.max(1, pagination.currentPage - 1),
//                     })
//                   }
//                   disabled={pagination.currentPage === 1}
//                   className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
//                 >
//                   Previous
//                 </button>
//                 <button
//                   onClick={() =>
//                     setPagination({
//                       ...pagination,
//                       currentPage: Math.min(
//                         pagination.totalPages,
//                         pagination.currentPage + 1
//                       ),
//                     })
//                   }
//                   disabled={pagination.currentPage === pagination.totalPages}
//                   className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
//                 >
//                   Next
//                 </button>
//               </div>
//               <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
//                 <div>
//                   <p className="text-sm text-gray-700">
//                     Showing{" "}
//                     <span className="font-medium">
//                       {(pagination.currentPage - 1) * pagination.itemsPerPage +
//                         1}
//                     </span>{" "}
//                     to{" "}
//                     <span className="font-medium">
//                       {Math.min(
//                         pagination.currentPage * pagination.itemsPerPage,
//                         pagination.totalItems
//                       )}
//                     </span>{" "}
//                     of{" "}
//                     <span className="font-medium">{pagination.totalItems}</span>{" "}
//                     results
//                   </p>
//                 </div>
//                 <div>
//                   <nav
//                     className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
//                     aria-label="Pagination"
//                   >
//                     <button
//                       onClick={() =>
//                         setPagination({
//                           ...pagination,
//                           currentPage: Math.max(1, pagination.currentPage - 1),
//                         })
//                       }
//                       disabled={pagination.currentPage === 1}
//                       className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
//                     >
//                       <span className="sr-only">Previous</span>
//                       <ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
//                     </button>

//                     {/* Page number buttons */}
//                     {[...Array(Math.min(5, pagination.totalPages))].map(
//                       (_, i) => {
//                         const pageNum = i + 1;
//                         return (
//                           <button
//                             key={pageNum}
//                             onClick={() =>
//                               setPagination({
//                                 ...pagination,
//                                 currentPage: pageNum,
//                               })
//                             }
//                             className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
//                               pageNum === pagination.currentPage
//                                 ? "z-10 bg-indigo-50 border-indigo-500 text-indigo-600"
//                                 : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
//                             }`}
//                           >
//                             {pageNum}
//                           </button>
//                         );
//                       }
//                     )}

//                     <button
//                       onClick={() =>
//                         setPagination({
//                           ...pagination,
//                           currentPage: Math.min(
//                             pagination.totalPages,
//                             pagination.currentPage + 1
//                           ),
//                         })
//                       }
//                       disabled={
//                         pagination.currentPage === pagination.totalPages
//                       }
//                       className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
//                     >
//                       <span className="sr-only">Next</span>
//                       <ChevronRightIcon
//                         className="h-5 w-5"
//                         aria-hidden="true"
//                       />
//                     </button>
//                   </nav>
//                 </div>
//               </div>
//             </div>
//           )}
//         </>
//       )}
//     </div>
//   );
// };

// export default AllPaymentRecords;
