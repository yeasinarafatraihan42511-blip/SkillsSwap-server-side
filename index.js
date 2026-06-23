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

    app.get("/", (req, res) => {
      res.send("SkillSwap Server Running");
    });

    app.post("/tasks", async (req, res) => {
      const task = req.body;

      const result = await tasksCollection.insertOne(task);

      res.send(result);
    });
    // Get all tasks
app.get("/tasks", async (req, res) => {
  const result = await tasksCollection.find().toArray();
  res.send(result);
});

// Get my tasks by email
app.get("/my-tasks", async (req, res) => {
  const email = req.query.email;

  const query = {
    clientEmail: email,
  };

  const result = await tasksCollection.find(query).toArray();

  res.send(result);
});

// Delete task
app.delete("/tasks/:id", async (req, res) => {
  const id = req.params.id;

  const query = {
    _id: new ObjectId(id),
  };

  const result = await tasksCollection.deleteOne(query);

  res.send(result);
});

// Update task
app.patch("/tasks/:id", async (req, res) => {
  const id = req.params.id;

  const updatedData = req.body;

  const query = {
    _id: new ObjectId(id),
  };

  const updateDoc = {
    $set: updatedData,
  };

  const result = await tasksCollection.updateOne(
    query,
    updateDoc
  );

  res.send(result);
});

  } catch (error) {
    console.log(error);
  }
}

run();

app.listen(port, () => {
  console.log(`Server running on ${port}`);
});