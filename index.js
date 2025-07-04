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

    const parcelCollection = client.db("parcelDB").collection("parcels");

    app.get("/parcels", async (req, res) => {
      const parcels = await parcelCollection.find().toArray();
      res.send(parcels);
    });

    // get method parcels api's
    app.get("/parcels", async (req, res) => {
      try {
        const email = req.query.email;
        const query = email ? { email } : {};
        const parcels = await parcelCollection
          .find(query)
          .sort({ creation_date: -1 })
          .toArray();

        res.send({
          success: true,
          count: parcels.length,
          parcels,
        });
      } catch (error) {
        console.error("Error fetching parcels:", error);
        res.status(500).send({
          success: false,
          message: "Failed to fetch parcels.",
        });
      }
    });
    

    // post method
    // POST - Add a new parcel
    app.post("/parcels", async (req, res) => {
      try {
        const parcel = req.body;
        if (!parcel.trackingId) {
          return res.status(400).send({ error: "Tracking ID is required" });
        }
        const result = await parcelCollection.insertOne(parcel);
        res.send({ success: true, insertedId: result.insertedId });
      } catch (error) {
        console.error("Error inserting parcel:", error);
        res
          .status(500)
          .send({ success: false, message: "Internal Server Error" });
      }
    });

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
