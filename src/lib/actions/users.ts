"use server";

import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "../prisma";

export async function syncUser() {
  try {
    const user = await currentUser();
    if (!user) return;

    const existingUser = await prisma.user.findUnique({ where: { clerkId: user.id } });
    if (existingUser) return existingUser;

    // Check if user exists by email (from previous sign-ups)
    const userByEmail = await prisma.user.findUnique({ 
      where: { email: user.emailAddresses[0].emailAddress } 
    });

    if (userByEmail) {
      // Update existing user with new Clerk ID
      const updatedUser = await prisma.user.update({
        where: { id: userByEmail.id },
        data: {
          clerkId: user.id,
          firstName: user.firstName || null,
          lastName: user.lastName || null,
          phone: user.phoneNumbers[0]?.phoneNumber || null,
        },
      });
      return updatedUser;
    }

    // Create new user
    const dbUser = await prisma.user.create({
      data: {
        clerkId: user.id,
        firstName: user.firstName || null,
        lastName: user.lastName || null,
        email: user.emailAddresses[0].emailAddress,
        phone: user.phoneNumbers[0]?.phoneNumber || null,
      },
    });

    return dbUser;
  } catch (error) {
    console.log("Error in syncUser server action", error);
  }
}
