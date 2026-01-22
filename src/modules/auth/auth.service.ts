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
        desiredProfit: 0,
        monthlyFixedCost: 0,
        defaultTaxRate: 0,
        defaultCardFee: 0,
        targetProfitValue: 0,
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

    // Create a default category to simplify onboarding
    await tx.category.create({
      data: {
        name: "Geral",
        companyId: company.id,
      },
    });

    return { user, company };
  });

  return result;
}

export async function signIn(data: SignInInput) {
  const { email, password } = data;

  // CORREÇÃO 1: Adicionado include: { company: true }
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      company: true, 
    },
  });

  if (!user) {
    throw new Error("Invalid credentials");
  }

  const isPasswordValid = await compare(password, user.password);

  if (!isPasswordValid) {
    throw new Error("Invalid credentials");
  }

  // CORREÇÃO 2: Retornar o objeto company completo
  return { 
    id: user.id, 
    name: user.name, 
    email: user.email, 
    companyId: user.companyId,
    company: user.company // <--- O Frontend precisa disso aqui para preencher os inputs!
  };
}

export async function getMe(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      company: true,
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  // CORREÇÃO 3: Retornar a company inteira, não apenas id e name
  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
    },
    company: user.company, // <--- Devolve tudo (taxas, custos, metas)
  };
}