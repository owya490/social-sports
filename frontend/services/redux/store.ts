// store/index.ts
import { configureStore } from "@reduxjs/toolkit";
import dashboardReducer from "./slices/dashboardSlice";

export const makeStore = () => {
  return configureStore({
    reducer: { dashboardReducer },
  });
};

// Infer the type of makeStore
export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
