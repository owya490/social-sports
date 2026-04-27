package com.functions.global.controllers;

import com.functions.stripe.config.StripeConfig;
import com.google.cloud.functions.HttpFunction;

public abstract class AbstractConfiguredHttpFunction implements HttpFunction {
    protected AbstractConfiguredHttpFunction() {
        StripeConfig.initialize();
    }
}
