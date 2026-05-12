import { SignupForm } from "./SignupForm";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string }>;
}) {
  const { plan } = await searchParams;
  const resolvedPlan: "free" | "pro" | null =
    plan === "pro" ? "pro" : plan === "free" ? "free" : null;

  return <SignupForm initialPlan={resolvedPlan} />;
}
