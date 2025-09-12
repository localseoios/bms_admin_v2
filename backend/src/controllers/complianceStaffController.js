const ComplianceStaff = require("../models/complianceStaffModel");
const User = require("../models/userModel");
const Role = require("../models/roleModel");
const notificationService = require("../services/complianceNotificationService");

const getAllComplianceStaff = async (req, res) => {
  try {
    // First, try to get existing ComplianceStaff records from database
    let staffMembers = await ComplianceStaff.find();
    
    if (staffMembers.length === 0) {
      // If no ComplianceStaff records exist, create them from User data
      console.log("No ComplianceStaff records found, creating from User data...");
      
      const users = await User.find()
        .populate("role", "name permissions")
        .select("name email role lastLogin isOnline createdAt");

      // Create ComplianceStaff records for each user
      const staffToCreate = users.map(user => {
        // Use original role name from User Management
        let staffRole = user.role ? user.role.name : "Staff Member";
        let department = "General Department";
        let level = "Mid-Level";
        
        if (user.role) {
          const roleName = user.role.name.toLowerCase().trim();
          
          // Set department and level based on role
          if (roleName === "admin") {
            department = "Administration";
            level = "Senior";
          } else if (roleName === "operation management") {
            department = "Operations";
            level = "Senior";
          } else if (roleName === "accounting") {
            department = "Finance & Accounting";
            level = "Mid-Level";
          } else if (roleName === "compliance management") {
            department = "Compliance";
            level = "Senior";
          } else if (roleName === "mlro") {
            department = "Risk & Compliance";
            level = "Senior";
          } else if (roleName === " dmlro") {
            department = "Risk & Compliance";
            level = "Senior";
          } else if (roleName === " ceo") {
            department = "Executive";
            level = "Senior";
          } else if (roleName === "external parties") {
            department = "External Relations";
            level = "Mid-Level";
          }
        }

        return {
          name: user.name,
          email: user.email,
          role: staffRole,
          department: department,
          level: level,
          userId: user._id,
          sections: [
            {
              id: "kyc-sheet",
              title: "KYC Sheet",
              description: "Know Your Customer documentation and verification records",
              icon: "IdentificationIcon",
              color: "blue",
              documents: [],
              expanded: true,
            },
            {
              id: "screening-records",
              title: "Screening Records",
              description: "Background verification and screening documentation",
              icon: "DocumentChartBarIcon",
              color: "green",
              documents: [],
              expanded: true,
            },
            {
              id: "ongoing-monitoring",
              title: "Ongoing Monitoring",
              description: "Continuous monitoring and compliance tracking records",
              icon: "EyeIcon",
              color: "purple",
              documents: [],
              expanded: true,
            }
          ]
        };
      });

      // Save all ComplianceStaff records to database
      staffMembers = await ComplianceStaff.insertMany(staffToCreate);
      console.log(`Created ${staffMembers.length} ComplianceStaff records`);
    }

    // Transform database records to frontend format
    const staffData = staffMembers.map(staff => ({
      id: staff._id.toString(),
      name: staff.name,
      email: staff.email,
      role: staff.role,
      department: staff.department,
      level: staff.level,
      avatar: null,
      sections: staff.sections || []
    }));

    res.status(200).json({
      success: true,
      count: staffData.length,
      data: staffData,
    });

  } catch (error) {
    console.error("Error fetching compliance staff:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching compliance staff",
      error: error.message,
    });
  }
};

const getComplianceStaffById = async (req, res) => {
  try {
    const { id } = req.params;

    const staff = await ComplianceStaff.findById(id)
      .populate({
        path: "userId",
        select: "name email role lastLogin isOnline",
        populate: {
          path: "role",
          select: "name permissions",
        },
      })
      .populate("createdBy", "name email")
      .populate("updatedBy", "name email");

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: "Compliance staff member not found",
      });
    }

    res.status(200).json({
      success: true,
      data: staff,
    });
  } catch (error) {
    console.error("Error fetching compliance staff member:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching compliance staff member",
      error: error.message,
    });
  }
};

