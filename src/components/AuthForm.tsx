"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Props = { mode: "login" | "register" };
type FieldError = { field: string; message: string };

export default function AuthForm({ mode }: Props) {
  const router = useRouter();
  const isLogin = mode === "login";

  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldError[]>([]);
  const [loading, setLoading] = useState(false);

  const fieldError = (name: string) =>
    fieldErrors.find((e) => e.field === name)?.message;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setFieldErrors([]);
    setLoading(true);

    try {
      const payload = isLogin
        ? { email: form.email, password: form.password }
        : form;

      const res = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Terjadi kesalahan");
        setFieldErrors(data.details ?? []);
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Tidak bisa terhubung ke server");
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 text-gray-900";

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-sm ring-1 ring-gray-200">
        <h1 className="text-2xl font-semibold text-gray-900">
          {isLogin ? "Masuk" : "Buat akun"}
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          {isLogin
            ? "Masuk untuk mengelola task kamu."
            : "Daftar untuk mulai mengatur task."}
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
          {!isLogin && (
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Nama
              </label>
              <input
                className={inputClass}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                autoComplete="name"
              />
              {fieldError("name") && (
                <p className="mt-1 text-xs text-red-600">{fieldError("name")}</p>
              )}
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              className={inputClass}
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              autoComplete="email"
            />
            {fieldError("email") && (
              <p className="mt-1 text-xs text-red-600">{fieldError("email")}</p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              type="password"
              className={inputClass}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              autoComplete={isLogin ? "current-password" : "new-password"}
            />
            {fieldError("password") && (
              <p className="mt-1 text-xs text-red-600">
                {fieldError("password")}
              </p>
            )}
          </div>

          {error && fieldErrors.length === 0 && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            {loading ? "Memproses..." : isLogin ? "Masuk" : "Daftar"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          {isLogin ? "Belum punya akun?" : "Sudah punya akun?"}{" "}
          <Link
            href={isLogin ? "/register" : "/login"}
            className="font-medium text-indigo-600 hover:underline"
          >
            {isLogin ? "Daftar" : "Masuk"}
          </Link>
        </p>
      </div>
    </div>
  );
}