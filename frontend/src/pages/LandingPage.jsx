import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import { useAuth } from "../context/AuthContext";

function LandingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);
  const heroRef = useRef(null);
  const featuresRef = useRef(null);
  const statsRef = useRef(null);
  const ctaRef = useRef(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  const backgroundY = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.3], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.3], [1, 0.8]);
  const springConfig = { stiffness: 100, damping: 30, restDelta: 0.001 };
  const scaleSpring = useSpring(scale, springConfig);

  useEffect(() => {
    const handleMouseMove = (e) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 2;
      const y = (e.clientY / window.innerHeight - 0.5) * 2;
      setMousePosition({ x, y });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const features = [
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
      title: "KYC Management",
      description: "Complete Know Your Customer compliance workflows with automated verification",
      gradient: "from-violet-500 to-purple-500",
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      title: "BRA Processing",
      description: "Business Risk Assessment with multi-level approvals and tracking",
      gradient: "from-blue-500 to-cyan-500",
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      title: "Client Management",
      description: "Centralized client data with secure document storage and retrieval",
      gradient: "from-emerald-500 to-teal-500",
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      ),
      title: "Secure & Compliant",
      description: "Role-based access control with complete audit trails",
      gradient: "from-orange-500 to-amber-500",
    },
  ];

  const stats = [
    { value: "99.9%", label: "Uptime", suffix: "" },
    { value: "500", label: "Active Clients", suffix: "+" },
    { value: "50", label: "Team Members", suffix: "+" },
    { value: "24/7", label: "Support", suffix: "" },
  ];

  const Card3D = ({ children, className }) => {
    const [rotateX, setRotateX] = useState(0);
    const [rotateY, setRotateY] = useState(0);

    const handleMouseMove = (e) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      setRotateX((y - centerY) / 10);
      setRotateY((centerX - x) / 10);
    };

    const handleMouseLeave = () => {
      setRotateX(0);
      setRotateY(0);
    };

    return (
      <motion.div
        className={className}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          transformStyle: "preserve-3d",
          transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
          transition: "transform 0.1s ease-out",
        }}
      >
        {children}
      </motion.div>
    );
  };

  return (
    <div ref={containerRef} className="min-h-screen relative overflow-x-hidden bg-[#0a0a1a]">
      {/* Animated Gradient Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute -top-1/2 -left-1/2 w-full h-full"
          style={{ y: backgroundY }}
        >
          <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-purple-600/30 rounded-full blur-[128px] animate-pulse" />
          <div className="absolute top-1/2 right-1/4 w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[128px] animate-pulse" style={{ animationDelay: "1s" }} />
          <div className="absolute bottom-1/4 left-1/3 w-[400px] h-[400px] bg-cyan-600/20 rounded-full blur-[128px] animate-pulse" style={{ animationDelay: "2s" }} />
        </motion.div>
      </div>

      {/* 3D Floating Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-20 right-20 w-32 h-32"
          animate={{
            y: [0, -20, 0],
            rotateY: [0, 360],
            rotateX: [0, 15, 0],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          style={{
            transformStyle: "preserve-3d",
            transform: `translateX(${mousePosition.x * 20}px) translateY(${mousePosition.y * 20}px)`,
          }}
        >
          <div className="w-full h-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-2xl backdrop-blur-sm border border-white/10"
               style={{ transform: "rotateX(45deg) rotateZ(45deg)" }} />
        </motion.div>

        <motion.div
          className="absolute bottom-40 left-20 w-24 h-24"
          animate={{
            y: [0, 20, 0],
            rotateY: [360, 0],
            rotateZ: [0, 90, 0],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          style={{
            transformStyle: "preserve-3d",
            transform: `translateX(${mousePosition.x * -15}px) translateY(${mousePosition.y * -15}px)`,
          }}
        >
          <div className="w-full h-full bg-gradient-to-br from-cyan-500/20 to-emerald-500/20 rounded-full backdrop-blur-sm border border-white/10" />
        </motion.div>

        <motion.div
          className="absolute top-1/2 left-10 w-16 h-16"
          animate={{
            y: [0, -30, 0],
            x: [0, 10, 0],
            rotateZ: [0, 180, 360],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <div className="w-full h-full bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-lg backdrop-blur-sm border border-white/10"
               style={{ transform: "rotateX(60deg)" }} />
        </motion.div>
      </div>

      {/* Animated Grid */}
      <div className="fixed inset-0 pointer-events-none opacity-20">
        <div className="absolute inset-0" style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)`,
          backgroundSize: "100px 100px",
          transform: `perspective(500px) rotateX(60deg) translateY(-50%)`,
          transformOrigin: "center top",
        }} />
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <motion.header
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="fixed top-0 left-0 right-0 z-50 py-4 px-6 backdrop-blur-xl bg-[#0a0a1a]/50 border-b border-white/5"
        >
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="flex items-center gap-3"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl blur-lg opacity-50" />
                <img
                  src="/Company Logo.png"
                  alt="Newoon LLC"
                  className="relative h-10 w-auto object-contain"
                  onError={(e) => { e.target.style.display = "none"; }}
                />
              </div>
              <span className="text-white font-bold text-xl tracking-tight hidden sm:block">
                Newoon <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">LLC</span>
              </span>
            </motion.div>

            <motion.button
              whileHover={{ scale: 1.05, boxShadow: "0 0 30px rgba(139, 92, 246, 0.5)" }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate(user ? "/mode-selection" : "/login")}
              className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full text-white font-medium text-sm shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all duration-300"
            >
              {user ? "Mode Selection" : "Sign In"}
            </motion.button>
          </div>
        </motion.header>

        {/* Hero Section */}
        <section ref={heroRef} className="min-h-screen flex items-center justify-center px-6 pt-20">
          <motion.div style={{ scale: scaleSpring, opacity }} className="max-w-6xl mx-auto text-center">
            {/* Floating Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-full mb-8"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              <span className="text-gray-300 text-sm">Enterprise Compliance Solution</span>
            </motion.div>

            {/* Logo */}
            <motion.div
              initial={{ opacity: 0, scale: 0.5, rotateY: -180 }}
              animate={{ opacity: 1, scale: 1, rotateY: 0 }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="mb-8"
              style={{ transformStyle: "preserve-3d" }}
            >
              <div className="relative inline-block">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-blue-500 rounded-3xl blur-2xl opacity-40 scale-110" />
                <img
                  src="/Company Logo.png"
                  alt="Newoon LLC"
                  className="relative h-28 sm:h-36 w-auto mx-auto object-contain drop-shadow-2xl"
                  onError={(e) => { e.target.style.display = "none"; }}
                />
              </div>
            </motion.div>

            {/* Company Name */}
            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-3xl sm:text-4xl font-light bg-gradient-to-r from-purple-300 via-blue-300 to-cyan-300 bg-clip-text text-transparent mb-4 tracking-[0.2em]"
            >
              NEWOON LLC
            </motion.h2>

            {/* Main Title */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="text-5xl sm:text-6xl md:text-8xl font-bold text-white mb-6 leading-tight"
            >
              Compliance
              <br />
              <span className="relative">
                <span className="relative z-10 bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
                  Information System
                </span>
                <motion.span
                  className="absolute -inset-2 bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-blue-500/20 blur-2xl"
                  animate={{ opacity: [0.5, 0.8, 0.5] }}
                  transition={{ duration: 3, repeat: Infinity }}
                />
              </span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto mb-12 leading-relaxed"
            >
              Streamline your business compliance workflows with our comprehensive
              KYC and BRA management platform. <span className="text-white">Secure, efficient, and fully auditable.</span>
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            >
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: "0 20px 40px rgba(139, 92, 246, 0.4)" }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate(user ? "/mode-selection" : "/login")}
                className="group relative px-10 py-5 bg-gradient-to-r from-purple-600 via-violet-600 to-blue-600 rounded-2xl text-white font-semibold text-lg shadow-2xl shadow-purple-500/30 overflow-hidden"
              >
                <span className="relative z-10 flex items-center gap-3">
                  {user ? "Mode Selection" : "Get Started"}
                  <motion.svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    animate={{ x: [0, 5, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </motion.svg>
                </span>
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-purple-700 via-violet-700 to-blue-700"
                  initial={{ x: "100%" }}
                  whileHover={{ x: 0 }}
                  transition={{ duration: 0.3 }}
                />
              </motion.button>

              {!user && (
                <motion.button
                  whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.1)" }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate("/login")}
                  className="px-10 py-5 bg-white/5 backdrop-blur-sm border border-white/20 rounded-2xl text-white font-medium text-lg hover:border-white/40 transition-all duration-300"
                >
                  Login to Dashboard
                </motion.button>
              )}
            </motion.div>

            {/* Scroll Indicator */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.5 }}
              className="absolute bottom-10 left-1/2 -translate-x-1/2"
            >
              <motion.div
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="flex flex-col items-center gap-2 text-gray-500"
              >
                <span className="text-xs uppercase tracking-widest">Scroll to explore</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </motion.div>
            </motion.div>
          </motion.div>
        </section>

        {/* Features Section */}
        <section ref={featuresRef} className="py-32 px-6">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8 }}
              className="text-center mb-20"
            >
              <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">
                Powerful <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">Features</span>
              </h2>
              <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                Everything you need to manage compliance workflows efficiently and securely
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.15 }}
                >
                  <Card3D className="h-full">
                    <div className="group relative h-full p-8 bg-gradient-to-br from-white/[0.08] to-white/[0.02] backdrop-blur-xl border border-white/10 rounded-3xl hover:border-white/20 transition-all duration-500 overflow-hidden">
                      {/* Glow Effect */}
                      <div className={`absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br ${feature.gradient} rounded-full blur-3xl opacity-0 group-hover:opacity-30 transition-opacity duration-500`} />

                      {/* Icon */}
                      <div className={`relative w-16 h-16 bg-gradient-to-br ${feature.gradient} rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300`}
                           style={{ transform: "translateZ(20px)" }}>
                        {feature.icon}
                      </div>

                      {/* Content */}
                      <h3 className="text-2xl font-bold text-white mb-3" style={{ transform: "translateZ(15px)" }}>
                        {feature.title}
                      </h3>
                      <p className="text-gray-400 leading-relaxed" style={{ transform: "translateZ(10px)" }}>
                        {feature.description}
                      </p>

                      {/* Arrow */}
                      <motion.div
                        className="absolute bottom-8 right-8 w-10 h-10 bg-white/5 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                        whileHover={{ scale: 1.1, backgroundColor: "rgba(255,255,255,0.1)" }}
                      >
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                      </motion.div>
                    </div>
                  </Card3D>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section ref={statsRef} className="py-32 px-6 relative">
          <div className="absolute inset-0 bg-gradient-to-b from-purple-900/20 via-transparent to-transparent" />
          <div className="max-w-7xl mx-auto relative">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-8"
            >
              {stats.map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="text-center"
                >
                  <Card3D className="p-8 bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl">
                    <motion.div
                      className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent mb-2"
                      initial={{ opacity: 0, scale: 0.5 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ type: "spring", stiffness: 100, delay: index * 0.1 + 0.2 }}
                    >
                      {stat.value}{stat.suffix}
                    </motion.div>
                    <div className="text-gray-400 text-sm uppercase tracking-wider">{stat.label}</div>
                  </Card3D>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* CTA Section */}
        <section ref={ctaRef} className="py-32 px-6">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8 }}
            >
              <Card3D className="relative overflow-hidden">
                <div className="relative p-12 sm:p-16 bg-gradient-to-br from-purple-900/50 via-violet-900/50 to-blue-900/50 backdrop-blur-xl border border-white/10 rounded-3xl text-center">
                  {/* Background Effects */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-purple-500/30 rounded-full blur-[100px]" />
                  <div className="absolute bottom-0 right-0 w-64 h-64 bg-blue-500/20 rounded-full blur-[80px]" />

                  <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 }}
                    className="relative text-3xl sm:text-5xl font-bold text-white mb-6"
                  >
                    Ready to Get Started?
                  </motion.h2>
                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 }}
                    className="relative text-gray-300 text-lg mb-10 max-w-xl mx-auto"
                  >
                    Join hundreds of businesses managing their compliance workflows with Newoon LLC
                  </motion.p>
                  <motion.button
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.4 }}
                    whileHover={{ scale: 1.05, boxShadow: "0 0 50px rgba(139, 92, 246, 0.5)" }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate(user ? "/mode-selection" : "/login")}
                    className="relative px-12 py-5 bg-white text-gray-900 rounded-2xl font-bold text-lg shadow-2xl hover:bg-gray-100 transition-all duration-300"
                  >
                    {user ? "Go to Mode Selection" : "Start Now"}
                  </motion.button>
                </div>
              </Card3D>
            </motion.div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-12 px-6 border-t border-white/5">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="flex items-center gap-3">
                <img
                  src="/Company Logo.png"
                  alt="Newoon LLC"
                  className="h-8 w-auto object-contain opacity-70"
                  onError={(e) => { e.target.style.display = "none"; }}
                />
                <span className="text-gray-500 text-sm">
                  &copy; {new Date().getFullYear()} Newoon LLC. All rights reserved.
                </span>
              </div>
              <div className="flex items-center gap-8">
                <span className="text-gray-600 text-sm hover:text-gray-400 cursor-pointer transition-colors">Privacy Policy</span>
                <span className="text-gray-600 text-sm hover:text-gray-400 cursor-pointer transition-colors">Terms of Service</span>
                <span className="text-gray-600 text-sm hover:text-gray-400 cursor-pointer transition-colors">Contact</span>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default LandingPage;
