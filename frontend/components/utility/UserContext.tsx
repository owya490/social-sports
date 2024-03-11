import { createContext, useState } from "react";

export const LoginUserContext = createContext({});

function UserContext({ children }: { children: any }) {
  const [currentUser, setCurrentUser] = useState(null);
  return (
    <LoginUserContext.Provider value={{ currentUser, setCurrentUser }}>
      {children}
    </LoginUserContext.Provider>
  );
}

export default UserContext;
