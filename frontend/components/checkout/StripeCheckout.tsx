"use client";
import { getEventById } from "@/services/eventsService";
import {
  EmbeddedCheckout,
  EmbeddedCheckoutProvider,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { useEffect, useState } from "react";
import Loading from "../Loading";

interface IStripeCheckout {
  eventId: string;
  quantity: number;
}

// Make sure to call `loadStripe` outside of a component’s render to avoid
// recreating the `Stripe` object on every render.
const stripePromise = loadStripe(
  "pk_test_51NXMlhHhhEIekcchpwavtyFGsnFLSqmUWxFhZlO64Uv5QYEzmBHKnlA75QWxO5CikWZC639BBhRDRfWEp1fYmyTu00NJyDRigF"
);

export default function StripeCheckout(props: IStripeCheckout) {
  const [clientSecret, setClientSecret] = useState({ clientSecret: "" });

  const [loading, setLoading] = useState(true);

  // var response = {
  //     clientSecret: ""
  //         // "cs_test_a1KdArCrXPWzoj1gHxKy9bPQ02iSIAQGnMSkGeQEXG…gYScpJ3dgYWx3YGZxSmtGamh1aWBxbGprJz8nZGlyZHx2J3gl",
  // };
  console.log("ashley");
  console.log(props);
  useEffect(() => {
    getEventById(props.eventId).then((event) => {
      console.log("owen");
      console.log(event);
      const bookingData = {
        name: event.name,
        price: event.price * 100,
        quantity: props.quantity,
      };
      fetch("https://stripe-checkout-7aikp3s36a-uc.a.run.app", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bookingData),
      }).then(async (stripeData) => {
        const json = await stripeData.json();
        console.log(json);
        // response = json;
        setClientSecret(json);
        // console.log(response);
        setLoading(false);
        return json;
      });
    });
  }, []);

  return loading ? (
    <Loading />
  ) : (
    <EmbeddedCheckoutProvider stripe={stripePromise} options={clientSecret}>
      <EmbeddedCheckout />
    </EmbeddedCheckoutProvider>
  );
}
