


const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { ObjectId } = require("mongodb");

const client = require("./database/db");

const app = express();

app.use(cors());
app.use(express.json());

const port = process.env.PORT || 5000;
const Stripe = require("stripe");

const stripe = Stripe(
  process.env.STRIPE_SECRET_KEY
);

async function run() {
  try {
    // await client.connect();


    const db = client.db(process.env.DB_NAME);

    const tasksCollection = db.collection("tasks");
    const proposalsCollection = db.collection("proposals");

   
   
    // TASK ROUTES
   

    // Create Task
    app.post("/tasks", async (req, res) => {
      const task = req.body;

      const result = await tasksCollection.insertOne(task);

      res.send(result);
    });
    app.post(
      "/create-checkout-session",
      async (req, res) => {
        try {
          const {
            proposalId,
            taskTitle,
            freelancerName,
            amount,
          } = req.body;

          const session =
            await stripe.checkout.sessions.create({
              payment_method_types: ["card"],

              line_items: [
                {
                  price_data: {
                    currency: "usd",

                    product_data: {
                      name: taskTitle,
                    },

                    unit_amount:
                      Number(amount) * 100,
                  },

                  quantity: 1,
                },
              ],

              mode: "payment",

              success_url:
                "http://localhost:3000/payment-success?session_id={CHECKOUT_SESSION_ID}&proposalId=" +
                proposalId,

              cancel_url:
                "http://localhost:3000/dashboard/client/manage-proposals",
            });

          res.send({
            url: session.url,
          });
        } catch (error) {
          res.status(500).send({
            error: error.message,
          });
        }
      }
    );

    // Get All Open Tasks
    app.get("/tasks", async (req, res) => {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 6;

      const skip = (page - 1) * limit;

      const query = {
        status: "open",
      };

      const totalTasks =
        await tasksCollection.countDocuments(query);

      const tasks = await tasksCollection
        .find(query)
        .skip(skip)
        .limit(limit)
        .toArray();

      res.send({
        tasks,
        totalTasks,
        totalPages: Math.ceil(
          totalTasks / limit
        ),
        currentPage: page,
      });
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
    app.get("/featured-tasks", async (req, res) => {
  try {
    const result = await tasksCollection
      .find({ status: "open" })
      .sort({ createdAt: -1 })
      .limit(6)
      .toArray();

    res.send(result);
  } catch (error) {
    res.status(500).send({
      message: "Failed to load featured tasks",
    });
  }
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
    app.get("/freelancers", async (req, res) => {
      const result = await db
        .collection("user")
        .find({
          role: "freelancer",
        })
        .toArray();

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



    // console.log("MongoDB Connected Successfully");


  } catch (error) {
    console.log(error);
  }
}

run();

 app.get("/", (req, res) => {
      res.send("SkillSwap Server Running");
    });


app.listen(port, () => {
  console.log(`Server running on ${port}`);
});
