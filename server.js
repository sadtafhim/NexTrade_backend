const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

// Cache database connection across function calls
let cachedDb = null;

async function getDatabase() {
  if (cachedDb) return cachedDb;

  await client.connect();
  cachedDb = client.db("nextrade");
  return cachedDb;
}

// --- ROUTES ---

app.get("/", (req, res) => {
  res.status(200).json({ message: "NexTrade API is live on Vercel" });
});

app.get("/api/items", async (req, res) => {
  try {
    const db = await getDatabase();
    const result = await db
      .collection("nextrade")
      .find()
      .sort({ _id: -1 })
      .toArray();
    res.status(200).send(result);
  } catch (error) {
    res
      .status(500)
      .send({ message: "Error fetching items", error: error.message });
  }
});

app.get("/api/items/:id", async (req, res) => {
  try {
    const db = await getDatabase();
    const id = req.params.id;
    if (!ObjectId.isValid(id))
      return res.status(400).send({ message: "Invalid ID" });

    const result = await db
      .collection("products")
      .findOne({ _id: new ObjectId(id) });
    if (!result) return res.status(404).send({ message: "Not found" });
    res.status(200).send(result);
  } catch (error) {
    res.status(500).send({ message: "Server error", error: error.message });
  }
});

app.post("/api/items", async (req, res) => {
  try {
    const db = await getDatabase();
    const newItem = req.body;
    if (newItem.price) newItem.price = parseFloat(newItem.price);

    const result = await db.collection("products").insertOne(newItem);
    res.status(201).send(result);
  } catch (error) {
    res.status(500).send({ message: "Error saving", error: error.message });
  }
});

// CRITICAL: Export for Vercel
module.exports = app;
