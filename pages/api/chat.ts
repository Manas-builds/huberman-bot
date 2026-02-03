import type { NextApiRequest, NextApiResponse } from "next";
import { VectorDBQAChain } from "langchain/chains";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { PineconeStore } from "langchain/vectorstores/pinecone";

import { openai } from "../../utils/openai-client";
import { getCompatibleIndex } from "../../utils/pinecone-client";
import { PINECONE_INDEX_NAME } from "../../config/pinecone";
import { ConversationalRetrievalQAChain } from "langchain/chains";

import * as mockData from "./mock.json";
import { CombineChatHistory } from "../../utils/combineChatHistory";
import { saveQuestion } from "../../utils/database";
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { question, chatHistory, user } = req.body;

  const shouldMockTheRes = false;

  if (!question) {
    return res.status(400).json({ message: "No question in the request" });
  }

  if (shouldMockTheRes) return res.status(200).json(mockData);

  try {
    // OpenAI recommends replacing newlines with spaces for best results
    const sanitizedQuestion = question.trim().replaceAll("\n", " ");

    const index = getCompatibleIndex(PINECONE_INDEX_NAME);
    /* create vectorstore*/
    const vectorStore = await PineconeStore.fromExistingIndex(
      new OpenAIEmbeddings({
        openAIApiKey: process.env.OPENAI_API_KEY,
        temperature: process.env.AI_TEMP,
      }),
      {
        pineconeIndex: index,
      }
    );

    const model = openai;

    // Normal similarity search on vector store

    // create the chain

    if (process?.env?.USE_CONTEXT === "true") {
      console.log("context QA chain");

      const combinedChatHistory = CombineChatHistory(chatHistory?.slice(1));
      const chain = ConversationalRetrievalQAChain.fromLLM(
        model,
        vectorStore.asRetriever(),
        { returnSourceDocuments: true }
      );
      console.log(combinedChatHistory, "==");
      const response = await chain.call({
        question: sanitizedQuestion,
        chat_history: combinedChatHistory,
      });

      return res.status(200).json(response);
    } else {
      console.log("simple QA chain");
      const chain = VectorDBQAChain.fromLLM(model, vectorStore, {
        k: 1,
        returnSourceDocuments: true,
      });

      // Ask a question
      const response = await chain.call({
        query: sanitizedQuestion,
      });
      try {
        saveQuestion(JSON.parse(user), question, { success: true });
      } catch (error: any) {
        console.log("Firebase Error: ", error);
      }
      res.status(200).json(response);
    }
  } catch (error: any) {
    console.log("error ", error, "<<<");
    saveQuestion(JSON.parse(user), question, {
      success: false,
      error: error.message,
    });

    res.status(error.status || 500).json({ error: error.message || "Internal Server Error" });
  }
}
