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

export async function resetPassword(email: string) {
  try {
    const response = await fetch("YOUR_CLOUD_FUNCTION_URL/reset_password", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
    });

    if (response.ok) {
      const data = await response.json();
      console.log(data); // Handle success response
    } else if (response.status === 404) {
      console.error("User not found");
    } else {
      const errorData = await response.json();
      console.error("Error resetting password:", errorData.error);
    }
  } catch (error) {
    console.error("An error occurred while resetting the password:", error);
  }
}

export async function sendPasswordResetEmail(email: string, resetLink: string) {
  const emailData = {
    email,
    reset_link: resetLink,
  };

  try {
    const response = await fetch("YOUR_CLOUD_FUNCTION_URL/send_password_reset_email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(emailData),
    });

    if (response.ok) {
      console.log("Password reset email sent successfully");
    } else {
      const errorData = await response.json();
      console.error("Error sending password reset email:", errorData.error);
    }
  } catch (error) {
    console.error("An error occurred while sending the password reset email:", error);
  }
}
