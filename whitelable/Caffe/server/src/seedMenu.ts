import { prisma } from "./db.js";

type SeedCategory = {
  name: string;
  slug: string;
  sortOrder: number;
  items: Array<{
    name: string;
    price: string;
    sortOrder: number;
    imageUrl: string;
  }>;
};

const catalog: SeedCategory[] = [
  {
    name: "Drink",
    slug: "drink",
    sortOrder: 1,
    items: [
      {
        name: "Black Coffee",
        price: "30.00",
        sortOrder: 1,
        imageUrl:
          "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=800&q=80"
      },
      {
        name: "Lemon Tea",
        price: "20.00",
        sortOrder: 2,
        imageUrl:
          "https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=800&q=80"
      },
      {
        name: "Ginger Tea",
        price: "20.00",
        sortOrder: 3,
        imageUrl:
          "https://images.unsplash.com/photo-1597318181409-cf64d0b5d8a2?auto=format&fit=crop&w=800&q=80"
      },
      {
        name: "Black Tea",
        price: "18.00",
        sortOrder: 4,
        imageUrl:
          "https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=800&q=80"
      },
      {
        name: "Milk",
        price: "15.00",
        sortOrder: 5,
        imageUrl:
          "https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=800&q=80"
      }
    ]
  },
  {
    name: "Juice",
    slug: "juice",
    sortOrder: 2,
    items: [
      {
        name: "Apple Juice",
        price: "45.00",
        sortOrder: 1,
        imageUrl:
          "https://images.unsplash.com/photo-1600271886742-f049cd451bba?auto=format&fit=crop&w=800&q=80"
      },
      {
        name: "Pomogranite Juice",
        price: "55.00",
        sortOrder: 2,
        imageUrl:
          "https://images.unsplash.com/photo-1604503468506-a8da13d82791?auto=format&fit=crop&w=800&q=80"
      },
      {
        name: "Mulampalam Juice",
        price: "40.00",
        sortOrder: 3,
        imageUrl:
          "https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?auto=format&fit=crop&w=800&q=80"
      },
      {
        name: "Watermelon Juice",
        price: "35.00",
        sortOrder: 4,
        imageUrl:
          "https://images.unsplash.com/photo-1622597467836-f3285f2131b8?auto=format&fit=crop&w=800&q=80"
      }
    ]
  },
  {
    name: "Snakes",
    slug: "snakes",
    sortOrder: 3,
    items: [
      {
        name: "Samosa",
        price: "12.00",
        sortOrder: 1,
        imageUrl:
          "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=800&q=80"
      },
      {
        name: "Ulunthu Vadai",
        price: "12.00",
        sortOrder: 2,
        imageUrl:
          "https://images.unsplash.com/photo-1669991053917-fbd18a9af22a?auto=format&fit=crop&w=800&q=80"
      },
      {
        name: "Sweet Bonda",
        price: "15.00",
        sortOrder: 3,
        imageUrl:
          "https://images.unsplash.com/photo-1613292443284-8d10ef9383c1?auto=format&fit=crop&w=800&q=80"
      }
    ]
  },
  {
    name: "Evening Special",
    slug: "evening-special",
    sortOrder: 4,
    items: [
      {
        name: "Sweet Kolukattai",
        price: "20.00",
        sortOrder: 1,
        imageUrl:
          "https://images.unsplash.com/photo-1666001088898-c88d690b48db?auto=format&fit=crop&w=800&q=80"
      },
      {
        name: "Sundal",
        price: "18.00",
        sortOrder: 2,
        imageUrl:
          "https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=800&q=80"
      },
      {
        name: "Sprouts",
        price: "20.00",
        sortOrder: 3,
        imageUrl:
          "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80"
      },
      {
        name: "Bajji (Onion)",
        price: "18.00",
        sortOrder: 4,
        imageUrl:
          "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=800&q=80"
      },
      {
        name: "Bajji (Valakai)",
        price: "18.00",
        sortOrder: 5,
        imageUrl:
          "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=800&q=80"
      },
      {
        name: "Bajji (Urulai)",
        price: "18.00",
        sortOrder: 6,
        imageUrl:
          "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=800&q=80"
      },
      {
        name: "Onion Pakoda",
        price: "22.00",
        sortOrder: 7,
        imageUrl:
          "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=800&q=80"
      }
    ]
  }
];

async function run() {
  for (const categoryData of catalog) {
    const category = await prisma.category.upsert({
      where: { slug: categoryData.slug },
      update: {
        name: categoryData.name,
        sortOrder: categoryData.sortOrder,
        isActive: true
      },
      create: {
        name: categoryData.name,
        slug: categoryData.slug,
        sortOrder: categoryData.sortOrder,
        isActive: true
      }
    });

    for (const itemData of categoryData.items) {
      const existing = await prisma.menuItem.findFirst({
        where: {
          categoryId: category.id,
          name: itemData.name
        }
      });

      if (existing) {
        await prisma.menuItem.update({
          where: { id: existing.id },
          data: {
            price: itemData.price,
            sortOrder: itemData.sortOrder,
            imageUrl: itemData.imageUrl,
            isAvailable: true,
            isActive: true
          }
        });
      } else {
        await prisma.menuItem.create({
          data: {
            categoryId: category.id,
            name: itemData.name,
            price: itemData.price,
            sortOrder: itemData.sortOrder,
            imageUrl: itemData.imageUrl,
            isAvailable: true,
            isActive: true
          }
        });
      }
    }
  }
}

run()
  .then(async () => {
    console.log("Seeded categories and menu items successfully.");
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error("Seeding failed:", error);
    await prisma.$disconnect();
    process.exit(1);
  });
