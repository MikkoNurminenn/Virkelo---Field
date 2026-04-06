import Image from "next/image";
import { JobAttachmentKind } from "@prisma/client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { attachmentKindLabels } from "@/lib/constants";

type AttachmentGalleryProps = {
  attachments: Array<{
    id: string;
    kind: JobAttachmentKind;
    caption: string | null;
  }>;
};

export const AttachmentGallery = ({ attachments }: AttachmentGalleryProps) => {
  const groups = attachments.reduce<Record<JobAttachmentKind, typeof attachments>>(
    (accumulator, attachment) => {
      accumulator[attachment.kind] = [...(accumulator[attachment.kind] ?? []), attachment];
      return accumulator;
    },
    {
      REFERENCE: [],
      WORK: [],
      BEFORE: [],
      AFTER: [],
    },
  );

  return (
    <div className="grid gap-4">
      {Object.entries(groups)
        .filter(([, group]) => group.length > 0)
        .map(([kind, group]) => (
          <Card key={kind}>
            <CardHeader>
              <CardTitle className="text-base">
                {attachmentKindLabels[kind as JobAttachmentKind]}
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {group.map((attachment) => (
                <figure className="overflow-hidden rounded-xl border bg-background" key={attachment.id}>
                  <Image
                    alt={attachment.caption ?? attachmentKindLabels[attachment.kind]}
                    className="aspect-[4/3] w-full object-cover"
                    height={900}
                    src={`/api/attachments/${attachment.id}`}
                    width={1200}
                  />
                  <figcaption className="px-3 py-2 text-sm text-muted-foreground">
                    {attachment.caption ?? attachmentKindLabels[attachment.kind]}
                  </figcaption>
                </figure>
              ))}
            </CardContent>
          </Card>
        ))}
    </div>
  );
};
