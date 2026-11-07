import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Nama minimal 2 karakter").max(50),
  email: z.string().trim().toLowerCase().email("Format email tidak valid"),
  password: z.string().min(8, "Password minimal 8 karakter").max(72),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Format email tidak valid"),
  password: z.string().min(1, "Password wajib diisi"),
});

// Mengubah error Zod menjadi format yang mudah dipakai frontend
export function formatZodError(error: z.ZodError) {
  return error.issues.map((i) => ({
    field: i.path.join("."),
    message: i.message,
  }));
}

const statusEnum = z.enum(["TODO", "IN_PROGRESS", "DONE"]);
const priorityEnum = z.enum(["LOW", "MEDIUM", "HIGH"]);

export const createTaskSchema = z.object({
  title: z.string().trim().min(1, "Judul wajib diisi").max(100),
  description: z.string().trim().max(1000).nullable().optional(),
  status: statusEnum.optional(),
  priority: priorityEnum.optional(),
  dueDate: z.string().datetime("Format tanggal harus ISO 8601").nullable().optional(),
});

export const updateTaskSchema = createTaskSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "Minimal satu field harus diisi",
  });

export const taskQuerySchema = z.object({
  status: statusEnum.optional(),
  priority: priorityEnum.optional(),
  q: z.string().trim().max(100).optional(),
  sort: z.enum(["newest", "oldest", "dueDate"]).default("newest"),
});