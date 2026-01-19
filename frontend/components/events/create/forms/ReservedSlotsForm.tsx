"use client";

import { ReservedSlot } from "@/interfaces/RecurringEventTypes";
import { validateEmail, EMAIL_VALIDATION_ERROR_MESSAGE } from "@/utilities/emailValidationUtils";
import { TrashIcon, PlusIcon, UserGroupIcon } from "@heroicons/react/24/outline";
import { Input } from "@material-tailwind/react";
import { useForm } from "react-hook-form";

interface ReservedSlotsFormProps {
  reservedSlots: ReservedSlot[];
  setReservedSlots: (slots: ReservedSlot[]) => void;
  maxCapacity?: number;
}

interface AddSlotFormData {
  email: string;
  name: string;
  slots: number;
}

export const ReservedSlotsForm = ({
  reservedSlots,
  setReservedSlots,
  maxCapacity,
}: ReservedSlotsFormProps) => {
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
    setError,
  } = useForm<AddSlotFormData>({
    defaultValues: {
      email: "",
      name: "",
      slots: 1,
    },
  });

  const totalReservedSlots = reservedSlots.reduce((sum, slot) => sum + slot.slots, 0);
  const watchedSlots = watch("slots");

  const onAddSlot = (data: AddSlotFormData) => {
    const trimmedEmail = data.email.trim().toLowerCase();
    const trimmedName = data.name.trim();

    // Check for duplicate email and name combination
    if (
      reservedSlots.some(
        (slot) =>
          slot.email.toLowerCase() === trimmedEmail &&
          slot.name.toLowerCase() === trimmedName.toLowerCase()
      )
    ) {
      setError("email", { message: "This email and name combination already has reserved slots" });
      return;
    }

    // Check capacity
    if (maxCapacity && totalReservedSlots + data.slots > maxCapacity) {
      setError("email", { message: `Cannot exceed event capacity (${maxCapacity} spots)` });
      return;
    }

    const newSlot: ReservedSlot = {
      email: trimmedEmail,
      name: trimmedName,
      slots: data.slots,
    };

    setReservedSlots([...reservedSlots, newSlot]);
    reset();
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
      handleSubmit(onAddSlot)();
    }
  };

  const handleSlotsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value >= 1) {
      const max = maxCapacity ? maxCapacity - totalReservedSlots : 99;
      setValue("slots", Math.min(value, max));
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
      <form onSubmit={handleSubmit(onAddSlot)}>
        <div className="grid grid-cols-1 md:grid-cols-[2fr_2fr_1fr_auto] gap-2 mb-4 items-end">
          <div>
            <Input
              label="Email Address"
              crossOrigin={undefined}
              {...register("email", {
                required: "Email is required",
                validate: (value) => validateEmail(value) || EMAIL_VALIDATION_ERROR_MESSAGE,
              })}
              onKeyDown={handleKeyPress}
              error={!!errors.email}
              className="rounded-md focus:ring-0"
              size="lg"
            />
          </div>
          <div>
            <Input
              label="Attendee Name"
              crossOrigin={undefined}
              {...register("name", {
                required: "Name is required",
                validate: (value) => value.trim().length > 0 || "Name is required",
              })}
              onKeyDown={handleKeyPress}
              error={!!errors.name}
              className="rounded-md focus:ring-0"
              size="lg"
            />
          </div>
          <div>
            <Input
              label="Slots"
              crossOrigin={undefined}
              type="number"
              value={watchedSlots}
              onChange={handleSlotsChange}
              onKeyDown={handleKeyPress}
              min={1}
              max={maxCapacity ? maxCapacity - totalReservedSlots : 99}
              className="rounded-md focus:ring-0"
              size="lg"
            />
          </div>
          <button
            type="submit"
            className="flex items-center justify-center bg-black text-white rounded-lg hover:bg-gray-800 transition-colors h-[42px] w-[42px]"
          >
            <PlusIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Error messages */}
        {errors.email && <div className="text-red-600 text-sm mb-3">{errors.email.message}</div>}
        {errors.name && <div className="text-red-600 text-sm mb-3">{errors.name.message}</div>}
      </form>

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
