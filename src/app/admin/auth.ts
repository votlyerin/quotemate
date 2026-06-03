import { cookies } from "next/headers";

export async function checkAdminAuth(): Promise<boolean> {
  if (!process.env.ADMIN_PASSWORD) return false;
  const cookieStore = await cookies();
  const token = cookieStore.get("qm_admin");
  return token?.value === process.env.ADMIN_PASSWORD;
}
