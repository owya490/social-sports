"use client";

import {
    handleEmailAndPasswordSignIn,
    handleGoogleSignIn,
    handleSignOut,
} from "@/services/authService";
import { authUser } from "@/services/firebase";
import React from "react";

const LoginDemo = () => {
    return (
        <div>
            <button
                onClick={() =>
                    handleEmailAndPasswordSignIn(
                        "testuser1@gmail.com",
                        "testuser1password"
                    )
                }
            >
                Email Sign In
            </button>
            <button
                onClick={() => {
                    console.log("authUser:", authUser);
                }}
            >
                Click
            </button>
            <button
                onClick={() => {
                    handleSignOut();
                }}
            >
                Logout
            </button>
        </div>
    );
};

export default LoginDemo;
