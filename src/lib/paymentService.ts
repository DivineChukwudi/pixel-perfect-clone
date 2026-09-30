/**
 * Payment service layer.
 *
 * Today this SIMULATES the M-Pesa / EcoCash gateway response so the checkout
 * flow is fully usable. When the real gateways are available, replace the
 * bodies of `initiatePayment` and `checkStatus` with calls to a secure server
 * function — the UI never changes and no API keys ever live in the frontend.
 */

export type PaymentMethod = "mpesa" | "ecocash";
export type PaymentStatus = "pending" | "success" | "failed";

export type InitiatePaymentInput = {
  method: PaymentMethod;
  phone: string;
  amount: number;
  orderNumber: string;
};

export type PaymentResult = {
  reference: string;
  status: PaymentStatus;
  message?: string;
};

type SimulatedPayment = { status: PaymentStatus; resolveAt: number };
const simulated = new Map<string, SimulatedPayment>();

const SIMULATED_DELAY_MS = 4500;

export const paymentService = {
  async initiatePayment(input: InitiatePaymentInput): Promise<PaymentResult> {
    await new Promise((resolve) => setTimeout(resolve, 700));

    const digits = input.phone.replace(/\D/g, "");
    if (digits.length < 8) {
      return { reference: "", status: "failed", message: "Please enter a valid mobile number." };
    }

    const reference = `${input.method.toUpperCase()}-${input.orderNumber}-${Date.now()
      .toString()
      .slice(-5)}`;

    // Simulated outcome: numbers ending in 0 fail, everything else succeeds.
    const willFail = digits.endsWith("0");
    simulated.set(reference, {
      status: willFail ? "failed" : "success",
      resolveAt: Date.now() + SIMULATED_DELAY_MS,
    });

    return { reference, status: "pending" };
  },

  async checkStatus(reference: string): Promise<PaymentResult> {
    const record = simulated.get(reference);
    if (!record) return { reference, status: "failed", message: "Unknown payment reference." };
    if (Date.now() < record.resolveAt) return { reference, status: "pending" };
    return {
      reference,
      status: record.status,
      message: record.status === "failed" ? "The payment was declined or timed out." : undefined,
    };
  },
};
