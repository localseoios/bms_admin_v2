const Client = require("../models/Client");
const Job = require("../models/Job");

const getClientByGmail = async (req, res) => {
  const { gmail } = req.params;
  try {
    const client = await Client.findOne({ gmail });
    if (!client) {
      return res.status(404).json({ message: "Client not found" });
    }
    const jobs = await Job.find({ clientId: client._id });
    res.status(200).json({ client, jobs });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = { getClientByGmail };
