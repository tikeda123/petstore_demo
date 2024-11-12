import { Express } from "express";
import { setupAuth } from "./auth";
import { db } from "db";
import { pets, orders, orderItems } from "db/schema";
import { eq } from "drizzle-orm";

interface OrderItem {
  id: number;
  quantity: number;
  price: number;
}

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

      // Validate items array
      if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ message: "Invalid order items" });
      }

      // Validate each item
      for (const item of items) {
        if (!item.id || !item.quantity || !item.price) {
          return res.status(400).json({ message: "Invalid item format" });
        }
        
        // Validate numeric values
        if (typeof item.quantity !== 'number' || item.quantity <= 0) {
          return res.status(400).json({ message: "Invalid quantity" });
        }
        
        if (typeof item.price !== 'number' || item.price <= 0) {
          return res.status(400).json({ message: "Invalid price" });
        }
      }

      const total = items.reduce(
        (sum: number, item: OrderItem) => sum + Number(item.price) * item.quantity,
        0
      );

      try {
        const order = await db.transaction(async (tx) => {
          // Create order first
          const [newOrder] = await tx
            .insert(orders)
            .values({
              userId: req.user!.id,
              total,
              status: "completed",
            })
            .returning();

          // Create order items
          await tx.insert(orderItems).values(
            items.map((item: OrderItem) => ({
              orderId: newOrder.id,
              petId: item.id,
              quantity: item.quantity,
              price: item.price,
            }))
          );

          // Update stock levels
          for (const item of items) {
            const [pet] = await tx
              .select()
              .from(pets)
              .where(eq(pets.id, item.id))
              .limit(1);

            if (!pet) {
              throw new Error(`Pet ${item.id} not found`);
            }

            if (pet.stock < item.quantity) {
              throw new Error(`Insufficient stock for ${pet.name}`);
            }

            await tx
              .update(pets)
              .set({ stock: pet.stock - item.quantity })
              .where(eq(pets.id, item.id));
          }

          return newOrder;
        });

        res.json({
          message: "Order created successfully",
          order,
        });
      } catch (txError: any) {
        return res.status(400).json({ message: txError.message });
      }
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
