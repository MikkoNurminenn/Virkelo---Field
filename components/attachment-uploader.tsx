"use client";

import { useId, useMemo, useState } from "react";
import { Loader2Icon, UploadIcon, XIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ALLOWED_IMAGE_CONTENT_TYPES, isAllowedImageContentType } from "@/lib/security";

type UploadedAttachment = {
  storageKey: string;
  fileName: string;
  contentType: string;
  size: number;
};

type AttachmentUploaderProps = {
  name: string;
  label: string;
  description: string;
};

const MAX_FILE_SIZE = 15 * 1024 * 1024;

export const AttachmentUploader = ({
  name,
  label,
  description,
}: AttachmentUploaderProps) => {
  const [items, setItems] = useState<UploadedAttachment[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const inputId = useId();

  const serialized = useMemo(() => JSON.stringify(items), [items]);

  return (
    <FieldGroup>
      <Field>
        <FieldLabel htmlFor={inputId}>{label}</FieldLabel>
        <Input
          accept={ALLOWED_IMAGE_CONTENT_TYPES.join(",")}
          className="h-auto min-h-28 border-dashed border-primary/25 bg-background/75 px-4 py-4 file:mr-3 file:bg-primary file:text-primary-foreground md:min-h-24"
          capture="environment"
          id={inputId}
          multiple
          onChange={async (event) => {
            const files = Array.from(event.target.files ?? []);

            if (files.length === 0) {
              return;
            }

            setIsUploading(true);

            try {
              for (const file of files) {
                if (!isAllowedImageContentType(file.type)) {
                  throw new Error("Sallitut tiedostotyypit ovat JPG, PNG, WebP, AVIF ja HEIC.");
                }

                if (file.size > MAX_FILE_SIZE) {
                  throw new Error("Yksittäinen kuva saa olla enintään 15 Mt.");
                }

                const signResponse = await fetch("/api/uploads/sign", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    fileName: file.name,
                    contentType: file.type,
                  }),
                });

                if (!signResponse.ok) {
                  throw new Error("Upload-osoitteen luonti epäonnistui.");
                }

                const { uploadUrl, storageKey } = (await signResponse.json()) as {
                  uploadUrl: string;
                  storageKey: string;
                };

                const uploadResponse = await fetch(uploadUrl, {
                  method: "PUT",
                  headers: {
                    "Content-Type": file.type,
                  },
                  body: file,
                });

                if (!uploadResponse.ok) {
                  throw new Error("Kuvan lähetys epäonnistui.");
                }

                setItems((current) => [
                  ...current,
                  {
                    storageKey,
                    fileName: file.name,
                    contentType: file.type,
                    size: file.size,
                  },
                ]);
              }

              toast.success("Kuvat ladattiin onnistuneesti.");
              event.target.value = "";
            } catch (error) {
              const message =
                error instanceof Error ? error.message : "Kuvan lähetys epäonnistui.";
              toast.error(message);
            } finally {
              setIsUploading(false);
            }
          }}
          type="file"
        />
        <FieldDescription>{description}</FieldDescription>
      </Field>

      <input name={name} type="hidden" value={serialized} />

      {items.length > 0 ? (
        <div className="flex flex-col gap-2 rounded-xl border border-dashed border-border/80 p-3">
          {items.map((item) => (
            <div
              className="flex items-center justify-between gap-3 rounded-xl bg-muted/50 px-3 py-2.5 text-sm"
              key={item.storageKey}
            >
              <span className="truncate">{item.fileName}</span>
              <Button
                onClick={() =>
                  setItems((current) =>
                    current.filter((entry) => entry.storageKey !== item.storageKey),
                  )
                }
                size="icon-sm"
                type="button"
                variant="ghost"
              >
                <XIcon />
              </Button>
            </div>
          ))}
        </div>
      ) : null}

      {isUploading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2Icon className="size-4 animate-spin" />
          Kuvia ladataan buckettiin...
        </div>
      ) : (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <UploadIcon className="size-4" />
          Ota kuva suoraan puhelimen kameralla tai valitse kuvat galleriasta.
        </div>
      )}
    </FieldGroup>
  );
};
