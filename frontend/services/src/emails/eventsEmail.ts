import { CreateEventFormData } from "@/interfaces/FormTypes";
import { UserData } from "@/interfaces/UserTypes";

export async function CreateEmailNotification(formData: CreateEventFormData, user: UserData) {
  const EmailData = {
    ...formData,
    to_email: user.contactInformation.email,
    first_name: user.firstName,
    last_name: user.surname,
    event_name: formData.name,
    event_location: formData.location,
    event_startTime: formData.startTime,
    event_finishTime: formData.endTime,
    event_sport: formData.sport,
    event_price: formData.price,
    event_capacity: formData.capacity,
    event_isPrivate: formData.isPrivate,
    event_tags: formData.tags,
  };

  try {
    const response = await fetch("https://send-email-7aikp3s36a-uc.a.run.app", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(EmailData),
    });

    if (response.ok) {
      console.log("Email sent successfully");
    } else {
      console.error("Failed to send email. Status:", response.status);
    }
  } catch (error) {
    console.error("An error occurred while sending the email:", error);
  }
}
