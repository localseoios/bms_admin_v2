import { createContext, useState, useEffect, useContext } from "react";
import axiosInstance from "../utils/axios";

export const AuthContext = createContext();

// Create the useAuth hook
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        // Update this path to match your backend API structure
        const response = await axiosInstance.get("/users/me");
        setUser(response.data);
      } catch (error) {
        console.error("Error fetching user:", error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  // Enhanced permission check for nested permissions
  const checkPermission = (permissionPath) => {
    if (!user || !user.role) return false;

    // For admin role
    if (user.role.name === "admin") return true;

    // For specific permissions like "kycManagement.lmro" or "clientManagement.auditedFinancial.viewer"
    if (permissionPath.includes(".")) {
      const parts = permissionPath.split(".");
      
      if (parts.length === 2) {
        // Two-level nesting like "kycManagement.lmro"
        const [section, permission] = parts;
        return user.role.permissions?.[section]?.[permission] === true;
      } else if (parts.length === 3) {
        // Three-level nesting like "clientManagement.auditedFinancial.viewer"
        const [section, subsection, permission] = parts;
        return user.role.permissions?.[section]?.[subsection]?.[permission] === true;
      }
    }

    // For simple permissions
    return user.role.permissions?.[permissionPath] === true;
  };

  return (
    <AuthContext.Provider value={{ user, loading, checkPermission }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
