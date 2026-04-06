import { JobAttachmentKind } from "@prisma/client";
import { z } from "zod";

import { CUSTOMER_DEFAULT } from "@/lib/constants";
import { isAllowedImageContentType, isSafeRedirectPath } from "@/lib/security";

const optionalText = z
  .string()
  .trim()
  .transform((value) => value || undefined)
  .optional();

export const uploadedAttachmentSchema = z.object({
  storageKey: z.string().min(1),
  fileName: z.string().min(1),
  contentType: z
    .string()
    .trim()
    .toLowerCase()
    .refine(isAllowedImageContentType, "Vain tuetut kuvatyypit sallitaan."),
  size: z.number().int().positive().max(20_000_000),
});

export type UploadedAttachment = z.infer<typeof uploadedAttachmentSchema>;

const parseAttachments = (value: FormDataEntryValue | null) => {
  if (!value || typeof value !== "string" || !value.trim()) {
    return [];
  }

  const parsed = JSON.parse(value);
  return z.array(uploadedAttachmentSchema).parse(parsed);
};

const nonEmptyString = (label: string) =>
  z.string().trim().min(1, `${label} on pakollinen.`);

const coerceDate = z.coerce.date({
  message: "Päivämäärä on pakollinen.",
});

const technicianPhoneSchema = z.string().trim().min(3, "Huoltomiehen numeron pitää olla kelvollinen.");

const parseTechnicianPhones = (formData: FormData) =>
  z
    .array(technicianPhoneSchema)
    .parse(
      formData
        .getAll("technicianPhones")
        .filter((value): value is string => typeof value === "string")
        .map((value) => value.trim())
        .filter(Boolean),
    );

export const parseCreateJobForm = (formData: FormData) => {
  const values = {
    title: formData.get("title"),
    description: formData.get("description"),
    address: formData.get("address"),
    area: formData.get("area"),
    scheduledDate: formData.get("scheduledDate"),
    notes: formData.get("notes"),
    customerName: formData.get("customerName"),
  };

  const schema = z.object({
    title: nonEmptyString("Otsikko"),
    description: nonEmptyString("Kuvaus"),
    address: nonEmptyString("Osoite"),
    area: optionalText,
    scheduledDate: coerceDate,
    notes: optionalText,
    customerName: optionalText,
  });

  const parsed = schema.parse(values);

  return {
    ...parsed,
    customerName: parsed.customerName ?? CUSTOMER_DEFAULT,
    technicianPhones: parseTechnicianPhones(formData),
    referenceAttachments: parseAttachments(formData.get("referenceAttachments")),
  };
};

export const parseUpdateJobForm = (formData: FormData) => {
  const parsed = z
    .object({
      jobId: nonEmptyString("Keikka"),
      title: nonEmptyString("Otsikko"),
      description: nonEmptyString("Kuvaus"),
      address: nonEmptyString("Osoite"),
      area: optionalText,
      scheduledDate: coerceDate,
      notes: optionalText,
      customerName: optionalText,
    })
    .parse({
      jobId: formData.get("jobId"),
      title: formData.get("title"),
      description: formData.get("description"),
      address: formData.get("address"),
      area: formData.get("area"),
      scheduledDate: formData.get("scheduledDate"),
      notes: formData.get("notes"),
      customerName: formData.get("customerName"),
    });

  return {
    ...parsed,
    technicianPhones: parseTechnicianPhones(formData),
  };
};

export const parseCreateReminderForm = (formData: FormData) =>
  z
    .object({
      title: nonEmptyString("Otsikko"),
      description: optionalText,
      dueDate: coerceDate,
    })
    .parse({
      title: formData.get("title"),
      description: formData.get("description"),
      dueDate: formData.get("dueDate"),
    });

export const parseReminderActionForm = (formData: FormData) =>
  z
    .object({
      reminderId: nonEmptyString("Muistutus"),
      redirectTo: optionalText.refine(
        (value) => !value || isSafeRedirectPath(value),
        "Virheellinen ohjausosoite.",
      ),
    })
    .parse({
      reminderId: formData.get("reminderId"),
      redirectTo: formData.get("redirectTo"),
    });

export const parseNoteForm = (formData: FormData) =>
  z
    .object({
      jobId: nonEmptyString("Keikka"),
      message: nonEmptyString("Muistiinpano"),
    })
    .parse({
      jobId: formData.get("jobId"),
      message: formData.get("message"),
    });

export const parseCompleteJobForm = (formData: FormData) =>
  z
    .object({
      jobId: nonEmptyString("Keikka"),
      workSummary: nonEmptyString("Mitä tehtiin"),
      additionalNotes: optionalText,
    })
    .parse({
      jobId: formData.get("jobId"),
      workSummary: formData.get("workSummary"),
      additionalNotes: formData.get("additionalNotes"),
    });

export const parseAttachmentForm = (formData: FormData) =>
  z
    .object({
      jobId: nonEmptyString("Keikka"),
      kind: z.nativeEnum(JobAttachmentKind),
      caption: optionalText,
    })
    .parse({
      jobId: formData.get("jobId"),
      kind: formData.get("kind"),
      caption: formData.get("caption"),
    });

export const parseUserToggleForm = (formData: FormData) =>
  z
    .object({
      userId: nonEmptyString("Käyttäjä"),
    })
    .parse({
      userId: formData.get("userId"),
    });
