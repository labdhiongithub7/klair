import OpenAI from "openai";
import { Pinecone } from "@pinecone-database/pinecone";

const openaiApiKey = process.env.OPENAI_API_KEY;
const pineconeApiKey = process.env.PINECONE_API_KEY;
const pineconeIndexName = process.env.PINECONE_INDEX;

if (!openaiApiKey) {
  console.warn(
    "[klair] OPENAI_API_KEY is not set. RAG answering will fail until this is configured.",
  );
}

if (!pineconeApiKey || !pineconeIndexName) {
  console.warn(
    "[klair] PINECONE_API_KEY or PINECONE_INDEX is not set. PDF indexing will fail until this is configured.",
  );
}

const openai = new OpenAI({
  apiKey: openaiApiKey,
});

const pinecone = pineconeApiKey
  ? new Pinecone({
      apiKey: pineconeApiKey,
    })
  : null;

type ChunkMetadata = {
  documentId: string;
  pageNumber: number;
  paragraphIndex: number;
  text: string;
};

const EMBEDDING_MODEL =
  process.env.KLAIR_EMBEDDING_MODEL ?? "text-embedding-3-small";
const CHAT_MODEL = process.env.KLAIR_CHAT_MODEL ?? "gpt-4.1-mini";

const MAX_CHARS_PER_CHUNK = 1000;
const EMBEDDING_BATCH_SIZE = 32;

function splitIntoParagraphs(text: string): string[] {
  return text
    .split(/\n{2,}/g)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
}

function splitParagraphIntoChunks(paragraph: string): string[] {
  if (paragraph.length <= MAX_CHARS_PER_CHUNK) {
    return [paragraph.trim()];
  }

  const chunks: string[] = [];
  for (let i = 0; i < paragraph.length; i += MAX_CHARS_PER_CHUNK) {
    chunks.push(paragraph.slice(i, i + MAX_CHARS_PER_CHUNK).trim());
  }
  return chunks.filter((c) => c.length > 0);
}

async function embedBatch(texts: string[]): Promise<number[][]> {
  if (!openaiApiKey) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }

  const response = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: texts,
  });

  return response.data.map((item) => item.embedding);
}

export async function indexDocument(
  documentId: string,
  pages: { pageNumber: number; text: string }[],
): Promise<void> {
  if (!pinecone || !pineconeIndexName) {
    throw new Error("Pinecone is not configured.");
  }

  const index = pinecone.index<ChunkMetadata>(pineconeIndexName);

  const texts: string[] = [];
  const metadataList: ChunkMetadata[] = [];
  const ids: string[] = [];

  for (const page of pages) {
    const paragraphs = splitIntoParagraphs(page.text);
    paragraphs.forEach((paragraph, paragraphIndex) => {
      const chunks = splitParagraphIntoChunks(paragraph);
      chunks.forEach((chunkText, localChunkIndex) => {
        const id = `${documentId}::${page.pageNumber}::${paragraphIndex}::${localChunkIndex}`;
        ids.push(id);
        texts.push(chunkText);
        metadataList.push({
          documentId,
          pageNumber: page.pageNumber,
          paragraphIndex,
          text: chunkText,
        });
      });
    });
  }

  if (texts.length === 0) return;

  for (let i = 0; i < texts.length; i += EMBEDDING_BATCH_SIZE) {
    const batchTexts = texts.slice(i, i + EMBEDDING_BATCH_SIZE);
    const batchIds = ids.slice(i, i + EMBEDDING_BATCH_SIZE);
    const batchMetadata = metadataList.slice(i, i + EMBEDDING_BATCH_SIZE);

    const embeddings = await embedBatch(batchTexts);

    const records = embeddings.map((values, idx) => ({
      id: batchIds[idx],
      values,
      metadata: batchMetadata[idx],
    }));

    await index.upsert({
      records,
      namespace: documentId,
    });
  }
}

type Citation = {
  page: number;
  paragraphIndex: number;
  snippet: string;
};

export type RagAnswer = {
  answer: string;
  citations: Citation[];
};

export async function answerQuestion(
  documentId: string,
  question: string,
): Promise<RagAnswer> {
  if (!pinecone || !pineconeIndexName) {
    throw new Error("Pinecone is not configured.");
  }

  if (!openaiApiKey) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }

  const index = pinecone.index<ChunkMetadata>(pineconeIndexName);

  const [questionEmbedding] = await embedBatch([question]);

  const queryResponse = await index.query({
    vector: questionEmbedding,
    topK: 6,
    includeMetadata: true,
    namespace: documentId,
  });

  const matches = queryResponse.matches ?? [];

  const contexts: string[] = [];
  const citations: Citation[] = [];

  for (const match of matches) {
    const meta = match.metadata as ChunkMetadata | undefined;
    if (!meta) continue;

    contexts.push(
      `Page ${meta.pageNumber}, paragraph ${meta.paragraphIndex + 1}:\n${meta.text}`,
    );

    citations.push({
      page: meta.pageNumber,
      paragraphIndex: meta.paragraphIndex,
      snippet: meta.text.slice(0, 260),
    });
  }

  const systemPrompt =
    "You are Klair, a gentle AI for technical PDFs. " +
    "You answer questions strictly using the provided context from the PDF. " +
    "Cite concrete facts and keep answers concise, but warm. " +
    "If the context does not contain the answer, say that you are not sure rather than guessing.";

  const userPrompt = [
    `Question:\n${question}`,
    "",
    "Context from the PDF:",
    contexts.length > 0 ? contexts.join("\n\n---\n\n") : "(no context available)",
  ].join("\n");

  const completion = await openai.chat.completions.create({
    model: CHAT_MODEL,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
  });

  const answer =
    completion.choices[0]?.message?.content ??
    "I could not generate an answer from the current context.";

  return {
    answer,
    citations,
  };
}

