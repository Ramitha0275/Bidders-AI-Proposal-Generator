import React, { useState } from "react";
import { useStripe } from "@stripe/react-stripe-js";
import { CreditCard, Lock, DollarSign } from "lucide-react";
import { loadStripe } from "@stripe/stripe-js";

const PaymentForm = ({
  amount,
  customerId,
  priceId,
  planType = "BASE", // or "PREMIUM"
  onSuccess,
  onError,
  description = "Subscription",
  authToken, // optional if you're using auth
}) => {
  const stripe = useStripe();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe) return;

    setProcessing(true);
    setError("");

    try {
      const response = await fetch("/api/payments/create-subscription", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(authToken && { Authorization: `Bearer ${authToken}` }),
        },
        body: JSON.stringify({
          customerId,
          priceId,
          planType,
        }),
      });

      const { sessionId, error: backendError } = await response.json();

      if (backendError || !sessionId) {
        setError(backendError || "Failed to create Stripe session.");
        setProcessing(false);
        return;
      }

      const stripeInstance = await loadStripe(
        process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY
      );
      await stripeInstance.redirectToCheckout({ sessionId });
    } catch (err) {
      setError("An unexpected error occurred.");
      onError && onError(err);
    }

    setProcessing(false);
  };

  return (
    <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-lg">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold flex items-center">
            <CreditCard className="h-5 w-5 mr-2 text-blue-600" />
            Subscription Details
          </h3>
          <div className="flex items-center text-green-600">
            <Lock className="h-4 w-4 mr-1" />
            <span className="text-xs">Secure</span>
          </div>
        </div>

        <div className="bg-gray-50 p-3 rounded">
          <div className="flex items-center justify-between">
            <span className="text-gray-600">{description}</span>
            <div className="flex items-center font-semibold">
              <DollarSign className="h-4 w-4" />
              <span>{amount.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={!stripe || processing}
          className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
            processing
              ? "bg-gray-400 text-gray-700 cursor-not-allowed"
              : "bg-blue-600 text-white hover:bg-blue-700"
          }`}
        >
          {processing ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
              Processing...
            </div>
          ) : (
            `Subscribe for $${amount.toFixed(2)}`
          )}
        </button>

        <div className="text-xs text-gray-500 text-center">
          <Lock className="h-3 w-3 inline mr-1" />
          Your payment information is secure and encrypted
        </div>
      </form>
    </div>
  );
};

export default PaymentForm;
