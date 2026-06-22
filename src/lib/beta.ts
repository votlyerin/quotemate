// BETA_MODE — remove bypass when beta ends
// Set NEXT_PUBLIC_BETA_MODE=true in .env.local and Vercel to grant all users Pro access.
// Set to false (or remove) to restore normal free vs. Pro tier enforcement.
export const BETA_MODE = process.env.NEXT_PUBLIC_BETA_MODE === "true";
