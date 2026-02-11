import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion"; // eslint-disable-line no-unused-vars
import {
  ChartBarIcon,
  ShieldCheckIcon,
  SparklesIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  BuildingOfficeIcon,
  ChartPieIcon,
  DocumentChartBarIcon,
  UserGroupIcon,
  ClipboardDocumentCheckIcon,
  DocumentTextIcon,
  UsersIcon,
  BookOpenIcon,
  FolderIcon,
  NewspaperIcon,
  DocumentDuplicateIcon,
  LockClosedIcon,
  ArchiveBoxIcon,
  ClockIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "../context/AuthContext";

const ModeSelection = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedMode, setSelectedMode] = useState(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Debug: Log user data when it changes
  React.useEffect(() => {
    console.log('ModeSelection - Current user data:', {
      name: user?.name,
      role: user?.role?.name,
      permissions: user?.role?.permissions,
      complianceManagement: user?.role?.permissions?.complianceManagement
    });
  }, [user]);

  const hasComplianceAccess = () => {
    if (!user) return false;

    // Admin always has access
    if (user.role?.name?.toLowerCase() === 'admin') return true;

    // Check complianceManagement permission (boolean)
    if (user.role?.permissions?.complianceManagement === true) return true;

    return false;
  };

  const modes = [
    {
      id: "dashboard",
      title: "Dashboard",
      subtitle: "Business Analytics & Operations",
      description: "Access comprehensive business metrics, financial reports, and operational management tools",
      icon: ChartBarIcon,
      gradient: "from-blue-600 to-cyan-600",
      bgGradient: "from-blue-50 via-cyan-50 to-blue-50",
      shadowColor: "shadow-blue-500/20",
      hoverShadow: "hover:shadow-blue-500/30",
      route: "/dashboard",
      features: [
        { icon: ChartPieIcon, text: "Real-time Analytics" },
        { icon: DocumentChartBarIcon, text: "Financial Reports" },
        { icon: UserGroupIcon, text: "User Management" },
        { icon: BuildingOfficeIcon, text: "Business Operations" },
      ],
      accentColor: "blue"
    },
    {
      id: "compliance",
      title: "Compliance",
      subtitle: "Regulatory & Risk Management",
      description: "Comprehensive compliance management with KYC, BRA, and regulatory adherence tools",
      icon: ShieldCheckIcon,
      gradient: "from-purple-600 to-indigo-600",
      bgGradient: "from-purple-50 via-indigo-50 to-purple-50",
      shadowColor: "shadow-purple-500/20",
      hoverShadow: "hover:shadow-purple-500/30",
      route: "/compliance-selection",
      features: [
        { icon: UsersIcon, text: "Staff Management" },
        { icon: ClipboardDocumentCheckIcon, text: "Client Compliance" },
        { icon: ShieldCheckIcon, text: "Risk Assessment" },
        { icon: BuildingOfficeIcon, text: "Org Structure" },
      ],
      accentColor: "purple",
      requiresComplianceAccess: true
    },
    {
      id: "compliance-resource",
      title: "Resource Center",
      subtitle: "Documentation & Guidelines",
      description: "Access compliance documentation, regulatory guidelines, templates, and knowledge base",
      icon: DocumentTextIcon,
      gradient: "from-orange-500 to-red-600",
      bgGradient: "from-orange-50 via-red-50 to-orange-50",
      shadowColor: "shadow-orange-500/20",
      hoverShadow: "hover:shadow-orange-500/30",
      route: "/compliance-resources",
      features: [
        { icon: DocumentDuplicateIcon, text: "Templates" },
        { icon: NewspaperIcon, text: "Guidelines" },
        { icon: FolderIcon, text: "Documents" },
        { icon: BookOpenIcon, text: "Knowledge Base" },
      ],
      accentColor: "orange"
    },
    {
      id: "library",
      title: "Document Library",
      subtitle: "Archive & Document History",
      description: "Access archived documents, view document history, and retrieve past versions - retained for 10 years",
      icon: ArchiveBoxIcon,
      gradient: "from-emerald-500 to-teal-600",
      bgGradient: "from-emerald-50 via-teal-50 to-emerald-50",
      shadowColor: "shadow-emerald-500/20",
      hoverShadow: "hover:shadow-emerald-500/30",
      route: "/library",
      features: [
        { icon: DocumentDuplicateIcon, text: "Archived Documents" },
        { icon: ClockIcon, text: "Document History" },
        { icon: MagnifyingGlassIcon, text: "Search & Filter" },
        { icon: FolderIcon, text: "Client-wise Archive" },
      ],
      accentColor: "emerald"
    }
  ];

  const handleModeSelect = (mode) => {
    if (mode.requiresComplianceAccess && !hasComplianceAccess()) {
      return;
    }
    setSelectedMode(mode.id);
    setIsTransitioning(true);

    setTimeout(() => {
      navigate(mode.route);
    }, 600);
  };

  const isCardDisabled = (mode) => {
    return mode.requiresComplianceAccess && !hasComplianceAccess();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          animate={{
            rotate: 360,
            scale: [1, 1.1, 1],
          }}
          transition={{
            rotate: { duration: 60, repeat: Infinity, ease: "linear" },
            scale: { duration: 10, repeat: Infinity, ease: "easeInOut" }
          }}
          className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-200/20 to-cyan-200/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            rotate: -360,
            scale: [1, 1.2, 1],
          }}
          transition={{
            rotate: { duration: 45, repeat: Infinity, ease: "linear" },
            scale: { duration: 8, repeat: Infinity, ease: "easeInOut" }
          }}
          className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-purple-200/20 to-indigo-200/20 rounded-full blur-3xl"
        />
      </div>

      {/* Main Content */}
      <div className="relative flex flex-col items-center justify-center min-h-screen px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center mb-12"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2, type: "spring", stiffness: 200 }}
            className="inline-flex items-center justify-center w-20 h-20 mb-6 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl shadow-2xl"
          >
            <SparklesIcon className="w-10 h-10 text-white" />
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-gray-900 via-indigo-800 to-gray-900 bg-clip-text text-transparent mb-4"
          >
            Welcome Back
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-xl text-gray-600 max-w-2xl mx-auto"
          >
            Choose your workspace to continue with your business operations
          </motion.p>
        </motion.div>

        {/* Mode Selection Cards */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl w-full"
        >
          {modes.map((mode, index) => {
            const disabled = isCardDisabled(mode);
            return (
            <motion.div
              key={mode.id}
              initial={{ opacity: 0, x: index === 0 ? -50 : 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.6 + index * 0.1 }}
              whileHover={disabled ? {} : { scale: 1.02, transition: { duration: 0.2 } }}
              whileTap={disabled ? {} : { scale: 0.98 }}
              onClick={() => handleModeSelect(mode)}
              className={`relative group ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'} ${
                selectedMode === mode.id ? 'ring-4 ring-offset-4' : ''
              } ${
                mode.accentColor === 'blue'
                  ? 'ring-blue-500 ring-offset-blue-100'
                  : mode.accentColor === 'purple'
                  ? 'ring-purple-500 ring-offset-purple-100'
                  : mode.accentColor === 'orange'
                  ? 'ring-orange-500 ring-offset-orange-100'
                  : 'ring-emerald-500 ring-offset-emerald-100'
              } rounded-3xl transition-all duration-300`}
            >
              <div className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${mode.bgGradient} p-8 border border-white/60 backdrop-blur-sm shadow-xl ${mode.shadowColor} ${disabled ? '' : mode.hoverShadow} transition-all duration-300 ${disabled ? 'opacity-60' : ''}`}>
                {disabled && (
                  <div className="absolute inset-0 bg-gray-900/10 backdrop-blur-[1px] rounded-3xl z-20 flex items-center justify-center">
                    <div className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-xl shadow-lg flex items-center space-x-2">
                      <LockClosedIcon className="w-5 h-5 text-gray-600" />
                      <span className="text-sm font-medium text-gray-700">Access Restricted</span>
                    </div>
                  </div>
                )}
                {/* Animated Background Pattern */}
                <div className="absolute inset-0 opacity-5">
                  <div className="absolute inset-0" style={{
                    backgroundImage: `radial-gradient(circle at 2px 2px, currentColor 1px, transparent 1px)`,
                    backgroundSize: '30px 30px'
                  }}></div>
                </div>

                {/* Card Content */}
                <div className="relative z-10">
                  {/* Icon and Title Row */}
                  <div className="flex items-start justify-between mb-6">
                    <motion.div
                      whileHover={{ rotate: 5, scale: 1.1 }}
                      transition={{ type: "spring", stiffness: 300 }}
                      className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br ${mode.gradient} shadow-lg`}
                    >
                      <mode.icon className="w-8 h-8 text-white" />
                    </motion.div>
                    
                    <AnimatePresence>
                      {selectedMode === mode.id && (
                        <motion.div
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <CheckCircleIcon className={`w-8 h-8 ${
                            mode.accentColor === 'blue' ? 'text-blue-500'
                            : mode.accentColor === 'purple' ? 'text-purple-500'
                            : mode.accentColor === 'orange' ? 'text-orange-500'
                            : 'text-emerald-500'
                          }`} />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Title and Subtitle */}
                  <h2 className="text-3xl font-bold text-gray-800 mb-2">
                    {mode.title}
                  </h2>
                  <p className={`text-sm font-semibold mb-4 ${
                    mode.accentColor === 'blue' ? 'text-blue-600'
                    : mode.accentColor === 'purple' ? 'text-purple-600'
                    : mode.accentColor === 'orange' ? 'text-orange-600'
                    : 'text-emerald-600'
                  }`}>
                    {mode.subtitle}
                  </p>

                  {/* Description */}
                  <p className="text-gray-600 mb-8 leading-relaxed">
                    {mode.description}
                  </p>

                  {/* Features Grid */}
                  <div className="grid grid-cols-2 gap-4 mb-8">
                    {mode.features.map((feature, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.8 + idx * 0.1 }}
                        className="flex items-center space-x-2"
                      >
                        <div className={`p-2 rounded-lg ${
                          mode.accentColor === 'blue'
                            ? 'bg-blue-100 text-blue-600'
                            : mode.accentColor === 'purple'
                            ? 'bg-purple-100 text-purple-600'
                            : mode.accentColor === 'orange'
                            ? 'bg-orange-100 text-orange-600'
                            : 'bg-emerald-100 text-emerald-600'
                        }`}>
                          <feature.icon className="w-4 h-4" />
                        </div>
                        <span className="text-sm text-gray-700 font-medium">
                          {feature.text}
                        </span>
                      </motion.div>
                    ))}
                  </div>

                  {/* Action Button */}
                  <motion.button
                    whileHover={disabled ? {} : { x: 5 }}
                    transition={{ type: "spring", stiffness: 400 }}
                    disabled={disabled}
                    className={`w-full py-4 px-6 rounded-2xl bg-gradient-to-r ${mode.gradient} text-white font-semibold flex items-center justify-center space-x-2 shadow-lg transition-all duration-300 group ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-xl'}`}
                  >
                    <span>{disabled ? 'Access Restricted' : `Enter ${mode.title}`}</span>
                    {disabled ? (
                      <LockClosedIcon className="w-5 h-5" />
                    ) : (
                      <ArrowRightIcon className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" />
                    )}
                  </motion.button>
                </div>

                {/* Hover Overlay Effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/0 via-white/5 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-3xl pointer-events-none"></div>
              </div>
            </motion.div>
          );
          })}
        </motion.div>

        {/* Loading Transition Overlay */}
        <AnimatePresence>
          {isTransitioning && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-white/95 backdrop-blur-lg"
            >
              <motion.div
                animate={{
                  scale: [1, 1.2, 1],
                  rotate: [0, 180, 360],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="w-16 h-16 border-4 border-transparent border-t-indigo-600 border-r-purple-600 rounded-full"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ModeSelection;