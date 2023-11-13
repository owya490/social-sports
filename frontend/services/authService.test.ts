import { handleEmailAndPasswordSignUp, userAuthData } from "./authService";

test("test sign up with email", async () => {
    const user1AuthData: userAuthData = {
        email: "testuser1@gmail.com",
        password: "testuser1password",
        firstName: "testuser1",
    };
    await handleEmailAndPasswordSignUp(user1AuthData);
});
