export default function WaitlistPage({
  params,
}: {
  params: { eventId: string }
}) {
  return (
    <main>
      <h1>Join the waitlist</h1>
      <p>Event ID: {params.eventId}</p>
    </main>
  )
}
