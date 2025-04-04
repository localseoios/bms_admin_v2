// // components/client/ClientNotFound.jsx
// import React from "react";
// import { Link } from "react-router-dom";

// const ClientNotFound = ({ clientId, error }) => {
//   return (
//     <div className="min-h-screen bg-gradient-to-br from-blue-100 via-blue-50 to-white flex items-center justify-center p-4">
//       <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 overflow-hidden max-w-md w-full">
//         <div className="p-6">
//           <div className="flex items-center justify-center">
//             <div className="h-16 w-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
//               <svg
//                 xmlns="http://www.w3.org/2000/svg"
//                 className="h-8 w-8 text-red-600"
//                 fill="none"
//                 viewBox="0 0 24 24"
//                 stroke="currentColor"
//               >
//                 <path
//                   strokeLinecap="round"
//                   strokeLinejoin="round"
//                   strokeWidth={2}
//                   d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
//                 />
//               </svg>
//             </div>
//           </div>

//           <h1 className="text-xl font-bold text-center text-gray-900 mb-2">
//             Client Not Found
//           </h1>

//           <p className="text-gray-600 text-center mb-6">
//             {error ||
//               `We couldn't find a client with the identifier "${clientId}". Please verify the client information and try again.`}
//           </p>

//           <div className="space-y-3">
//             <Link
//               to="/operation-management"
//               className="flex items-center justify-center w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
//             >
//               <svg
//                 xmlns="http://www.w3.org/2000/svg"
//                 className="h-5 w-5 mr-2"
//                 fill="none"
//                 viewBox="0 0 24 24"
//                 stroke="currentColor"
//               >
//                 <path
//                   strokeLinecap="round"
//                   strokeLinejoin="round"
//                   strokeWidth={2}
//                   d="M10 19l-7-7m0 0l7-7m-7 7h18"
//                 />
//               </svg>
//               Back to Operations
//             </Link>

//             <Link
//               to="/admin/jobs"
//               className="flex items-center justify-center w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
//             >
//               <svg
//                 xmlns="http://www.w3.org/2000/svg"
//                 className="h-5 w-5 mr-2"
//                 fill="none"
//                 viewBox="0 0 24 24"
//                 stroke="currentColor"
//               >
//                 <path
//                   strokeLinecap="round"
//                   strokeLinejoin="round"
//                   strokeWidth={2}
//                   d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
//                 />
//               </svg>
//               All Jobs
//             </Link>

//             <Link
//               to="/create-job"
//               className="flex items-center justify-center w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
//             >
//               <svg
//                 xmlns="http://www.w3.org/2000/svg"
//                 className="h-5 w-5 mr-2"
//                 fill="none"
//                 viewBox="0 0 24 24"
//                 stroke="currentColor"
//               >
//                 <path
//                   strokeLinecap="round"
//                   strokeLinejoin="round"
//                   strokeWidth={2}
//                   d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
//                 />
//               </svg>
//               Create New Job
//             </Link>
//           </div>

//           <div className="mt-6 pt-4 border-t border-gray-200">
//             <p className="text-sm text-gray-500 text-center">
//               If you believe this is an error, please contact system support.
//             </p>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default ClientNotFound;
