const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { MongoClient, ServerApiVersion } = require("mongodb");
const port = process.env.PORT || 5000;
dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

// mongodb codded
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.shu503b.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();

    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Fast Parcel Server is running...");
});

app.listen(port, () => {
  console.log(`Fast Parcel Server is running on this port ${port}`);
});
