import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import {
  createTaskSchema,
  taskQuerySchema,
  formatZodError,
} from "@/lib/validations";

// GET /api/tasks?status=TODO&priority=HIGH&q=belajar&sort=dueDate
export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Belum login" }, { status: 401 });
  }

  const params = Object.fromEntries(new URL(req.url).searchParams);
  const parsed = taskQuerySchema.safeParse(params);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Query tidak valid", details: formatZodError(parsed.error) },
      { status: 400 }
    );
  }

  const { status, priority, q, sort } = parsed.data;

  const tasks = await prisma.task.findMany({
    where: {
      userId: user.id, // <- kunci otorisasi
      ...(status && { status }),
      ...(priority && { priority }),
      ...(q && { title: { contains: q, mode: "insensitive" } }),
    },
    orderBy:
      sort === "oldest"
        ? { createdAt: "asc" }
        : sort === "dueDate"
        ? { dueDate: { sort: "asc", nulls: "last" } }
        : { createdAt: "desc" },
  });

  return NextResponse.json({ tasks });
}

// POST /api/tasks
export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Belum login" }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    const parsed = createTaskSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validasi gagal", details: formatZodError(parsed.error) },
        { status: 400 }
      );
    }

    const { dueDate, ...rest } = parsed.data;

    const task = await prisma.task.create({
      data: {
        ...rest,
        dueDate: dueDate ? new Date(dueDate) : null,
        userId: user.id, // diambil dari sesi, BUKAN dari body request
      },
    });

    return NextResponse.json({ task }, { status: 201 });
  } catch (err) {
    console.error("CREATE_TASK_ERROR", err);
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}