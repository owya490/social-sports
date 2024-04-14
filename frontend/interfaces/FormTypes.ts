export type CreateEventFormData = {
  date: string;
  location: string;
  sport: string;
  price: number;
  capacity: number;
  name: string;
  description: string;
  image: File | undefined;
  tags: string[];
  isPrivate: boolean;
  startTime: string;
  endTime: string;
};

export const EmptyCreateEventFormData: CreateEventFormData = {
  date: new Date().toISOString().slice(0, 10),
  location: "",
  sport: "volleyball",
  price: 15,
  capacity: 20,
  name: "",
  description: "",
  image: undefined,
  tags: [],
  isPrivate: false,
  startTime: "10:00",
  endTime: "18:00",
};
