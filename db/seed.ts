import { db } from "./index";
import { users, pets } from "./schema";
import { sql } from "drizzle-orm";

async function seed() {
  console.log("Starting database seeding...");

  try {
    // Create admin user
    console.log("Creating admin user...");
    await db.insert(users).values({
      username: "admin",
      password: "admin123", // In production, this should be hashed
      isAdmin: true,
    });

    // Create sample pets
    console.log("Creating sample pets...");
    const samplePets = [
      {
        name: "Max",
        species: "dog",
        breed: "Golden Retriever",
        age: 2,
        price: "799.99",
        description: "Friendly and energetic Golden Retriever puppy. Great with kids!",
        imageUrl: "https://images.unsplash.com/photo-1633722723956-ebb83fc6bc91",
        stock: 1,
      },
      {
        name: "Luna",
        species: "cat",
        breed: "Siamese",
        age: 1,
        price: "599.99",
        description: "Elegant Siamese kitten with beautiful blue eyes. Very affectionate.",
        imageUrl: "https://images.unsplash.com/photo-1513360371669-4adf3dd7dff8",
        stock: 2,
      },
      {
        name: "Charlie",
        species: "bird",
        breed: "Budgie",
        age: 1,
        price: "49.99",
        description: "Colorful and cheerful budgie. Already trained to step up!",
        imageUrl: "https://images.unsplash.com/photo-1591198936750-16d8e15edb9e",
        stock: 5,
      },
      {
        name: "Bella",
        species: "dog",
        breed: "Poodle",
        age: 3,
        price: "899.99",
        description: "Well-trained standard poodle. Hypoallergenic and great family pet.",
        imageUrl: "https://images.unsplash.com/photo-1616149562385-1d84e79478bb",
        stock: 1,
      },
    ];

    await db.insert(pets).values(samplePets);

    console.log("Database seeding completed successfully!");
  } catch (error) {
    console.error("Error seeding database:", error);
    throw error;
  }
}

// Execute seeding
seed();