const createComplianceStaff = async (req, res) => {
  try {
    const {
      userId,
      staffId,
      department,
      designation,
      joiningDate,
      phoneNumber,
      address,
      emergencyContact,
      qualifications,
      certifications,
      specializations,
      status,
      notes,
    } = req.body;

    const existingUser = await User.findById(userId);
    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const existingStaff = await ComplianceStaff.findOne({
      $or: [{ userId }, { staffId }],
    });

    if (existingStaff) {
      return res.status(400).json({
        success: false,
        message: "Staff member already exists with this user or staff ID",
      });
    }

    const newStaff = await ComplianceStaff.create({
      userId,
      staffId,
      department,
      designation,
      joiningDate,
      phoneNumber,
      address,
      emergencyContact,
      qualifications,
      certifications,
      specializations,
      status: status || "Active",
      notes,
      createdBy: req.user._id,
    });

    const populatedStaff = await ComplianceStaff.findById(newStaff._id)
      .populate({
        path: "userId",
        select: "name email role",
        populate: {
          path: "role",
          select: "name",
        },
      })
      .populate("createdBy", "name email");

    res.status(201).json({
      success: true,
      message: "Compliance staff member created successfully",
      data: populatedStaff,
    });
  } catch (error) {
    console.error("Error creating compliance staff:", error);
    res.status(500).json({
      success: false,
      message: "Error creating compliance staff member",
      error: error.message,
    });
  }
};

const updateComplianceStaff = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    const existingStaff = await ComplianceStaff.findById(id);
    if (!existingStaff) {
      return res.status(404).json({
        success: false,
        message: "Compliance staff member not found",
      });
    }

    if (updateData.staffId && updateData.staffId !== existingStaff.staffId) {
      const duplicateStaffId = await ComplianceStaff.findOne({
        staffId: updateData.staffId,
        _id: { $ne: id },
      });
      if (duplicateStaffId) {
        return res.status(400).json({
          success: false,
          message: "Staff ID already exists",
        });
      }
    }

    updateData.updatedBy = req.user._id;

    const updatedStaff = await ComplianceStaff.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    )
      .populate({
        path: "userId",
        select: "name email role",
        populate: {
          path: "role",
          select: "name",
        },
      })
      .populate("createdBy", "name email")
      .populate("updatedBy", "name email");

    res.status(200).json({
      success: true,
      message: "Compliance staff member updated successfully",
      data: updatedStaff,
    });
  } catch (error) {
    console.error("Error updating compliance staff:", error);
    res.status(500).json({
      success: false,
      message: "Error updating compliance staff member",
      error: error.message,
    });
  }
};

const deleteComplianceStaff = async (req, res) => {
  try {
    const { id } = req.params;

    const staff = await ComplianceStaff.findById(id);
    if (!staff) {
      return res.status(404).json({
        success: false,
        message: "Compliance staff member not found",
      });
    }

    await ComplianceStaff.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Compliance staff member deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting compliance staff:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting compliance staff member",
      error: error.message,
    });
  }
};

const getAvailableUsers = async (req, res) => {
  try {
    const existingStaffUserIds = await ComplianceStaff.find().distinct("userId");
    
    const availableUsers = await User.find({
      _id: { $nin: existingStaffUserIds },
    })
      .populate("role", "name")
      .select("name email role")
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      data: availableUsers,
    });
  } catch (error) {
    console.error("Error fetching available users:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching available users",
      error: error.message,
    });
  }
};

const getStaffStatistics = async (req, res) => {
  try {
    const totalStaff = await ComplianceStaff.countDocuments();
    const activeStaff = await ComplianceStaff.countDocuments({ status: "Active" });
    const onLeaveStaff = await ComplianceStaff.countDocuments({ status: "On Leave" });
    const inactiveStaff = await ComplianceStaff.countDocuments({ status: "Inactive" });

    const departmentStats = await ComplianceStaff.aggregate([
      {
        $group: {
          _id: "$department",
          count: { $sum: 1 },
        },
      },
    ]);

    const statusStats = await ComplianceStaff.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: {
        total: totalStaff,
        active: activeStaff,
        onLeave: onLeaveStaff,
        inactive: inactiveStaff,
        byDepartment: departmentStats,
        byStatus: statusStats,
      },
    });
  } catch (error) {
    console.error("Error fetching staff statistics:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching staff statistics",
      error: error.message,
    });
  }
};

