import { Express } from "express";
import { setupAuth } from "./auth";
import { db } from "db";
import { pets, orders, orderItems } from "db/schema";
import { eq } from "drizzle-orm";

export function registerRoutes(app: Express) {
  setupAuth(app);

  // Get all pets
  app.get("/api/pets", async (req, res) => {
    try {
      const allPets = await db.select().from(pets);
      res.json(allPets);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch pets" });
    }
  });

  // Get single pet
  app.get("/api/pets/:id", async (req, res) => {
    try {
      const [pet] = await db
        .select()
        .from(pets)
        .where(eq(pets.id, parseInt(req.params.id)))
        .limit(1);

      if (!pet) {
        return res.status(404).json({ message: "Pet not found" });
      }

      res.json(pet);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch pet" });
    }
  });

  // Create order
  app.post("/api/orders", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const { items } = req.body;
      
      // Validate stock levels before processing
      for (const item of items) {
        const [pet] = await db
          .select()
          .from(pets)
          .where(eq(pets.id, item.id))
          .limit(1);

        if (!pet) {
          return res.status(404).json({ 
            message: `Pet with ID ${item.id} not found` 
          });
        }

        if (pet.stock < item.quantity) {
          return res.status(400).json({
            message: `Insufficient stock for ${pet.name}. Available: ${pet.stock}, Requested: ${item.quantity}`
          });
        }
      }

      const total = items.reduce(
        (sum: number, item: any) => sum + Number(item.price) * item.quantity,
        0
      );

      const [order] = await db
        .insert(orders)
        .values({
          userId: req.user!.id,
          total,
          status: "completed", // Changed from "pending" to "completed"
        })
        .returning();

      await db.insert(orderItems).values(
        items.map((item: any) => ({
          orderId: order.id,
          petId: item.id,
          quantity: item.quantity,
          price: item.price,
        }))
      );

      // Update pet stock
      for (const item of items) {
        await db
          .update(pets)
          .set({
            stock: db
              .select()
              .from(pets)
              .where(eq(pets.id, item.id))
              .limit(1)
              .then(([pet]) => pet.stock - item.quantity),
          })
          .where(eq(pets.id, item.id));
      }

      res.json({ 
        message: "Order created successfully",
        order 
      });
    } catch (error) {
      console.error("Order creation error:", error);
      res.status(500).json({ message: "Failed to create order" });
    }
  });

  // Admin routes
  app.post("/api/pets", async (req, res) => {
    if (!req.isAuthenticated() || !req.user!.isAdmin) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const [pet] = await db.insert(pets).values(req.body).returning();
      res.json(pet);
    } catch (error) {
      res.status(500).json({ message: "Failed to create pet" });
    }
  });

  app.put("/api/pets/:id", async (req, res) => {
    if (!req.isAuthenticated() || !req.user!.isAdmin) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const [pet] = await db
        .update(pets)
        .set(req.body)
        .where(eq(pets.id, parseInt(req.params.id)))
        .returning();

      if (!pet) {
        return res.status(404).json({ message: "Pet not found" });
      }

      res.json(pet);
    } catch (error) {
      res.status(500).json({ message: "Failed to update pet" });
    }
  });

  app.delete("/api/pets/:id", async (req, res) => {
    if (!req.isAuthenticated() || !req.user!.isAdmin) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      await db.delete(pets).where(eq(pets.id, parseInt(req.params.id)));
      res.json({ message: "Pet deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete pet" });
    }
  });
}
