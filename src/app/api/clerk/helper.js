'use server';

import { clerkClient } from "@clerk/nextjs/server";

export async function getUser(userId) {
  const user = await clerkClient().users.getUser(userId);
  return user;
}

export async function getUserByEmail(email) {
  const user = await clerkClient().users.getUserByEmailAddress({ email });
  return user;
}

export async function getUserEmail(userId) {
  const user = await getUser(userId);
  return user.emailAddresses[0].emailAddress;
}

