import { NextRequest, NextResponse } from "next/server";
import pdf from "pdf-parse";
import { indexDocument } from "@/lib/rag";

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
      pagerender: (pageData: { getTextContent: () => unknown }) =>
        pageData.getTextContent(),
    } as unknown);

    const rawPages = typeof data.text === "string" ? data.text.split("\f") : [];

    const pages: ParsedPage[] = rawPages
      .map((t: string, index: number) => ({
        pageNumber: index + 1,
        text: t.trim(),
      }))
      .filter((p: ParsedPage) => p.text.length > 0);

    const documentId = crypto.randomUUID();

    // Index into Pinecone so questions can be answered later.
    await indexDocument(documentId, pages);

    const responseBody: ParsedDocumentResponse = {
      documentId,
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

