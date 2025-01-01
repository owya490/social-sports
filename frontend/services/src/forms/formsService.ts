import { UserId } from "@/interfaces/UserTypes";
import { authenticate } from "@google-cloud/local-auth";
import google from "@googleapis/forms";

export async function createOrganiserForm(organiserId: UserId): Promise<string> {
  const authClient = await authenticate({
    keyfilePath: "./functions_key_dev.json",
    scopes: "https://www.googleapis.com/auth/drive",
  });
  const forms = google.forms({
    version: "v1",
    auth: authClient,
  });
  const newForm = {
    info: {
      title: "Creating a new form in Node",
    },
  };
  const res = await forms.forms.create({
    requestBody: newForm,
  });
  console.log(res.data);
  if (res.data.formId === null || res.data.formId === undefined) {
    throw Error();
  }
  return res.data.formId;
}

export async function getAllOrganiserForms(organiserId: UserId) {}