const getRoleStatistics = async (req, res) => {
  try {
    // Get all users and group by their actual role names from User Management
    const users = await User.find()
      .populate("role", "name permissions")
      .select("name email role");

    // Define role styling based on role name - using original User Management role names
    const getRoleStyle = (roleName) => {
      const name = roleName.toLowerCase().trim();
      
      if (name === "admin") {
        return { icon: "ShieldCheckIcon", color: "purple", description: "System Administrator" };
      } else if (name === "operation management") {
        return { icon: "ScaleIcon", color: "green", description: "Operation Management Team" };
      } else if (name === "accounting") {
        return { icon: "BanknotesIcon", color: "pink", description: "Accounting Department" };
      } else if (name === "compliance management") {
        return { icon: "IdentificationIcon", color: "cyan", description: "Compliance Management Team" };
      } else if (name === "mlro") {
        return { icon: "ExclamationTriangleIcon", color: "red", description: "Money Laundering Reporting Officer" };
      } else if (name === "dmlro") {
        return { icon: "DocumentMagnifyingGlassIcon", color: "orange", description: "Deputy Money Laundering Reporting Officer" };
      } else if (name === "ceo") {
        return { icon: "TrophyIcon", color: "yellow", description: "Chief Executive Officer" };
      } else if (name === "external parties") {
        return { icon: "UsersIcon", color: "blue", description: "External Parties" };
      } else {
        return { icon: "UserIcon", color: "gray", description: "Staff Member" };
      }
    };

    // Count users by their original role names
    const roleStats = {};
    
    users.forEach(user => {
      if (user.role) {
        const originalRoleName = user.role.name; // Keep original capitalization
        
        if (!roleStats[originalRoleName]) {
          roleStats[originalRoleName] = {
            role: originalRoleName,
            count: 0,
            ...getRoleStyle(originalRoleName)
          };
        }
        roleStats[originalRoleName].count++;
      }
    });

    const result = Object.values(roleStats).filter(role => role.count > 0);

    res.status(200).json({
      success: true,
      data: result,
      total: users.length
    });
  } catch (error) {
    console.error("Error fetching role statistics:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching role statistics",
      error: error.message,
    });
  }
};

// Add custom section to staff member
const addStaffSection = async (req, res) => {
  try {
    const { staffId, sectionTitle, sectionDescription } = req.body;
    
    if (!staffId || !sectionTitle) {
      return res.status(400).json({
        success: false,
        message: "Staff ID and section title are required"
      });
    }

    // Find the staff member and add the new section
    const staffMember = await ComplianceStaff.findById(staffId);
    if (!staffMember) {
      return res.status(404).json({
        success: false,
        message: "Staff member not found"
      });
    }

    const newSection = {
      id: `custom-${Date.now()}`,
      title: sectionTitle,
      description: sectionDescription || "Custom document section",
      icon: "DocumentTextIcon",
      color: "cyan",
      documents: [],
      expanded: true,
      isCustom: true
    };

    // Add the new section to the staff member
    staffMember.sections.push(newSection);
    
    // Save the updated staff member
    await staffMember.save();
    
    console.log(`Section "${sectionTitle}" added successfully for ${staffMember.name}`);

    res.status(201).json({
      success: true,
      message: "Section added successfully",
      data: newSection
    });

  } catch (error) {
    console.error("Error adding staff section:", error);
    res.status(500).json({
      success: false,
      message: "Error adding staff section",
      error: error.message,
    });
  }
};

