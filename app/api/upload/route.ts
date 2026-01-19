
import { put } from "@vercel/blob";
import { NextResponse } from "next/server";

export const runtime = 'edge'; // Menggunakan Edge Runtime untuk latensi minimal (Opsional)

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Ekstraksi ekstensi
    const ext = file.name.split('.').pop();
    // Sanitasi nama file: hanya alfanumerik + timestamp
    const safeName = `${Date.now()}.${ext}`;
    
    // Upload langsung ke Vercel Blob
    // Token BLOB_READ_WRITE_TOKEN harus ada di env Vercel
    const blob = await put(safeName, file, {
      access: "public",
      addRandomSuffix: true,
      contentType: file.type,
    });

    return NextResponse.json({ url: blob.url });
  } catch (err: any) {
    console.error("Vercel Blob Upload error:", err);
    return NextResponse.json(
      { error: "Upload gagal", details: err.message }, 
      { status: 500 }
    );
  }
}
