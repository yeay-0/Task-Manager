"use client";

import { useCallback, useEffect, useState } from "react";
import TaskForm, { type TaskPayload } from "@/components/TaskForm";
import KanbanBoard from "@/components/KanbanBoard";
import type { Priority, Task, TaskStatus } from "@/types/task";

const STATUS_LABEL: Record<TaskStatus, string> = {
  TODO: "To Do",
  IN_PROGRESS: "In Progress",
  DONE: "Done",
};

const PRIORITY_LABEL: Record<Priority, string> = {
  LOW: "Rendah",
  MEDIUM: "Sedang",
  HIGH: "Tinggi",
};

const PRIORITY_STYLE: Record<Priority, string> = {
  LOW: "bg-gray-100 text-gray-700",
  MEDIUM: "bg-amber-100 text-amber-800",
  HIGH: "bg-red-100 text-red-700",
};

const FILTERS: { value: "" | TaskStatus; label: string }[] = [
  { value: "", label: "Semua" },
  { value: "TODO", label: "To Do" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "DONE", label: "Done" },
];

export default function TaskManager() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | TaskStatus>("");
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [view, setView] = useState<"list" | "board">("list");
  const [editing, setEditing] = useState<Task | null>(null);
  const [now] = useState(() => Date.now());

  const loadTasks = useCallback(async () => {
    setError("");
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set("status", statusFilter);
      if (search.trim()) params.set("q", search.trim());

      const res = await fetch(`/api/tasks?${params.toString()}`);
      if (res.status === 401) {
        window.location.href = "/login"; // sesi habis
        return;
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setTasks(data.tasks);
    } catch {
      setError("Gagal memuat task. Coba lagi.");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search]);

  // debounce 300ms supaya tidak request di setiap ketikan
  useEffect(() => {
    const t = setTimeout(loadTasks, 300);
    return () => clearTimeout(t);
  }, [loadTasks]);

  async function handleSave(payload: TaskPayload) {
    const isEdit = editing !== null;
    const res = await fetch(isEdit ? `/api/tasks/${editing.id}` : "/api/tasks", {
      method: isEdit ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();

    if (!res.ok) {
      return { error: data.error as string, details: data.details };
    }

    setFormOpen(false);
    setEditing(null);
    await loadTasks();
    return null;
  }

  async function handleStatusChange(task: Task, status: TaskStatus) {
    // optimistic update: UI berubah dulu, server menyusul
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, status } : t)));

    const res = await fetch(`/api/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      setError("Gagal mengubah status.");
      await loadTasks(); // kembalikan ke data server
    }
  }

  async function handleDelete(task: Task) {
    if (!confirm(`Hapus task "${task.title}"?`)) return;

    const res = await fetch(`/api/tasks/${task.id}`, { method: "DELETE" });
    if (!res.ok) {
      setError("Gagal menghapus task.");
      return;
    }
    setTasks((prev) => prev.filter((t) => t.id !== task.id));
  }

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(task: Task) {
    setEditing(task);
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEditing(null);
  }

  const hasFilter = statusFilter !== "" || search.trim() !== "";

  return (
    <div>
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {/* Pilihan tampilan */}
          <div className="flex rounded-lg bg-white p-0.5 ring-1 ring-gray-200">
            {(["list", "board"] as const).map((v) => (
              <button
                key={v}
                onClick={() => {
                  setView(v);
                  if (v === "board") setStatusFilter(""); // board sudah memisah per status
                }}
                className={`rounded-md px-3 py-1 text-sm ${
                  view === v
                    ? "bg-indigo-600 text-white"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {v === "list" ? "List" : "Board"}
              </button>
            ))}
          </div>

          {/* Filter status hanya untuk tampilan list */}
          {view === "list" &&
            FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setStatusFilter(f.value)}
                className={`rounded-full px-3 py-1 text-sm ${
                  statusFilter === f.value
                    ? "bg-indigo-600 text-white"
                    : "bg-white text-gray-600 ring-1 ring-gray-200 hover:bg-gray-100"
                }`}
              >
                {f.label}
              </button>
            ))}
        </div>

        <div className="flex gap-2">
          <input
            type="search"
            placeholder="Cari task..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900 outline-none focus:border-indigo-500 sm:w-52"
          />
          <button
            onClick={openCreate}
            className="whitespace-nowrap rounded-lg bg-indigo-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
          >
            + Task
          </button>
        </div>
      </div>

      {error && (
        <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {/* Tampilan Board */}
      {view === "board" && !loading && (
        <div className="mt-4">
          <KanbanBoard
            tasks={tasks}
            now={now}
            onStatusChange={handleStatusChange}
            onEdit={openEdit}
            onDelete={handleDelete}
          />
        </div>
      )}

      {/* Tampilan List (juga dipakai untuk loading dan empty state) */}
      <div
        className={`mt-4 space-y-3 ${
          view === "board" && !loading ? "hidden" : ""
        }`}
      >
        {loading ? (
          <p className="py-12 text-center text-sm text-gray-500">Memuat task...</p>
        ) : tasks.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white py-12 text-center">
            <p className="text-gray-700">
              {hasFilter ? "Tidak ada task yang cocok." : "Belum ada task."}
            </p>
            {!hasFilter && (
              <button
                onClick={openCreate}
                className="mt-3 text-sm font-medium text-indigo-600 hover:underline"
              >
                Buat task pertamamu
              </button>
            )}
          </div>
        ) : (
          tasks.map((task) => {
            const overdue =
              task.dueDate !== null &&
              task.status !== "DONE" &&
              new Date(task.dueDate).getTime() < now;

            return (
              <div
                key={task.id}
                className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-200"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3
                      className={`font-medium text-gray-900 ${
                        task.status === "DONE" ? "line-through opacity-60" : ""
                      }`}
                    >
                      {task.title}
                    </h3>
                    {task.description && (
                      <p className="mt-1 text-sm text-gray-600">
                        {task.description}
                      </p>
                    )}
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${PRIORITY_STYLE[task.priority]}`}
                  >
                    {PRIORITY_LABEL[task.priority]}
                  </span>
                </div>

                <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <select
                      value={task.status}
                      onChange={(e) =>
                        handleStatusChange(task, e.target.value as TaskStatus)
                      }
                      className="rounded-lg border border-gray-300 bg-white px-2 py-1 text-xs text-gray-900"
                    >
                      {(Object.keys(STATUS_LABEL) as TaskStatus[]).map((s) => (
                        <option key={s} value={s}>
                          {STATUS_LABEL[s]}
                        </option>
                      ))}
                    </select>
                    {task.dueDate && (
                      <span
                        className={`text-xs ${
                          overdue ? "font-medium text-red-600" : "text-gray-500"
                        }`}
                      >
                        {overdue ? "Lewat tenggat: " : "Tenggat: "}
                        {new Date(task.dueDate).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          timeZone: "UTC",
                        })}
                      </span>
                    )}
                  </div>

                  <div className="flex gap-3 text-sm">
                    <button
                      onClick={() => openEdit(task)}
                      className="text-indigo-600 hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(task)}
                      className="text-red-600 hover:underline"
                    >
                      Hapus
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {formOpen && (
        <TaskForm
          key={editing?.id ?? "new"}
          task={editing}
          onClose={closeForm}
          onSave={handleSave}
        />
      )}
    </div>
  );
}