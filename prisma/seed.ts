import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Clearing existing data...");
  await prisma.agentLog.deleteMany({});
  await prisma.refundRequest.deleteMany({});
  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.customer.deleteMany({});

  const now = new Date();

  // Helper for dates relative to today
  const daysAgo = (days: number) => {
    const d = new Date(now);
    d.setDate(d.getDate() - days);
    return d;
  };

  console.log("🌱 Seeding 15 realistic mock customers and orders...");

  // 1. Valid Refund Case
  await prisma.customer.create({
    data: {
      id: "CUST-101",
      name: "Sarah Jenkins",
      email: "sarah.jenkins@example.com",
      phone: "+1 (555) 234-5678",
      orders: {
        create: [
          {
            id: "ORD-1001",
            purchaseDate: daysAgo(14),
            deliveryDate: daysAgo(10),
            totalAmount: 149.99,
            status: "DELIVERED",
            isRefunded: false,
            items: {
              create: [
                {
                  productName: "Wireless Noise-Canceling Headphones",
                  category: "Electronics",
                  price: 149.99,
                  quantity: 1,
                  isRefundable: true,
                },
              ],
            },
          },
        ],
      },
    },
  });

  // 2. Expired Refund Period (> 30 days)
  await prisma.customer.create({
    data: {
      id: "CUST-102",
      name: "Mark Davis",
      email: "mark.davis@example.com",
      phone: "+1 (555) 345-6789",
      orders: {
        create: [
          {
            id: "ORD-1002",
            purchaseDate: daysAgo(52),
            deliveryDate: daysAgo(45),
            totalAmount: 299.0,
            status: "DELIVERED",
            isRefunded: false,
            items: {
              create: [
                {
                  productName: "Smart Watch Pro Series 7",
                  category: "Electronics",
                  price: 299.0,
                  quantity: 1,
                  isRefundable: true,
                },
              ],
            },
          },
        ],
      },
    },
  });

  // 3. Already Refunded Order
  await prisma.customer.create({
    data: {
      id: "CUST-103",
      name: "Elena Rostova",
      email: "elena.rostova@example.com",
      phone: "+1 (555) 456-7890",
      orders: {
        create: [
          {
            id: "ORD-1003",
            purchaseDate: daysAgo(16),
            deliveryDate: daysAgo(12),
            totalAmount: 79.5,
            status: "REFUNDED",
            isRefunded: true,
            refundedAmount: 79.5,
            items: {
              create: [
                {
                  productName: "Genuine Italian Leather Wallet",
                  category: "Accessories",
                  price: 79.5,
                  quantity: 1,
                  isRefundable: true,
                },
              ],
            },
          },
        ],
      },
    },
  });

  // 4. Non-Refundable Product Category (Digital Software)
  await prisma.customer.create({
    data: {
      id: "CUST-104",
      name: "David Chen",
      email: "david.chen@example.com",
      phone: "+1 (555) 567-8901",
      orders: {
        create: [
          {
            id: "ORD-1004",
            purchaseDate: daysAgo(6),
            deliveryDate: daysAgo(5),
            totalAmount: 59.99,
            status: "DELIVERED",
            isRefunded: false,
            items: {
              create: [
                {
                  productName: "Premium Video Editing Software License Key",
                  category: "Digital Download",
                  price: 59.99,
                  quantity: 1,
                  isRefundable: false,
                },
              ],
            },
          },
        ],
      },
    },
  });

  // 5. Ownership Mismatch Test Customer
  await prisma.customer.create({
    data: {
      id: "CUST-105",
      name: "Amanda Taylor",
      email: "amanda.taylor@example.com",
      phone: "+1 (555) 678-9012",
      orders: {
        create: [
          {
            id: "ORD-1005",
            purchaseDate: daysAgo(18),
            deliveryDate: daysAgo(15),
            totalAmount: 34.99,
            status: "DELIVERED",
            isRefunded: false,
            items: {
              create: [
                {
                  productName: "Stainless Steel Water Bottle",
                  category: "Home",
                  price: 34.99,
                  quantity: 1,
                  isRefundable: true,
                },
              ],
            },
          },
        ],
      },
    },
  });

  // 6. Customer with Multiple Orders (One Eligible, One Expired)
  await prisma.customer.create({
    data: {
      id: "CUST-106",
      name: "James Wilson",
      email: "james.wilson@example.com",
      phone: "+1 (555) 789-0123",
      orders: {
        create: [
          {
            id: "ORD-1006A",
            purchaseDate: daysAgo(10),
            deliveryDate: daysAgo(7),
            totalAmount: 120.0,
            status: "DELIVERED",
            isRefunded: false,
            items: {
              create: [
                {
                  productName: "RGB Mechanical Keyboard",
                  category: "Electronics",
                  price: 120.0,
                  quantity: 1,
                  isRefundable: true,
                },
              ],
            },
          },
          {
            id: "ORD-1006B",
            purchaseDate: daysAgo(60),
            deliveryDate: daysAgo(50),
            totalAmount: 45.0,
            status: "DELIVERED",
            isRefunded: false,
            items: {
              create: [
                {
                  productName: "Ergonomic Gaming Mouse",
                  category: "Electronics",
                  price: 45.0,
                  quantity: 1,
                  isRefundable: true,
                },
              ],
            },
          },
        ],
      },
    },
  });

  // 7. Non-refundable Customized Item
  await prisma.customer.create({
    data: {
      id: "CUST-107",
      name: "Robert Martinez",
      email: "robert.martinez@example.com",
      phone: "+1 (555) 890-1234",
      orders: {
        create: [
          {
            id: "ORD-1007",
            purchaseDate: daysAgo(12),
            deliveryDate: daysAgo(8),
            totalAmount: 189.0,
            status: "DELIVERED",
            isRefunded: false,
            items: {
              create: [
                {
                  productName: "Custom Monogrammed Silver Signet Ring",
                  category: "Customized",
                  price: 189.0,
                  quantity: 1,
                  isRefundable: false,
                },
              ],
            },
          },
        ],
      },
    },
  });

  // 8. Order Not Delivered Yet (In Transit)
  await prisma.customer.create({
    data: {
      id: "CUST-108",
      name: "Emily Watson",
      email: "emily.watson@example.com",
      phone: "+1 (555) 901-2345",
      orders: {
        create: [
          {
            id: "ORD-1008",
            purchaseDate: daysAgo(3),
            deliveryDate: null,
            totalAmount: 210.0,
            status: "SHIPPED",
            isRefunded: false,
            items: {
              create: [
                {
                  productName: "Wireless Multi-room Speaker System",
                  category: "Electronics",
                  price: 210.0,
                  quantity: 1,
                  isRefundable: true,
                },
              ],
            },
          },
        ],
      },
    },
  });

  // 9. Gift Card Category
  await prisma.customer.create({
    data: {
      id: "CUST-109",
      name: "Michael Brown",
      email: "michael.brown@example.com",
      phone: "+1 (555) 012-3456",
      orders: {
        create: [
          {
            id: "ORD-1009",
            purchaseDate: daysAgo(4),
            deliveryDate: daysAgo(4),
            totalAmount: 100.0,
            status: "DELIVERED",
            isRefunded: false,
            items: {
              create: [
                {
                  productName: "E-Commerce Digital Gift Card $100",
                  category: "Gift Card",
                  price: 100.0,
                  quantity: 1,
                  isRefundable: false,
                },
              ],
            },
          },
        ],
      },
    },
  });

  // 10. High-value Eligible Order
  await prisma.customer.create({
    data: {
      id: "CUST-110",
      name: "Sophia Garcia",
      email: "sophia.garcia@example.com",
      phone: "+1 (555) 123-4567",
      orders: {
        create: [
          {
            id: "ORD-1010",
            purchaseDate: daysAgo(20),
            deliveryDate: daysAgo(16),
            totalAmount: 350.0,
            status: "DELIVERED",
            isRefunded: false,
            items: {
              create: [
                {
                  productName: "Ergonomic Lumbar Office Chair",
                  category: "Furniture",
                  price: 350.0,
                  quantity: 1,
                  isRefundable: true,
                },
              ],
            },
          },
        ],
      },
    },
  });

  // 11. Recent Delivery Eligible Order
  await prisma.customer.create({
    data: {
      id: "CUST-111",
      name: "Daniel Kim",
      email: "daniel.kim@example.com",
      phone: "+1 (555) 234-8901",
      orders: {
        create: [
          {
            id: "ORD-1011",
            purchaseDate: daysAgo(5),
            deliveryDate: daysAgo(2),
            totalAmount: 89.99,
            status: "DELIVERED",
            isRefunded: false,
            items: {
              create: [
                {
                  productName: "Waterproof Bluetooth Outdoor Speaker",
                  category: "Electronics",
                  price: 89.99,
                  quantity: 1,
                  isRefundable: true,
                },
              ],
            },
          },
        ],
      },
    },
  });

  // 12. Perishable Category
  await prisma.customer.create({
    data: {
      id: "CUST-112",
      name: "Olivia Taylor",
      email: "olivia.taylor@example.com",
      phone: "+1 (555) 345-9012",
      orders: {
        create: [
          {
            id: "ORD-1012",
            purchaseDate: daysAgo(8),
            deliveryDate: daysAgo(6),
            totalAmount: 48.0,
            status: "DELIVERED",
            isRefunded: false,
            items: {
              create: [
                {
                  productName: "Artisanal Fresh Gourmet Coffee Beans Box",
                  category: "Perishable",
                  price: 48.0,
                  quantity: 1,
                  isRefundable: false,
                },
              ],
            },
          },
        ],
      },
    },
  });

  // 13. Near 30-day Boundary (28 days delivered - Eligible)
  await prisma.customer.create({
    data: {
      id: "CUST-113",
      name: "William Harris",
      email: "william.harris@example.com",
      phone: "+1 (555) 456-0123",
      orders: {
        create: [
          {
            id: "ORD-1013",
            purchaseDate: daysAgo(31),
            deliveryDate: daysAgo(28),
            totalAmount: 119.0,
            status: "DELIVERED",
            isRefunded: false,
            items: {
              create: [
                {
                  productName: "Advanced GPS Fitness Tracker Band",
                  category: "Electronics",
                  price: 119.0,
                  quantity: 1,
                  isRefundable: true,
                },
              ],
            },
          },
        ],
      },
    },
  });

  // 14. Cancelled Order
  await prisma.customer.create({
    data: {
      id: "CUST-114",
      name: "Charlotte Clark",
      email: "charlotte.clark@example.com",
      phone: "+1 (555) 567-1234",
      orders: {
        create: [
          {
            id: "ORD-1014",
            purchaseDate: daysAgo(10),
            deliveryDate: null,
            totalAmount: 65.0,
            status: "CANCELLED",
            isRefunded: false,
            items: {
              create: [
                {
                  productName: "Compact Travel Backpack 25L",
                  category: "Luggage",
                  price: 65.0,
                  quantity: 1,
                  isRefundable: true,
                },
              ],
            },
          },
        ],
      },
    },
  });

  // 15. Premium Monitor (Eligible)
  await prisma.customer.create({
    data: {
      id: "CUST-115",
      name: "Lucas Lewis",
      email: "lucas.lewis@example.com",
      phone: "+1 (555) 678-2345",
      orders: {
        create: [
          {
            id: "ORD-1015",
            purchaseDate: daysAgo(18),
            deliveryDate: daysAgo(14),
            totalAmount: 499.99,
            status: "DELIVERED",
            isRefunded: false,
            items: {
              create: [
                {
                  productName: "32-inch 4K UHD IPS Designer Monitor",
                  category: "Electronics",
                  price: 499.99,
                  quantity: 1,
                  isRefundable: true,
                },
              ],
            },
          },
        ],
      },
    },
  });

  console.log("✅ Successfully seeded 15 mock customers with orders and items.");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("❌ Seeding failed:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
