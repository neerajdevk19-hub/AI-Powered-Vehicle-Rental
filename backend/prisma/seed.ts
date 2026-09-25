import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding DriveAI database...');

  // Clean existing data
  await prisma.gpsLocation.deleteMany();
  await prisma.reservation.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.user.deleteMany();
  await prisma.rentalPolicy.deleteMany();

  // Create demo user
  const demoUser = await prisma.user.create({
    data: {
      id: 'usr-demo-001',
      name: 'Alex Sharma',
      email: 'alex.sharma@example.com',
    },
  });
  console.log(`Created demo user: ${demoUser.name}`);

  // Create sample vehicles around Indore, India
  const vehiclesData = [
    {
      id: 'veh-001',
      name: 'Mahindra Thar 4x4',
      brand: 'Mahindra',
      description: 'Rugged 4x4 automatic SUV with convertible top, perfect for weekend getaways.',
      type: 'SUV',
      transmission: 'Automatic',
      fuelType: 'Petrol',
      seatingCapacity: 4,
      pricePerDay: 3200,
      securityDeposit: 3000,
      status: 'available',
      latitude: 22.7533,
      longitude: 75.8937,
      location: 'Vijay Nagar, Indore',
      imageUrl: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&q=80',
      rating: 4.9,
    },
    {
      id: 'veh-002',
      name: 'Hyundai Creta SX(O)',
      brand: 'Hyundai',
      description: 'Feature-loaded automatic SUV with panoramic sunroof and ADAS safety.',
      type: 'SUV',
      transmission: 'Automatic',
      fuelType: 'Diesel',
      seatingCapacity: 5,
      pricePerDay: 2800,
      securityDeposit: 2500,
      status: 'available',
      latitude: 22.7244,
      longitude: 75.8839,
      location: 'Palasia, Indore',
      imageUrl: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80',
      rating: 4.8,
    },
    {
      id: 'veh-003',
      name: 'Tata Nexon EV Max',
      brand: 'Tata',
      description: 'Eco-friendly electric compact SUV with 400km range per charge.',
      type: 'SUV',
      transmission: 'Automatic',
      fuelType: 'Electric',
      seatingCapacity: 5,
      pricePerDay: 2500,
      securityDeposit: 2000,
      status: 'available',
      latitude: 22.7256,
      longitude: 75.8812,
      location: 'Chappan Dukan, Indore',
      imageUrl: 'https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=800&q=80',
      rating: 4.7,
    },
    {
      id: 'veh-004',
      name: 'Honda City ZX',
      brand: 'Honda',
      description: 'Executive sedan offering smooth automatic drive and plush leather seats.',
      type: 'Sedan',
      transmission: 'Automatic',
      fuelType: 'Petrol',
      seatingCapacity: 5,
      pricePerDay: 2600,
      securityDeposit: 2000,
      status: 'available',
      latitude: 22.7196,
      longitude: 75.8577,
      location: 'Rajwada Palace, Indore',
      imageUrl: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=800&q=80',
      rating: 4.85,
    },
    {
      id: 'veh-005',
      name: 'Toyota Fortuner Legender',
      brand: 'Toyota',
      description: 'Premium 7-seater SUV with command seating and high power engine.',
      type: 'SUV',
      transmission: 'Automatic',
      fuelType: 'Diesel',
      seatingCapacity: 7,
      pricePerDay: 4500,
      securityDeposit: 5000,
      status: 'available',
      latitude: 22.7667,
      longitude: 75.8333,
      location: 'Super Corridor, Indore',
      imageUrl: 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&w=800&q=80',
      rating: 4.95,
    },
    {
      id: 'veh-006',
      name: 'Maruti Suzuki Swift ZXi',
      brand: 'Maruti Suzuki',
      description: 'Agile hatchback easy to park with high mileage.',
      type: 'Hatchback',
      transmission: 'Manual',
      fuelType: 'Petrol',
      seatingCapacity: 5,
      pricePerDay: 1500,
      securityDeposit: 1500,
      status: 'available',
      latitude: 22.7400,
      longitude: 75.8900,
      location: 'AB Road, Indore',
      imageUrl: 'https://images.unsplash.com/photo-1609521263047-f8d205293f24?auto=format&fit=crop&w=800&q=80',
      rating: 4.6,
    },
    {
      id: 'veh-007',
      name: 'Royal Enfield Classic 350',
      brand: 'Royal Enfield',
      description: 'Iconic cruiser motorcycle for city cruising and highway touring.',
      type: 'Bike',
      transmission: 'Manual',
      fuelType: 'Petrol',
      seatingCapacity: 2,
      pricePerDay: 900,
      securityDeposit: 1000,
      status: 'available',
      latitude: 22.6950,
      longitude: 75.8670,
      location: 'Bhanwarkuan, Indore',
      imageUrl: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=800&q=80',
      rating: 4.75,
    },
    {
      id: 'veh-008',
      name: 'Ather 450X Gen 3',
      brand: 'Ather',
      description: 'High performance smart electric scooter with touchscreen navigation.',
      type: 'Bike',
      transmission: 'Automatic',
      fuelType: 'Electric',
      seatingCapacity: 2,
      pricePerDay: 800,
      securityDeposit: 1000,
      status: 'available',
      latitude: 22.6285,
      longitude: 75.8055,
      location: 'Rau, Indore',
      imageUrl: 'https://images.unsplash.com/photo-1591637333184-19aa84b3e01f?auto=format&fit=crop&w=800&q=80',
      rating: 4.8,
    },
    {
      id: 'veh-009',
      name: 'Kia Seltos GTX Plus',
      brand: 'Kia',
      description: 'Stylish automatic SUV with ventilated seats and Bose surround audio.',
      type: 'SUV',
      transmission: 'Automatic',
      fuelType: 'Petrol',
      seatingCapacity: 5,
      pricePerDay: 2900,
      securityDeposit: 2500,
      status: 'available',
      latitude: 22.7011,
      longitude: 75.8395,
      location: 'Annapurna, Indore',
      imageUrl: 'https://images.unsplash.com/photo-1541348263662-e068662d82af?auto=format&fit=crop&w=800&q=80',
      rating: 4.88,
    },
    {
      id: 'veh-010',
      name: 'Volkswagen Virtus GT',
      brand: 'Volkswagen',
      description: 'Dynamic turbo sedan with 5-star GNCAP safety rating.',
      type: 'Sedan',
      transmission: 'Automatic',
      fuelType: 'Petrol',
      seatingCapacity: 5,
      pricePerDay: 2700,
      securityDeposit: 2000,
      status: 'available',
      latitude: 22.7300,
      longitude: 75.9100,
      location: 'Khajrana, Indore',
      imageUrl: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&q=80',
      rating: 4.9,
    },
    {
      id: 'veh-011',
      name: 'MG Hector Sharp Pro',
      brand: 'MG',
      description: 'Internet-inside SUV with massive 14-inch touchscreen and smart voice control.',
      type: 'SUV',
      transmission: 'Automatic',
      fuelType: 'Hybrid',
      seatingCapacity: 5,
      pricePerDay: 3100,
      securityDeposit: 3000,
      status: 'available',
      latitude: 22.7250,
      longitude: 75.8050,
      location: 'Airport Road, Indore',
      imageUrl: 'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?auto=format&fit=crop&w=800&q=80',
      rating: 4.7,
    },
    {
      id: 'veh-012',
      name: 'Maruti Suzuki Baleno Alpha',
      brand: 'Maruti Suzuki',
      description: 'Comfortable automatic hatchback with heads-up display and 360 camera.',
      type: 'Hatchback',
      transmission: 'Automatic',
      fuelType: 'Petrol',
      seatingCapacity: 5,
      pricePerDay: 1800,
      securityDeposit: 1500,
      status: 'available',
      latitude: 22.7800,
      longitude: 75.9000,
      location: 'Dewas Naka, Indore',
      imageUrl: 'https://images.unsplash.com/photo-1502877338535-766e1452684a?auto=format&fit=crop&w=800&q=80',
      rating: 4.65,
    },
    {
      id: 'veh-013',
      name: 'Tata Punch Creative',
      brand: 'Tata',
      description: 'Micro SUV with high ground clearance and robust build.',
      type: 'SUV',
      transmission: 'Manual',
      fuelType: 'Petrol',
      seatingCapacity: 5,
      pricePerDay: 2200,
      securityDeposit: 2000,
      status: 'available',
      latitude: 22.7150,
      longitude: 75.9020,
      location: 'Bengali Square, Indore',
      imageUrl: 'https://images.unsplash.com/photo-1533106497176-45ae19e68ba2?auto=format&fit=crop&w=800&q=80',
      rating: 4.75,
    },
    {
      id: 'veh-014',
      name: 'BMW X1 sDrive20d',
      brand: 'BMW',
      description: 'Luxury compact SUV offering pinnacle German engineering and comfort.',
      type: 'SUV',
      transmission: 'Automatic',
      fuelType: 'Diesel',
      seatingCapacity: 5,
      pricePerDay: 4800,
      securityDeposit: 6000,
      status: 'available',
      latitude: 22.6350,
      longitude: 75.8150,
      location: 'Silicon City, Indore',
      imageUrl: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=800&q=80',
      rating: 4.96,
    },
    {
      id: 'veh-015',
      name: 'Honda Activa 6G',
      brand: 'Honda',
      description: 'Reliable and comfortable automatic scooter for easy city transit.',
      type: 'Bike',
      transmission: 'Automatic',
      fuelType: 'Petrol',
      seatingCapacity: 2,
      pricePerDay: 500,
      securityDeposit: 500,
      status: 'available',
      latitude: 22.7100,
      longitude: 75.8950,
      location: 'Piplyahana, Indore',
      imageUrl: 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&w=800&q=80',
      rating: 4.6,
    },
    {
      id: 'veh-016',
      name: 'Hyundai Verna SX Turbo',
      brand: 'Hyundai',
      description: 'Futuristic sedan with 1.5L turbo engine and dual screens.',
      type: 'Sedan',
      transmission: 'Automatic',
      fuelType: 'Petrol',
      seatingCapacity: 5,
      pricePerDay: 2850,
      securityDeposit: 2500,
      status: 'available',
      latitude: 22.7180,
      longitude: 75.8780,
      location: 'Geeta Bhawan, Indore',
      imageUrl: 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=800&q=80',
      rating: 4.82,
    },
    {
      id: 'veh-017',
      name: 'Skoda Slavia Style',
      brand: 'Skoda',
      description: 'Spacious European sedan with refined TSI performance.',
      type: 'Sedan',
      transmission: 'Manual',
      fuelType: 'Petrol',
      seatingCapacity: 5,
      pricePerDay: 2550,
      securityDeposit: 2000,
      status: 'available',
      latitude: 22.7600,
      longitude: 75.8900,
      location: 'Scheme 78, Indore',
      imageUrl: 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&w=800&q=80',
      rating: 4.8,
    },
    {
      id: 'veh-018',
      name: 'Maruti Suzuki Brezza ZXi',
      brand: 'Maruti Suzuki',
      description: 'Dependable compact automatic SUV with smart hybrid tech.',
      type: 'SUV',
      transmission: 'Automatic',
      fuelType: 'Petrol',
      seatingCapacity: 5,
      pricePerDay: 2400,
      securityDeposit: 2000,
      status: 'available',
      latitude: 22.7100,
      longitude: 75.8500,
      location: 'Collectorate, Indore',
      imageUrl: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80',
      rating: 4.7,
    },
    {
      id: 'veh-019',
      name: 'Bajaj Chetak Premium EV',
      brand: 'Bajaj',
      description: 'Retro-modern metal body electric scooter.',
      type: 'Bike',
      transmission: 'Automatic',
      fuelType: 'Electric',
      seatingCapacity: 2,
      pricePerDay: 750,
      securityDeposit: 1000,
      status: 'available',
      latitude: 22.6800,
      longitude: 75.8400,
      location: 'Regional Park, Indore',
      imageUrl: 'https://images.unsplash.com/photo-1591637333184-19aa84b3e01f?auto=format&fit=crop&w=800&q=80',
      rating: 4.75,
    },
    {
      id: 'veh-020',
      name: 'Mahindra XUV700 AX7 Luxury',
      brand: 'Mahindra',
      description: 'Flagship 7-seater SUV with ADAS level 2 and Sony 3D sound system.',
      type: 'SUV',
      transmission: 'Automatic',
      fuelType: 'Diesel',
      seatingCapacity: 7,
      pricePerDay: 3800,
      securityDeposit: 4000,
      status: 'available',
      latitude: 22.7650,
      longitude: 75.8850,
      location: 'MR 10, Indore',
      imageUrl: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&q=80',
      rating: 4.93,
    },
  ];

  for (const v of vehiclesData) {
    await prisma.vehicle.create({ data: v });
  }
  console.log(`Seeded ${vehiclesData.length} vehicles.`);

  // Seed Rental Policy documents
  const policiesData = [
    {
      id: 'pol-001',
      title: 'Cancellation Policy',
      category: 'Cancellation',
      content: `DriveAI Cancellation Policy:
- Free cancellation is available up to 24 hours before the scheduled trip start time. Full refund will be processed to the original payment method within 3-5 business days.
- Cancellations made between 6 to 24 hours prior to trip start will incur a cancellation fee equal to 50% of 1 day rental charge.
- Cancellations made less than 6 hours before trip start or no-shows are non-refundable.
- In case of booking modification, date change is free up to 12 hours prior to trip start subject to vehicle availability.`,
    },
    {
      id: 'pol-002',
      title: 'Late Return Charges Policy',
      category: 'Late Return',
      content: `DriveAI Late Return Charges Policy:
- A grace period of 30 minutes is allowed for returning the vehicle at the designated drop-off location.
- Late returns beyond the 30-minute grace period up to 2 hours will be charged at a flat penalty rate of ₹300 per hour.
- Late returns exceeding 2 hours without prior extension request will be billed for an full additional daily rental rate plus a ₹1,000 late fee.
- If you anticipate a delay, request an extension through the DriveAI app at least 1 hour before scheduled end time.`,
    },
    {
      id: 'pol-003',
      title: 'Insurance Coverage Policy',
      category: 'Insurance',
      content: `DriveAI Comprehensive Insurance Coverage Policy:
- All DriveAI vehicles come with Third-Party Liability Insurance and Comprehensive Collision Damage Waiver (CDW).
- User financial liability in case of accidental damage is capped at the Security Deposit amount (e.g. ₹2,000 - ₹5,000 depending on vehicle tier), provided terms are followed.
- Insurance does NOT cover damage resulting from driving under influence of alcohol/drugs, off-roading in unauthorized areas, race track driving, or unauthorized driver operating the vehicle.
- Tire punctures and cosmetic interior stains are user responsibility.`,
    },
    {
      id: 'pol-004',
      title: 'Security Deposit Policy',
      category: 'Security Deposit',
      content: `DriveAI Security Deposit Policy:
- A refundable security deposit ranging from ₹500 to ₹5,000 is authorized at vehicle pickup or reservation creation depending on vehicle category.
- The security deposit is automatically released back to the customer account within 24 to 48 hours post-trip inspection, provided no damages, traffic fines, or fuel shortages occur.
- Any unpaid tolls, fastag charges, or minor damage repairs will be deducted from the security deposit with an itemized invoice sent via email.`,
    },
    {
      id: 'pol-005',
      title: 'Fuel Policy',
      category: 'Fuel Policy',
      content: `DriveAI Fuel & EV Charging Policy:
- Full-to-Full Fuel Policy applies for all Internal Combustion Engine (Petrol/Diesel/Hybrid) vehicles. The vehicle will be handed over with a full or marked fuel level and must be returned with the same fuel level.
- If returned with lower fuel, missing fuel will be charged at current market price plus a flat refueling service fee of ₹250.
- For Electric Vehicles (EVs): Vehicle is delivered with at least 80% charge and must be returned with at least 20% charge. Charging at DriveAI hub stations during rental period is free of cost.`,
    },
  ];

  for (const p of policiesData) {
    await prisma.rentalPolicy.create({ data: p });
  }
  console.log(`Seeded ${policiesData.length} rental policies.`);

  console.log('Seeding finished successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
