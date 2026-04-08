import { format } from "date-fns";

import { createJobAction } from "@/app/actions";
import { AddressFields } from "@/components/address-fields";
import { AttachmentUploader } from "@/components/attachment-uploader";
import { BrandMark } from "@/components/brand-mark";
import { PhoneListInput } from "@/components/phone-list-input";
import { SubmitButton } from "@/components/submit-button";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CUSTOMER_DEFAULT } from "@/lib/constants";

export default function NewJobPage() {
  const defaultScheduledDate = format(new Date(), "yyyy-MM-dd");

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(290px,0.85fr)]">
      <section className="section-panel overflow-hidden">
        <div className="border-b border-border/60 px-5 py-6 md:px-7 md:py-7">
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_260px] lg:items-end">
            <div className="flex items-start gap-4">
              <BrandMark className="mt-1 h-14 w-14 shrink-0" priority size={56} />
              <div className="space-y-3">
                <p className="page-eyebrow">Uusi keikka</p>
                <h1 className="max-w-3xl text-[2rem] font-semibold leading-[0.98] tracking-[-0.04em] text-foreground sm:text-[2.5rem]">
                  Tee uusi keikka nopeasti ilman turhaa näpyttelyä
                </h1>
                <p className="max-w-2xl text-sm leading-7 text-muted-foreground">
                  Pakolliseksi jätettiin vain oleelliset asiat. Muut tiedot, työnumero,
                  lähtökuvat ja huoltomiehen numerot voi lisätä tarvittaessa.
                </p>
              </div>
            </div>

            <div className="rounded-[1.6rem] border border-white/70 bg-white/78 p-4 shadow-[0_12px_30px_rgba(15,23,42,0.05)]">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-primary">
                Pikalisäys
              </p>
              <div className="mt-4 grid gap-3 text-sm text-muted-foreground">
                <p>Pakolliset kentät: otsikko, osoite ja päivä.</p>
                <p>Kuvaus voidaan jättää tyhjäksi ja täydentää myöhemmin.</p>
                <p>Tunnit ja tavarat kirjataan keikan omalla sivulla päiväkohtaisesti.</p>
              </div>
            </div>
          </div>
        </div>

        <form action={createJobAction} className="grid gap-5 px-5 py-5 md:px-7 md:py-7">
          <section className="grid gap-5 rounded-[1.5rem] border border-white/70 bg-white/72 p-5 shadow-[0_10px_26px_rgba(15,23,42,0.04)]">
            <div>
              <p className="page-eyebrow">Pakolliset tiedot</p>
              <h2 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-foreground">
                Täytä vain tämä, niin keikka saadaan sisään
              </h2>
            </div>

            <FieldGroup className="lg:grid lg:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="title">Otsikko</FieldLabel>
                <Input
                  autoFocus
                  id="title"
                  name="title"
                  placeholder="Esim. Venttiilin vaihto koululla"
                  required
                />
              </Field>
              <AddressFields showArea={false} />
              <Field className="lg:col-span-2">
                <FieldLabel htmlFor="scheduledDate">Päivämäärä</FieldLabel>
                <Input defaultValue={defaultScheduledDate} id="scheduledDate" name="scheduledDate" required type="date" />
                <FieldDescription>
                  Oletuksena tämän päivän päivämäärä.
                </FieldDescription>
              </Field>
            </FieldGroup>
          </section>

          <details className="group rounded-[1.5rem] border border-white/70 bg-white/72 p-5 shadow-[0_10px_26px_rgba(15,23,42,0.04)]">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
              <div>
                <p className="page-eyebrow">Lisää tarvittaessa</p>
                <h2 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-foreground">
                  Avaa valinnaiset kentät
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                  Työnumero, kuvaus, asiakas, huoltomiehen numerot, lisätiedot ja lähtökuvat.
                </p>
              </div>
              <span className="rounded-full border border-border/70 px-3 py-1 text-xs font-medium text-muted-foreground transition group-open:border-primary/30 group-open:text-primary">
                Näytä / piilota
              </span>
            </summary>

            <div className="mt-5 grid gap-5 border-t border-border/60 pt-5">
              <FieldGroup className="lg:grid lg:grid-cols-[minmax(0,1fr)_220px]">
                <Field className="lg:col-span-2">
                  <FieldLabel htmlFor="description">Kuvaus</FieldLabel>
                  <Textarea
                    id="description"
                    name="description"
                    placeholder="Voit jättää tyhjäksi. Jos tiedät jo työn sisällön, kirjoita se tähän."
                  />
                  <FieldDescription>
                    Jos jätät tämän tyhjäksi, keikalle tallennetaan automaattinen täydennettävä oletusteksti.
                  </FieldDescription>
                </Field>
                <Field>
                  <FieldLabel htmlFor="jobNumber">Työnumero</FieldLabel>
                  <Input id="jobNumber" name="jobNumber" placeholder="Esim. 42173" />
                </Field>
                <Field>
                  <FieldLabel htmlFor="customerName">Asiakas</FieldLabel>
                  <Input defaultValue={CUSTOMER_DEFAULT} id="customerName" name="customerName" />
                </Field>
                <Field>
                  <FieldLabel htmlFor="area">Alue</FieldLabel>
                  <Input id="area" name="area" placeholder="Esim. Kallio" />
                </Field>
              </FieldGroup>

              <PhoneListInput
                description="Lisää vain jos numerot halutaan mukaan heti luontivaiheessa."
                label="Huoltomiehen numerot"
                name="technicianPhones"
              />

              <Field>
                <FieldLabel htmlFor="notes">Lisätiedot</FieldLabel>
                <Textarea
                  id="notes"
                  name="notes"
                  placeholder="Kulkuohjeet, avaimet, yhteyshenkilö tai muu huomio"
                />
              </Field>

              <AttachmentUploader
                description="Lähtökuvat voi lisätä myös myöhemmin, mutta halutessa ne saa mukaan jo nyt."
                label="Lähtökuvat"
                name="referenceAttachments"
              />
            </div>
          </details>

          <div className="flex flex-col gap-3 rounded-[1.4rem] border border-primary/20 bg-primary/10 p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="max-w-xl text-sm leading-6 text-muted-foreground">
              Keikan jälkeen tai työn aikana voit lisätä samalle kohteelle päiväkohtaiset tunnit,
              tavaralistat ja kuittikuvat ilman että tätä lomaketta tarvitsee täyttää pitkästi heti.
            </p>
            <SubmitButton pendingLabel="Luodaan keikka..." size="lg">
              Tallenna keikka
            </SubmitButton>
          </div>
        </form>
      </section>

      <aside className="grid gap-6 xl:sticky xl:top-6 xl:self-start">
        <section className="app-dark-surface rounded-[1.8rem] border border-white/10 p-5 text-white">
          <p className="page-eyebrow">Kenttäkäyttö</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-white">
            Keikka jatkuu myös detail-sivulla
          </h2>
          <div className="mt-5 grid gap-4 text-sm leading-6 text-white/72">
            <p>Työpäivälle voi kirjata tunnit vaikka keikka jatkuisi seuraavana päivänä.</p>
            <p>Materiaalit voi listata omaksi merkinnäkseen ilman pakollisia lisäkenttiä.</p>
            <p>Ahlsellin tai Dahlin kuitista voi ottaa kuvan suoraan puhelimella liitteeksi.</p>
          </div>
        </section>

        <section className="section-panel p-5">
          <p className="page-eyebrow">Suositus</p>
          <h2 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-foreground">
            Täytä vähintään nämä
          </h2>
          <div className="mt-4 grid gap-3 text-sm leading-6 text-muted-foreground">
            <p>Selkeä otsikko, jotta keikka löytyy nopeasti listalta.</p>
            <p>Tarkka osoite ja päivä, jotta kentälle ei tule turhaa arpomista.</p>
            <p>Lisähuomioihin kulkuohjeet, avaimet ja muut käytännön asiat.</p>
          </div>
        </section>
      </aside>
    </div>
  );
}
