import { Pinecone } from "@pinecone-database/pinecone";

if (!process.env.PINECONE_API_KEY) {
  throw new Error("Pinecone api key var missing");
}

export const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY,
});

export const getCompatibleIndex = (indexName: string) => {
  const index = pinecone.index(indexName);

  return new Proxy(index, {
    get(target, prop, receiver) {
      if (prop === "query") {
        return async (args: any) => {
          console.log("Proxy query args:", JSON.stringify(args));
          if (args && args.queryRequest) {
            const { queryRequest } = args;
            return target.query({
              ...queryRequest,
              topK: queryRequest.topK,
            });
          }
          return target.query(args);
        };
      }
      if (prop === "upsert") {
        return async (args: any) => {
          console.log("Proxy upsert args:", JSON.stringify(args));
          if (args && args.upsertRequest) {
            return target.upsert(args.upsertRequest.vectors);
          }
          return target.upsert(args);
        };
      }
      return Reflect.get(target, prop, receiver);
    },
  });
};
