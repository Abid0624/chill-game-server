const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const port = process.env.PORT || 5000;

//middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.rcb0n.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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
    const gameCollection = client.db("gameDB").collection("game");
    const userCollection = client.db("gameDB").collection("users");
    const watchlistCollection = client.db("gameDB").collection("watchlist");

    app.get("/game/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await gameCollection.findOne(query);
      res.send(result);
    });

    app.post("/game", async (req, res) => {
      const newGame = req.body;

      const result = await gameCollection.insertOne(newGame);
      res.send(result);
    });

    // get only my reviews
    app.get("/game", async (req, res) => {
      const email = req.query.email;
      const filter = email
        ? {
            email: email,
          }
        : {};

      const cursor = gameCollection.find(filter);
      const result = await cursor.toArray();
      res.send(result);
    });

    // delete a review
    app.delete("/game/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await gameCollection.deleteOne(query);
      res.send(result);
    });

    // get a review for update
    app.get("/game/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await gameCollection.findOne(query);
      res.send(result);
    });

    // update a review
    app.put("/game/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updatedReview = req.body;
      const review = {
        $set: {
          thumbnail: updatedReview.thumbnail,
          title: updatedReview.title,
          description: updatedReview.description,
          rating: updatedReview.rating,
          year: updatedReview.year,
          genre: updatedReview.genre,
        },
      };

      const result = await gameCollection.updateOne(filter, review, options);
      res.send(result);
    });

    // watchlist apis
    app.post("/watchlist", async (req, res) => {
      const newItem = req.body;

      const existing = await watchlistCollection.findOne({
        reviewId: newItem.reviewId,
        userEmail: newItem.userEmail,
      });

      if (existing) {
        return res.send({ alreadyExists: true });
      }

      const result = await watchlistCollection.insertOne(newItem);
      res.send(result);
    });

    // get only my watchlist
    app.get("/watchlist", async (req, res) => {
      const email = req.query.email;
      const filter = email ? { userEmail: email } : {};
      const result = await watchlistCollection.find(filter).toArray();
      res.send(result);
    });

    // delete from watchlist
    app.delete("/watchlist/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await watchlistCollection.deleteOne(query);
      res.send(result);
    });

    // users related apis
    app.post("/users", async (req, res) => {
      const newUser = req.body;
      const result = await userCollection.insertOne(newUser);
      res.send(result);
    });

    app.patch("/users", async (req, res) => {
      const email = req.body.email;
      const filter = { email };
      const updatedDoc = {
        $set: {
          lastSignInTime: req.body?.lastSignInTime,
        },
      };
      const result = await userCollection.updateOne(filter, updatedDoc);
      res.send(result);
    });
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Game server is running");
});

app.listen(port, () => {
  console.log(`game server is running on port:${port}`);
});
