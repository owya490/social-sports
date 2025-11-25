package com.functions;

import com.functions.stripe.config.StripeConfig;

/**
 * Hello world!
 *
 */
public class App 
{    
    public static void main( String[] args ) {
        StripeConfig.initialize();
    }
}
