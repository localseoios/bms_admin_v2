// Updated Role model schema with BRA management permissions
const mongoose = require("mongoose");

const permissionSchema = new mongoose.Schema({
  editor: { type: Boolean, default: false },
  viewer: { type: Boolean, default: false },
});

const roleSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  permissions: {
    clientManagement: {
      companyDetails: permissionSchema,
      directorDetails: permissionSchema,
      secretaryDetails: permissionSchema,
      shareholderDetails: permissionSchema,
      sefDetails: permissionSchema,
      signedKyc: permissionSchema,
      paymentDetails: permissionSchema,
      auditedFinancial: permissionSchema,
    },
    documentManagement: { type: Boolean, default: false },
    renewalManagement: { type: Boolean, default: false },
    complianceManagement: { type: Boolean, default: false },
    requestService: { type: Boolean, default: false },
    userManagement: { type: Boolean, default: false },
    operationManagement: { type: Boolean, default: false },
    accountManagement: { type: Boolean, default: false },

    // Existing KYC Management permissions
    kycManagement: {
      lmro: { type: Boolean, default: false },
      dlmro: { type: Boolean, default: false },
      ceo: { type: Boolean, default: false },
    },
    // New BRA Management permissions section
    braManagement: {
      lmro: { type: Boolean, default: false }, // LMRO role permission
      dlmro: { type: Boolean, default: false }, // DLMRO role permission
      ceo: { type: Boolean, default: false }, // CEO role permission
    },
  },
});

module.exports = mongoose.model("Role", roleSchema);
