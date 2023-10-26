"use client";
import {
    EmbeddedCheckout,
    EmbeddedCheckoutProvider,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { useEffect, useState } from "react";
import Loading from "../Loading";

// Make sure to call `loadStripe` outside of a component’s render to avoid
// recreating the `Stripe` object on every render.
const stripePromise = loadStripe(
    "pk_test_51NXMlhHhhEIekcchpwavtyFGsnFLSqmUWxFhZlO64Uv5QYEzmBHKnlA75QWxO5CikWZC639BBhRDRfWEp1fYmyTu00NJyDRigF"
);

export default function StripeCheckout() {
    const [clientSecret, setClientSecret] = useState({ clientSecret: "" });

    const [loading, setLoading] = useState(true);

    // var response = {
    //     clientSecret: ""
    //         // "cs_test_a1KdArCrXPWzoj1gHxKy9bPQ02iSIAQGnMSkGeQEXG…gYScpJ3dgYWx3YGZxSmtGamh1aWBxbGprJz8nZGlyZHx2J3gl",
    // };

    const data = {
        name: "owen",
        price: 2000,
        quantity: 5,
    };
    useEffect(() => {
        fetch("https://stripe-checkout-7aikp3s36a-uc.a.run.app", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        }).then(async (data) => {
            const json = await data.json();
            console.log(json);
            // response = json;
            setClientSecret(json);
            // console.log(response);
            setLoading(false);
            return json;
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
