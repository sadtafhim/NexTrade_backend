const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection URI from .env
const uri = process.env.MONGODB_URI;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect to MongoDB
    await client.connect();
    const db = client.db("nextrade");
    const productCollection = db.collection("nextrade");

    console.log("🟢 Successfully connected to MongoDB Atlas!");

    // --- ROUTES ---

    // 0. Root Route (Fixes "Cannot GET /")
    app.get("/", (req, res) => {
      res.status(200).json({
        message: "NexTrade API is live",
        status: "Connected to MongoDB",
        endpoints: ["/api/items", "/api/items/:id"],
      });
    });

    // 1. GET all items (Used by Item List Page)
    app.get("/api/items", async (req, res) => {
      try {
        const cursor = productCollection.find().sort({ _id: -1 }); // Newest first
        const result = await cursor.toArray();
        res.send(result);
      } catch (error) {
        res.status(500).send({ message: "Error fetching items" });
      }
    });

    // 2. GET a single item by ID (Used by Item Details Page)
    app.get("/api/items/:id", async (req, res) => {
      try {
        const id = req.params.id;
        // Basic validation for MongoDB ObjectId
        if (!ObjectId.isValid(id)) {
          return res.status(400).send({ message: "Invalid ID format" });
        }
        const query = { _id: new ObjectId(id) };
        const result = await productCollection.findOne(query);
        if (!result) return res.status(404).send({ message: "Item not found" });
        res.send(result);
      } catch (error) {
        res.status(500).send({ message: "Server error" });
      }
    });

    // 3. POST a new item (Used by Add Item Page)
    app.post("/api/items", async (req, res) => {
      try {
        const newItem = req.body;
        // Data sanitization
        if (newItem.price) newItem.price = parseFloat(newItem.price);
        newItem.createdAt = new Date();

        const result = await productCollection.insertOne(newItem);
        res.status(201).send(result);
      } catch (error) {
        res.status(500).send({ message: "Error saving item" });
      }
    });
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
  }
}

// Initialize connection
run().catch(console.dir);

// Start the Server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
