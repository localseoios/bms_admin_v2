// src/utils/imageCompression.js
import imageCompression from "browser-image-compression";

export const compressImage = async (file, maxSizeMB = 1, maxWidth = 1920) => {
  // Only compress images, not other file types
  if (!file.type.startsWith("image/")) {
    return file;
  }

  try {
    const options = {
      maxSizeMB: maxSizeMB,
      maxWidthOrHeight: maxWidth,
      useWebWorker: true,
    };

    console.log(
      `Compressing ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`
    );
    const compressedFile = await imageCompression(file, options);
    console.log(
      `Compressed to ${(compressedFile.size / 1024 / 1024).toFixed(2)} MB`
    );

    // Create a new File object with the compressed data
    return new File([compressedFile], file.name, {
      type: file.type,
      lastModified: file.lastModified,
    });
  } catch (error) {
    console.error("Error compressing image:", error);
    return file; // Return original if compression fails
  }
};
