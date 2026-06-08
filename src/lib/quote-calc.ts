export interface QuoteDraft {
  customer?: string;
  phone?: string;
  email?: string;
  address?: string;
  source?: string;
  loadSize?: string;
  jobType?: string;
  complexity?: string[];
  hours?: string;
  crew?: string;
  dump?: string;
  travel?: string;
  addons?: string;
  discount?: string;
  notes?: string;
  photosReviewed?: boolean;
  photoNotes?: string;
  finalPrice?: string;
  overrideReason?: string;
  targetMargin?: string;
}

export interface PricingConfig {
  margin: number;
  labor: number;
  crew: number;
  travel: number;
  minPrice: number;
  complexityFees?: Record<string, number>;
  dumpFeePerTon?: number;
  dumpFeeMode?: "per_ton" | "flat_rate";
  flatDumpFees?: Record<string, number>;
}

export interface TruckPricing {
  min: number;
  eight: number;
  qtr: number;
  half: number;
  three: number;
  full: number;
  multiple?: number;
}

export interface QuoteCalcResult {
  recommended: number;
  floorPrice: number;
  cost: number;
  profit: number;
  marginPct: number;
  status: "Excellent" | "Good" | "Risky" | "Underpriced";
  loadPrice: number;
  loadLabel: string;
  crew: number;
  hours: number;
  laborCost: number;
  dump: number;
  dumpTons: number;
  travel: number;
  addons: number;
  discount: number;
  complexityFee: number;
  target: number;
}

export const LOAD_LABELS: Record<string, string> = {
  min: "Minimum pickup",
  eight: "1/8 truck",
  qtr: "1/4 truck",
  half: "1/2 truck",
  three: "3/4 truck",
  full: "Full truck",
  multiple: "Multiple trucks",
};

/** Estimated tons of debris per load size */
export const DEFAULT_TONS: Record<string, number> = {
  min: 0.1,
  eight: 0.25,
  qtr: 0.5,
  half: 1.0,
  three: 1.5,
  full: 2.0,
  multiple: 4.0,
};

const DEFAULT_COMPLEXITY_FEES: Record<string, number> = {
  stairs: 25,
  basement: 25,
  longCarry: 25,
  heavy: 25,
  rush: 50,
};

function num(v: unknown, d = 0): number {
  const n = parseFloat(String(v));
  return Number.isFinite(n) ? n : d;
}

/** Compute the auto-calculated dump fee for a load size given pricing config */
export function getAutoDumpFee(loadId: string, pricing: PricingConfig): number {
  if (pricing.dumpFeeMode === "flat_rate" && pricing.flatDumpFees) {
    return pricing.flatDumpFees[loadId] ?? 0;
  }
  if ((pricing.dumpFeePerTon ?? 0) > 0) {
    const tons = DEFAULT_TONS[loadId] ?? 1.0;
    return Math.round((pricing.dumpFeePerTon ?? 0) * tons);
  }
  return 60; // fallback default
}

export function calculateQuote(
  draft: QuoteDraft,
  pricing: PricingConfig,
  truck: TruckPricing
): QuoteCalcResult {
  // Per-quote margin override takes precedence over profile default
  const target = draft.targetMargin !== undefined && draft.targetMargin !== ""
    ? num(draft.targetMargin, num(pricing.margin, 45))
    : num(pricing.margin, 45);
  const loadId = draft.loadSize || "half";
  const loadPrice = num((truck as unknown as Record<string, number>)[loadId], 325);
  const loadLabel = LOAD_LABELS[loadId] || loadId;

  const crew = num(draft.crew, num(pricing.crew, 2));
  const hours = num(draft.hours, 2.5);
  const laborRate = num(pricing.labor, 35);
  const laborCost = Math.round(crew * hours * laborRate);

  const autoDump = getAutoDumpFee(loadId, pricing);
  const dump = num(draft.dump, autoDump);
  const dumpTons = DEFAULT_TONS[loadId] ?? 1.0;

  const travel = num(draft.travel, num(pricing.travel, 25));
  const addons = num(draft.addons, 0);
  const discount = num(draft.discount, 0);

  const fees = pricing.complexityFees ?? DEFAULT_COMPLEXITY_FEES;
  const complexityFee = (draft.complexity ?? []).reduce(
    (sum, id) => sum + (fees[id] ?? 25),
    0
  );

  const cost = laborCost + dump + travel;
  const baseFromTruck = loadPrice + addons + complexityFee - discount;
  const minProfitable = Math.ceil((cost / (1 - target / 100)) / 5) * 5;
  const recommended = Math.max(
    baseFromTruck,
    minProfitable,
    num(pricing.minPrice, 125)
  );
  const floorPrice = Math.ceil(cost / 5) * 5;

  const finalPrice = num(draft.finalPrice, recommended);
  const profit = Math.round(finalPrice - cost);
  const marginPct =
    finalPrice > 0 ? Math.round((profit / finalPrice) * 100) : 0;

  let status: QuoteCalcResult["status"];
  if (marginPct >= target + 10) status = "Excellent";
  else if (marginPct >= target - 3) status = "Good";
  else if (marginPct >= target - 15) status = "Risky";
  else status = "Underpriced";

  return {
    recommended,
    floorPrice,
    cost,
    profit,
    marginPct,
    status,
    loadPrice,
    loadLabel,
    crew,
    hours,
    laborCost,
    dump,
    dumpTons,
    travel,
    addons,
    discount,
    complexityFee,
    target,
  };
}