// Delete custom section from staff
const deleteStaffSection = async (req, res) => {
  try {
    const { staffId, sectionId } = req.body;
    
    if (!staffId || !sectionId) {
      return res.status(400).json({
        success: false,
        message: "Staff ID and section ID are required"
      });
    }

    // Find the staff member
    const staffMember = await ComplianceStaff.findById(staffId);
    if (!staffMember) {
      return res.status(404).json({
        success: false,
        message: "Staff member not found"
      });
    }

    // Find the section index
    const sectionIndex = staffMember.sections.findIndex(
      section => section.id === sectionId
    );

    if (sectionIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Section not found"
      });
    }

    // Check if it's a custom section
    const section = staffMember.sections[sectionIndex];
    if (!section.isCustom) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete default sections"
      });
    }

    // Check if section has documents
    if (section.documents && section.documents.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete section with documents. Please remove all documents first."
      });
    }

    // Remove the section
    staffMember.sections.splice(sectionIndex, 1);
    await staffMember.save();

    res.status(200).json({
      success: true,
      message: "Section deleted successfully",
      data: staffMember
    });
  } catch (error) {
    console.error("Error deleting staff section:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting staff section",
      error: error.message,
    });
  }
};

// Upload document to staff section
const uploadStaffDocument = async (req, res) => {
  try {
    // Extract data from both body and potential form fields
    const staffId = req.body.staffId;
    const sectionId = req.body.sectionId;
    const description = req.body.description;
    const expireDate = req.body.expireDate;
    
    // Debug: Manual test with hardcoded expire date for testing
    const testExpireDate = '2025-09-05';
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded"
      });
    }

    // Import upload service function
    const { uploadToCloudinary } = require("../services/fileUploadService");
    const fs = require("fs");

    // Upload file to Cloudinary
    const uploadResult = await uploadToCloudinary(req.file.path, {
      folder: "compliance-staff-documents"
    });

    // Clean up temporary file
    try {
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
    } catch (cleanupError) {
      console.error("Error cleaning up temp file:", cleanupError);
    }

    const newDocument = {
      id: `doc-${Date.now()}`,
      name: req.file.originalname,
      description: description || "Uploaded document",
      uploadDate: new Date(),
      size: `${(req.file.size / 1024).toFixed(2)} KB`,
      uploadedBy: req.user?.name || "System User",
      fileUrl: uploadResult.success ? uploadResult.url : uploadResult.url, // Use Cloudinary URL or fallback
      cloudinaryId: uploadResult.publicId || null,
      expireDate: expireDate ? new Date(expireDate) : null
    };

    // Debug logging
    console.log(`Upload request - staffId: ${staffId}, sectionId: ${sectionId}`);
    console.log(`Request body:`, { staffId, sectionId, description, expireDate });
    console.log(`Full req.body:`, req.body);

    // Find the staff member and update their document section
    const staffMember = await ComplianceStaff.findById(staffId);
    console.log(`Found staff member:`, staffMember ? `${staffMember.name} (${staffMember._id})` : 'NOT FOUND');
    
    if (!staffMember) {
      // Try to find by email if direct ID lookup fails
      console.log('Attempting to find by User ID reference...');
      const staffByUserId = await ComplianceStaff.findOne({ userId: staffId });
      console.log(`Found by userId:`, staffByUserId ? `${staffByUserId.name} (${staffByUserId._id})` : 'NOT FOUND');
      
      return res.status(404).json({
        success: false,
        message: "Staff member not found",
        debug: { 
          staffId, 
          searchedById: true, 
          searchedByUserId: !!staffByUserId,
          availableStaffCount: await ComplianceStaff.countDocuments()
        }
      });
    }

    // Find the section and add the document
    console.log(`Staff member sections:`, staffMember.sections.map(s => ({ id: s._id, title: s.title, mongoId: s.id })));
    console.log(`Looking for sectionId: ${sectionId}`);
    
    const section = staffMember.sections.id(sectionId);
    console.log(`Found section:`, section ? `${section.title} (${section._id})` : 'NOT FOUND');
    
    if (!section) {
      return res.status(404).json({
        success: false,
        message: "Section not found",
        debug: { 
          sectionId, 
          availableSections: staffMember.sections.map(s => ({ id: s._id, title: s.title, mongoId: s.id }))
        }
      });
    }

    // Add document to the section
    section.documents.push(newDocument);
    
    // Save the updated staff member
    await staffMember.save();
    
    // Create notification if document has expire date  
    console.log('🚀 Checking if notification should be created - expireDate:', expireDate);
    console.log('🚀 Testing with hardcoded expire date - testExpireDate:', testExpireDate);
    console.log('🚀 Force create notification for testing');
    // ALWAYS create notification for testing
    if (true) {
      console.log('✅ Creating notification for document with expire date');
      const { createComplianceNotification } = require("../services/complianceNotificationService");
      
      try {
        const expiryDate = expireDate || testExpireDate;
        
        console.log('🚀 Starting notification creation process...');
        
        let allUsers = [];
        let targetUserIds = [];
        
        try {
          // Get all users first, then filter by role name after populate
          console.log('📋 Fetching all users from database...');
          allUsers = await User.find().populate("role", "name");
          
          console.log(`📊 Found ${allUsers.length} users in database`);
          console.log('🔍 All users with roles:');
          allUsers.forEach(user => {
            console.log(`  - ${user.name}: ${user.role ? user.role.name : 'No role'}`);
          });
          
          // Filter for admin and compliance management users only, EXCLUDE the uploader
          console.log('🎯 Filtering for Admin and Compliance Management users...');
          console.log('🚫 Excluding document uploader from notification recipients');
          console.log('📤 Uploader ID:', req.user._id.toString());
          console.log('📤 Uploader name:', req.user.name);
          
          const targetUsers = allUsers.filter(user => {
            // Exclude the current user who uploaded the document
            if (user._id.toString() === req.user._id.toString()) {
              console.log(`🚫 Excluding uploader: ${user.name}`);
              return false;
            }
            
            if (!user.role || !user.role.name) return false;
            const roleName = user.role.name.toLowerCase().trim();
            return roleName === 'admin' || 
                   roleName === 'compliance management' ||
                   roleName.includes('admin') ||
                   roleName.includes('compliance');
          });
          
          targetUserIds = targetUsers.map(user => user._id);
          
          console.log('🎯 Final notification recipients (supervisors/managers only):');
          targetUsers.forEach(user => {
            console.log(`  ✅ ${user.name} (${user.role.name})`);
          });
          
        } catch (userError) {
          console.error('❌ Error fetching users:', userError.message);
          console.error('Stack:', userError.stack);
          
          // Fallback: use current user as recipient
          console.log('🔄 Using fallback: current user as recipient');
          if (req.user && req.user._id) {
            targetUserIds = [req.user._id];
            console.log('Fallback target user:', req.user.name);
          }
        }
        
        console.log(`🎯 Final notification target: ${targetUserIds.length} users`);
        console.log('Target user IDs:', targetUserIds);
        
        await createComplianceNotification({
          title: "Document Uploaded with Expiry Date",
          message: `Document "${req.file.originalname}" uploaded for ${staffMember.name} in ${section.title} section. Expires on ${new Date(expiryDate).toLocaleDateString()}.`,
          type: "document_uploaded",
          priority: "medium",
          targetUsers: targetUserIds, // Add target users
          metadata: {
            staffName: staffMember.name,
            sectionName: section.title,
            documentName: req.file.originalname,
            expireDate: new Date(expiryDate),
            daysLeft: Math.ceil((new Date(expiryDate) - new Date()) / (1000 * 60 * 60 * 24))
          }
        });
        console.log(`Notification created for document upload with expiry: ${req.file.originalname}`);
      } catch (notificationError) {
        console.error("Error creating upload notification:", notificationError);
        // Don't fail the upload if notification creation fails
      }
    }
    
    console.log(`Document uploaded successfully for ${staffMember.name} in section ${section.title}`);
    console.log('✅ === UPLOAD COMPLETE ===');
    console.log('Document saved with ID:', newDocument.id);
    console.log('================================\n');

    res.status(201).json({
      success: true,
      message: "Document uploaded successfully",
      data: newDocument
    });

  } catch (error) {
    console.error("\n❌ === UPLOAD ERROR ===");
    console.error("Error message:", error.message);
    console.error("Stack trace:", error.stack);
    console.error("================================\n");
    
    res.status(500).json({
      success: false,
      message: "Error uploading document",
      error: error.message,
    });
  }
};

