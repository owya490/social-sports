package com.functions.firebase.models.requests;

// Prepare JSON body: wrap in { "data": ... } as Firebase callable functions expect
public record CallFirebaseFunctionRequest(
        Object data
) {
}
