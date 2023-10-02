import React, { useState } from 'react';
import { eventCreate, getAllEvents } from '@/services/eventsCrud';

interface EventData {
    Name: string;
}

function Test() {
  const [eventName, setEventName] = useState<string>('');
  const [events, setEvents] = useState<EventData[]>([]);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setEventName(event.target.value);
  };

  const handleAddEvent = async () => {
    if (eventName.trim() === '') {
      return; // Prevent adding an empty event name
    }

    try {
      const eventData = { Name: eventName };
      await eventCreate(eventData);
      setEventName(''); // Clear the input field after adding
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div>
      <h1>This is the /test page</h1>
      <input
        type='text'
        placeholder='Enter event name'
        value={eventName}
        onChange={handleInputChange}
      />
      <button onClick={handleAddEvent}>Add Event</button>
    </div>
  );
}

export default Test;
