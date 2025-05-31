"use server";

import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { PdfHandler } from "@/lib/pdf-handler";

export async function POST(req: Request) {
  const supabase = await createClient();
  const formData = await req.formData();

  const { error: userError } = await supabase.auth.getUser();
  if (userError) {
    return NextResponse.json({ error: userError.message }, { status: 401 });
  }

  const file = formData.get("file") as File;
  if (!file) {
    return NextResponse.json({ error: "No files received." }, { status: 400 });
  }

  const allowedTypes = process.env.NEXT_ALLOWED_FILE_TYPE!.split(",");
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json(
      { error: "File type not allowed" },
      { status: 400 }
    );
  }

  const maxSize = +process.env.NEXT_MAX_FILE_SIZE!;
  if (file.size > maxSize) {
    return NextResponse.json(
      { error: "File size too large (max 5MB)" },
      { status: 400 }
    );
  }

  const password = formData.get("password") as string;
  let uploadingFile: File = file;

  if (file.type === "application/pdf") {
    const res = await PdfHandler.checkPDF(file, password);
    if (res.result === "error") {
      return NextResponse.json({ error: res.error }, { status: 500 });
    }

    if (res.result !== "decrypted" && res.result !== "not_encrypted") {
      return NextResponse.json({ error: res.result }, { status: 400 });
    }

    if (res.result === "decrypted" && res.unlockedFile) {
      uploadingFile = res.unlockedFile;
    }
  }

  const timestamp = Date.now();
  const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
  const fileName = `/tmp/${timestamp}_${originalName}`;

  const { data, error } = await supabase.storage
    .from(process.env.NEXT_SUPABASE_BUCKET!)
    .upload(fileName, uploadingFile);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
