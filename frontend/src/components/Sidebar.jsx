import React, { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  UserGroupIcon,
  ChartBarIcon,
  DocumentTextIcon,
  Cog6ToothIcon,
  HomeIcon,
  ChevronDownIcon,
  CircleStackIcon,
  ClipboardDocumentListIcon,
  UserIcon,
  QuestionMarkCircleIcon,
  ShieldCheckIcon,
  BriefcaseIcon,
  IdentificationIcon,
  ClipboardIcon,
} from "@heroicons/react/24/outline";

const navigation = [
  {
    name: "Overview",
    items: [
      { name: "Dashboard", href: "/dashboard", icon: HomeIcon },
      { name: "Reports", href: "/reports", icon: ChartBarIcon },
    ],
  },
  {
    name: "Management",
    items: [
      {
        name: "User Management",
        href: "/user-management",
        icon: UserGroupIcon,
      },
      { name: "Documents", href: "/documents", icon: DocumentTextIcon },
      { name: "Database", href: "/database", icon: CircleStackIcon },
    ],
  },
  {
    name: "Administration",
    items: [
      {
        name: "Create Job",
        href: "/create-job",
        icon: ClipboardDocumentListIcon,
      },
      {
        name: "All Jobs",
        href: "/admin/jobs",
        icon: BriefcaseIcon,
      },
      { name: "Profile", href: "/profile", icon: UserIcon },
      { name: "Settings", href: "/settings", icon: Cog6ToothIcon },
    ],
  },
  {
    name: "Compliance Management",
    items: [
      {
        name: "Compliance",
        href: "/compliance",
        icon: ShieldCheckIcon,
      },
    ],
  },
  {
    name: "Operation Management",
    items: [
      {
        name: "My Jobs",
        href: "/operation-management",
        icon: BriefcaseIcon,
      },
    ],
  },
  {
    name: "KYC Management",
    items: [
      {
        name: "KYC Management",
        href: "/kyc-management",
        icon: IdentificationIcon,
      },
    ],
  },
  {
    name: "BRA Management",
    items: [
      {
        name: "BRA Management",
        href: "/bra-management",
        icon: ClipboardIcon,
      },
    ],
  },
];

function Sidebar() {
  const location = useLocation();
  const [expandedSections, setExpandedSections] = useState(
    navigation.map((section) => section.name)
  );

  const toggleSection = (sectionName) => {
    setExpandedSections((prev) =>
      prev.includes(sectionName)
        ? prev.filter((name) => name !== sectionName)
        : [...prev, sectionName]
    );
  };

  return (
    <div className="h-full bg-white w-64 fixed left-0 top-16 border-r border-gray-200 z-20">
      <div className="flex flex-col h-[calc(100vh-4rem)]">
        <div className="flex-1 overflow-y-auto">
          <nav className="px-3 py-4">
            {navigation.map((section) => (
              <div key={section.name} className="mb-6">
                <button
                  onClick={() => toggleSection(section.name)}
                  className="flex items-center justify-between w-full px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider hover:text-indigo-600 transition-colors duration-200"
                >
                  {section.name}
                  <ChevronDownIcon
                    className={`h-4 w-4 transition-transform duration-200 ${
                      expandedSections.includes(section.name)
                        ? "transform rotate-180"
                        : ""
                    }`}
                  />
                </button>
                {expandedSections.includes(section.name) && (
                  <div className="mt-2 space-y-1">
                    {section.items.map((item) => (
                      <NavLink
                        key={item.name}
                        to={item.href}
                        className={({ isActive }) =>
                          `group flex items-center px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 ${
                            isActive
                              ? "bg-gradient-to-r from-indigo-50 to-purple-50/50 text-indigo-700"
                              : "text-gray-700 hover:bg-gray-50"
                          }`
                        }
                      >
                        <item.icon
                          className={`flex-shrink-0 h-5 w-5 mr-3 transition-colors duration-200 ${
                            location.pathname === item.href
                              ? "text-indigo-700"
                              : "text-gray-400 group-hover:text-gray-600"
                          }`}
                        />
                        <span className="truncate">{item.name}</span>
                        {item.name === "BRA Management" && (
                          <span className="ml-auto bg-teal-100 text-teal-700 py-0.5 px-2 rounded-lg text-xs font-medium">
                            New
                          </span>
                        )}
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>
        </div>

        {/* Help Section */}
        <div className="p-4 border-t border-gray-200">
          <button className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50/50 hover:from-indigo-100 hover:to-purple-100/50 transition-all duration-200 group">
            <QuestionMarkCircleIcon className="h-6 w-6 text-indigo-600 group-hover:text-indigo-700" />
            <div className="flex-1 text-left">
              <p className="text-sm font-medium text-gray-900">Need Help?</p>
              <p className="text-xs text-gray-500">Contact support team</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}

export default Sidebar;
