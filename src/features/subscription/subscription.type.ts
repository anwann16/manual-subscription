import type {
  DurationUnit,
  PaymentStatus,
  SubscriptionStatus,
} from "@/generated/prisma/enums";

/** Serialized plan (Decimal → number, Date → ISO string). */
export type PlanDTO = {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number;
  durationUnit: DurationUnit;
  isActive: boolean;
};

export type PaymentDTO = {
  id: string;
  subscriptionId: string;
  amount: number;
  status: PaymentStatus;
  /** App-relative URL that trades the session for a presigned storage GET. */
  proofUrl: string;
  proofKind: ProofKind;
  submittedAt: string;
  verifiedAt: string | null;
  verifiedById: string | null;
  rejectionReason: string | null;
};

/** How a review surface should render the stored proof. */
export type ProofKind = "pdf" | "image";

export type SubscriptionDTO = {
  id: string;
  userId: string;
  planId: string;
  status: SubscriptionStatus;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  updatedAt: string;
  plan: PlanDTO;
  payments: PaymentDTO[];
  /** Most recent payment by `submittedAt`, undefined when none exists. */
  latestPayment?: PaymentDTO;
};

/** Admin-facing payment row: the payment plus its owning subscription. */
export type AdminPaymentDTO = PaymentDTO & {
  subscription: {
    id: string;
    userId: string;
    status: SubscriptionStatus;
    startDate: string | null;
    endDate: string | null;
    plan: PlanDTO;
    user: { id: string; email: string };
  };
};

/** The three panels the dashboard can render; the sidebar switches between them. */
export type WorkspaceView = "overview" | "payments" | "verification";

/** Normalized error payload every subscription endpoint returns. */
export type ApiError = {
  error: string;
  code?: string;
};
