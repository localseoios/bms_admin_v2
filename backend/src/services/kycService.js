// services/kycService.js
const Job = require("../models/Job");
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
        (job.serviceType.toLowerCase().includes("kyc") || job.type === "kyc");

      if (!isKycJob) {
        console.log(
          `Job #${job._id} is not a KYC job, skipping KYC processing`
        );
        return;
      }

      console.log(`Processing completed KYC job #${job._id}`);

      // Check KYC documents status
      const kycDocuments = await KycDocument.findOne({ jobId: job._id });

      // Create notification for management team
      await notificationService.createNotification(
        {
          title: "KYC Job Completed by Operations",
          description: `A KYC job for ${job.clientName} (Job #${job._id}) has been completed by ${user.name} from Operations Management. Please review for further processing.`,
          type: "job",
          subType: "kyc", // This will use the purple shield icon
          relatedTo: { model: "Job", id: job._id },
        },
        { "role.name": "management" }
      );

      // Document completeness check - send additional notifications if needed
      if (!kycDocuments || kycDocuments.documents.length === 0) {
        // Alert management that KYC documents are missing
        await notificationService.createNotification(
          {
            title: "KYC Documents Missing",
            description: `Attention: KYC job #${job._id} for ${job.clientName} has been completed, but no KYC documents have been uploaded. Please follow up.`,
            type: "job",
            subType: "kyc",
            relatedTo: { model: "Job", id: job._id },
          },
          { "role.name": "management" }
        );
      }

      // Add additional KYC processing logic here if needed

      console.log(`KYC processing complete for job #${job._id}`);
    } catch (error) {
      console.error(`Error processing KYC job #${job._id}:`, error);
      throw error;
    }
  },
};

module.exports = kycService;
