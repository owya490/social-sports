import StripeCheckout from "@/components/checkout/StripeCheckout";

export default function Checkout({ searchParams }: any) {
  return (
    <div className="pt-20 bg-white">
      <StripeCheckout
        eventId={searchParams.eventId}
        quantity={searchParams.quantity}
      />
    </div>
  );
}
