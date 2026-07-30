import { MongoClient } from "mongodb";

const DB_NAME = process.env.MONGODB_DB ?? "recipe-consensus";

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

function getClientPromise(): Promise<MongoClient> {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("Missing MONGODB_URI environment variable.");
  }

  // Reuse the client across hot reloads in dev and across invocations of the
  // same serverless instance in production, instead of opening a new connection per request.
  if (process.env.NODE_ENV === "development") {
    if (!global._mongoClientPromise) {
      global._mongoClientPromise = new MongoClient(uri).connect();
    }
    return global._mongoClientPromise;
  }

  return new MongoClient(uri).connect();
}

export async function getDb() {
  const client = await getClientPromise();
  return client.db(DB_NAME);
}
