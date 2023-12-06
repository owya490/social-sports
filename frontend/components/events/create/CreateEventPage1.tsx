// CreateEventPage1.jsx
// @ts-nocheck
// use client

import React from 'react';
import { CreateEventLocationSearch } from "@/components/events/create/CreateEventLocationSearch";
import { CreateEventName } from "@/components/events/create/CreateEventName";

export  function CreateEventPage1() {
  return (
    <div className="mt-10">
      <CreateEventLocationSearch />
      <div className='mt-30'></div>
      <CreateEventName />
    </div>
  );
}
