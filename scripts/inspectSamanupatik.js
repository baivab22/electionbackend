const { MongoClient } = require('mongodb');
require('dotenv').config();

const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/nekapa';
const dbName = uri.split('/').pop();

async function main() {
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(dbName);
  const doc = await db.collection('samanupatik').findOne();
  console.log(doc);
  await client.close();
}

main().catch(console.error);