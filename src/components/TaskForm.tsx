"use client";

import { useState } from "react";
import type { FieldError, Priority, Task, TaskStatus } from "@/types/task";

export type TaskPayload = {
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: Priority;
  dueDate: string | null;
};

type SaveResult = { error?: string; details?: FieldError[] } | null;

type Props = {
  task: Task | null; // null = mode tambah
  onClose: () => void;
  onSave: (payload: TaskPayload) => Promise<SaveResult>;
};

export default function TaskForm({ task, onClose, onSave }: Props) {
  const [title, setTitle] = useState(task?.title ?? "");
  const [description, setDescription] = useState(task?.description ?? "");
  const [status, setStatus] = useState<TaskStatus>(task?.status ?? "TODO");
  const [priority, setPriority] = useState<Priority>(task?.priority ?? "MEDIUM");
  const [dueDate, setDueDate] = useState(task?.dueDate?.slice(0, 10) ?? "");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldError[]>([]);
  const [saving, setSaving] = useState(false);

  const fieldError = (name: string) =>
    fieldErrors.find((e) => e.field === name)?.message;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setFieldErrors([]);
    setSaving(true);

    const result = await onSave({
      title,
      description: description.trim() ? description : null,
      status,
      priority,
      dueDate: dueDate ? new Date(`${dueDate}T00:00:00.000Z`).toISOString() : null,
    });

    setSaving(false);
    if (result) {
      setError(result.error ?? "Terjadi kesalahan");
      setFieldErrors(result.details ?? []);
    }
  }

  const inputClass =
    "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200";
  const labelClass = "mb-1 block text-sm font-medium text-gray-700";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-gray-900">
          {task ? "Edit task" : "Task baru"}
        </h2>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4" noValidate>
          <div>
            <label className={labelClass}>Judul</label>
            <input
              className={inputClass}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
            />
            {fieldError("title") && (
              <p className="mt-1 text-xs text-red-600">{fieldError("title")}</p>
            )}
          </div>

          <div>
            <label className={labelClass}>Deskripsi (opsional)</label>
            <textarea
              className={inputClass}
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            {fieldError("description") && (
              <p className="mt-1 text-xs text-red-600">
                {fieldError("description")}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Status</label>
              <select
                className={inputClass}
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
              >
                <option value="TODO">To Do</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="DONE">Done</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Prioritas</label>
              <select
                className={inputClass}
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
              >
                <option value="LOW">Rendah</option>
                <option value="MEDIUM">Sedang</option>
                <option value="HIGH">Tinggi</option>
              </select>
            </div>
          </div>

          <div>
            <label className={labelClass}>Tenggat (opsional)</label>
            <input
              type="date"
              className={inputClass}
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>

          {error && fieldErrors.length === 0 && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              {saving ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}