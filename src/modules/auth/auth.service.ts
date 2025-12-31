
import { prisma } from "../../lib/prisma.js";
import { hash, compare } from "bcryptjs";
import type { SignUpInput, SignInInput } from "./auth.schemas.js";

export async function signUp(data: SignUpInput) {
  const { name, email, password, companyName } = data;

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new Error("User already exists");
  }

  const hashedPassword = await hash(password, 6);

  // Transaction to create company and user ensures atomicity
  const result = await prisma.$transaction(async (tx) => {
    const company = await tx.company.create({
      data: {
        name: companyName,
      },
    });

    const user = await tx.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        companyId: company.id,
      },
    });

    return { user, company };
  });

  return result;
}

export async function signIn(data: SignInInput) {
  const { email, password } = data;

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new Error("Invalid credentials");
  }

  const isPasswordValid = await compare(password, user.password);

  if (!isPasswordValid) {
    throw new Error("Invalid credentials");
  }

  return { 
    id: user.id, 
    name: user.name, 
    email: user.email, 
    companyId: user.companyId 
  };
}
