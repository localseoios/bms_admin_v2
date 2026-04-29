const crypto = require("crypto");
const fs = require("fs");

const SECRET = "BMS$Lk9#Px2@Qr7!Nt4*Mw1^Jv6&Yz8";

const machineId = process.argv[2];
const expiry = process.argv[3] || "2030-01-01";

if (!machineId) {
  console.log("Usage: node generate-license.js <machineId> [expiry-date]");
  console.log("Example: node generate-license.js aa:bb:cc:dd:ee:ff 2027-12-31");
  process.exit(1);
}

const signature = crypto
  .createHmac("sha256", SECRET)
  .update(machineId + expiry)
  .digest("hex");

const license = { machineId, expiry, signature };

fs.writeFileSync("license.key", JSON.stringify(license, null, 2), "utf8");
console.log("license.key generated:");
console.log(JSON.stringify(license, null, 2));
console.log("\nSend the license.key file to the client. They place it inside the backend/ folder.");
