// services/kycService.js
const Job = require("../models/Job");
const KycApproval = require("../models/kycApprovalModel"); // Use the proper KYC model
const { KycDocument } = require("../models/OperationModels");
const notificationService = require("./notificationService");

/**
 * Handles KYC job completion notifications and processing
 */
const kycService = {
  /**
   * Processes a completed KYC job and sends appropriate notifications
   * @param {Object} job - The completed job
   * @param {Object} user - The user who completed the job
   * @returns {Promise<void>}
   */
  processCompletedKycJob: async (job, user) => {
    try {
      // Check if this is a KYC job
      const isKycJob =
        job.serviceType &&
        (job.serviceType.toLowerCase().includes("kyc") || 
         job.type === "kyc" ||
         job.status === "om_completed"); // Include jobs ready for KYC

      if (!isKycJob) {
        console.log(
          `Job #${job._id} is not a KYC job, skipping KYC processing`
        );
        return;
      }

      console.log(`Processing completed KYC job #${job._id}`);

      // Check if KYC approval process already exists
      let kycApproval = await KycApproval.findOne({ jobId: job._id });
      
      // Check KYC documents status from operations
      const kycDocuments = await KycDocument.findOne({ jobId: job._id }).catch(() => null);

      // If KYC approval doesn't exist and job is ready, create notification for KYC team
      if (!kycApproval && job.status === "om_completed") {
        // Create notification for KYC management team
        await notificationService.createNotification(
          {
            title: "Job Ready for KYC Review",
            description: `Operations has completed job for ${job.clientName} (${job.serviceType}). The job is now ready for KYC review and approval process.`,
            type: "kyc",
            subType: "ready_for_review",
            relatedTo: { model: "Job", id: job._id },
          },
          { "role.permissions.kycManagement.lmro": true } // Target LMRO users specifically
        );

        // Also notify management/admin
        await notificationService.createNotification(
          {
            title: "KYC Job Ready for Review",
            description: `Job #${job.jobNumber || job._id} for ${job.clientName} has been completed by Operations and is ready for KYC approval process.`,
            type: "job",
            subType: "kyc",
            relatedTo: { model: "Job", id: job._id },
          },
          { "role.name": "admin" }
        );
      }

      // Document completeness check
      if (!kycDocuments || !kycDocuments.documents || kycDocuments.documents.length === 0) {
        // Alert that operational KYC documents might be missing
        await notificationService.createNotification(
          {
            title: "KYC Documents Check Required",
            description: `Job #${job.jobNumber || job._id} for ${job.clientName} is ready for KYC review. Please verify all required operational documents are uploaded before starting the approval process.`,
            type: "job",
            subType: "kyc_documents_check",
            relatedTo: { model: "Job", id: job._id },
          },
          { "role.permissions.operationManagement": true }
        );
      }

      console.log(`KYC processing complete for job #${job._id}`);
    } catch (error) {
      console.error(`Error processing KYC job #${job._id}:`, error);
      throw error;
    }
  },

  /**
   * Checks if a job is eligible for KYC approval process
   * @param {Object} job - The job to check
   * @returns {Promise<Object>} - Eligibility status and details
   */
  checkKycEligibility: async (job) => {
    try {
      const result = {
        eligible: false,
        reason: "",
        missingRequirements: [],
        canInitialize: false
      };

      // Check job status
      if (job.status !== "om_completed") {
        result.reason = "Job must be completed by Operations Management first";
        result.missingRequirements.push("Operations completion");
        return result;
      }

      // Check if KYC already exists
      const existingKyc = await KycApproval.findOne({ jobId: job._id });
      if (existingKyc) {
        result.reason = `KYC process already exists with status: ${existingKyc.status}`;
        result.canInitialize = existingKyc.status === "rejected"; // Allow re-initialization if rejected
        return result;
      }

      // Check for required documents (optional - can be customized based on requirements)
      const kycDocuments = await KycDocument.findOne({ jobId: job._id }).catch(() => null);
      if (!kycDocuments || !kycDocuments.documents || kycDocuments.documents.length === 0) {
        result.missingRequirements.push("Operational KYC documents");
      }

      // Job is eligible if all basic requirements are met
      result.eligible = true;
      result.canInitialize = true;
      result.reason = "Job is ready for KYC approval process";

      return result;
    } catch (error) {
      console.error(`Error checking KYC eligibility for job ${job._id}:`, error);
      return {
        eligible: false,
        reason: "Error checking eligibility",
        error: error.message
      };
    }
  },

  /**
   * Sends notifications when KYC status changes
   * @param {Object} job - The job
   * @param {Object} kycApproval - The KYC approval record
   * @param {Object} user - The user who made the change
   * @param {string} action - The action performed (approved, rejected, etc.)
   * @returns {Promise<void>}
   */
  notifyKycStatusChange: async (job, kycApproval, user, action) => {
    try {
      const stage = kycApproval.currentApprovalStage;
      const stageDisplayName = stage === 'lmro' ? 'LMRO' : stage === 'dlmro' ? 'DLMRO' : 'CEO';

      switch (action) {
        case 'approved':
          // Notify next stage (if applicable)
          if (stage === 'lmro') {
            await notificationService.createNotification(
              {
                title: "KYC Requires DLMRO Review",
                description: `${stageDisplayName} has approved KYC for ${job.clientName}. DLMRO review is now required.`,
                type: "kyc",
                subType: "dlmro_review_required",
                relatedTo: { model: "Job", id: job._id },
              },
              { "role.permissions.kycManagement.dlmro": true }
            );
          } else if (stage === 'dlmro') {
            await notificationService.createNotification(
              {
                title: "KYC Requires CEO Approval",
                description: `${stageDisplayName} has approved KYC for ${job.clientName}. CEO final approval is now required.`,
                type: "kyc",
                subType: "ceo_approval_required",
                relatedTo: { model: "Job", id: job._id },
              },
              { "role.permissions.kycManagement.ceo": true }
            );
          } else if (stage === 'ceo') {
            // KYC completed - notify relevant parties
            await notificationService.createNotification(
              {
                title: "KYC Process Completed",
                description: `KYC process for ${job.clientName} has been completed successfully. Job is now ready for next phase.`,
                type: "kyc",
                subType: "completed",
                relatedTo: { model: "Job", id: job._id },
              },
              { _id: job.assignedPerson }
            );

            // Notify admin
            await notificationService.createNotification(
              {
                title: "KYC Completed",
                description: `KYC for ${job.clientName} (Job #${job.jobNumber || job._id}) has been completed by CEO.`,
                type: "job",
                subType: "kyc_completed",
                relatedTo: { model: "Job", id: job._id },
              },
              { "role.name": "admin" }
            );
          }
          break;

        case 'rejected':
          // Notify relevant parties about rejection
          await notificationService.createNotification(
            {
              title: "KYC Request Rejected",
              description: `${stageDisplayName} has rejected KYC for ${job.clientName}. Reason: ${kycApproval.rejectionReason || 'Not specified'}`,
              type: "kyc",
              subType: "rejected",
              relatedTo: { model: "Job", id: job._id },
            },
            { _id: job.assignedPerson }
          );

          // Notify admin about rejection
          await notificationService.createNotification(
            {
              title: "KYC Rejected",
              description: `KYC for ${job.clientName} rejected by ${stageDisplayName}: ${kycApproval.rejectionReason || 'No reason provided'}`,
              type: "job",
              subType: "kyc_rejected",
              relatedTo: { model: "Job", id: job._id },
            },
            { "role.name": "admin" }
          );
          break;

        case 'document_updated':
          // Notify admin about document changes
          await notificationService.createNotification(
            {
              title: "KYC Document Updated",
              description: `${stageDisplayName} document updated for ${job.clientName}'s KYC by ${user.name}`,
              type: "kyc",
              subType: "document_updated",
              relatedTo: { model: "Job", id: job._id },
            },
            { "role.name": "admin" }
          );
          break;

        case 'document_deleted':
          // Notify admin about document deletion
          await notificationService.createNotification(
            {
              title: "KYC Document Deleted",
              description: `${stageDisplayName} document deleted for ${job.clientName}'s KYC by ${user.name}`,
              type: "kyc",
              subType: "document_deleted",
              relatedTo: { model: "Job", id: job._id },
            },
            { "role.name": "admin" }
          );
          break;

        default:
          console.log(`Unknown KYC action: ${action}`);
      }
    } catch (error) {
      console.error(`Error sending KYC status change notifications:`, error);
      // Don't throw error - notifications are non-critical
    }
  },

  /**
   * Gets KYC statistics for reporting
   * @returns {Promise<Object>} - KYC statistics
   */
  getKycStatistics: async () => {
    try {
      const stats = {
        total: 0,
        pending: 0,
        in_progress: 0,
        completed: 0,
        rejected: 0,
        by_stage: {
          lmro: 0,
          dlmro: 0,
          ceo: 0
        }
      };

      const allKyc = await KycApproval.find({});
      stats.total = allKyc.length;

      allKyc.forEach(kyc => {
        stats[kyc.status] = (stats[kyc.status] || 0) + 1;
        
        if (kyc.status === 'in_progress') {
          stats.by_stage[kyc.currentApprovalStage] = (stats.by_stage[kyc.currentApprovalStage] || 0) + 1;
        }
      });

      return stats;
    } catch (error) {
      console.error('Error getting KYC statistics:', error);
      return null;
    }
  }
};

module.exports = kycService;