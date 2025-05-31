import os from "os";
import { execFile, spawn } from "child_process";
import { writeFile, unlink, readFile } from "fs/promises";
import { promisify } from "util";

const execPromise = promisify(execFile);

export interface PDFInfo {
  result:
    | "decrypted"
    | "not_encrypted"
    | "incorrect_password"
    | "corrupt_file"
    | "error";
  unlockedFile?: File;
  error?: string;
}

// Helper function to sanitize filename
const sanitizeFilename = (filename: string): string =>
  filename.replace(/[^a-zA-Z0-9.-]/g, "_");

// Helper function to generate temporary file path
const generateTempPath = (filename: string): string =>
  `${os.tmpdir()}/${Date.now()}_${sanitizeFilename(filename)}`;

// Helper function to create File from buffer
const createFileFromBuffer = (buffer: Buffer, filename: string): File =>
  new File([buffer], filename, { type: "application/pdf" });

// Helper function to handle qpdf process
const executeQpdf = (args: string[]): Promise<number> =>
  new Promise((resolve, reject) => {
    const qpdf = spawn("qpdf", args);
    qpdf.on("close", resolve);
    qpdf.on("error", reject);
  });

export const PdfHandler = {
  checkPDF: async (file: File, password: string): Promise<PDFInfo> => {
    const originalPath = generateTempPath(file.name);

    try {
      // Check if file is a valid PDF
      const isPdfFile = await PdfHandler.isPdfFile(file);
      if (isPdfFile !== true) {
        return { result: "corrupt_file" };
      }

      // Write file to temporary location
      const buffer = Buffer.from(await file.arrayBuffer());
      await writeFile(originalPath, buffer);

      // Check encryption status
      const encryptionInfo = await PdfHandler.isEncrypt(originalPath, password);
      if (encryptionInfo !== "encrypted") {
        await unlink(originalPath).catch(() => {}); // Cleanup on non-encrypted files
        return { result: encryptionInfo };
      }

      // Generate unlocked file path
      const unlockPath = generateTempPath(`unlocked_${file.name}`);

      // Decrypt PDF
      const exitCode = await executeQpdf([
        `--password=${password}`,
        "--decrypt",
        originalPath,
        unlockPath,
      ]);

      // Cleanup original file
      await unlink(originalPath).catch(() => {});

      if (exitCode !== 0) {
        await unlink(unlockPath).catch(() => {});
        return { result: "corrupt_file" };
      }

      // Read decrypted file and create File object
      const unlockedBuffer = await readFile(unlockPath);
      await unlink(unlockPath).catch(() => {}); // Cleanup decrypted temp file

      return {
        result: "decrypted",
        unlockedFile: createFileFromBuffer(
          unlockedBuffer,
          `unlocked_${sanitizeFilename(file.name)}`
        ),
      };
    } catch (error: any) {
      // Cleanup on error
      await Promise.allSettled([
        unlink(originalPath),
        unlink(generateTempPath(`unlocked_${file.name}`)),
      ]);

      return {
        result: "error",
        error: `Failed to check PDF: ${error.message}`,
      };
    }
  },

  isPdfFile: async (file: File): Promise<boolean | "corrupt_file"> => {
    if (file.type !== "application/pdf") return false;

    const buffer = Buffer.from(await file.arrayBuffer());
    const signature = buffer.subarray(0, 4).toString("utf8");

    return signature === "%PDF" ? true : "corrupt_file";
  },

  isEncrypt: async (
    filePath: string,
    password?: string
  ): Promise<
    "encrypted" | "not_encrypted" | "incorrect_password" | "corrupt_file"
  > => {
    try {
      const args = password
        ? [`--password=${password}`, "--show-encryption", filePath]
        : ["--show-encryption", filePath];

      const { stdout } = await execPromise("qpdf", args);
      const output = stdout.toLowerCase();

      if (output.includes("not encrypted")) return "not_encrypted";
      if (output.includes("incorrect password")) return "incorrect_password";
      if (output.includes("file is damaged")) return "corrupt_file";

      return "encrypted";
    } catch (err: any) {
      const stderr = err.stderr?.toLowerCase() || err.message.toLowerCase();
      if (stderr.includes("incorrect password")) return "incorrect_password";
      throw new Error(`qpdf error: ${stderr}`);
    }
  },
};
