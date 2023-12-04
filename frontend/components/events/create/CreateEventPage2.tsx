// CreateEventPage1.jsx
// @ts-nocheck
// use client

import React from 'react';
import { CreateEventCostCustomAmount } from './CreateEventCostCustomAmount';
import { CreateEventMaximumPeople } from './CreateEventMaximumPeople';
import CreateEventCostSlider from './CreateEventCost';


export  function CreateEventPage2() {
  return (
    <div className="mt-10">
      <CreateEventCostSlider/>
      <div className='mt-30'></div>
      <CreateEventCostCustomAmount />
      <div className='mt-30'></div>
      <CreateEventMaximumPeople/>
    </div>
  );
}
