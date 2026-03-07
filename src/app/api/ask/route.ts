import { NextRequest, NextResponse } from "next/server";
import { answerQuestion } from "@/lib/rag";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "Invalid JSON body." },
        { status: 400 },
      );
    }

    const question = (body as { question?: string }).question;
    const documentId = (body as { documentId?: string }).documentId;

    if (!question || typeof question !== "string") {
      return NextResponse.json(
        { error: "`question` must be a non-empty string." },
        { status: 400 },
      );
    }

    if (!documentId || typeof documentId !== "string") {
      return NextResponse.json(
        { error: "`documentId` must be provided." },
        { status: 400 },
      );
    }

    const result = await answerQuestion(documentId, question);

    return NextResponse.json(result);
  } catch (error) {
    console.error("[ask] Failed to answer question", error);
    return NextResponse.json(
      { error: "Failed to answer question. Please try again." },
      { status: 500 },
    );
  }
}

