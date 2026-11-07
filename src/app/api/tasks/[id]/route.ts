import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { updateTaskSchema, formatZodError } from "@/lib/validations";

type Ctx = { params: Promise<{ id: string }> };

const unauthorized = () =>
  NextResponse.json({ error: "Belum login" }, { status: 401 });
const notFound = () =>
  NextResponse.json({ error: "Task tidak ditemukan" }, { status: 404 });

// GET /api/tasks/:id
export async function GET(_req: Request, { params }: Ctx) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const { id } = await params;
  const task = await prisma.task.findFirst({ where: { id, userId: user.id } });
  if (!task) return notFound();

  return NextResponse.json({ task });
}

// PATCH /api/tasks/:id
export async function PATCH(req: Request, { params }: Ctx) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    const { id } = await params;

    const body = await req.json().catch(() => null);
    const parsed = updateTaskSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validasi gagal", details: formatZodError(parsed.error) },
        { status: 400 }
      );
    }

    const existing = await prisma.task.findFirst({
      where: { id, userId: user.id },
      select: { id: true },
    });
    if (!existing) return notFound();

    const { dueDate, ...rest } = parsed.data;

    const task = await prisma.task.update({
      where: { id },
      data: {
        ...rest,
        ...(dueDate !== undefined && {
          dueDate: dueDate ? new Date(dueDate) : null,
        }),
      },
    });

    return NextResponse.json({ task });
  } catch (err) {
    console.error("UPDATE_TASK_ERROR", err);
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}

// DELETE /api/tasks/:id
export async function DELETE(_req: Request, { params }: Ctx) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    const { id } = await params;

    const existing = await prisma.task.findFirst({
      where: { id, userId: user.id },
      select: { id: true },
    });
    if (!existing) return notFound();

    await prisma.task.delete({ where: { id } });
    return NextResponse.json({ message: "Task dihapus" });
  } catch (err) {
    console.error("DELETE_TASK_ERROR", err);
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}

