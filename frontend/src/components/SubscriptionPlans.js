import React, { useState } from "react";
import SubscriptionPlans from "./SubscriptionPlans";
import PaymentForm from "./PaymentForm";

const PricingPage = ({ userStripeCustomerId, userAuthToken }) => {
  const [selectedPlan, setSelectedPlan] = useState(null);

  // Map plan ID to Stripe price ID
  const getStripePriceId = (planId) => {
    const priceMap = {
      basic: "price_abc123",         // Replace with actual Stripe price IDs
      professional: "price_def456",
      enterprise: "price_xyz789",
    };
    return priceMap[planId];
  };

  const handleCheckout = (plan) => {
    setSelectedPlan(plan);
  };

  return (
    <div className="container mx-auto p-6">
      {!selectedPlan ? (
        <SubscriptionPlans onCheckout={handleCheckout} />
      ) : (
        <PaymentForm
          amount={selectedPlan.price}
          customerId={userStripeCustomerId}
          priceId={getStripePriceId(selectedPlan.id)}
          planType={selectedPlan.id.toUpperCase()} // "BASIC", "PROFESSIONAL", etc.
          authToken={userAuthToken}
        />
      )}
    </div>
  );
};

export default PricingPage;
