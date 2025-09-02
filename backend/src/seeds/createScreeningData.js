// Script to create sample screening data
const mongoose = require("mongoose");
const Client = require("../models/Client");
const Job = require("../models/Job");
const Screening = require("../models/screeningModel");
const User = require("../models/userModel");

const createScreeningData = async () => {
  try {
    // Find existing test client
    const client = await Client.findOne({ gmail: "tt@gmail.com" });
    if (!client) {
      console.log("Test client not found");
      return;
    }

    // Find the client's job
    const job = await Job.findOne({ clientId: client._id });
    if (!job) {
      console.log("No job found for client");
      return;
    }

    // Find a user to assign as screener
    const user = await User.findOne();
    if (!user) {
      console.log("No user found to assign as screener");
      return;
    }

    console.log(`Creating screening records for client: ${client.name} (${client.gmail})`);
    console.log(`Job: ${job.jobNumber}`);

    // Create comprehensive screening records
    const screeningRecords = [
      {
        clientId: client._id,
        jobId: job._id,
        screeningType: "AML/KYC Screening",
        result: "clear",
        details: "Initial AML/KYC screening completed successfully. No adverse findings identified.",
        screenedBy: user._id,
        dataSources: [
          { name: "Internal AML Database", type: "database" },
          { name: "Sanctions Lists", type: "api" },
          { name: "PEP Database", type: "database" }
        ],
        riskScore: 15,
        reviewNotes: "Standard screening completed with no issues"
      },
      {
        clientId: client._id,
        jobId: job._id,
        screeningType: "PEP Check",
        result: "clear",
        details: "No Politically Exposed Person matches found in global PEP databases.",
        screenedBy: user._id,
        dataSources: [
          { name: "World Bank PEP List", type: "api" },
          { name: "UN PEP Database", type: "api" },
          { name: "Local PEP Registry", type: "database" }
        ],
        riskScore: 5,
        reviewNotes: "Comprehensive PEP screening completed"
      },
      {
        clientId: client._id,
        jobId: job._id,
        screeningType: "Sanctions Screening",
        result: "clear",
        details: "No matches found against international sanctions and watchlists.",
        screenedBy: user._id,
        dataSources: [
          { name: "OFAC Sanctions List", type: "api" },
          { name: "UN Security Council Sanctions", type: "api" },
          { name: "EU Sanctions List", type: "api" },
          { name: "UK HMT Sanctions", type: "api" }
        ],
        riskScore: 8,
        reviewNotes: "All major sanctions lists checked"
      },
      {
        clientId: client._id,
        jobId: job._id,
        screeningType: "Adverse Media Check",
        result: "review",
        details: "Found 1 media mention requiring manual review. Minor business news coverage identified.",
        screenedBy: user._id,
        dataSources: [
          { name: "Global News Database", type: "api" },
          { name: "Financial Press Archives", type: "api" },
          { name: "Regulatory News", type: "api" }
        ],
        riskScore: 25,
        findings: [
          {
            type: "Media Mention",
            description: "Business expansion news article",
            severity: "low",
            resolved: false,
            notes: "Positive business coverage, low risk"
          }
        ],
        reviewNotes: "Requires manual review of media mention"
      },
      {
        clientId: client._id,
        jobId: job._id,
        screeningType: "Criminal Records Check",
        result: "clear",
        details: "No criminal records or law enforcement actions found.",
        screenedBy: user._id,
        dataSources: [
          { name: "Interpol Database", type: "api" },
          { name: "National Crime Database", type: "database" },
          { name: "Court Records", type: "database" }
        ],
        riskScore: 0,
        reviewNotes: "Clean criminal background check"
      }
    ];

    // Delete existing screening records for this client
    await Screening.deleteMany({ clientId: client._id });

    // Create new screening records
    const createdRecords = await Screening.insertMany(screeningRecords);
    
    console.log(`Created ${createdRecords.length} screening records:`);
    createdRecords.forEach(record => {
      console.log(`- ${record.screeningType}: ${record.result} (Risk: ${record.riskScore})`);
    });

    return createdRecords;
  } catch (error) {
    console.error("Error creating screening data:", error);
    throw error;
  }
};

module.exports = { createScreeningData };

// Run this script directly if called
if (require.main === module) {
  require("dotenv").config();
  
  mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/bms_db")
    .then(() => {
      console.log("Connected to MongoDB");
      return createScreeningData();
    })
    .then(() => {
      console.log("Screening data creation completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Error:", error);
      process.exit(1);
    });
}