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
      auditedFinancial: permissionSchema, // Added from permission tables
    },
    documentManagement: { type: Boolean, default: false }, // Added from permission tables
    renewalManagement: { type: Boolean, default: false },
    complianceManagement: { type: Boolean, default: false },
    requestService: { type: Boolean, default: false },
    userManagement: { type: Boolean, default: false },
  },
});

module.exports = mongoose.model("Role", roleSchema);
