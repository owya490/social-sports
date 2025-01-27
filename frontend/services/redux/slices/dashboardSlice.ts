// store/dashboardSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { EventData } from "@/interfaces/EventTypes";

interface DashboardState {
  loading: boolean;
  allEventsDataList: EventData[];
  eventDataList: EventData[];
  searchDataList: EventData[];
  showLoginSuccess: boolean;
  srcLocation: string;
  triggerFilterApply?: boolean;
  endLoading?: boolean;
}

const initialState: DashboardState = {
  loading: true,
  allEventsDataList: [],
  eventDataList: [],
  searchDataList: [],
  showLoginSuccess: false,
  srcLocation: "",
  triggerFilterApply: undefined,
  endLoading: undefined,
};

const dashboardSlice = createSlice({
  name: "dashboard",
  initialState,
  reducers: {
    setLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
    setAllEventsDataList(state, action: PayloadAction<EventData[]>) {
      state.allEventsDataList = action.payload;
    },
    setEventDataList(state, action: PayloadAction<EventData[]>) {
      state.eventDataList = action.payload;
    },
    setSearchDataList(state, action: PayloadAction<EventData[]>) {
      state.searchDataList = action.payload;
    },
    setShowLoginSuccess(state, action: PayloadAction<boolean>) {
      state.showLoginSuccess = action.payload;
    },
    setSrcLocation(state, action: PayloadAction<string>) {
      state.srcLocation = action.payload;
    },
    setTriggerFilterApply(state, action: PayloadAction<boolean | undefined>) {
      state.triggerFilterApply = action.payload;
    },
    setEndLoading(state, action: PayloadAction<boolean | undefined>) {
      state.endLoading = action.payload;
    },
  },
});

export const {
  setLoading,
  setAllEventsDataList,
  setEventDataList,
  setSearchDataList,
  setShowLoginSuccess,
  setSrcLocation,
  setTriggerFilterApply,
  setEndLoading,
} = dashboardSlice.actions;

const dashboardReducer = dashboardSlice.reducer;
export default dashboardReducer;
