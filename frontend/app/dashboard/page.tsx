'use client';
import { getAllEvents, getEventById } from '@/services/eventsService';
import { useEffect, useState } from 'react';
import { searchEventsByKeyword } from '@/services/eventsService';
import { Alert } from '@material-tailwind/react';
import FilterBanner from '@/components/Filter/FilterBanner';
import Loading from '@/components/Loading';
import EventCard from '@/components/events/EventCard';
import { EventData } from '@/interfaces/EventTypes';
import { useRouter, useSearchParams } from 'next/navigation';
import noSearchResultLineDrawing from '../../public/images/no-search-result-line-drawing.jpg';
import Image from 'next/image';

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [allEventsDataList, setAllEventsDataList] = useState<EventData[]>([]);
  const [eventDataList, setEventDataList] = useState<EventData[]>([]);
  const [searchDataList, setSearchDataList] = useState<EventData[]>([]);
  const [showLoginSuccess, setShowLoginSuccess] = useState(false);
  const router = useRouter();
  const [currentUrl, setCurrentUrl] = useState(
    typeof window !== 'undefined' ? window.location.href : ''
  );
  const searchParams = useSearchParams();
  const [srcLocation, setSrcLocation] = useState<string>('');
  const [triggerFilterApply, setTriggerFilterApply] = useState(false);
  const getQueryParams = () => {
    if (typeof window === 'undefined') {
      // Return some default or empty values when not in a browser environment
      return { event: '', location: '' };
    }
    const searchParams = new URLSearchParams(window.location.search);
    return {
      event: searchParams.get('event') || '',
      location: searchParams.get('location') || '',
    };
  };

  useEffect(() => {
    setLoading(true);
    const fetchEvents = async () => {
      const { event, location } = getQueryParams();
      setSrcLocation(location);
      if (typeof event === 'string' && typeof location === 'string') {
        if (event.trim() === '') {
          getAllEvents()
            .then((events) => {
              setEventDataList(events);
              setSearchDataList(events);
              setAllEventsDataList(events);
            })
            .finally(() => {
              setLoading(false);
            });
        } else {
          searchEventsByKeyword(event, location)
            .then(async (events) => {
              let tempEventDataList: EventData[] = [];
              for (const singleEvent of events) {
                const eventData = await getEventById(singleEvent.eventId);
                tempEventDataList.push(eventData);
              }
              return tempEventDataList;
            })
            .then((tempEventDataList: EventData[]) => {
              setEventDataList(tempEventDataList);
              setSearchDataList(tempEventDataList);
            })
            .finally(() => {
              setLoading(false);
            });
        }
      }
      if (location.trim() !== '') {
        setTriggerFilterApply(true);
      }
    };
    fetchEvents();
    console.log(srcLocation);
  }, [searchParams]);

  useEffect(() => {
    const login = searchParams?.get('login');
    if (login === 'success') {
      setShowLoginSuccess(true);

      router.replace('/dashboard');
    }
  }, [router]);

  useEffect(() => {
    let timer: number | undefined;

    if (showLoginSuccess) {
      timer = window.setTimeout(() => {
        setShowLoginSuccess(false);
      }, 3000);
    }

    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [showLoginSuccess]);

  return loading ? (
    <Loading />
  ) : (
    <div>
      <div className='flex justify-center'>
        <FilterBanner
          eventDataList={searchDataList}
          allEventsDataList={allEventsDataList}
          setEventDataList={setEventDataList}
          srcLocation={srcLocation}
          setSrcLocation={setSrcLocation}
          triggerFilterApply={triggerFilterApply}
        />
      </div>
      <div className='absolute ml-auto mr-auto left-0 right-0 top-32 w-fit'>
        <Alert open={showLoginSuccess} color='green'>
          Successfully logged in!
        </Alert>
      </div>
      <div className='flex justify-center'>
        <div className='pb-10 screen-width-dashboard'>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8'>
            {eventDataList
              .sort((event1, event2) => {
                if (event1.accessCount > event2.accessCount) {
                  return 1;
                }
                if (event2.accessCount < event2.accessCount) {
                  return -1;
                }
                return 0;
              })
              .map((event, eventIdx) => {
                return (
                  <div className='my-4' key={eventIdx}>
                    <EventCard
                      eventId={event.eventId}
                      image={event.image}
                      name={event.name}
                      organiser={event.organiser}
                      startTime={event.startDate}
                      location={event.location}
                      price={event.price}
                      vacancy={event.vacancy}
                    />
                  </div>
                );
              })}
            {eventDataList.length === 0 ? (
              <div className=''>
                <Image
                  src={noSearchResultLineDrawing}
                  alt='noSearchResultLineDrawing'
                  width={600}
                  height={600}
                  className='h-100 w-30'
                />
              </div>
            ) : (
              <div></div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
