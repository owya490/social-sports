import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { EventData } from "@/interfaces/EventTypes";

interface DashboardState {
  loading: boolean;
  eventDataList: EventData[];
  searchDataList: EventData[];
  allEventsDataList: EventData[];
  showLoginSuccess: boolean;
  srcLocation: string;
  triggerFilterApply: boolean | undefined;
  endLoading: boolean | undefined;
}

const initialState: DashboardState = {
  loading: false,
  eventDataList: [],
  searchDataList: [],
  allEventsDataList: [],
  showLoginSuccess: false,
  srcLocation: "",
  triggerFilterApply: undefined,
  endLoading: undefined,
};

const dashboardSlice = createSlice({
  name: "dashboard",
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setEventDataList: (state, action: PayloadAction<EventData[]>) => {
      state.eventDataList = action.payload;
    },
    setSearchDataList: (state, action: PayloadAction<EventData[]>) => {
      state.searchDataList = action.payload;
    },
    setAllEventsDataList: (state, action: PayloadAction<EventData[]>) => {
      state.allEventsDataList = action.payload;
    },
    setShowLoginSuccess: (state, action: PayloadAction<boolean>) => {
      state.showLoginSuccess = action.payload;
    },
    setSrcLocation: (state, action: PayloadAction<string>) => {
      state.srcLocation = action.payload;
    },
    setTriggerFilterApply: (state, action: PayloadAction<boolean | undefined>) => {
      state.triggerFilterApply = action.payload;
    },
    setEndLoading: (state, action: PayloadAction<boolean | undefined>) => {
      state.endLoading = action.payload;
    },
  },
});

export const {
  setLoading,
  setEventDataList,
  setSearchDataList,
  setAllEventsDataList,
  setShowLoginSuccess,
  setSrcLocation,
  setTriggerFilterApply,
  setEndLoading,
} = dashboardSlice.actions;

export default dashboardSlice.reducer;