// Delete document from staff section
const deleteStaffDocument = async (req, res) => {
  try {
    const { staffId, sectionId, documentId } = req.body;
    
    console.log(`Delete request - staffId: ${staffId}, sectionId: ${sectionId}, documentId: ${documentId}`);

    // Find the staff member
    const staffMember = await ComplianceStaff.findById(staffId);
    if (!staffMember) {
      return res.status(404).json({
        success: false,
        message: "Staff member not found"
      });
    }

    // Find the section
    const section = staffMember.sections.id(sectionId);
    if (!section) {
      return res.status(404).json({
        success: false,
        message: "Section not found"
      });
    }

    // Find and remove the document
    const documentIndex = section.documents.findIndex(doc => doc.id === documentId);
    if (documentIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Document not found"
      });
    }

    section.documents.splice(documentIndex, 1);
    await staffMember.save();
    
    console.log(`Document deleted successfully for ${staffMember.name}`);

    res.status(200).json({
      success: true,
      message: "Document deleted successfully"
    });

  } catch (error) {
    console.error("Error deleting document:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting document",
      error: error.message,
    });
  }
};

// Update document metadata
const updateStaffDocument = async (req, res) => {
  try {
    const { staffId, sectionId, documentId, description, expireDate } = req.body;
    
    console.log(`📝 === DOCUMENT UPDATE STARTED ===`);
    console.log(`Update request - staffId: ${staffId}, sectionId: ${sectionId}, documentId: ${documentId}`);

    // Find the staff member
    const staffMember = await ComplianceStaff.findById(staffId);
    if (!staffMember) {
      return res.status(404).json({
        success: false,
        message: "Staff member not found"
      });
    }

    // Find the section
    const section = staffMember.sections.id(sectionId);
    if (!section) {
      return res.status(404).json({
        success: false,
        message: "Section not found"
      });
    }

    // Find and update the document
    const document = section.documents.find(doc => doc.id === documentId);
    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found"
      });
    }

    // Store original expire date to check if it changed
    const originalExpireDate = document.expireDate;
    let expireDateChanged = false;

    // Update document fields
    document.description = description;
    if (expireDate !== undefined) {
      const newExpireDate = expireDate ? new Date(expireDate) : null;
      
      // Check if expire date actually changed
      if ((originalExpireDate && newExpireDate && originalExpireDate.getTime() !== newExpireDate.getTime()) ||
          (originalExpireDate && !newExpireDate) ||
          (!originalExpireDate && newExpireDate)) {
        expireDateChanged = true;
        document.expireDate = newExpireDate;
        console.log(`📅 Expire date changed from ${originalExpireDate} to ${newExpireDate}`);
      }
    }

    await staffMember.save();
    
    // Send notification if expire date was changed
    if (expireDateChanged) {
      console.log(`🔔 === CREATING EXPIRE DATE UPDATE NOTIFICATION ===`);
      
      try {
        // Get target users (Admin and Compliance Management users, including updater)
        const targetUsers = await User.find({}).populate("role", "name");
        const filteredUsers = targetUsers.filter(user => {
          // Only include Admin and Compliance Management users
          if (!user.role || (user.role.name !== "admin" && user.role.name !== "Compliance Management")) {
            return false;
          }
          // Include all users (including the updater) for expire date updates
          return true;
        });

        const targetUserIds = filteredUsers.map(user => user._id);
        console.log(`🎯 Sending notification to ${targetUserIds.length} users (including updater)`);

        if (targetUserIds.length > 0) {
          const updaterName = req.user.name || "Unknown User";
          const formatDate = (date) => date ? date.toLocaleDateString() : "Not set";
          
          const notificationData = {
            title: "📝 Document Expire Date Updated",
            message: `${updaterName} updated the expire date for document "${document.name}" in ${section.title} section for ${staffMember.name}. Previous: ${formatDate(originalExpireDate)} → New: ${formatDate(document.expireDate)}`,
            type: "document_update",
            priority: "medium",
            targetUsers: targetUserIds,
            metadata: {
              staffId: staffMember._id,
              documentId: document.id,
              sectionId: section._id,
              updatedBy: req.user._id,
              updaterName: updaterName,
              originalExpireDate: originalExpireDate,
              newExpireDate: document.expireDate,
              staffName: staffMember.name,
              documentName: document.name,
              sectionName: section.title,
            },
            actionRequired: false,
          };

          const result = await notificationService.createComplianceNotification(notificationData);
          if (result.success) {
            console.log(`✅ Expire date update notification created successfully`);
          } else {
            console.log(`❌ Failed to create expire date update notification: ${result.error}`);
          }
        }
      } catch (notificationError) {
        console.error("❌ Error creating expire date update notification:", notificationError);
      }
    }
    
    console.log(`✅ Document updated successfully for ${staffMember.name}`);

    res.status(200).json({
      success: true,
      message: "Document updated successfully",
      data: document
    });

  } catch (error) {
    console.error("Error updating document:", error);
    res.status(500).json({
      success: false,
      message: "Error updating document",
      error: error.message,
    });
  }
};

