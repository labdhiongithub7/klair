import { NextRequest, NextResponse } from "next/server";
import pdf from "pdf-parse";

export const runtime = "nodejs";

type ParsedPage = {
  pageNumber: number;
  text: string;
};

type ParsedDocumentResponse = {
  documentId: string;
  pages: ParsedPage[];
};

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "No PDF file provided under field `file`." },
        { status: 400 },
      );
    }

    if (file.type !== "application/pdf") {
      return NextResponse.json(
        { error: "Only PDF files are supported right now." },
        { status: 400 },
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const data = await pdf(buffer, {
      pagerender: (pageData) => pageData.getTextContent(),
    } as any);

    // `text` is a single string; split into rough per-page chunks by '\f'
    const rawPages = typeof data.text === "string" ? data.text.split("\f") : [];

    const pages: ParsedPage[] = rawPages
      .map((t, index) => ({
        pageNumber: index + 1,
        text: t.trim(),
      }))
      .filter((p) => p.text.length > 0);

    const responseBody: ParsedDocumentResponse = {
      documentId: crypto.randomUUID(),
      pages,
    };

    return NextResponse.json(responseBody);
  } catch (error) {
    console.error("[upload] Failed to parse PDF", error);
    return NextResponse.json(
      { error: "Failed to read PDF. Please try another file." },
      { status: 500 },
    );
  }
}

