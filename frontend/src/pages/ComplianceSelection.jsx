import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ShieldCheckIcon,
  UsersIcon,
  DocumentTextIcon,
  AcademicCapIcon,
  ChevronRightIcon,
  ArrowLeftIcon,
  HomeIcon,
  Squares2X2Icon,
  ArrowRightOnRectangleIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "../context/AuthContext";
import axiosInstance from "../utils/axios";

const ComplianceSelection = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [localUser, setLocalUser] = useState(null);

  useEffect(() => {
    // Get user from localStorage as fallback
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setLocalUser(JSON.parse(storedUser));
    }
  }, []);

  const currentUser = user || localUser;

  const handleLogout = async () => {
    try {
      if (currentUser && currentUser._id) {
        await axiosInstance.post("/auth/logout", { userId: currentUser._id });
      } else {
        await axiosInstance.get("/auth/logout");
      }
      localStorage.removeItem("user");
      setLocalUser(null);
      navigate("/login");
    } catch (error) {
      console.error("Error logging out:", error);
      localStorage.removeItem("user");
      setLocalUser(null);
      navigate("/login");
    }
  };

  const handleLogin = () => {
    navigate("/login");
  };

  const complianceCards = [
    {
      id: "compliance-culture",
      title: "Compliance Culture",
      description: "Foster and maintain organizational compliance culture with policies, training, and monitoring systems.",
      icon: AcademicCapIcon,
      gradient: "from-blue-500 to-indigo-600",
      bgGradient: "from-blue-50 to-indigo-50",
      shadowColor: "shadow-blue-500/25",
      hoverShadow: "group-hover:shadow-blue-500/40",
      route: "/compliance-culture",
      stats: "12 Active Programs"
    },
    {
      id: "compliance-staff", 
      title: "Compliance Staff",
      description: "Manage compliance team members, roles, responsibilities, and performance tracking.",
      icon: UsersIcon,
      gradient: "from-emerald-500 to-green-600",
      bgGradient: "from-emerald-50 to-green-50",
      shadowColor: "shadow-emerald-500/25",
      hoverShadow: "group-hover:shadow-emerald-500/40",
      route: "/compliance-staff",
      stats: "24 Team Members"
    },
    {
      id: "compliance-client",
      title: "Compliance Client",
      description: "Client onboarding, KYC processes, risk assessments, and ongoing compliance monitoring.",
      icon: ShieldCheckIcon,
      gradient: "from-purple-500 to-violet-600", 
      bgGradient: "from-purple-50 to-violet-50",
      shadowColor: "shadow-purple-500/25",
      hoverShadow: "group-hover:shadow-purple-500/40",
      route: "/compliance/clients",
      stats: "156 Active Clients"
    },
    {
      id: "compliance-resource",
      title: "Compliance Resource",
      description: "Access compliance documentation, regulatory guidelines, templates, and knowledge base.",
      icon: DocumentTextIcon,
      gradient: "from-orange-500 to-red-600",
      bgGradient: "from-orange-50 to-red-50", 
      shadowColor: "shadow-orange-500/25",
      hoverShadow: "group-hover:shadow-orange-500/40",
      route: "/compliance-resources",
      stats: "89 Documents"
    }
  ];

  const handleCardClick = (route) => {
    navigate(route);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Navigation Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-40"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left Navigation */}
            <div className="flex items-center space-x-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate("/mode-selection")}
                className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors duration-200"
              >
                <ArrowLeftIcon className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">Back</span>
              </motion.button>
              
              <div className="h-8 w-px bg-gray-300"></div>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate("/mode-selection")}
                className="flex items-center space-x-2 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
              >
                <Squares2X2Icon className="w-5 h-5 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">Mode Selection</span>
              </motion.button>
            </div>

            {/* Center Logo/Title */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <ShieldCheckIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-800">Compliance Hub</h1>
                <p className="text-xs text-gray-500">Management System</p>
              </div>
            </div>

            {/* Right Navigation */}
            <div className="flex items-center space-x-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate("/dashboard")}
                className="flex items-center space-x-2 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
              >
                <HomeIcon className="w-5 h-5 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">Dashboard</span>
              </motion.button>

              {/* Login/Logout Button */}
              {currentUser ? (
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    <UserCircleIcon className="w-6 h-6 text-gray-600" />
                    <span className="text-sm font-medium text-gray-700">
                      {currentUser.name || currentUser.username || 'User'}
                    </span>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleLogout}
                    className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 transition-colors duration-200 border border-red-200"
                  >
                    <ArrowRightOnRectangleIcon className="w-4 h-4" />
                    <span className="text-sm font-medium">Logout</span>
                  </motion.button>
                </div>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleLogin}
                  className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 hover:text-blue-700 transition-colors duration-200 border border-blue-200"
                >
                  <UserCircleIcon className="w-4 h-4" />
                  <span className="text-sm font-medium">Login</span>
                </motion.button>
              )}
            </div>
          </div>
        </div>
      </motion.header>

      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative overflow-hidden bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-800 rounded-3xl mx-6 mt-6 mb-8"
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-20">
          <div className="w-full h-full bg-gradient-to-r from-white/10 to-white/20 bg-[radial-gradient(circle_at_1px_1px,white_1px,transparent_0)]" style={{ backgroundSize: '30px 30px' }}></div>
        </div>
        
        <div className="relative px-8 py-12 text-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-6"
          >
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-lg rounded-2xl shadow-2xl">
              <ShieldCheckIcon className="w-10 h-10 text-white" />
            </div>
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-4xl md:text-5xl font-bold text-white mb-4"
          >
            Compliance Management
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-xl text-indigo-100 max-w-3xl mx-auto leading-relaxed"
          >
            Comprehensive compliance management system to ensure regulatory adherence, 
            risk mitigation, and operational excellence across your organization.
          </motion.p>
        </div>
      </motion.div>

      {/* Cards Grid */}
      <div className="max-w-7xl mx-auto px-6 pb-12">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-8"
        >
          {complianceCards.map((card, index) => (
            <motion.div
              key={card.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ 
                duration: 0.6, 
                delay: 0.1 * index + 0.3,
                ease: [0.4, 0, 0.2, 1]
              }}
              whileHover={{ 
                scale: 1.02, 
                transition: { duration: 0.2, ease: "easeOut" }
              }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleCardClick(card.route)}
              className={`group relative overflow-hidden rounded-3xl bg-gradient-to-br ${card.bgGradient} p-8 cursor-pointer border border-white/60 backdrop-blur-sm shadow-xl ${card.shadowColor} hover:shadow-2xl ${card.hoverShadow} transition-all duration-300`}
            >
              {/* Background Pattern */}
              <div className="absolute top-0 right-0 w-32 h-32 opacity-10">
                <div className={`w-full h-full rounded-full bg-gradient-to-br ${card.gradient} transform translate-x-8 -translate-y-8`}></div>
              </div>
              
              {/* Card Content */}
              <div className="relative">
                {/* Icon & Stats Row */}
                <div className="flex items-start justify-between mb-6">
                  <motion.div
                    whileHover={{ rotate: 5, scale: 1.1 }}
                    transition={{ type: "spring", stiffness: 300 }}
                    className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br ${card.gradient} shadow-lg group-hover:shadow-xl transition-shadow duration-300`}
                  >
                    <card.icon className="w-8 h-8 text-white" />
                  </motion.div>
                  
                  <motion.div
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 0.2 }}
                    className="text-right"
                  >
                    <div className="text-sm font-medium text-gray-600 mb-1">Status</div>
                    <div className="text-lg font-bold text-gray-800">{card.stats}</div>
                  </motion.div>
                </div>
                
                {/* Title */}
                <motion.h3
                  className="text-2xl font-bold text-gray-800 mb-3 group-hover:text-gray-900 transition-colors duration-200"
                >
                  {card.title}
                </motion.h3>
                
                {/* Description */}
                <motion.p
                  className="text-gray-600 leading-relaxed mb-6 group-hover:text-gray-700 transition-colors duration-200"
                >
                  {card.description}
                </motion.p>
                
                {/* Action Button */}
                <motion.div
                  whileHover={{ x: 5 }}
                  transition={{ type: "spring", stiffness: 400 }}
                  className="flex items-center text-sm font-semibold text-gray-700 group-hover:text-gray-900 transition-colors duration-200"
                >
                  <span>Explore Module</span>
                  <ChevronRightIcon className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-200" />
                </motion.div>
              </div>
              
              {/* Hover Overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/0 via-white/5 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-3xl"></div>
            </motion.div>
          ))}
        </motion.div>

        {/* Bottom Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mt-12 text-center"
        >
          <div className="inline-flex items-center space-x-2 px-6 py-3 bg-white/80 backdrop-blur-sm rounded-full shadow-lg border border-white/60">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-gray-700">
              All systems operational
            </span>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ComplianceSelection;