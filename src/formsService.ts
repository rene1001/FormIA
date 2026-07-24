import { FormQuestion, GoogleFormFile, GoogleFormDetails, FormResponse } from "./types";

/**
 * Crée un Google Form complet (création puis batchUpdate pour les questions)
 */
export async function createGoogleForm(
  title: string,
  description: string,
  questions: FormQuestion[],
  token: string
): Promise<{ formId: string; responderUri: string; editUri: string }> {
  // 1. Create the base form
  const createRes = await fetch("https://forms.googleapis.com/v1/forms", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      info: {
        title: title,
        documentTitle: title, // File title in Google Drive
      },
    }),
  });

  if (!createRes.ok) {
    const errorData = await createRes.json().catch(() => ({}));
    throw new Error(
      errorData.error?.message || "Impossible de créer le formulaire de base."
    );
  }

  const form = await createRes.json();
  const formId = form.formId;
  const responderUri = form.responderUri;
  const editUri = `https://docs.google.com/forms/d/${formId}/edit`;

  // 2. Add description and questions using batchUpdate
  const requests: any[] = [];

  // 2a. Update description
  requests.push({
    updateFormInfo: {
      info: {
        description: description,
      },
      updateMask: "description",
    },
  });

  // 2b. Add each question in order
  questions.forEach((q, index) => {
    const itemRequest: any = {
      title: q.title,
    };

    if (q.description) {
      itemRequest.description = q.description;
    }

    if (q.type === "TEXT" || q.type === "PARAGRAPH") {
      itemRequest.questionItem = {
        question: {
          required: q.required,
          textQuestion: {
            paragraph: q.type === "PARAGRAPH",
          },
        },
      };
    } else if (q.type === "RADIO" || q.type === "CHECKBOX" || q.type === "DROP_DOWN") {
      itemRequest.questionItem = {
        question: {
          required: q.required,
          choiceQuestion: {
            type: q.type,
            options: (q.options || []).map((opt) => ({ value: opt })),
          },
        },
      };
    }

    requests.push({
      createItem: {
        item: itemRequest,
        location: {
          index: index,
        },
      },
    });
  });

  const updateRes = await fetch(
    `https://forms.googleapis.com/v1/forms/${formId}:batchUpdate`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        requests: requests,
      }),
    }
  );

  if (!updateRes.ok) {
    const errorData = await updateRes.json().catch(() => ({}));
    throw new Error(
      errorData.error?.message ||
        "Impossible d'ajouter les questions au formulaire."
    );
  }

  return { formId, responderUri, editUri };
}

/**
 * Récupère la liste des Google Forms depuis Google Drive
 */
export async function listGoogleForms(token: string): Promise<GoogleFormFile[]> {
  const url =
    "https://www.googleapis.com/drive/v3/files?q=mimeType%3D%27application%2Fvnd.google-apps.form%27+and+trashed%3Dfalse&orderBy=modifiedTime+desc&fields=files(id%2Cname%2CwebViewLink%2CcreatedTime%2CmodifiedTime)&pageSize=40";
  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      if (res.status === 401) {
        throw new Error("UNAUTHORIZED");
      }
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.error?.message || `Impossible de récupérer la liste des formulaires (HTTP ${res.status}).`);
    }
    const data = await res.json();
    return data.files || [];
  } catch (err: any) {
    if (err.message === "UNAUTHORIZED") {
      throw new Error("UNAUTHORIZED");
    }
    if (err instanceof TypeError || err.name === "TypeError" || (err.message && err.message.includes("fetch"))) {
      throw new Error("Connexion à Google Drive interrompue. Veuillez vérifier votre réseau ou vous reconnecter.");
    }
    throw err;
  }
}

/**
 * Récupère les détails d'un formulaire et ses réponses
 */
export async function getFormResponsesAndDetails(
  formId: string,
  token: string
): Promise<{ details: GoogleFormDetails; responses: FormResponse[] }> {
  try {
    // Fetch details
    const detailsRes = await fetch(`https://forms.googleapis.com/v1/forms/${formId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!detailsRes.ok) {
      if (detailsRes.status === 401) {
        throw new Error("UNAUTHORIZED");
      }
      const errJson = await detailsRes.json().catch(() => ({}));
      throw new Error(errJson.error?.message || "Impossible de récupérer les détails du formulaire.");
    }
    const details: GoogleFormDetails = await detailsRes.json();

    // Fetch responses
    const responsesRes = await fetch(
      `https://forms.googleapis.com/v1/forms/${formId}/responses`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (!responsesRes.ok) {
      if (responsesRes.status === 401) {
        throw new Error("UNAUTHORIZED");
      }
      // If error because of permission or empty responses, return empty array
      if (responsesRes.status === 400 || responsesRes.status === 404) {
        return { details, responses: [] };
      }
      throw new Error("Impossible de récupérer les réponses de ce formulaire.");
    }

    const data = await responsesRes.json();
    const responses: FormResponse[] = data.responses || [];

    return { details, responses };
  } catch (err: any) {
    if (err.message === "UNAUTHORIZED") {
      throw new Error("UNAUTHORIZED");
    }
    if (err instanceof TypeError || err.name === "TypeError" || (err.message && err.message.includes("fetch"))) {
      throw new Error("Connexion réseau interrompue lors de la récupération des données de Google Forms.");
    }
    throw err;
  }
}

/**
 * Supprime un formulaire de Google Drive
 */
export async function deleteGoogleForm(formId: string, token: string): Promise<void> {
  try {
    const res = await fetch(`https://www.googleapis.com/drive/v3/files/${formId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      if (res.status === 401) {
        throw new Error("UNAUTHORIZED");
      }
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.error?.message || "Impossible de supprimer le formulaire de Google Drive.");
    }
  } catch (err: any) {
    if (err.message === "UNAUTHORIZED") {
      throw new Error("UNAUTHORIZED");
    }
    throw err;
  }
}
