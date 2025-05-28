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

export class PdfHandler {
  static async checkPDF(file: File, password: string): Promise<PDFInfo> {
    const tmpDir = os.tmpdir();
    const originalPath = `${tmpDir}/${Date.now()}_${file.name.replace(
      /[^a-zA-Z0-9.-]/g,
      "_"
    )}`;
    try {
      const isPdfFile = (await PdfHandler.isPdfFile(file))
      if (isPdfFile != true) {
        return { result: "corrupt_file" };
      }

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      await writeFile(originalPath, buffer);

      const encryptionInfo = await PdfHandler.isEncrypt(originalPath, password);
      if (encryptionInfo != "encrypted") return { result: encryptionInfo };

      const unlockName = `unlocked_${file.name.replace(
        /[^a-zA-Z0-9.-]/g,
        "_"
      )}`;
      const unlockPath = `${tmpDir}/${Date.now()}_${unlockName}`;
      const qpdf = spawn("qpdf", [
        `--password=${password}`,
        "--decrypt",
        originalPath,
        unlockPath,
      ]);

      const exitCode = await new Promise<number>((resolve, reject) => {
        qpdf.on("close", resolve);
        qpdf.on("error", reject);
      });

      if (exitCode !== 0) {
        await unlink(originalPath);
        return { result: "corrupt_file" };
      }

      const bufferUnlockedFile = await readFile(unlockPath);

      return {
        result: "decrypted",
        unlockedFile: new File([bufferUnlockedFile], unlockName, { type: "application/pdf" }),
      };
    } catch (error: any) {
      return {
        result: "error",
        error: `Failed to check PDF: ${error.message}`,
      };
    } finally {
    }
  }

  static async isPdfFile(file: File): Promise<boolean | "corrupt_file"> {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const signature = buffer.subarray(0, 4).toString("utf8");

    if (file.type !== "application/pdf") return false;
    if (signature !== "%PDF") return "corrupt_file";

    return true;
  }

  static async isEncrypt(
    filePath: string,
    password?: string
  ): Promise<
    "encrypted" | "not_encrypted" | "incorrect_password" | "corrupt_file"
  > {
    try {
      const args = ["--show-encryption", filePath];
      if (password) {
        args.unshift("--password=" + password);
      }

      const { stdout } = await execPromise("qpdf", args);

      const output = stdout.toLowerCase();

      if (output.includes("not encrypted")) return "not_encrypted";
      if (output.includes("incorrect password")) return "incorrect_password";
      if (output.includes("file is damaged")) return "corrupt_file";

      return "encrypted";
    } catch (err: any) {
      const stderr = err.stderr?.toLowerCase() || err.message.toLowerCase();
      if (stderr.includes("incorrect password")) return "incorrect_password";
      throw new Error("qpdf error: " + stderr);
    }
  }
}
