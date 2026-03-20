interface DeleteEventAttendeeCardProps {
  attendeeName: string;
  attendeeEmail: string;
  ticketCount: number;
}

const DeleteEventAttendeeCard = ({ attendeeName, attendeeEmail, ticketCount }: DeleteEventAttendeeCardProps) => {
  return (
    <div className="grid grid-flow-col justify-stretch py-2 grid-cols-7 items-center text-xs md:text-base">
      <div className="col-span-1 w-14 text-center">{ticketCount}</div>

      <div className="w-10">{attendeeName}</div>

      <div className="col-span-2">{attendeeEmail}</div>
    </div>
  );
};

export default DeleteEventAttendeeCard;
