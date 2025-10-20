import { BlackHighlightButton } from "@/components/elements/HighlightButton";
import { CustomEventLink, CustomEventLinkType, EMPTY_CUSTOM_EVENT_LINK } from "@/interfaces/CustomLinkTypes";
import { EventData } from "@/interfaces/EventTypes";
import { RecurrenceTemplate } from "@/interfaces/RecurringEventTypes";
import { UserData } from "@/interfaces/UserTypes";
import {
  deleteCustomEventLink,
  saveCustomEventLink,
} from "@/services/src/events/customEventLinks/customEventLinksService";
import { getUrlWithCurrentHostname } from "@/services/src/urlUtils";
import { DocumentDuplicateIcon, PencilIcon, TrashIcon } from "@heroicons/react/24/outline";
import { Chip, IconButton, Input, Option, Select, Tooltip, Typography } from "@material-tailwind/react";
import { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";

const TABLE_HEAD = ["Custom Link Name", "Custom Link", "Type", "Reference", ""];

interface CustomEventLinksTableProps {
  user: UserData;
  activeEvents: EventData[];
  activeRecurringTemplates: RecurrenceTemplate[];
  links: Record<string, CustomEventLink>;
  setLinks: (links: Record<string, CustomEventLink>) => void;
}

export default function CustomEventLinksTable({
  user,
  activeEvents,
  activeRecurringTemplates,
  links,
  setLinks,
}: CustomEventLinksTableProps) {
  const [updatedLinks, setUpdatedLinks] = useState<Record<string, CustomEventLink>>(links);
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
    setUpdatedLinks((prev) => ({ ...prev, [newId]: newLink }));
    setEditIds((prev) => [...prev, newId]);
  };

  const handleSave = async (id: string) => {
    const updatedLink = updatedLinks[id];

    if (!validateCustomLink(updatedLink)) {
      return;
    }

    setEditIds((prev) => prev.filter((editId) => editId !== id));

    try {
      await saveCustomEventLink(user.userId, updatedLink);
    } catch (error) {
      console.error("Error saving custom event link:", error);
      window.alert("Error saving custom event link. Please try again.");
      return;
    }
    setLinks({ ...links, [id]: updatedLink });
  };

  const validateCustomLink = (link: CustomEventLink) => {
    // Validation: required fields
    const missingFields = [];
    if (!link.customEventLinkName) missingFields.push("Custom Link Name");
    if (!link.customEventLink) missingFields.push("Custom Link");
    if (!link.type) missingFields.push("Type");
    if (missingFields.length > 0) {
      window.alert(`Please fill in the following fields: ${missingFields.join(", ")}`);
      return false;
    }

    // Validation: length constraints
    if (link.customEventLinkName && link.customEventLinkName.length > 50) {
      window.alert("Custom Link Name must be no longer than 50 characters.");
      return false;
    }

    if (link.customEventLink && link.customEventLink.length > 30) {
      window.alert("Custom Link must be no longer than 30 characters.");
      return false;
    }

    // Validation: minimum length constraints
    if (link.customEventLinkName && link.customEventLinkName.length < 3) {
      window.alert("Custom Link Name must be at least 3 characters long.");
      return false;
    }

    if (link.customEventLink && link.customEventLink.length < 3) {
      window.alert("Custom Link must be at least 3 characters long.");
      return false;
    }

    // Custom Link format validation - check for uppercase letters and spaces
    if (link.customEventLink) {
      if (link.customEventLink !== link.customEventLink.toLowerCase()) {
        window.alert("Custom Link must be in lowercase only (no uppercase letters).");
        return false;
      }
      if (link.customEventLink.includes(" ")) {
        window.alert("Custom Link cannot contain spaces.");
        return false;
      }
      const customLinkRegex = /^[a-z0-9-]+$/;
      if (!customLinkRegex.test(link.customEventLink)) {
        window.alert(
          "Custom Link must only contain lowercase letters, numbers, and hyphens (no spaces or special characters)."
        );
        return false;
      }
    }

    // Validation: check for duplicate custom links (case-insensitive)
    const isNew = !Object.keys(links).includes(link.id);
    const duplicateLink = isNew
      ? Object.values(links).find((l) => l.customEventLink.toLowerCase() === link.customEventLink.toLowerCase())
      : false;

    if (duplicateLink) {
      window.alert(
        `A custom link with the name "${link.customEventLink}" already exists. Please choose a different link.`
      );
      return false;
    }

    // Validation: check for consecutive hyphens or leading/trailing hyphens
    if (
      link.customEventLink &&
      (link.customEventLink.startsWith("-") ||
        link.customEventLink.endsWith("-") ||
        link.customEventLink.includes("--"))
    ) {
      window.alert("Custom Link cannot start or end with hyphens, and cannot contain consecutive hyphens.");
      return false;
    }

    // Validation: reference must be selected when type is chosen
    if (!link.referenceId) {
      window.alert(`Please select a ${link.type === "event" ? "event" : "recurring template"} reference.`);
      return false;
    }

    return true;
  };

  const handleCancel = (id: string) => {
    setEditIds((prev) => prev.filter((editId) => editId !== id));
    if (Object.keys(links).includes(id)) {
      setUpdatedLinks({ ...updatedLinks, [id]: links[id] });
    } else {
      const updatedLinkCopy = { ...updatedLinks };
      delete updatedLinkCopy[id];
      setUpdatedLinks(updatedLinkCopy);
    }
  };

  const handleCopyLink = (link: string) => {
    navigator.clipboard.writeText(`${getUrlWithCurrentHostname(`/event/${user.username}/${link}`)}`);
  };

  const handleDelete = async (id: string) => {
    const link = updatedLinks[id];
    try {
      await deleteCustomEventLink(user.userId, link);
    } catch (error) {
      console.error("Error deleting custom event link:", error);
      window.alert("Error deleting custom event link. Please try again.");
      return;
    }
    const updatedLinkCopy = { ...updatedLinks };
    delete updatedLinkCopy[id];
    setUpdatedLinks(updatedLinkCopy);
    const linksCopy = { ...links };
    delete linksCopy[id];
    setLinks(linksCopy);
  };

  // Utility function to update a field in updatedLinks by id
  const handleFieldChange = <T extends keyof CustomEventLink>(
    id: string,
    field: T,
    valueFn: (prev: CustomEventLink) => CustomEventLink[T]
  ) => setUpdatedLinks((prev) => ({ ...prev, [id]: { ...prev[id], [field]: valueFn(prev[id]) } }));

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
        <BlackHighlightButton className="" onClick={handleAddLink}>
          + Add Link
        </BlackHighlightButton>
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
            {Object.values(updatedLinks).map((link) => {
              const isEditing = editIds.includes(link.id);
              return (
                <tr key={link.id} className="align-top">
                  {/* Custom Link Name */}
                  <td className="p-4">
                    {isEditing ? (
                      <Input
                        label="Custom Link Name"
                        crossOrigin={undefined}
                        className="focus:ring-0"
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
                        className="focus:ring-0"
                        value={link.customEventLink}
                        onChange={(e) => {
                          // Convert to lowercase and remove whitespaces
                          const processedValue = e.target.value.toLowerCase().replace(/\s/g, "");
                          handleFieldChange(link.id, "customEventLink", () => processedValue);
                        }}
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
                          setUpdatedLinks((prev) => {
                            return {
                              ...prev,
                              [link.id]: {
                                ...prev[link.id],
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
                                        )!.recurrenceData.pastRecurrences ?? {}
                                      )
                                        .map(([dateStr, id]) => ({ date: new Date(dateStr), id }))
                                        .sort((a, b) => b.date.getTime() - a.date.getTime())[0].id,
                              },
                            };
                          });
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