// Replace document file
const replaceStaffDocument = async (req, res) => {
  try {
    const { staffId, sectionId, documentId, expireDate } = req.body;
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded"
      });
    }

    console.log(`Replace request - staffId: ${staffId}, sectionId: ${sectionId}, documentId: ${documentId}`);

    // Upload new file to Cloudinary
    const { uploadToCloudinary } = require("../services/fileUploadService");
    const fs = require("fs");

    const uploadResult = await uploadToCloudinary(req.file.path, {
      folder: "compliance-staff-documents"
    });

    // Clean up temporary file
    try {
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
    } catch (cleanupError) {
      console.error("Error cleaning up temp file:", cleanupError);
    }

    // Find the staff member
    const staffMember = await ComplianceStaff.findById(staffId);
    if (!staffMember) {
      return res.status(404).json({
        success: false,
        message: "Staff member not found"
      });
    }

    // Find the section
    const section = staffMember.sections.id(sectionId);
    if (!section) {
      return res.status(404).json({
        success: false,
        message: "Section not found"
      });
    }

    // Find and replace the document
    const document = section.documents.find(doc => doc.id === documentId);
    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found"
      });
    }

    // Update document with new file info
    document.name = req.file.originalname;
    document.size = `${(req.file.size / 1024).toFixed(2)} KB`;
    document.fileUrl = uploadResult.success ? uploadResult.url : uploadResult.url;
    document.cloudinaryId = uploadResult.publicId || null;
    document.uploadDate = new Date();
    document.uploadedBy = req.user?.name || "System User";
    if (expireDate !== undefined) {
      document.expireDate = expireDate ? new Date(expireDate) : null;
    }

    await staffMember.save();
    
    // Create notification if document has expire date
    if (expireDate) {
      const { createComplianceNotification } = require("../services/complianceNotificationService");
      
      try {
        await createComplianceNotification({
          title: "Document Replaced with Expiry Date",
          message: `Document "${req.file.originalname}" replaced for ${staffMember.name} in ${section.title} section. Expires on ${new Date(expireDate).toLocaleDateString()}.`,
          type: "document_uploaded",
          priority: "medium",
          metadata: {
            staffName: staffMember.name,
            sectionName: section.title,
            documentName: req.file.originalname,
            expireDate: new Date(expireDate),
            daysLeft: Math.ceil((new Date(expireDate) - new Date()) / (1000 * 60 * 60 * 24))
          }
        });
        console.log(`Notification created for document replace with expiry: ${req.file.originalname}`);
      } catch (notificationError) {
        console.error("Error creating replace notification:", notificationError);
        // Don't fail the replacement if notification creation fails
      }
    }
    
    console.log(`Document replaced successfully for ${staffMember.name}`);

    res.status(200).json({
      success: true,
      message: "Document replaced successfully",
      data: document
    });

  } catch (error) {
    console.error("Error replacing document:", error);
    res.status(500).json({
      success: false,
      message: "Error replacing document",
      error: error.message,
    });
  }
};

module.exports = {
  getAllComplianceStaff,
  getComplianceStaffById,
  createComplianceStaff,
  updateComplianceStaff,
  deleteComplianceStaff,
  getAvailableUsers,
  getStaffStatistics,
  getRoleStatistics,
  addStaffSection,
  deleteStaffSection,
  uploadStaffDocument,
  deleteStaffDocument,
  updateStaffDocument,
  replaceStaffDocument,
};