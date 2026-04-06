import { createJobAction } from "@/app/actions";
import { AddressFields } from "@/components/address-fields";
import { AttachmentUploader } from "@/components/attachment-uploader";
import { PhoneListInput } from "@/components/phone-list-input";
import { SubmitButton } from "@/components/submit-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CUSTOMER_DEFAULT } from "@/lib/constants";

export default function NewJobPage() {
  return (
    <div className="mx-auto max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>Uusi keikka</CardTitle>
          <CardDescription>
            Lisää perustiedot, lähtökuvat ja tarvittavat lisähuomiot yhdellä lomakkeella.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={createJobAction} className="flex flex-col gap-6">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="title">Otsikko</FieldLabel>
                <Input id="title" name="title" placeholder="Esim. Venttiilin vaihto koululla" required />
              </Field>
              <Field>
                <FieldLabel htmlFor="description">Kuvaus</FieldLabel>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Mitä työmaalla pitää tehdä ja mitä pitää huomioida?"
                  required
                />
              </Field>
            </FieldGroup>

            <FieldGroup className="lg:grid lg:grid-cols-2">
              <AddressFields />
              <Field>
                <FieldLabel htmlFor="scheduledDate">Päivämäärä</FieldLabel>
                <Input id="scheduledDate" name="scheduledDate" required type="date" />
              </Field>
            </FieldGroup>

            <PhoneListInput
              description="Voit lisätä yhden tai useamman huoltomiehen numeron samaan keikkaan."
              label="Huoltomiehen numerot"
              name="technicianPhones"
            />

            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="customerName">Asiakas</FieldLabel>
                <Input defaultValue={CUSTOMER_DEFAULT} id="customerName" name="customerName" />
                <FieldDescription>
                  Oletuksena Helsingin kaupunki, mutta kenttä on muokattavissa.
                </FieldDescription>
              </Field>
              <Field>
                <FieldLabel htmlFor="notes">Lisätiedot</FieldLabel>
                <Textarea
                  id="notes"
                  name="notes"
                  placeholder="Kulkuohjeet, avainasiat, yhteyshenkilö tai muu huomio"
                />
              </Field>
            </FieldGroup>

            <AttachmentUploader
              description="Lataa lähtötilanteen kuvat tähän. Ne näkyvät keikan detail-sivulla heti luomisen jälkeen."
              label="Lähtökuvat"
              name="referenceAttachments"
            />

            <div className="flex justify-end">
              <SubmitButton pendingLabel="Luodaan keikka...">Tallenna keikka</SubmitButton>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
