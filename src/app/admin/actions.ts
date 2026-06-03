"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function adminLogin(_prev: unknown, formData: FormData) {
  const password = formData.get("password") as string;
  if (password && password === process.env.ADMIN_PASSWORD) {
    const cookieStore = await cookies();
    cookieStore.set("qm_admin", process.env.ADMIN_PASSWORD, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: "/",
    });
    redirect("/admin");
  }
  redirect("/admin/login?error=1");
}

export async function adminLogout() {
  const cookieStore = await cookies();
  cookieStore.delete("qm_admin");
  redirect("/admin/login");
}
