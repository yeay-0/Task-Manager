"use client";

import { useState } from "react";
import {
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import type { Priority, Task, TaskStatus } from "@/types/task";

const COLUMNS: { status: TaskStatus; label: string; dot: string }[] = [
  { status: "TODO", label: "To Do", dot: "bg-gray-400" },
  { status: "IN_PROGRESS", label: "In Progress", dot: "bg-indigo-500" },
  { status: "DONE", label: "Done", dot: "bg-green-500" },
];

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

type Props = {
  tasks: Task[];
  now: number;
  onStatusChange: (task: Task, status: TaskStatus) => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
};

type CardBodyProps = {
  task: Task;
  now: number;
  onEdit?: (task: Task) => void;
  onDelete?: (task: Task) => void;
};

// Isi kartu dipakai bersama oleh kartu biasa dan kartu "melayang" saat diseret
function CardBody({ task, now, onEdit, onDelete }: CardBodyProps) {
  const overdue =
    task.dueDate !== null &&
    task.status !== "DONE" &&
    new Date(task.dueDate).getTime() < now;

  return (
    <>
      <div className="flex items-start justify-between gap-2">
        <h3
          className={`text-sm font-medium text-gray-900 ${
            task.status === "DONE" ? "line-through opacity-60" : ""
          }`}
        >
          {task.title}
        </h3>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${PRIORITY_STYLE[task.priority]}`}
        >
          {PRIORITY_LABEL[task.priority]}
        </span>
      </div>

      {task.description && (
        <p className="mt-1 line-clamp-2 text-xs text-gray-600">
          {task.description}
        </p>
      )}

      {task.dueDate && (
        <p
          className={`mt-2 text-xs ${
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
        </p>
      )}

      {(onEdit || onDelete) && (
        <div className="mt-3 flex gap-3 text-xs">
          {onEdit && (
            <button
              onClick={() => onEdit(task)}
              className="text-indigo-600 hover:underline"
            >
              Edit
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(task)}
              className="text-red-600 hover:underline"
            >
              Hapus
            </button>
          )}
        </div>
      )}
    </>
  );
}

function DraggableCard(props: CardBodyProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: props.task.id,
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`cursor-grab rounded-lg bg-white p-3 shadow-sm ring-1 ring-gray-200 active:cursor-grabbing ${
        isDragging ? "opacity-40" : ""
      }`}
    >
      <CardBody {...props} />
    </div>
  );
}

function Column({
  status,
  label,
  dot,
  count,
  children,
}: {
  status: TaskStatus;
  label: string;
  dot: string;
  count: number;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div
      ref={setNodeRef}
      className={`flex min-h-[220px] flex-col rounded-xl p-3 transition-colors ${
        isOver ? "bg-indigo-50 ring-2 ring-indigo-300" : "bg-gray-100"
      }`}
    >
      <div className="mb-3 flex items-center gap-2">
        <span className={`h-2.5 w-2.5 rounded-full ${dot}`} />
        <h2 className="text-sm font-semibold text-gray-800">{label}</h2>
        <span className="rounded-full bg-white px-2 text-xs text-gray-600">
          {count}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-2">{children}</div>
    </div>
  );
}

export default function KanbanBoard({
  tasks,
  now,
  onStatusChange,
  onEdit,
  onDelete,
}: Props) {
  const [activeId, setActiveId] = useState<string | null>(null);

  // Drag baru aktif setelah mouse bergeser 8px, jadi klik Edit/Hapus tetap normal.
  // Di layar sentuh, tahan sekitar 0,2 detik dulu supaya scroll tidak terganggu.
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 6 },
    })
  );

  const activeTask = tasks.find((t) => t.id === activeId) ?? null;

  function handleDragStart(e: DragStartEvent) {
    setActiveId(String(e.active.id));
  }

  function handleDragEnd(e: DragEndEvent) {
    setActiveId(null);
    const { active, over } = e;
    if (!over) return; // dilepas di luar kolom

    const task = tasks.find((t) => t.id === active.id);
    const newStatus = over.id as TaskStatus;
    if (task && task.status !== newStatus) {
      onStatusChange(task, newStatus);
    }
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {COLUMNS.map((col) => {
          const columnTasks = tasks.filter((t) => t.status === col.status);
          return (
            <Column
              key={col.status}
              status={col.status}
              label={col.label}
              dot={col.dot}
              count={columnTasks.length}
            >
              {columnTasks.length === 0 ? (
                <p className="py-6 text-center text-xs text-gray-400">Kosong</p>
              ) : (
                columnTasks.map((task) => (
                  <DraggableCard
                    key={task.id}
                    task={task}
                    now={now}
                    onEdit={onEdit}
                    onDelete={onDelete}
                  />
                ))
              )}
            </Column>
          );
        })}
      </div>

      <DragOverlay>
        {activeTask ? (
          <div className="rotate-2 cursor-grabbing rounded-lg bg-white p-3 shadow-lg ring-1 ring-indigo-300">
            <CardBody task={activeTask} now={now} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}