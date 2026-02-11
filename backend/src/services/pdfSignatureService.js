const { PDFDocument } = require("pdf-lib");
const https = require("https");
const http = require("http");

const SIGNATURE_POSITIONS = {
  dlmro: { x: 50, y: 80, width: 120, height: 40 },
  lmro: { x: 230, y: 80, width: 120, height: 40 },
  ceo: { x: 410, y: 80, width: 120, height: 40 },
};

const downloadFile = (url) => {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith("https") ? https : http;
    protocol.get(url, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        return downloadFile(response.headers.location).then(resolve).catch(reject);
      }

      const chunks = [];
      response.on("data", (chunk) => chunks.push(chunk));
      response.on("end", () => resolve(Buffer.concat(chunks)));
      response.on("error", reject);
    }).on("error", reject);
  });
};

const addSignatureToPdf = async (pdfUrl, signatureImageUrl, positionsOrRole) => {
  try {
    const pdfBytes = await downloadFile(pdfUrl);
    const signatureBytes = await downloadFile(signatureImageUrl);

    const pdfDoc = await PDFDocument.load(pdfBytes);

    let signatureImage;
    const signatureUrlLower = signatureImageUrl.toLowerCase();
    if (signatureUrlLower.includes(".png") || signatureUrlLower.includes("png")) {
      signatureImage = await pdfDoc.embedPng(signatureBytes);
    } else if (signatureUrlLower.includes(".jpg") || signatureUrlLower.includes(".jpeg") || signatureUrlLower.includes("jpg")) {
      signatureImage = await pdfDoc.embedJpg(signatureBytes);
    } else {
      try {
        signatureImage = await pdfDoc.embedPng(signatureBytes);
      } catch {
        signatureImage = await pdfDoc.embedJpg(signatureBytes);
      }
    }

    const pages = pdfDoc.getPages();

    // Handle multiple positions (array) or single position/role
    let positions = [];

    if (Array.isArray(positionsOrRole)) {
      positions = positionsOrRole;
    } else if (typeof positionsOrRole === "object" && positionsOrRole !== null) {
      positions = [positionsOrRole];
    } else {
      // It's a role string like "dlmro", "lmro", "ceo"
      const position = SIGNATURE_POSITIONS[positionsOrRole];
      if (!position) {
        throw new Error(`Invalid role for signature: ${positionsOrRole}`);
      }
      positions = [{ ...position, page: pages.length }];
    }

    // Add signature at each position
    for (const pos of positions) {
      const pageNumber = pos.page || pages.length;
      const pdfWidth = pos.pdfWidth || null;
      const pdfHeight = pos.pdfHeight || null;

      let targetPage;
      if (pageNumber >= 1 && pageNumber <= pages.length) {
        targetPage = pages[pageNumber - 1];
      } else {
        targetPage = pages[pages.length - 1];
      }

      const { width: actualPdfWidth, height: actualPdfHeight } = targetPage.getSize();

      let finalX = pos.x;
      let finalY = pos.y;
      const width = pos.width || 150;
      const height = pos.height || 50;

      if (pdfWidth && pdfHeight) {
        const scaleX = actualPdfWidth / pdfWidth;
        const scaleY = actualPdfHeight / pdfHeight;

        finalX = pos.x * scaleX;
        finalY = actualPdfHeight - (pos.y * scaleY) - height;
      } else {
        finalY = actualPdfHeight - pos.y - height;
      }

      targetPage.drawImage(signatureImage, {
        x: finalX,
        y: finalY,
        width: width,
        height: height,
      });
    }

    const modifiedPdfBytes = await pdfDoc.save();
    return Buffer.from(modifiedPdfBytes);
  } catch (error) {
    console.error("Error adding signature to PDF:", error);
    throw error;
  }
};

const getSignaturePosition = (role) => {
  return SIGNATURE_POSITIONS[role] || null;
};

module.exports = {
  addSignatureToPdf,
  getSignaturePosition,
  SIGNATURE_POSITIONS,
};
