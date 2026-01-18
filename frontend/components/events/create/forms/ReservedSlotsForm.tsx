import { ReservedSlot } from "@/interfaces/RecurringEventTypes";
import { ActionIcon, NumberInput, TextInput } from "@mantine/core";
import { IconPlus, IconTrash, IconUsers } from "@tabler/icons-react";
import { useState } from "react";

interface ReservedSlotsFormProps {
  reservedSlots: ReservedSlot[];
  setReservedSlots: (slots: ReservedSlot[]) => void;
  maxCapacity?: number;
}

export const ReservedSlotsForm = ({
  reservedSlots,
  setReservedSlots,
  maxCapacity,
}: ReservedSlotsFormProps) => {
  const [newEmail, setNewEmail] = useState("");
  const [newSlots, setNewSlots] = useState<number>(1);
  const [emailError, setEmailError] = useState<string | null>(null);

  const totalReservedSlots = reservedSlots.reduce((sum, slot) => sum + slot.slots, 0);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleAddSlot = () => {
    setEmailError(null);

    if (!newEmail.trim()) {
      setEmailError("Email is required");
      return;
    }

    if (!validateEmail(newEmail.trim())) {
      setEmailError("Please enter a valid email address");
      return;
    }

    // Check for duplicate email
    if (reservedSlots.some((slot) => slot.email.toLowerCase() === newEmail.trim().toLowerCase())) {
      setEmailError("This email already has reserved slots");
      return;
    }

    // Check capacity
    if (maxCapacity && totalReservedSlots + newSlots > maxCapacity) {
      setEmailError(`Cannot exceed event capacity (${maxCapacity} spots)`);
      return;
    }

    const newSlot: ReservedSlot = {
      email: newEmail.trim().toLowerCase(),
      slots: newSlots,
    };

    setReservedSlots([...reservedSlots, newSlot]);
    setNewEmail("");
    setNewSlots(1);
  };

  const handleRemoveSlot = (emailToRemove: string) => {
    setReservedSlots(reservedSlots.filter((slot) => slot.email !== emailToRemove));
  };

  const handleUpdateSlots = (email: string, slots: number) => {
    if (slots < 1) return;

    // Check capacity
    const otherSlots = reservedSlots
      .filter((slot) => slot.email !== email)
      .reduce((sum, slot) => sum + slot.slots, 0);

    if (maxCapacity && otherSlots + slots > maxCapacity) {
      return;
    }

    setReservedSlots(
      reservedSlots.map((slot) => (slot.email === email ? { ...slot, slots } : slot))
    );
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddSlot();
    }
  };

  return (
    <div className="mt-6">
      <div className="flex items-center gap-2 mb-3">
        <IconUsers size={20} className="text-gray-600" />
        <label className="text-black text-lg font-semibold">Reserved Slots</label>
      </div>
      <p className="text-gray-600 text-sm mb-4">
        Reserve spots for specific email addresses. These users will have guaranteed spots in each
        recurring event.
      </p>

      {/* Add new reserved slot */}
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <TextInput
          placeholder="Enter email address"
          value={newEmail}
          onChange={(e) => {
            setNewEmail(e.target.value);
            setEmailError(null);
          }}
          onKeyDown={handleKeyPress}
          error={emailError}
          className="flex-grow"
          styles={{
            input: {
              borderColor: "#e5e7eb",
            },
          }}
        />
        <NumberInput
          value={newSlots}
          onChange={(value) => setNewSlots(typeof value === "number" ? value : 1)}
          min={1}
          max={maxCapacity ? maxCapacity - totalReservedSlots : 99}
          className="w-24"
          styles={{
            input: {
              borderColor: "#e5e7eb",
            },
          }}
        />
        <ActionIcon
          variant="filled"
          color="teal"
          size="lg"
          onClick={handleAddSlot}
          className="self-start sm:self-center"
        >
          <IconPlus size={18} />
        </ActionIcon>
      </div>

      {/* Reserved slots list */}
      {reservedSlots.length > 0 && (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
            <div className="flex justify-between text-sm font-medium text-gray-600">
              <span>Email</span>
              <span>Slots ({totalReservedSlots} total)</span>
            </div>
          </div>
          <div className="divide-y divide-gray-200">
            {reservedSlots.map((slot) => (
              <div
                key={slot.email}
                className="flex items-center justify-between px-4 py-3 hover:bg-gray-50"
              >
                <span className="text-sm text-gray-800 truncate flex-grow mr-4">{slot.email}</span>
                <div className="flex items-center gap-2">
                  <NumberInput
                    value={slot.slots}
                    onChange={(value) =>
                      handleUpdateSlots(slot.email, typeof value === "number" ? value : 1)
                    }
                    min={1}
                    max={maxCapacity ? maxCapacity - totalReservedSlots + slot.slots : 99}
                    size="xs"
                    className="w-16"
                    styles={{
                      input: {
                        borderColor: "#e5e7eb",
                      },
                    }}
                  />
                  <ActionIcon
                    variant="subtle"
                    color="red"
                    size="sm"
                    onClick={() => handleRemoveSlot(slot.email)}
                  >
                    <IconTrash size={16} />
                  </ActionIcon>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {reservedSlots.length === 0 && (
        <div className="text-center py-6 border border-dashed border-gray-300 rounded-lg">
          <IconUsers size={32} className="mx-auto text-gray-400 mb-2" />
          <p className="text-gray-500 text-sm">No reserved slots yet</p>
          <p className="text-gray-400 text-xs">Add email addresses above to reserve spots</p>
        </div>
      )}
    </div>
  );
};

