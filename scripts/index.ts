import * as dotenv from "dotenv";
import { Document } from "langchain/document";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { PineconeStore } from "langchain/vectorstores/pinecone";
import { getCompatibleIndex } from "../utils/pinecone-client";

dotenv.config();
(async () => {
  const pineconeIndex = getCompatibleIndex("hub-index");

  const docs = [
    new Document({
      metadata: { foo: "bar" },
      pageContent: "pinecone is a vector db",
    }),
    new Document({
      metadata: { foo: "bar" },
      pageContent: "the quick brown fox jumped over the lazy dog",
    }),
    new Document({
      metadata: { baz: "qux" },
      pageContent: "pinecones are the woody fruiting body and of a pine tree",
    }),
  ];
  const embeddings = new OpenAIEmbeddings({
    openAIApiKey: process.env.OPENAI_API_KEY,
    temperature: process.env.AI_TEMP,
  });
  let store = await PineconeStore.fromDocuments(docs, embeddings, {
    pineconeIndex,
  });

  console.log(docs);
})();
