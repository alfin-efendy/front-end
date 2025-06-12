import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ param: string[] }> }
) {
  const { params } = context;
  const param = (await params).param?.join("/") ?? "";
  const supabase = await createClient();

  if (!param) {
    return NextResponse.json(
      { error: "File path is required" },
      { status: 400 }
    );
  }

  const { error: userError } = await supabase.auth.getUser();
  if (userError) {
    return NextResponse.json({ error: userError.message }, { status: 401 });
  }

  const { data, error } = await supabase.storage
    .from(process.env.NEXT_SUPABASE_BUCKET!)
    .download(param);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  return new Response(data, {
    headers: {
      "Content-Type": data.type || "application/octet-stream",
      "Content-Length": data.size.toString(),
      "Content-Disposition": `inline; filename="${param}"`,
      "Cache-Control": "public, max-age=60",
      Vary: "Accept-Encoding, Cookie",
    },
  });
}
