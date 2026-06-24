const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { ObjectId } = require("mongodb");

const client = require("./database/db");

const app = express();

app.use(cors());
app.use(express.json());

const port = process.env.PORT || 5000;

async function run() {
  try {
    await client.connect();


    const db = client.db(process.env.DB_NAME);

    const tasksCollection = db.collection("tasks");
    const proposalsCollection = db.collection("proposals");

    app.get("/", (req, res) => {
      res.send("SkillSwap Server Running");
    });

    // =========================
    // TASK ROUTES
    // =========================

    // Create Task
    app.post("/tasks", async (req, res) => {
      const task = req.body;

      const result = await tasksCollection.insertOne(task);

      res.send(result);
    });

    // Get All Open Tasks
    app.get("/tasks", async (req, res) => {
      const query = {
        status: "open",
      };

      const result = await tasksCollection
        .find(query)
        .toArray();

      res.send(result);
    });

    // Get Single Task
    app.get("/tasks/:id", async (req, res) => {
      const id = req.params.id;

      const result = await tasksCollection.findOne({
        _id: new ObjectId(id),
      });

      res.send(result);
    });

    // Get My Tasks
    app.get("/my-tasks", async (req, res) => {
      const email = req.query.email;

      const result = await tasksCollection
        .find({
          clientEmail: email,
        })
        .toArray();

      res.send(result);
    });

    // Update Task
    app.patch("/tasks/:id", async (req, res) => {
      const id = req.params.id;

      const updatedData = req.body;

      const result = await tasksCollection.updateOne(
        {
          _id: new ObjectId(id),
        },
        {
          $set: updatedData,
        }
      );

      res.send(result);
    });

    // Delete Task
    app.delete("/tasks/:id", async (req, res) => {
      const id = req.params.id;

      const result = await tasksCollection.deleteOne({
        _id: new ObjectId(id),
      });

      res.send(result);
    });

    // =========================
    // PROPOSAL ROUTES
    // =========================

    // Submit Proposal
    app.post("/proposals", async (req, res) => {
      const proposal = req.body;

      const result =
        await proposalsCollection.insertOne(
          proposal
        );

      res.send(result);
    });

    // Get My Proposals
    app.get("/proposals", async (req, res) => {
      const email = req.query.email;

      const result =
        await proposalsCollection
          .find({
            freelancerEmail: email,
          })
          .toArray();

      res.send(result);
    });

    app.get("/accepted-projects", async (req, res) => {
      const email = req.query.email;

      const result = await proposalsCollection
        .find({
          freelancerEmail: email,
          status: "accepted",
        })
        .toArray();

      res.send(result);
    });

    // Admin Stats

    app.get("/admin-stats", async (req, res) => {
      const totalTasks =
        await tasksCollection.countDocuments();

      const totalProposals =
        await proposalsCollection.countDocuments();

      const totalUsers =
        await db.collection("user").countDocuments();

      res.send({
        totalTasks,
        totalProposals,
        totalUsers,
      });
    });
    app.get("/transactions", async (req, res) => {
  const result =
    await proposalsCollection.find().toArray();

  res.send(result);
});

    app.get("/client-proposals", async (req, res) => {
      const email = req.query.email;

      const result =
        await proposalsCollection
          .find({
            clientEmail: email,
          })
          .toArray();

      res.send(result);
    });
    app.patch("/proposals/:id", async (req, res) => {
      const id = req.params.id;

      const result =
        await proposalsCollection.updateOne(
          {
            _id: new ObjectId(id),
          },
          {
            $set: req.body,
          }
        );

      res.send(result);
    });



    console.log("MongoDB Connected Successfully");


  } catch (error) {
    console.log(error);
  }
}

run();

app.listen(port, () => {
  console.log(`Server running on ${port}`);
});
