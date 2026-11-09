import dotenv from "dotenv";
import express from "express";
import { MongoClient, ObjectId } from "mongodb";
import cors from "cors";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

const client = new MongoClient(process.env.MONGODB_URI);
const db = client.db(process.env.DATABASE_NAME);
const medicinesCollection = db.collection("medicines");
const cartCollection = db.collection("cart");

async function connectToDatabase() {
  try {
    await client.connect();
    console.log("Connect to MongoDB");
  } catch (error) {
    console.error("Mongodb connection error: ", error);
  }
}
connectToDatabase();

app.get("/", (req, res) => {
  res.send("Mediflow Server is Running");
});

app.post("/api/medicines", async (req, res) => {
  try {
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

    const result = await medicinesCollection.insertOne(newMedicine);
    return res.status(201).json(result);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

app.get("/api/medicines", async (req, res) => {
  try {
    const result = await medicinesCollection.find().toArray();
    return res.status(200).json(result);
  } catch (error) {
    console.error("error", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

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
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

app.get("/api/cart/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const cartItems = await cartCollection
      .aggregate([
        { $match: { userId: userId } },
        {
          $lookup: {
            from: "medicines",
            localField: "medicineId",
            foreignField: "_id",
            as: "medicineDetails",
          },
        },
        { $unwind: "$medicineDetails" },
      ])
      .toArray();
    res.status(200).json(cartItems);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.put("/api/cart/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { quanitiy } = req.body;

    if (quanitiy < 1) {
      return res
        .status(400)
        .json({ message: "Quantity must be greater than 1" });
    }

    const result = await cartCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { quanitiy: quanitiy } },
    );

    return res.status(200).json(result);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

app.delete("/api/cart/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await cartCollection.deleteOne({
      _id: new ObjectId(id),
    });

    return res.status(200).json(result);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "internal server error" });
  }
});

if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`The app is listening on port ${PORT}`);
  });
}

export default app;