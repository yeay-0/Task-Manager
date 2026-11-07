import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, setAuthCookie } from "@/lib/auth";
import { registerSchema, formatZodError } from "@/lib/validations";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validasi gagal", details: formatZodError(parsed.error) },
        { status: 400 }
      );
    }

    const { name, email, password } = parsed.data;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "Email sudah terdaftar" },
        { status: 409 }
      );
    }

    const user = await prisma.user.create({
      data: { name, email, passwordHash: await hashPassword(password) },
      select: { id: true, name: true, email: true },
    });

    await setAuthCookie(user.id);
    return NextResponse.json({ user }, { status: 201 });
  } catch (err) {
    console.error("REGISTER_ERROR", err);
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}