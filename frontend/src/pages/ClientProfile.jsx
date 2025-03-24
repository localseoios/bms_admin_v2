import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import axiosInstance from "../utils/axios";
import {
  UserCircleIcon,
  CalendarIcon,
  UserIcon,
  BuildingOfficeIcon,
  MapPinIcon,
  DocumentTextIcon,
  ArrowLeftIcon,
  PencilIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  BriefcaseIcon,
  ChevronDownIcon,
  SparklesIcon,
  DocumentIcon,
  IdentificationIcon,
  EnvelopeIcon,
} from "@heroicons/react/24/outline";

function ClientProfile() {
  const { gmail } = useParams();
  const [client, setClient] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedService, setExpandedService] = useState(null);
  const [jobTimelines, setJobTimelines] = useState({});
  const [loadingTimelines, setLoadingTimelines] = useState({});

  useEffect(() => {
    const fetchClientData = async () => {
      try {
        const response = await axiosInstance.get(`/clients/${gmail}`);
        setClient(response.data.client);
        setJobs(response.data.jobs);
        setExpandedService(response.data.jobs[0]?._id || null);
        setIsLoading(false);
      } catch (err) {
        console.error("Error fetching client data:", err);
        setError("Failed to load client data. Please try again later.");
        setIsLoading(false);
      }
    };
    fetchClientData();
  }, [gmail]);

  // Fetch timeline data when a service is expanded
  useEffect(() => {
    if (expandedService) {
      fetchJobTimeline(expandedService);
    }
  }, [expandedService]);

  const fetchJobTimeline = async (jobId) => {
    // Skip if we already have the timeline data
    if (jobTimelines[jobId]) return;

    setLoadingTimelines((prev) => ({ ...prev, [jobId]: true }));

    try {
      const response = await axiosInstance.get(`/jobs/${jobId}/timeline`);
      setJobTimelines((prev) => ({
        ...prev,
        [jobId]: response.data,
      }));
      setLoadingTimelines((prev) => ({ ...prev, [jobId]: false }));
    } catch (err) {
      console.error(`Error fetching timeline for job ${jobId}:`, err);
      setLoadingTimelines((prev) => ({ ...prev, [jobId]: false }));
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "text-green-600 bg-green-100 ring-1 ring-green-600/20";
      case "in-progress":
        return "text-blue-600 bg-blue-100 ring-1 ring-blue-600/20";
      case "pending":
        return "text-yellow-600 bg-yellow-100 ring-1 ring-yellow-600/20";
      case "rejected":
        return "text-red-600 bg-red-100 ring-1 ring-red-600/20";
      default:
        return "text-gray-600 bg-gray-100 ring-1 ring-gray-600/20";
    }
  };

  const getTimelineStatusIcon = (status) => {
    switch (status) {
      case "created":
        return DocumentTextIcon;
      case "screening_done":
        return CheckCircleIcon;
      case "rejected":
        return XCircleIcon;
      case "corrected":
        return PencilIcon;
      default:
        return ClockIcon;
    }
  };

  const getTimelineStatus = (status) => {
    switch (status) {
      case "created":
      case "screening_done":
      case "rejected":
      case "corrected":
        return "completed";
      default:
        return "in-progress";
    }
  };

  const getTimelineTitle = (status) => {
    switch (status) {
      case "created":
        return "Service Requested";
      case "screening_done":
        return "Screening Done";
      case "rejected":
        return "Job Rejected";
      case "corrected":
        return "Job Resubmitted";
      default:
        return "Processing";
    }
  };

  const getServiceStatusBadge = (status) => {
    const colors = {
      approved: "bg-green-50 text-green-700 ring-green-600/20",
      rejected: "bg-red-50 text-red-700 ring-red-600/20",
      corrected: "bg-blue-50 text-blue-700 ring-blue-600/20",
      pending: "bg-yellow-50 text-yellow-700 ring-yellow-600/20",
    };
    return colors[status] || colors["pending"];
  };

  // Find screening information from timeline
  const getScreeningInfo = (jobId) => {
    const timeline = jobTimelines[jobId] || [];
    const screeningEvent = timeline.find(
      (event) => event.status === "screening_done"
    );

    if (screeningEvent) {
      return {
        date: format(new Date(screeningEvent.timestamp), "PPp"),
        person: screeningEvent.updatedBy ? "Compliance Officer" : "Unknown", // We'll need to fetch user details if needed
      };
    }

    return { date: "Not screened yet", person: "N/A" };
  };

  // Map timeline data to UI format
  const mapTimelineData = (jobId) => {
    const timeline = jobTimelines[jobId] || [];

    // If timeline data is not yet loaded, return a loading placeholder
    if (!timeline.length && loadingTimelines[jobId]) {
      return [
        {
          id: "loading",
          title: "Loading timeline...",
          description: "Please wait",
          date: new Date(),
          status: "in-progress",
          icon: ClockIcon,
        },
      ];
    }

    // If no timeline data exists, return a default timeline
    if (!timeline.length) {
      const job = jobs.find((j) => j._id === jobId);
      return [
        {
          id: 1,
          title: "Service Requested",
          description: `Requested ${job?.serviceType}`,
          date: job?.createdAt,
          status: "completed",
          icon: DocumentTextIcon,
        },
      ];
    }

    // Map the timeline data from API to UI format
    return timeline.map((event, index) => ({
      id: index,
      title: getTimelineTitle(event.status),
      description: event.description,
      date: event.timestamp,
      status: getTimelineStatus(event.status),
      icon: getTimelineStatusIcon(event.status),
    }));
  };

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-100 via-blue-50 to-white"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="flex items-center justify-between mb-8"
        >
          <div className="flex items-center space-x-4">
            <Link
              to="/compliance"
              className="inline-flex items-center px-4 py-2 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-white/50 transition-all duration-200"
            >
              <ArrowLeftIcon className="h-5 w-5 mr-2" />
              Back to Compliance
            </Link>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {}}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white/70 backdrop-blur-sm border border-gray-200 rounded-xl hover:bg-white hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 shadow-sm hover:shadow-md"
          >
            <PencilIcon className="h-4 w-4 mr-2" />
            Edit Profile
          </motion.button>
        </motion.div>

        {/* Client Profile Card */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 overflow-hidden hover:shadow-2xl transition-all duration-500"
        >
          <div className="px-8 py-10">
            <div className="flex items-start space-x-6">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="h-24 w-24 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center ring-4 ring-blue-100 shadow-lg"
              >
                <UserCircleIcon className="h-12 w-12 text-white" />
              </motion.div>
              <div className="flex-1">
                <motion.h1
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent"
                >
                  {client.name}
                </motion.h1>
                <div className="flex items-center mt-1">
                  <EnvelopeIcon className="h-4 w-4 text-gray-500 mr-1" />
                  <motion.p
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="text-gray-500"
                  >
                    {client.gmail}
                  </motion.p>
                </div>
                <motion.div
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  className="mt-4 flex flex-wrap gap-2"
                >
                  {jobs.map((job, index) => (
                    <motion.span
                      key={job._id}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.3, delay: 0.5 + index * 0.1 }}
                      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getServiceStatusBadge(
                        job.status
                      )} shadow-sm`}
                    >
                      <BriefcaseIcon className="h-4 w-4 mr-1.5" />
                      {job.serviceType}
                    </motion.span>
                  ))}
                </motion.div>
              </div>
            </div>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              <div className="space-y-4">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="flex items-center space-x-3 p-4 rounded-xl bg-green-50/50 border border-green-100/50"
                >
                  <MapPinIcon className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      Starting Point
                    </p>
                    <p className="text-sm font-medium text-gray-900">
                      {client.startingPoint}
                    </p>
                  </div>
                </motion.div>
              </div>
              <div className="space-y-4">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="flex items-center space-x-3 p-4 rounded-xl bg-indigo-50/50 border border-indigo-100/50"
                >
                  <BriefcaseIcon className="h-5 w-5 text-indigo-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      Total Services
                    </p>
                    <p className="text-sm font-medium text-gray-900">
                      {jobs.length} active services
                    </p>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Services Section */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="mt-8"
        >
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
            <BriefcaseIcon className="h-6 w-6 mr-2 text-blue-600" />
            Client Services
          </h2>
          <div className="space-y-4">
            {jobs.map((job, index) => (
              <motion.div
                key={job._id}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.7 + index * 0.1 }}
                className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 overflow-hidden hover:shadow-2xl transition-all duration-500"
              >
                <motion.div
                  whileHover={{ backgroundColor: "rgba(249, 250, 251, 0.5)" }}
                  className="px-6 py-4 cursor-pointer transition-colors duration-200"
                  onClick={() =>
                    setExpandedService(
                      expandedService === job._id ? null : job._id
                    )
                  }
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        className={`p-2 rounded-lg ${getServiceStatusBadge(
                          job.status
                        )}`}
                      >
                        <BriefcaseIcon className="h-5 w-5" />
                      </motion.div>
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">
                          {job.serviceType}
                        </h3>
                        <p className="text-sm text-gray-500">
                          Assigned to {job.assignedPerson}
                        </p>
                      </div>
                    </div>
                    <motion.div
                      animate={{
                        rotate: expandedService === job._id ? 180 : 0,
                      }}
                      transition={{ duration: 0.3 }}
                    >
                      <ChevronDownIcon className="h-5 w-5 text-gray-400" />
                    </motion.div>
                  </div>
                </motion.div>

                <AnimatePresence>
                  {expandedService === job._id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 py-4 border-t border-gray-100">
                        {/* Service Details Section */}
                        <motion.div
                          initial={{ y: 20, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ delay: 0.1 }}
                          className="bg-gray-50/70 rounded-xl p-5 mb-6"
                        >
                          <h4 className="text-base font-medium text-gray-900 mb-4">
                            Service Information
                          </h4>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Left Column */}
                            <div className="space-y-4">
                              {/* Service Type */}
                              <div className="flex items-start">
                                <div className="flex-shrink-0 mt-0.5">
                                  <BriefcaseIcon className="h-5 w-5 text-blue-600" />
                                </div>
                                <div className="ml-3">
                                  <h5 className="text-sm font-medium text-gray-900">
                                    Service Type
                                  </h5>
                                  <p className="text-sm text-gray-700">
                                    {job.serviceType}
                                  </p>
                                </div>
                              </div>

                              {/* Assigned Person */}
                              <div className="flex items-start">
                                <div className="flex-shrink-0 mt-0.5">
                                  <UserIcon className="h-5 w-5 text-blue-600" />
                                </div>
                                <div className="ml-3">
                                  <h5 className="text-sm font-medium text-gray-900">
                                    Assigned Person
                                  </h5>
                                  <p className="text-sm text-gray-700">
                                    {job.assignedPerson}
                                  </p>
                                </div>
                              </div>

                              {/* Client Name */}
                              <div className="flex items-start">
                                <div className="flex-shrink-0 mt-0.5">
                                  <UserCircleIcon className="h-5 w-5 text-blue-600" />
                                </div>
                                <div className="ml-3">
                                  <h5 className="text-sm font-medium text-gray-900">
                                    Client Name
                                  </h5>
                                  <p className="text-sm text-gray-700">
                                    {job.clientName}
                                  </p>
                                </div>
                              </div>

                              {/* Gmail */}
                              <div className="flex items-start">
                                <div className="flex-shrink-0 mt-0.5">
                                  <EnvelopeIcon className="h-5 w-5 text-blue-600" />
                                </div>
                                <div className="ml-3">
                                  <h5 className="text-sm font-medium text-gray-900">
                                    Email
                                  </h5>
                                  <p className="text-sm text-gray-700">
                                    {job.gmail}
                                  </p>
                                </div>
                              </div>
                            </div>

                            {/* Right Column */}
                            <div className="space-y-4">
                              {/* Starting Point */}
                              <div className="flex items-start">
                                <div className="flex-shrink-0 mt-0.5">
                                  <MapPinIcon className="h-5 w-5 text-blue-600" />
                                </div>
                                <div className="ml-3">
                                  <h5 className="text-sm font-medium text-gray-900">
                                    Starting Point
                                  </h5>
                                  <p className="text-sm text-gray-700">
                                    {job.startingPoint}
                                  </p>
                                </div>
                              </div>

                              {/* Documents */}
                              <div className="flex items-start">
                                <div className="flex-shrink-0 mt-0.5">
                                  <DocumentIcon className="h-5 w-5 text-blue-600" />
                                </div>
                                <div className="ml-3">
                                  <h5 className="text-sm font-medium text-gray-900">
                                    Documents
                                  </h5>
                                  <div className="mt-1 space-y-1">
                                    <a
                                      href={job.documentPassport}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center"
                                    >
                                      <DocumentTextIcon className="h-4 w-4 mr-1" />
                                      Passport
                                    </a>
                                    <a
                                      href={job.documentID}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center"
                                    >
                                      <IdentificationIcon className="h-4 w-4 mr-1" />
                                      ID Document
                                    </a>
                                  </div>
                                </div>
                              </div>

                              {/* Screening Information */}
                              <div className="flex items-start">
                                <div className="flex-shrink-0 mt-0.5">
                                  <ClockIcon className="h-5 w-5 text-blue-600" />
                                </div>
                                <div className="ml-3">
                                  <h5 className="text-sm font-medium text-gray-900">
                                    Screening Information
                                  </h5>
                                  <p className="text-sm text-gray-700">
                                    <span className="block">
                                      Date: {getScreeningInfo(job._id).date}
                                    </span>
                                    <span className="block">
                                      Person: {getScreeningInfo(job._id).person}
                                    </span>
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Job Details - Full Width */}
                          <div className="mt-6">
                            <h5 className="text-sm font-medium text-gray-900 mb-2">
                              Job Details
                            </h5>
                            <p className="text-sm text-gray-700 bg-white/50 p-3 rounded-lg border border-gray-100">
                              {job.jobDetails}
                            </p>
                          </div>

                          {/* Special Description - Full Width */}
                          {job.specialDescription && (
                            <div className="mt-4">
                              <h5 className="text-sm font-medium text-gray-900 mb-2">
                                Special Description
                              </h5>
                              <p className="text-sm italic text-gray-600 bg-white/50 p-3 rounded-lg border border-gray-100">
                                {job.specialDescription}
                              </p>
                            </div>
                          )}
                        </motion.div>

                        {/* Timeline Section */}
                        <motion.div
                          initial={{ y: 20, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ delay: 0.3 }}
                          className="mt-6"
                        >
                          <h4 className="text-base font-medium text-gray-900 mb-4">
                            Service Timeline
                          </h4>
                          <div className="flow-root">
                            <ul className="-mb-8">
                              {mapTimelineData(job._id).map(
                                (event, eventIdx) => (
                                  <motion.li
                                    key={event.id}
                                    initial={{ x: -20, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    transition={{ delay: 0.4 + eventIdx * 0.1 }}
                                  >
                                    <div className="relative pb-8">
                                      {eventIdx !==
                                      mapTimelineData(job._id).length - 1 ? (
                                        <span
                                          className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                                          aria-hidden="true"
                                        />
                                      ) : null}
                                      <div className="relative flex space-x-3">
                                        <motion.div
                                          whileHover={{ scale: 1.1 }}
                                          transition={{
                                            type: "spring",
                                            stiffness: 400,
                                            damping: 10,
                                          }}
                                        >
                                          <span
                                            className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${getStatusColor(
                                              event.status
                                            )}`}
                                          >
                                            <event.icon
                                              className="h-5 w-5"
                                              aria-hidden="true"
                                            />
                                          </span>
                                        </motion.div>
                                        <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                                          <div>
                                            <p className="text-sm font-medium text-gray-900">
                                              {event.title}
                                              {event.status === "completed" && (
                                                <motion.span
                                                  initial={{ scale: 0 }}
                                                  animate={{ scale: 1 }}
                                                  className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-50 text-green-700"
                                                >
                                                  <CheckCircleIcon className="h-3 w-3 mr-1" />
                                                  Done
                                                </motion.span>
                                              )}
                                            </p>
                                            <p className="mt-1 text-sm text-gray-500">
                                              {event.description}
                                            </p>
                                          </div>
                                          <div className="whitespace-nowrap text-right text-sm text-gray-500">
                                            {format(
                                              new Date(event.date),
                                              "PPp"
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </motion.li>
                                )
                              )}
                            </ul>
                          </div>
                        </motion.div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

export default ClientProfile;
