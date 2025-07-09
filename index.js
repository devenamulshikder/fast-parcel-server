const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const port = process.env.PORT || 5000;
dotenv.config();
const stripe = require("stripe")(process.env.PAYMENT_GATEWAY_KEY);
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
    const paymentCollections = client.db("parcelDB").collection("payments");
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

    // GET: get a specific parcel by ID
    app.get("/parcels/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const parcel = await parcelCollection.findOne({
          _id: new ObjectId(id),
        });
        if (!parcel) {
          return res.status(404).send({ message: "Parcel not found" });
        }
        res.send(parcel);
      } catch (error) {
        console.error("Error fetching parcel:", error);
        res.status(500).send({ message: "Fail to fetch parcel" });
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

    // delete method
    app.delete("/parcels/:id", async (req, res) => {
      const id = req.params.id;
      const result = await parcelCollection.deleteOne({
        _id: new ObjectId(id),
      });
      res.send(result);
    });

    // payment

    app.get("/payments", async (req, res) => {
      try {
        const userEmail = req.query.email;
        const query = userEmail ? { email: userEmail } : {};
        const options = { sort: { paid_at: -1 } };
        const payments = await paymentCollections
          .find(query, options)
          .toArray();
        res.send(payments);
      } catch (error) {
        console.error("Error fetching from payment history:", error);
        res.status(500).send({ message: "Failed to get payments" });
      }
    });

    app.post("/payments", async (req, res) => {
      try {
        const { id, email, amount, paymentMethod, transactionId } = req.body;

        const updateResult = await parcelCollection.updateOne(
          { _id: new ObjectId(id) },
          { $set: { payment_status: "paid" } }
        );

        if (updateResult.modifiedCount === 0) {
          return res
            .status(404)
            .send({ message: "Parcel not found or already paid" });
        }

        const paymentDoc = {
          id,
          email,
          amount,
          paymentMethod,
          transactionId,
          paid_at_string: new Date().toISOString(),
          paid_at: new Date(),
        };

        const paymentResult = await paymentCollections.insertOne(paymentDoc);
        res.status(201).send({
          message: "Payment Recorded",
          insertedId: paymentResult.insertedId,
        });
      } catch (error) {
        console.error("Payment processing failed:", error);
        res.status(500).send({ message: "Failed to record payment" });
      }
    });

    // stripe method
    app.post("/create-payment-intent", async (req, res) => {
      const amountInCents = req.body.amountInCents;
      try {
        const paymentIntent = await stripe.paymentIntents.create({
          amount: amountInCents,
          currency: "usd",
          payment_method_types: ["card"],
        });
        res.json({ clientSecret: paymentIntent.client_secret });
      } catch (error) {
        res.status(500).json({ error: error.message });
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