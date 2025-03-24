import React, { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Header from "./Header";
import Sidebar from "./Sidebar";

function Layout() {
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  const particles = Array.from({ length: 6 });

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <Sidebar />
      <main className="pl-64 pt-16">
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="loader"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-white/90 to-gray-50/90 backdrop-blur-lg"
            >
              <div className="relative">
                {/* Floating particles */}
                {particles.map((_, index) => (
                  <motion.div
                    key={index}
                    animate={{
                      scale: [1, 1.2, 1],
                      opacity: [0.3, 0.8, 0.3],
                      x: [0, Math.cos(index) * 20, 0],
                      y: [0, Math.sin(index) * 20, 0],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      delay: index * 0.2,
                      ease: "easeInOut",
                    }}
                    className="absolute w-2 h-2 bg-blue-500 rounded-full"
                    style={{
                      left: `${Math.cos(index) * 40}px`,
                      top: `${Math.sin(index) * 40}px`,
                    }}
                  />
                ))}

                {/* Main spinning ring */}
                <motion.div
                  animate={{
                    rotate: 360,
                    scale: [1, 1.1, 1],
                  }}
                  transition={{
                    rotate: {
                      duration: 2,
                      repeat: Infinity,
                      ease: "linear",
                    },
                    scale: {
                      duration: 1,
                      repeat: Infinity,
                      ease: "easeInOut",
                    },
                  }}
                  className="w-20 h-20 border-4 border-transparent border-t-blue-600 border-r-indigo-600 rounded-full shadow-lg"
                  style={{
                    filter: "drop-shadow(0 0 8px rgba(37, 99, 235, 0.3))",
                  }}
                />

                {/* Inner spinning ring */}
                <motion.div
                  animate={{
                    rotate: -360,
                    scale: [1, 0.9, 1],
                  }}
                  transition={{
                    rotate: {
                      duration: 1.5,
                      repeat: Infinity,
                      ease: "linear",
                    },
                    scale: {
                      duration: 1,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: 0.2,
                    },
                  }}
                  className="absolute inset-0 m-auto w-12 h-12 border-4 border-transparent border-t-indigo-500 border-r-blue-500 rounded-full"
                  style={{
                    filter: "drop-shadow(0 0 8px rgba(99, 102, 241, 0.3))",
                  }}
                />

                {/* Center pulsing dot */}
                <motion.div
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.5, 1, 0.5],
                  }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="absolute inset-0 m-auto w-4 h-4 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full shadow-xl"
                  style={{
                    filter: "drop-shadow(0 0 8px rgba(37, 99, 235, 0.5))",
                  }}
                />

                {/* Loading text with gradient and glow */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    delay: 0.2,
                    duration: 0.5,
                  }}
                  className="absolute -bottom-12 left-1/2 transform -translate-x-1/2 whitespace-nowrap text-center"
                >
                  <motion.span
                    animate={{
                      backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                    className="text-sm font-medium bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 bg-clip-text text-transparent bg-[length:200%_auto] inline-block"
                    style={{
                      filter: "drop-shadow(0 0 2px rgba(37, 99, 235, 0.3))",
                    }}
                  >
                    Loading...
                  </motion.span>
                </motion.div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{
                duration: 0.4,
                ease: [0.4, 0, 0.2, 1],
              }}
              className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8"
            >
              <Outlet />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

export default Layout;
