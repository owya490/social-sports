"use client";

import { InvertedHighlightButton } from "@/components/elements/HighlightButton";
import { ImageSelectionDialog } from "@/components/forms/sections/image-section/ImageSelectionDialog";
import OrganiserEventCard from "@/components/organiser/dashboard/OrganiserEventCard";
import { useUser } from "@/components/utility/UserContext";
import { EMPTY_EVENT_COLLECTION, EventCollection } from "@/interfaces/EventCollectionTypes";
import { EmptyEventData, EventData, EventId } from "@/interfaces/EventTypes";
import { ImageType } from "@/interfaces/ImageTypes";
import { Logger } from "@/observability/logger";
import noSearchResultLineDrawing from "@/public/images/no-search-result-line-drawing.jpg";
import {
  deleteEventCollection,
  getEventCollectionById,
  removeEventFromCollection,
  updateEventCollection,
} from "@/services/src/eventCollections/eventCollectionsService";
import { getEventById, getOrganiserEvents } from "@/services/src/events/eventsService";
import { getUsersEventImagesUrls, uploadEventImage } from "@/services/src/images/imageService";
import { getErrorUrl, getUrlWithCurrentHostname } from "@/services/src/urlUtils";
import {
  ArrowLeftIcon,
  CheckIcon,
  LinkIcon,
  LockClosedIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

interface CollectionPageProps {
  params: {
    id: string;
  };
}

export default function CollectionPage({ params }: CollectionPageProps) {
  const collectionId = params.id;
  const { user } = useUser();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [eventDataList, setEventDataList] = useState<EventData[]>([]);
  const [collection, setCollection] = useState<EventCollection>(EMPTY_EVENT_COLLECTION);
  const [copied, setCopied] = useState(false);

  // Editing states
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editedTitle, setEditedTitle] = useState("");
  const [editedDescription, setEditedDescription] = useState("");
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [showAddEventsDialog, setShowAddEventsDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [allOrganiserEvents, setAllOrganiserEvents] = useState<EventData[]>([]);
  const [selectedEventIds, setSelectedEventIds] = useState<Set<EventId>>(new Set());

  const titleInputRef = useRef<HTMLInputElement>(null);
  const descriptionTextareaRef = useRef<HTMLTextAreaElement>(null);

  const logger = new Logger("CollectionPage");

  const loadingEventDataList: EventData[] = [
    EmptyEventData,
    EmptyEventData,
    EmptyEventData,
    EmptyEventData,
    EmptyEventData,
    EmptyEventData,
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const collection = await getEventCollectionById(collectionId);
        setCollection(collection);
        setEditedTitle(collection.name);
        setEditedDescription(collection.description);

        const events: EventData[] = [];
        for (const eventId of collection.eventIds) {
          const event = await getEventById(eventId);
          events.push(event);
        }

        setEventDataList(events);
        setLoading(false);
      } catch (error) {
        logger.error(`Failed to get events for collection: ${error}`);
        router.push(getErrorUrl(error));
      }
    };

    fetchData();
  }, []);

  // Focus on input when entering edit mode
  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [isEditingTitle]);

  useEffect(() => {
    if (isEditingDescription && descriptionTextareaRef.current) {
      descriptionTextareaRef.current.focus();
    }
  }, [isEditingDescription]);

  const handleTitleSave = async () => {
    if (editedTitle.trim() && editedTitle !== collection.name) {
      try {
        await updateEventCollection(collectionId, collection.isPrivate, { name: editedTitle.trim() });
        setCollection((prev) => ({ ...prev, name: editedTitle.trim() }));
      } catch (error) {
        logger.error(`Failed to update collection name: ${error}`);
        router.push(getErrorUrl(error));
      }
    }
    setIsEditingTitle(false);
  };

  const handleDescriptionSave = async () => {
    if (editedDescription.trim() !== collection.description) {
      try {
        await updateEventCollection(collectionId, collection.isPrivate, { description: editedDescription.trim() });
        setCollection((prev) => ({ ...prev, description: editedDescription.trim() }));
      } catch (error) {
        logger.error(`Failed to update collection description: ${error}`);
        router.push(getErrorUrl(error));
      }
    }
    setIsEditingDescription(false);
  };

  const handleImageSelected = async (imageUrl: string) => {
    try {
      await updateEventCollection(collectionId, collection.isPrivate, { image: imageUrl });
      setCollection((prev) => ({ ...prev, image: imageUrl }));
      setShowImageDialog(false);
    } catch (error) {
      logger.error(`Failed to update collection image: ${error}`);
      router.push(getErrorUrl(error));
    }
  };

  const handleOpenAddEventsDialog = async () => {
    try {
      const events = await getOrganiserEvents(user.userId);
      setAllOrganiserEvents(events);
      setSelectedEventIds(new Set(collection.eventIds));
      setShowAddEventsDialog(true);
    } catch (error) {
      logger.error(`Failed to load organiser events: ${error}`);
    }
  };

  const handleToggleEventSelection = (eventId: EventId) => {
    setSelectedEventIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(eventId)) {
        newSet.delete(eventId);
      } else {
        newSet.add(eventId);
      }
      return newSet;
    });
  };

  const handleSaveEventSelection = async () => {
    try {
      const newEventIds = Array.from(selectedEventIds);
      await updateEventCollection(collectionId, collection.isPrivate, { eventIds: newEventIds });

      // Refresh event data
      const events: EventData[] = [];
      for (const eventId of newEventIds) {
        const event = await getEventById(eventId);
        events.push(event);
      }
      setEventDataList(events);
      setCollection((prev) => ({ ...prev, eventIds: newEventIds }));
      setShowAddEventsDialog(false);
    } catch (error) {
      logger.error(`Failed to save event selection: ${error}`);
      router.push(getErrorUrl(error));
    }
  };

  const handleRemoveEvent = async (eventId: EventId) => {
    try {
      await removeEventFromCollection(collectionId, eventId, collection.isPrivate);
      setEventDataList((prev) => prev.filter((event) => event.eventId !== eventId));
      setCollection((prev) => ({
        ...prev,
        eventIds: prev.eventIds.filter((id) => id !== eventId),
      }));
    } catch (error) {
      logger.error(`Failed to remove event: ${error}`);
      router.push(getErrorUrl(error));
    }
  };

  const handleDeleteCollection = async () => {
    try {
      await deleteEventCollection(collectionId, user.userId, collection.isPrivate);
      router.push("/organiser/event/event-collection");
    } catch (error) {
      logger.error(`Failed to delete collection: ${error}`);
      router.push(getErrorUrl(error));
    }
  };

  const handleCopyLink = () => {
    const collectionUrl = `${getUrlWithCurrentHostname(`/event-collection/${collectionId}`)}`;
    navigator.clipboard.writeText(collectionUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="px-4 pb-10 mt-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/organiser/event/event-collection"
            className="inline-flex items-center text-gray-600 hover:text-core-text mb-4"
          >
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
            Back to Collections
          </Link>

          <div className="bg-white rounded-lg border border-gray-300 p-4 md:p-6 mb-6">
            {/* Side-by-side: Image and Details */}
            <div className="flex flex-col md:flex-row gap-4 md:gap-6 mb-4">
              {/* Image - Click to edit */}
              <div className="flex-shrink-0 w-full md:w-80 lg:w-96 relative group">
                <div
                  className="w-full rounded-xl cursor-pointer relative overflow-hidden"
                  style={{
                    backgroundImage: `url(${collection.image})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center center",
                    aspectRatio: "16/9",
                  }}
                  onClick={() => setShowImageDialog(true)}
                >
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center">
                    <PencilIcon className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              </div>

              {/* Collection Details */}
              <div className="flex-1 flex flex-col justify-between min-w-0">
                <div>
                  {/* Title - Click to edit */}
                  <div className="flex items-center gap-2 mb-3">
                    {isEditingTitle ? (
                      <input
                        ref={titleInputRef}
                        type="text"
                        value={editedTitle}
                        onChange={(e) => setEditedTitle(e.target.value)}
                        onBlur={handleTitleSave}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleTitleSave();
                          if (e.key === "Escape") {
                            setEditedTitle(collection.name);
                            setIsEditingTitle(false);
                          }
                        }}
                        className="flex-1 text-2xl md:text-3xl lg:text-4xl font-bold text-core-text border-b-1 border-gray-300 focus:outline-none focus:border-black focus:ring-1 focus:ring-black rounded"
                      />
                    ) : (
                      <h1
                        className="text-2xl md:text-3xl lg:text-4xl font-bold text-core-text cursor-pointer hover:text-gray-700 transition-colors"
                        onClick={() => setIsEditingTitle(true)}
                      >
                        {collection.name}
                      </h1>
                    )}
                    <div className="flex items-center gap-2 ml-auto">
                      {collection.isPrivate && (
                        <span className="flex items-center text-xs px-3 py-1.5 bg-gray-100 text-gray-600 rounded-full whitespace-nowrap">
                          <LockClosedIcon className="w-3 h-3 mr-1" />
                          Private
                        </span>
                      )}
                      <button
                        onClick={() => setShowDeleteDialog(true)}
                        className="p-2 bg-gray-100 hover:bg-red-600 text-gray-600 hover:text-white rounded-full transition-colors"
                        title="Delete collection"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {/* Description - Click to edit */}
                  {isEditingDescription ? (
                    <textarea
                      ref={descriptionTextareaRef}
                      value={editedDescription}
                      onChange={(e) => setEditedDescription(e.target.value)}
                      onBlur={handleDescriptionSave}
                      onKeyDown={(e) => {
                        if (e.key === "Escape") {
                          setEditedDescription(collection.description);
                          setIsEditingDescription(false);
                        }
                      }}
                      rows={3}
                      className="w-full text-gray-600 text-sm md:text-base border border-gray-300 rounded-lg p-2 focus:outline-none focus:border-black focus:ring-1 focus:ring-black"
                    />
                  ) : (
                    <p
                      className="text-gray-600 text-sm md:text-base cursor-pointer hover:text-gray-800 transition-colors"
                      onClick={() => setIsEditingDescription(true)}
                    >
                      {collection.description}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Collection Link */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <label className="block text-sm font-medium text-gray-700 mb-2">Collection Link</label>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <div className="flex-1 bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-xs md:text-sm text-gray-600 font-mono overflow-x-auto whitespace-nowrap">
                  {`${getUrlWithCurrentHostname(`/event-collection/${collectionId}`)}`}
                </div>
                <button
                  onClick={handleCopyLink}
                  className="flex items-center justify-center space-x-2 px-4 py-1.5 bg-black text-white rounded-lg hover:bg-white hover:text-black border border-black transition-colors whitespace-nowrap"
                >
                  <LinkIcon className="w-4 h-4" />
                  <span>{copied ? "Copied!" : "Copy"}</span>
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Only people with this link can view this collection. Share it to let others see these events.
              </p>
            </div>
          </div>
        </div>

        {/* Events Grid */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg md:text-xl font-bold text-core-text">
              Events ({loading ? "..." : eventDataList.length})
            </h2>
            <InvertedHighlightButton onClick={handleOpenAddEventsDialog} text="Add Events" />
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {loadingEventDataList.map((event, eventIdx) => (
                <div className="w-full" key={eventIdx}>
                  <OrganiserEventCard
                    eventId={event.eventId}
                    image={event.image}
                    name={event.name}
                    organiser={event.organiser}
                    startTime={event.startDate}
                    location={event.location}
                    price={event.price}
                    vacancy={event.vacancy}
                    loading={true}
                  />
                </div>
              ))}
            </div>
          ) : eventDataList.length === 0 ? (
            <div className="flex justify-center py-12">
              <div className="text-center">
                <Image
                  src={noSearchResultLineDrawing}
                  alt="No events found"
                  width={400}
                  height={240}
                  className="opacity-60 mx-auto mb-6"
                />
                <div className="text-gray-600 font-medium text-lg sm:text-2xl">No events in this collection</div>
                <p className="text-gray-500 text-sm mt-2">Click "Add Events" to add events to this collection</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {eventDataList.map((event) => (
                <div key={event.eventId} className="relative w-full group">
                  <div className="transition-all duration-200 group-hover:scale-[1.05]">
                    <OrganiserEventCard
                      eventId={event.eventId}
                      image={event.image}
                      name={event.name}
                      organiser={event.organiser}
                      startTime={event.startDate}
                      location={event.location}
                      price={event.price}
                      vacancy={event.vacancy}
                      loading={false}
                    />
                  </div>
                  <button
                    onClick={() => handleRemoveEvent(event.eventId)}
                    className="absolute bottom-2 right-2 p-2 bg-red-600 text-white rounded-full hover:bg-red-700 shadow-lg z-10 cursor-pointer transition-all duration-200 opacity-100 md:opacity-0 group-hover:opacity-100"
                    title="Remove from collection"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Image Selection Dialog */}
      <ImageSelectionDialog
        isOpen={showImageDialog}
        onClose={() => setShowImageDialog(false)}
        onImageSelected={handleImageSelected}
        imageType={ImageType.IMAGE}
        imageUrls={[]}
        onLoadImages={async () => await getUsersEventImagesUrls(user.userId)}
        onUploadImage={async (file: File) => await uploadEventImage(user.userId, file)}
        title="Select Collection Image"
        buttonText="Save Image"
      />

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-core-text mb-4">Delete Collection?</h2>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this collection? This action is irreversible and cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteDialog(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteCollection}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Events Dialog */}
      {showAddEventsDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
              <div>
                <h2 className="text-xl font-semibold text-core-text">Add Events to Collection</h2>
                <p className="text-sm text-gray-600 mt-1">
                  {selectedEventIds.size} {selectedEventIds.size === 1 ? "event" : "events"} selected
                </p>
              </div>
              <button onClick={() => setShowAddEventsDialog(false)} className="p-2 hover:bg-gray-100 rounded-full">
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              {allOrganiserEvents.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-600 text-lg">No events found</p>
                  <p className="text-gray-500 text-sm mt-2">Create events first to add them to this collection</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {allOrganiserEvents.map((event) => {
                    const isSelected = selectedEventIds.has(event.eventId);
                    return (
                      <div
                        key={event.eventId}
                        onClick={() => handleToggleEventSelection(event.eventId)}
                        className={`cursor-pointer transition-all duration-200 rounded-lg ${
                          isSelected ? "ring-2 ring-black shadow-lg" : "hover:shadow-md"
                        }`}
                      >
                        <div className="relative">
                          {isSelected && (
                            <div className="absolute top-2 right-2 bg-black text-white rounded-full p-1">
                              <CheckIcon className="w-4 h-4" />
                            </div>
                          )}
                          <OrganiserEventCard
                            eventId={event.eventId}
                            image={event.image}
                            name={event.name}
                            organiser={event.organiser}
                            startTime={event.startDate}
                            location={event.location}
                            price={event.price}
                            vacancy={event.vacancy}
                            loading={false}
                            disabled={true}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end gap-3 sticky bottom-0 bg-white">
              <button
                onClick={() => setShowAddEventsDialog(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEventSelection}
                className="px-4 py-2 bg-black text-white rounded-lg hover:bg-white hover:text-black border border-black transition-colors"
              >
                Save Selection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
