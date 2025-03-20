import Compressor from "compressorjs";

export async function optimizeImage(
  file: File,
  debug: boolean = false,
): Promise<string | null> {
  return new Promise((resolve, reject) => {
    const options: Compressor.Options = {
      quality: 0.8,
      minWidth: 244,
      minHeight: 244,
      resize: "contain",
      checkOrientation: true,
      convertSize: 1 * 1000, // 1KB
      convertTypes: ["image/png", "image/webp"],
      success(result: File | Blob) {
        if (debug) {
          console.log("Compression complete:", {
            originalSize: (file.size / 1024).toFixed(2) + "KB",
            compressedSize: (result.size / 1024).toFixed(2) + "KB",
            compressionRatio: (result.size / file.size).toFixed(2),
            type: result.type,
          });
        }

        // Convert to base64
        const reader = new FileReader();
        reader.onload = () => {
          resolve(reader.result as string);
        };
        reader.onerror = () => {
          reject(new Error("Failed to read file"));
        };
        reader.readAsDataURL(result as File);
      },
      error(err: Error) {
        console.warn("Compression failed:", err);
        resolve(null); // Fallback to original instead of rejecting
      },
    };

    new Compressor(file, options);
  });
}
