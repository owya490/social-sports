import { CustomEventLink, CustomEventLinkType, EMPTY_CUSTOM_EVENT_LINK } from "@/interfaces/CustomLinkTypes";
import { EventData } from "@/interfaces/EventTypes";
import { RecurrenceTemplate } from "@/interfaces/RecurringEventTypes";
import { UserData } from "@/interfaces/UserTypes";
import {
  deleteCustomEventLink,
  saveCustomEventLink,
} from "@/services/src/events/customEventLinks/customEventLinksService";
import { DocumentDuplicateIcon, PencilIcon, TrashIcon } from "@heroicons/react/24/outline";
import { Button, Chip, IconButton, Input, Option, Select, Tooltip, Typography } from "@material-tailwind/react";
import { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";

const TABLE_HEAD = ["Custom Link Name", "Custom Link", "Type", "Reference", ""];

interface CustomEventLinksTableProps {
  user: UserData;
  activeEvents: EventData[];
  activeRecurringTemplates: RecurrenceTemplate[];
  links: CustomEventLink[];
  setLinks: (links: CustomEventLink[]) => void;
}

export default function CustomEventLinksTable({
  user,
  activeEvents,
  activeRecurringTemplates,
  links,
  setLinks,
}: CustomEventLinksTableProps) {
  const [updatedLinks, setUpdatedLinks] = useState<CustomEventLink[]>(links);
  const [editIds, setEditIds] = useState<string[]>([]);

  useEffect(() => {
    setUpdatedLinks(links);
  }, [links]);

  const handleEdit = (id: string) => setEditIds((prev) => [...prev, id]);

  const handleAddLink = () => {
    const newId = uuidv4();
    const newLink: CustomEventLink = {
      ...EMPTY_CUSTOM_EVENT_LINK,
      id: newId,
    };
    setUpdatedLinks((prev) => [...prev, newLink]);
    setEditIds((prev) => [...prev, newId]);
  };

  const handleSave = async (id: string) => {
    const updatedLink = updatedLinks.find((l) => l.id === id)!;
    // Validation: required fields
    const missingFields = [];
    if (!updatedLink.customEventLinkName) missingFields.push("Custom Link Name");
    if (!updatedLink.customEventLink) missingFields.push("Custom Link");
    if (!updatedLink.type) missingFields.push("Type");
    if (missingFields.length > 0) {
      window.alert(`Please fill in the following fields: ${missingFields.join(", ")}`);
      return;
    }
    // Custom Link format validation
    const customLinkRegex = /^[a-zA-Z0-9-]+$/;
    if (updatedLink.customEventLink && !customLinkRegex.test(updatedLink.customEventLink)) {
      window.alert("Custom Link must only contain letters, numbers, and hyphens (no spaces or special characters).");
      return;
    }
    setEditIds((prev) => prev.filter((editId) => editId !== id));
    const isNew = !links.some((l) => l.id === id);
    if (isNew) {
      setLinks([...links, updatedLink]);
    } else {
      // get everything from links, except for the one specified by the id, get from updatedLinks
      setLinks(links.map((link) => (link.id === id ? updatedLink : link)));
    }
    await saveCustomEventLink(user.userId, updatedLink);
  };

  const handleCancel = (id: string) => {
    setEditIds((prev) => prev.filter((editId) => editId !== id));
    const isNew = !links.some((l) => l.id === id);
    if (isNew) {
      setUpdatedLinks((prev) => prev.filter((link) => link.id !== id));
    }
    {
      // get everything from updatedLinks, except for the one specified by the id, get from links
      setUpdatedLinks((prev) => prev.map((link) => (link.id === id ? links.find((l) => l.id === id)! : link)));
    }
  };
  
  const handleCopyLink = (link: string) => {
    navigator.clipboard.writeText(`https://www.sportshub.net.au/event/${user.username}/${link}`);
  };

  const handleDelete = (id: string) => {
    const link = updatedLinks.find((link) => link.id === id)!;
    setUpdatedLinks((prev) => prev.filter((link) => link.id !== id));
    setLinks(links.filter((link) => link.id !== id));
    deleteCustomEventLink(user.userId, link);
  };

  // Utility function to update a field in updatedLinks by id
  function handleFieldChange<T extends keyof CustomEventLink>(
    id: string,
    field: T,
    valueFn: (prev: CustomEventLink) => CustomEventLink[T]
  ) {
    setUpdatedLinks((prev) => prev.map((l) => (l.id === id ? { ...l, [field]: valueFn(l) } : l)));
  }

  return (
    <div className="w-full">
      <div className="mb-8 flex items-center justify-between gap-8">
        <div>
          <Typography color="gray" className="mt-1 font-normal">
            View and edit your custom event links.{" "}
            <span className="font-bold hidden md:block">
              The link will be in the format of https://www.sportshub.net.au/event/{user.username}/custom_link{" "}
            </span>
          </Typography>
        </div>
        <Button className="flex items-center gap-3 shrink-0" size="sm" onClick={handleAddLink}>
          + Add Link
        </Button>
      </div>
      <div className="overflow-x-scroll rounded-lg min-h-[70vh] scroll">
        <table className="w-full min-w-max text-left">
          <thead>
            <tr>
              {TABLE_HEAD.map((head) => (
                <th key={head} className="p-4 bg-blue-gray-50/50">
                  <Typography variant="small" color="blue-gray" className="font-normal leading-none opacity-70">
                    {head}
                  </Typography>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {updatedLinks.map((link) => {
              const isEditing = editIds.includes(link.id);
              return (
                <tr key={link.id} className="align-top">
                  {/* Custom Link Name */}
                  <td className="p-4">
                    {isEditing ? (
                      <Input
                        label="Custom Link Name"
                        crossOrigin={undefined}
                        value={link.customEventLinkName}
                        onChange={(e) => handleFieldChange(link.id, "customEventLinkName", () => e.target.value)}
                      />
                    ) : (
                      <Typography variant="small" color="blue-gray" className="font-normal">
                        {link.customEventLinkName}
                      </Typography>
                    )}
                  </td>
                  {/* Custom Link */}
                  <td className="p-4">
                    {isEditing ? (
                      <Input
                        label="Custom Link"
                        crossOrigin={undefined}
                        value={link.customEventLink}
                        onChange={(e) => handleFieldChange(link.id, "customEventLink", () => e.target.value)}
                      />
                    ) : (
                      <Typography variant="small" color="blue-gray" className="font-normal">
                        {link.customEventLink}
                      </Typography>
                    )}
                  </td>
                  {/* Type */}
                  <td className="p-4">
                    {isEditing ? (
                      <Select
                        label="Type"
                        value={link.type}
                        onChange={(val) => {
                          handleFieldChange(link.id, "type", () => val as CustomEventLinkType);
                          handleFieldChange(link.id, "referenceId", () => null);
                          handleFieldChange(link.id, "referenceName", () => null);
                          handleFieldChange(link.id, "eventReference", () => null);
                        }}
                      >
                        <Option value="event">Event</Option>
                        <Option value="recurring">Recurring</Option>
                      </Select>
                    ) : (
                      <Chip
                        className={`${
                          link.type === "event" ? "bg-core-outline" : "bg-core-hover"
                        } text-black text-sm font-light`}
                        value={link.type === "event" ? "Event" : "Recurring"}
                        size="sm"
                      />
                    )}
                  </td>
                  {/* Reference */}
                  <td className="p-4">
                    {isEditing ? (
                      <Select
                        label={link.type === "event" ? "Event Reference" : "Recurring Reference"}
                        value={link.referenceId ?? ""}
                        onChange={(val) => {
                          setUpdatedLinks((prev) =>
                            prev.map((l) =>
                              l.id === link.id
                                ? {
                                    ...l,
                                    referenceId: val ?? null,
                                    referenceName: val
                                      ? link.type === "event"
                                        ? activeEvents.find((event) => event.eventId === val)!.name
                                        : activeRecurringTemplates.find(
                                            (template) => template.recurrenceTemplateId === val
                                          )!.eventData.name
                                      : null,
                                    eventReference:
                                      link.type === "event"
                                        ? val ?? null
                                        : Object.entries(
                                            activeRecurringTemplates.find(
                                              (template) => template.recurrenceTemplateId === val
                                            )!.recurrenceData.pastRecurrences
                                          )
                                            .map(([dateStr, id]) => ({ date: new Date(dateStr), id }))
                                            .sort((a, b) => b.date.getTime() - a.date.getTime())[0].id,
                                  }
                                : l
                            )
                          );
                        }}
                      >
                        {link.type === "event"
                          ? activeEvents.map((event) => (
                              <Option key={event.eventId} value={event.eventId}>
                                {event.name}
                              </Option>
                            ))
                          : activeRecurringTemplates.map((template) => (
                              <Option key={template.recurrenceTemplateId} value={template.recurrenceTemplateId}>
                                {template.eventData.name}
                              </Option>
                            ))}
                      </Select>
                    ) : (
                      <Typography variant="small" color="blue-gray" className="font-normal">
                        {link.referenceName}
                      </Typography>
                    )}
                  </td>
                  {/* Actions */}
                  <td className="p-4">
                    {isEditing ? (
                      <div className="flex gap-2">
                        <button
                          className="rounded-full py-1.5 px-3 bg-core-outline text-black text-sm font-light"
                          onClick={() => handleSave(link.id)}
                        >
                          Save
                        </button>
                        <button
                          className="rounded-full py-1.5 px-3 bg-core-hover text-black text-sm font-light"
                          onClick={() => handleCancel(link.id)}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <>
                        <Tooltip content="Edit Link">
                          <IconButton variant="text" onClick={() => handleEdit(link.id)}>
                            <PencilIcon className="h-4 w-4" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip content="Copy Link">
                          <IconButton variant="text" onClick={() => handleCopyLink(link.customEventLink)}>
                            <DocumentDuplicateIcon className="h-4 w-4" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip content="Delete Link">
                          <IconButton variant="text" onClick={() => handleDelete(link.id)}>
                            <TrashIcon className="h-4 w-4" />
                          </IconButton>
                        </Tooltip>
                      </>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
