"use client";

import { useActionState } from "react";
import { adminLogin } from "../actions";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function LoginForm() {
  const [, action, pending] = useActionState(adminLogin, null);
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0E1414]">
      <div className="w-full max-w-sm px-6">
        <div className="mb-8 text-center">
          <div className="text-2xl font-bold text-white tracking-tight">QuoteMate Admin</div>
          <div className="text-sm text-gray-400 mt-1">Internal dashboard</div>
        </div>
        <form action={action} className="flex flex-col gap-3">
          <input
            type="password"
            name="password"
            placeholder="Admin password"
            autoFocus
            required
            className="w-full h-12 rounded-xl bg-[#1C2626] border border-white/10 px-4 text-white placeholder:text-gray-500 outline-none focus:border-emerald-500 text-[15px]"
          />
          {error && (
            <div className="text-red-400 text-sm text-center">Incorrect password.</div>
          )}
          <button
            type="submit"
            disabled={pending}
            className="h-12 rounded-xl bg-emerald-500 text-white font-semibold text-[15px] disabled:opacity-60"
          >
            {pending ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
