const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion } = require("mongodb");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

console.log(process.env.DB_PASS);

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.nb7zkyq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const postCollection = client.db("conversation").collection("postedpost");

    app.get("/posts", async (req, res) => {
      // const search = req.query.search;
      const sortBy = req.query.sortBy;

      const query = {};

      // if (search) {
      //   query.tags = { $regex: search, $options: "i" };
      // }

      let sortOptions = {};
      if (sortBy === "popularity") {
        sortOptions = {
          $expr: { $subtract: ["$upvote", "$downvote"] },
        };
      } else {
        sortOptions = { createdAt: -1 };
      }

      const result = await postCollection
        .find(query)
        .sort(sortOptions)
        .toArray();

      if (sortBy === "popularity") {
        result.sort((a, b) => b.upvote - b.downvote - (a.upvote - a.downvote));
      }

      res.send(result);
    });

    // To save Post in Database
    app.post("/post", async (req, res) => {
      const data = req.body;
      const result = await postCollection.insertOne(data);
      res.send(result);
    });

    app.get('/myPosts', async (req, res) => {
      const email = req.query.email; 
      const query = { authorEmail: email }; 
      
        const result = await postCollection.find(query).toArray(); 
        res.send(result) 
     
    });
    // Get user profile data
    app.get("/profile", async (req, res) => {
      try {
        const userId = req.user.id; // Assuming user ID is available through auth middleware
        const user = await User.findById(userId).select(
          "name image email isRegistered isMember"
        );
        res.json(user);
      } catch (err) {
        res.status(500).send("Server Error");
      }
    });

    app.get("/posts/recent", async (req, res) => {
      try {
        const userId = req.user.id;
        const posts = await Post.find({ userId })
          .sort({ date: -1 })
          .limit(3)
          .select("title content date");
        res.json(posts);
      } catch (err) {
        res.status(500).send("Server Error");
      }
    });

    // user related data

    app.post('/users', async(req,res) =>{
      const user = req.body;

      const query = {email: user.email}
      const existingUser = await userCollection.findOne(query);
      if (existingUser) {
        return res.send({message: 'exits', insertedTd: null })
      }
      const result = await userCollection.insertOne(user);
      res.send(result);

    })

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    //
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("running port");
});

app.listen(port, () => {
  console.log(`running`);
});
