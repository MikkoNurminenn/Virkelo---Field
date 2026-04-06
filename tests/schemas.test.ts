import { describe, expect, it } from "vitest";

import {
  parseCreateJobForm,
  parseCreateReminderForm,
  parseReminderActionForm,
} from "@/lib/schemas";

const createFormData = () => {
  const formData = new FormData();
  formData.set("title", "Patteriventtiilin vaihto");
  formData.set("description", "Vaihdetaan vuotava patteriventtiili");
  formData.set("address", "Esimerkkikatu 1");
  formData.set("area", "Kallio");
  formData.set("scheduledDate", "2026-04-07");
  formData.append("technicianPhones", "040 123 4567");
  formData.append("technicianPhones", "050 765 4321");
  formData.set("notes", "Oven avaus vahtimestarilta");
  formData.set("customerName", "Helsingin kaupunki");
  formData.set(
    "referenceAttachments",
    JSON.stringify([
      {
        storageKey: "jobs/2026-04-04/user_1/file.jpg",
        fileName: "file.jpg",
        contentType: "image/jpeg",
        size: 1024,
      },
    ]),
  );
  return formData;
};

describe("job schema parsing", () => {
  it("parses create form data and attachments", () => {
    const result = parseCreateJobForm(createFormData());

    expect(result.title).toBe("Patteriventtiilin vaihto");
    expect(result.referenceAttachments).toHaveLength(1);
    expect(result.customerName).toBe("Helsingin kaupunki");
    expect(result.technicianPhones).toEqual(["040 123 4567", "050 765 4321"]);
  });

  it("requires mandatory fields", () => {
    const formData = createFormData();
    formData.set("title", "");

    expect(() => parseCreateJobForm(formData)).toThrow();
  });
});

describe("reminder schema parsing", () => {
  it("parses reminder creation form data", () => {
    const formData = new FormData();
    formData.set("title", "Lähetä viikkoraportti");
    formData.set("description", "Muista kuitata viikon työt ja lähettää yhteenveto.");
    formData.set("dueDate", "2026-04-08");

    const result = parseCreateReminderForm(formData);

    expect(result.title).toBe("Lähetä viikkoraportti");
    expect(result.description).toBe("Muista kuitata viikon työt ja lähettää yhteenveto.");
    expect(result.dueDate).toBeInstanceOf(Date);
  });

  it("parses reminder action form data", () => {
    const formData = new FormData();
    formData.set("reminderId", "reminder_1");
    formData.set("redirectTo", "/admin");

    expect(parseReminderActionForm(formData)).toEqual({
      reminderId: "reminder_1",
      redirectTo: "/admin",
    });
  });

  it("rejects external reminder redirects", () => {
    const formData = new FormData();
    formData.set("reminderId", "reminder_1");
    formData.set("redirectTo", "https://evil.example");

    expect(() => parseReminderActionForm(formData)).toThrow();
  });
});
