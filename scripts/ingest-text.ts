import { processMarkDownFiles, processTextFiles } from "../utils/helpers";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { getCompatibleIndex } from "../utils/pinecone-client";
import { PINECONE_INDEX_NAME } from "../config/pinecone";
import { OpenAIEmbeddings } from "langchain/embeddings";
import { PineconeStore } from "langchain/vectorstores/pinecone";
import { readText } from "../utils/read";
import { Document } from "langchain/document";
import fs from "fs";

/* Name of directory to retrieve files from. You can change this as required */
const directoryPath = "transcripts";
const LOGGER_FILE = "document_logs.txt";
const run = async () => {
  try {
    /*load raw docs from the markdown files in the directory */
    const rawDocs = await processTextFiles(directoryPath);
    /* Split text into chunks */
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 2000,
      chunkOverlap: 200,
    });
    const docs = await textSplitter.splitDocuments(rawDocs);
    fs.writeFile(LOGGER_FILE, JSON.stringify(docs), (err) => {
      if (err) console.log(err);
      else {
        console.log("File written successfully\n");
      }
    });
    console.log("split docs", docs.length);

    console.log("creating vector store...");
    /*create and store the embeddings in the vectorStore*/
    const embeddings = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY,
      temperature: process.env.AI_TEMP,
    });

    const pineconeIndex = getCompatibleIndex(PINECONE_INDEX_NAME);
    const index = getCompatibleIndex(PINECONE_INDEX_NAME); //change to your own index name

    console.log("Index done");
    const storeRes = await PineconeStore.fromDocuments(docs, embeddings, {
      pineconeIndex,
    });
  } catch (error) {
    console.log("error", error);
    throw new Error("Failed to ingest your data");
  }
};

(async () => {
  await run();
  console.log("ingestion complete");
})();
