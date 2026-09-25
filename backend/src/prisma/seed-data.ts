import { PrismaClient } from '@prisma/client';
import { Logger } from '@nestjs/common';

const logger = new Logger('AutoSeed');

export async function autoSeedIfEmpty(prisma: PrismaClient) {
  try {
    const vehicleCount = await prisma.vehicle.count();
    if (vehicleCount > 0) {
      logger.log(`Database already populated with ${vehicleCount} vehicles. Skipping auto-seed.`);
      return;
    }

    logger.log('Database is empty. Starting automatic self-seeding...');

    // 1. Create demo user
    await prisma.user.upsert({
      where: { id: 'usr-demo-001' },
      update: {},
      create: {
        id: 'usr-demo-001',
        name: 'Alex Sharma',
        email: 'alex.sharma@example.com',
      },
    });

    // 2. Create sample vehicles around Indore
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
        name: 'Honda City ZX CVT',
        brand: 'Honda',
        description: 'Premium automatic sedan with plush leather seats and smooth city drive.',
        type: 'Sedan',
        transmission: 'Automatic',
        fuelType: 'Petrol',
        seatingCapacity: 5,
        pricePerDay: 2200,
        securityDeposit: 2000,
        status: 'available',
        latitude: 22.7196,
        longitude: 75.8577,
        location: 'Rajwada, Indore',
        imageUrl: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=800&q=80',
        rating: 4.7,
      },
      {
        id: 'veh-004',
        name: 'Royal Enfield Classic 350',
        brand: 'Royal Enfield',
        description: 'Iconic retro motorcycle with thump exhaust, ideal for highway cruising.',
        type: 'Bike',
        transmission: 'Manual',
        fuelType: 'Petrol',
        seatingCapacity: 2,
        pricePerDay: 900,
        securityDeposit: 1000,
        status: 'available',
        latitude: 22.7282,
        longitude: 75.8681,
        location: 'MG Road, Indore',
        imageUrl: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=800&q=80',
        rating: 4.9,
      },
      {
        id: 'veh-005',
        name: 'Ather 450X Gen 3',
        brand: 'Ather',
        description: 'High-speed smart electric scooter with touchscreen navigation and Warp mode.',
        type: 'Bike',
        transmission: 'Automatic',
        fuelType: 'Electric',
        seatingCapacity: 2,
        pricePerDay: 650,
        securityDeposit: 800,
        status: 'available',
        latitude: 22.7471,
        longitude: 75.8950,
        location: 'AB Road, Indore',
        imageUrl: 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&w=800&q=80',
        rating: 4.6,
      },
      {
        id: 'veh-006',
        name: 'Tata Nexon EV Max',
        brand: 'Tata',
        description: 'Long-range electric SUV with 400km range, zero emissions, and fast charging.',
        type: 'SUV',
        transmission: 'Automatic',
        fuelType: 'Electric',
        seatingCapacity: 5,
        pricePerDay: 2600,
        securityDeposit: 2500,
        status: 'available',
        latitude: 22.7580,
        longitude: 75.8820,
        location: 'Bhawarkua, Indore',
        imageUrl: 'https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=800&q=80',
        rating: 4.8,
      },
      {
        id: 'veh-007',
        name: 'Toyota Fortuner 4x4 AT',
        brand: 'Toyota',
        description: '7-seater luxury off-road SUV with commanding road presence and high power.',
        type: 'SUV',
        transmission: 'Automatic',
        fuelType: 'Diesel',
        seatingCapacity: 7,
        pricePerDay: 4800,
        securityDeposit: 5000,
        status: 'available',
        latitude: 22.7300,
        longitude: 75.9000,
        location: 'Bypass Road, Indore',
        imageUrl: 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&w=800&q=80',
        rating: 5.0,
      },
      {
        id: 'veh-008',
        name: 'BMW 3 Series Gran Limousine',
        brand: 'BMW',
        description: 'Ultimate executive luxury sedan with M-sport steering and Harman Kardon sound.',
        type: 'Sedan',
        transmission: 'Automatic',
        fuelType: 'Petrol',
        seatingCapacity: 5,
        pricePerDay: 7500,
        securityDeposit: 8000,
        status: 'available',
        latitude: 22.7400,
        longitude: 75.8900,
        location: 'Race Course Road, Indore',
        imageUrl: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=800&q=80',
        rating: 5.0,
      },
      {
        id: 'veh-009',
        name: 'Maruti Suzuki Swift ZXi',
        brand: 'Maruti Suzuki',
        description: 'Compact hatchback, highly fuel-efficient and easy to park in crowded city areas.',
        type: 'Hatchback',
        transmission: 'Manual',
        fuelType: 'Petrol',
        seatingCapacity: 5,
        pricePerDay: 1400,
        securityDeposit: 1500,
        status: 'available',
        latitude: 22.7100,
        longitude: 75.8500,
        location: 'Annapurna, Indore',
        imageUrl: 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&w=800&q=80',
        rating: 4.5,
      },
      {
        id: 'veh-010',
        name: 'TVS Jupiter 125',
        brand: 'TVS',
        description: 'Comfortable family gearless scooter with large under-seat storage.',
        type: 'Bike',
        transmission: 'Automatic',
        fuelType: 'Petrol',
        seatingCapacity: 2,
        pricePerDay: 500,
        securityDeposit: 500,
        status: 'available',
        latitude: 22.7180,
        longitude: 75.8650,
        location: 'Regal Square, Indore',
        imageUrl: 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&w=800&q=80',
        rating: 4.6,
      },
    ];

    for (const v of vehiclesData) {
      await prisma.vehicle.upsert({
        where: { id: v.id },
        update: v,
        create: v,
      });
    }

    // 3. Create policies
    const policiesData = [
      {
        id: 'pol-001',
        title: 'Cancellation & Refund Policy',
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
      await prisma.rentalPolicy.upsert({
        where: { id: p.id },
        update: p,
        create: p,
      });
    }

    logger.log(`✅ Auto-seeding completed successfully! Inserted ${vehiclesData.length} vehicles and ${policiesData.length} policies.`);
  } catch (error) {
    logger.error('Auto-seeding failed:', error);
  }
}
