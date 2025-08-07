import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from '@/lib/prisma';
import { registerSchema, validateRequestBody } from '@/lib/validations';

export async function POST(request: Request) {
  try {
    // Validate and sanitize input
    const validation = await validateRequestBody(request, registerSchema);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }
    
    const { name, email, password } = validation.data;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    });

    // Return user without password
    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json(
      { message: "User created successfully", user: userWithoutPassword },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}