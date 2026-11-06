import dotenv from "dotenv";
import express from "express";
import { MongoClient, ObjectId } from "mongodb";
import cors from "cors";

dotenv.config();
const app = express();
const PORT = process.env.PORT;
app.use(cors());
app.use(express.json());

const client = new MongoClient(process.env.MONGODB_URI);
const db = client.db(process.env.DATABASE_NAME);
const medicinesCollection = db.collection("medicines");
const cartCollection = db.collection("cart");

app.get("/", (req, res) => {
  res.send("Mediflow Server is Running");
});

export async function connectToMongoDB() {
  try {
    await client.connect();

    // Add medicine post method
    app.post("/api/medicines", async (req, res) => {
      const {
        userId,
        name,
        genericName,
        manufacturer,
        category,
        price,
        stock,
        expiaryDate,
        description,
        imageUrl,
      } = req.body;
      const newMedicine = {
        userId: userId,
        name: name,
        genericName: genericName,
        manufacturer: manufacturer,
        category: category,
        price: price,
        stock: stock,
        expiaryDate: expiaryDate,
        description: description,
        imageUrl: imageUrl,
        createdAt: new Date(),
      };

      const result = db.collection("medicines").insertOne(newMedicine);
    });

    // Medicine Get method:
    app.get("/api/medicines", async (req, res) => {
      try {
        const result = await medicinesCollection.find().toArray();
        return res.status(200).json(result);
      } catch (error) {
        console.error("error", Error);
      }
    });

    // Add to cart post method:
    app.post("/api/cart", async (req, res) => {
      try {
        const { userId, medicineId, quanitiy } = req.body;

        const existingMedicine = await cartCollection.findOne({
          userId: userId,
          medicineId: new ObjectId(medicineId),
        });

        if (existingMedicine) {
          const result = await cartCollection.updateOne(
            { _id: existingMedicine._id },
            { $inc: { quanitiy: quanitiy } },
          );
          return res.json(result);
        }

        const newCartItem = {
          userId: userId,
          medicineId: new ObjectId(medicineId),
          quanitiy: quanitiy,
          updatedAt: new Date(),
        };

        const result = await cartCollection.insertOne(newCartItem);
        return res.json(result);
      } catch (error) {
        console.error(error);
        throw error;
      }
    });

    console.log("You successfully connected to MongoDB!");
    return client;
  } catch (err) {
    console.dir(err);
  }
}
connectToMongoDB();
// Call this only when your application terminates
export async function disconnectFromMongoDB() {
  //   await client.close();
}

app.listen(PORT, () => {
  console.log(`The app is listening on port ${PORT} `);
});
