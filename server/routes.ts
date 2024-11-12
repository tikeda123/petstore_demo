import { Express } from "express";
import { setupAuth } from "./auth";
import { db } from "../db";
import { pets, orders, orderItems, cart } from "../db/schema";
import { eq } from "drizzle-orm";

export function registerRoutes(app: Express) {
  setupAuth(app);

  // Pets routes
  app.get("/api/pets", async (req, res) => {
    const allPets = await db.select().from(pets);
    res.json(allPets);
  });

  app.get("/api/pets/:id", async (req, res) => {
    const [pet] = await db
      .select()
      .from(pets)
      .where(eq(pets.id, parseInt(req.params.id)))
      .limit(1);
    
    if (!pet) {
      return res.status(404).json({ message: "Pet not found" });
    }
    res.json(pet);
  });

  // Cart routes
  app.get("/api/cart", async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const cartItems = await db
      .select()
      .from(cart)
      .where(eq(cart.userId, req.user.id));
    res.json(cartItems);
  });

  app.post("/api/cart", async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { petId, quantity } = req.body;
    
    const [pet] = await db
      .select()
      .from(pets)
      .where(eq(pets.id, petId))
      .limit(1);

    if (!pet || pet.stock < quantity) {
      return res.status(400).json({ message: "Invalid request" });
    }

    const [cartItem] = await db
      .insert(cart)
      .values({
        userId: req.user.id,
        petId,
        quantity,
      })
      .returning();

    res.json(cartItem);
  });

  app.delete("/api/cart/:id", async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    await db
      .delete(cart)
      .where(eq(cart.id, parseInt(req.params.id)))
      .where(eq(cart.userId, req.user.id));

    res.json({ success: true });
  });

  // Orders routes
  app.get("/api/orders", async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const userOrders = await db
      .select()
      .from(orders)
      .where(eq(orders.userId, req.user.id));
    res.json(userOrders);
  });

  app.post("/api/orders", async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const cartItems = await db
      .select()
      .from(cart)
      .where(eq(cart.userId, req.user.id));

    if (cartItems.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    const total = cartItems.reduce((sum, item) => sum + item.quantity, 0);

    const [order] = await db
      .insert(orders)
      .values({
        userId: req.user.id,
        total,
        status: "pending",
      })
      .returning();

    await Promise.all(
      cartItems.map((item) =>
        db.insert(orderItems).values({
          orderId: order.id,
          petId: item.petId,
          quantity: item.quantity,
          price: 0, // TODO: Calculate actual price
        })
      )
    );

    await db.delete(cart).where(eq(cart.userId, req.user.id));

    res.json(order);
  });

  // Admin routes
  app.post("/api/admin/pets", async (req, res) => {
    if (!req.user?.isAdmin) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const [pet] = await db.insert(pets).values(req.body).returning();
    res.json(pet);
  });

  app.put("/api/admin/pets/:id", async (req, res) => {
    if (!req.user?.isAdmin) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const [pet] = await db
      .update(pets)
      .set(req.body)
      .where(eq(pets.id, parseInt(req.params.id)))
      .returning();
    res.json(pet);
  });

  app.delete("/api/admin/pets/:id", async (req, res) => {
    if (!req.user?.isAdmin) {
      return res.status(403).json({ message: "Forbidden" });
    }

    await db.delete(pets).where(eq(pets.id, parseInt(req.params.id)));
    res.json({ success: true });
  });
}
