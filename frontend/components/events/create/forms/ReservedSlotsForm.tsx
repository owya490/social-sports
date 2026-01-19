import { ReservedSlot } from "@/interfaces/RecurringEventTypes";
import { TrashIcon, PlusIcon, UserGroupIcon } from "@heroicons/react/24/outline";
import { Input } from "@material-tailwind/react";
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
  const [newName, setNewName] = useState("");
  const [newSlots, setNewSlots] = useState<number>(1);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);

  const totalReservedSlots = reservedSlots.reduce((sum, slot) => sum + slot.slots, 0);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleAddSlot = () => {
    setEmailError(null);
    setNameError(null);

    if (!newEmail.trim()) {
      setEmailError("Email is required");
      return;
    }

    if (!validateEmail(newEmail.trim())) {
      setEmailError("Please enter a valid email address");
      return;
    }

    if (!newName.trim()) {
      setNameError("Name is required");
      return;
    }

    // Check for duplicate email and name combination
    if (
      reservedSlots.some(
        (slot) =>
          slot.email.toLowerCase() === newEmail.trim().toLowerCase() &&
          slot.name.toLowerCase() === newName.trim().toLowerCase()
      )
    ) {
      setEmailError("This email and name combination already has reserved slots");
      return;
    }

    // Check capacity
    if (maxCapacity && totalReservedSlots + newSlots > maxCapacity) {
      setEmailError(`Cannot exceed event capacity (${maxCapacity} spots)`);
      return;
    }

    const newSlot: ReservedSlot = {
      email: newEmail.trim().toLowerCase(),
      name: newName.trim(),
      slots: newSlots,
    };

    setReservedSlots([...reservedSlots, newSlot]);
    setNewEmail("");
    setNewName("");
    setNewSlots(1);
  };

  const handleRemoveSlot = (emailToRemove: string, nameToRemove: string) => {
    setReservedSlots(
      reservedSlots.filter((slot) => !(slot.email === emailToRemove && slot.name === nameToRemove))
    );
  };

  const handleUpdateSlots = (email: string, name: string, slots: number) => {
    if (slots < 1) return;

    // Check capacity
    const otherSlots = reservedSlots
      .filter((slot) => !(slot.email === email && slot.name === name))
      .reduce((sum, slot) => sum + slot.slots, 0);

    if (maxCapacity && otherSlots + slots > maxCapacity) {
      return;
    }

    setReservedSlots(
      reservedSlots.map((slot) =>
        slot.email === email && slot.name === name ? { ...slot, slots } : slot
      )
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
      <label className="text-black text-lg font-semibold">Reserved Slots</label>
      <p className="text-sm mb-5 mt-2">
        Reserve spots for specific attendees. These users will have guaranteed spots in each recurring event and appear
        in Manage Attendees.
      </p>

      {/* Add new reserved slot */}
      <div className="grid grid-cols-1 md:grid-cols-[2fr_2fr_1fr_auto] gap-2 mb-4 items-end">
        <div>
          <Input
            label="Email Address"
            crossOrigin={undefined}
            value={newEmail}
            onChange={(e) => {
              setNewEmail(e.target.value);
              setEmailError(null);
            }}
            onKeyDown={handleKeyPress}
            error={!!emailError}
            className="rounded-md focus:ring-0"
            size="lg"
          />
        </div>
        <div>
          <Input
            label="Attendee Name"
            crossOrigin={undefined}
            value={newName}
            onChange={(e) => {
              setNewName(e.target.value);
              setNameError(null);
            }}
            onKeyDown={handleKeyPress}
            error={!!nameError}
            className="rounded-md focus:ring-0"
            size="lg"
          />
        </div>
        <div>
          <Input
            label="Slots"
            crossOrigin={undefined}
            type="number"
            value={newSlots}
            onChange={(e) => {
              const value = parseInt(e.target.value);
              if (!isNaN(value) && value >= 1) {
                const max = maxCapacity ? maxCapacity - totalReservedSlots : 99;
                setNewSlots(Math.min(value, max));
              }
            }}
            onKeyDown={handleKeyPress}
            min={1}
            max={maxCapacity ? maxCapacity - totalReservedSlots : 99}
            className="rounded-md focus:ring-0"
            size="lg"
          />
        </div>
        <button
          type="button"
          onClick={handleAddSlot}
          className="flex items-center justify-center bg-black text-white rounded-lg hover:bg-gray-800 transition-colors h-[42px] w-[42px]"
        >
          <PlusIcon className="w-5 h-5" />
        </button>
      </div>

      {/* Error messages */}
      {emailError && <div className="text-red-600 text-sm mb-3">{emailError}</div>}
      {nameError && <div className="text-red-600 text-sm mb-3">{nameError}</div>}

      {/* Reserved slots list */}
      {reservedSlots.length > 0 && (
        <div className="border border-blue-gray-200 rounded-lg overflow-hidden">
          {/* Desktop header - hidden on mobile */}
          <div className="hidden md:block bg-gray-50 px-4 py-2 border-b border-blue-gray-200">
            <div className="grid grid-cols-[2fr_2fr_1fr_auto] gap-2 text-sm font-medium text-gray-600">
              <span>Email</span>
              <span>Name</span>
              <span>Slots ({totalReservedSlots} total)</span>
              <span className="w-[42px]"></span>
            </div>
          </div>
          {/* Mobile header */}
          <div className="md:hidden bg-gray-50 px-4 py-2 border-b border-blue-gray-200">
            <span className="text-sm font-medium text-gray-600">
              Reserved Attendees ({totalReservedSlots} total slots)
            </span>
          </div>
          <div className="divide-y divide-blue-gray-200">
            {reservedSlots.map((slot) => (
              <div key={`${slot.email}-${slot.name}`}>
                {/* Desktop row */}
                <div className="hidden md:grid grid-cols-[2fr_2fr_1fr_auto] gap-2 items-center px-4 py-3 hover:bg-gray-50">
                  <span className="text-sm text-gray-800 truncate">{slot.email}</span>
                  <span className="text-sm text-gray-800 truncate">{slot.name}</span>
                  <div>
                    <Input
                      crossOrigin={undefined}
                      type="number"
                      value={slot.slots}
                      onChange={(e) => {
                        const value = parseInt(e.target.value);
                        if (!isNaN(value)) {
                          handleUpdateSlots(slot.email, slot.name, value);
                        }
                      }}
                      min={1}
                      max={maxCapacity ? maxCapacity - totalReservedSlots + slot.slots : 99}
                      size="md"
                      className="rounded-md focus:ring-0"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveSlot(slot.email, slot.name)}
                    className="w-[42px] h-[42px] flex items-center justify-center text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </div>
                {/* Mobile card */}
                <div className="md:hidden px-4 py-3 hover:bg-gray-50">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1 min-w-0 pr-2">
                      <p className="text-sm font-medium text-gray-800 truncate">{slot.name}</p>
                      <p className="text-xs text-gray-500 truncate">{slot.email}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveSlot(slot.email, slot.name)}
                      className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors flex-shrink-0"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">Slots:</span>
                    <div className="w-20">
                      <Input
                        crossOrigin={undefined}
                        type="number"
                        value={slot.slots}
                        onChange={(e) => {
                          const value = parseInt(e.target.value);
                          if (!isNaN(value)) {
                            handleUpdateSlots(slot.email, slot.name, value);
                          }
                        }}
                        min={1}
                        max={maxCapacity ? maxCapacity - totalReservedSlots + slot.slots : 99}
                        size="md"
                        className="rounded-md focus:ring-0"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {reservedSlots.length === 0 && (
        <div className="text-center py-6 border border-dashed border-blue-gray-300 rounded-lg">
          <UserGroupIcon className="w-8 h-8 mx-auto text-gray-400 mb-2" />
          <p className="text-gray-500 text-sm">No reserved slots yet</p>
          <p className="text-gray-400 text-xs">Add attendees above to reserve spots</p>
        </div>
      )}
    </div>
  );
};
