"use client"

import { useEffect, useEffectEvent, useRef, useState } from "react"

import { Button } from "@/components/ui/button"
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { appIcons } from "@/lib/app-icons"
import {
  buildGoogleMapsSearchUrl,
  extractAreaFromAddressComponents,
  type GoogleAutocompletePlace,
  loadGoogleMapsPlacesLibrary,
} from "@/lib/google-maps"

type AddressFieldsProps = {
  addressDefaultValue?: string
  areaDefaultValue?: string
}

const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

export function AddressFields({
  addressDefaultValue,
  areaDefaultValue,
}: AddressFieldsProps) {
  const MapsIcon = appIcons.maps
  const [mapsReady, setMapsReady] = useState(false)
  const addressRef = useRef<HTMLInputElement>(null)
  const areaRef = useRef<HTMLInputElement>(null)

  const applySelectedPlace = useEffectEvent((place?: GoogleAutocompletePlace) => {
    const nextAddress =
      typeof place?.formatted_address === "string" && place.formatted_address.trim()
        ? place.formatted_address.trim()
        : undefined

    if (nextAddress && addressRef.current) {
      addressRef.current.value = nextAddress
    }

    const nextArea = extractAreaFromAddressComponents(place?.address_components)

    if (nextArea && areaRef.current) {
      areaRef.current.value = nextArea
    }
  })

  useEffect(() => {
    let listener: { remove?: () => void } | null = null
    let disposed = false

    if (!googleMapsApiKey) {
      return
    }

    const initializeAutocomplete = async () => {
      try {
        const placesLibrary = await loadGoogleMapsPlacesLibrary(googleMapsApiKey)

        if (!placesLibrary || disposed || !addressRef.current) {
          return
        }

        const autocomplete = new placesLibrary.Autocomplete(addressRef.current, {
          componentRestrictions: { country: ["fi"] },
          fields: ["address_components", "formatted_address"],
          types: ["address"],
        })

        listener = autocomplete.addListener("place_changed", () => {
          applySelectedPlace(autocomplete.getPlace?.())
        })

        if (!disposed) {
          setMapsReady(true)
        }
      } catch (error) {
        console.error("Google Maps autocomplete failed to initialize", error)

        if (!disposed) {
          setMapsReady(false)
        }
      }
    }

    void initializeAutocomplete()

    return () => {
      disposed = true
      listener?.remove?.()
    }
  }, [])

  const openMapsSearch = () => {
    const query = [addressRef.current?.value, areaRef.current?.value]
      .map((value) => value?.trim())
      .filter(Boolean)
      .join(", ")

    window.open(buildGoogleMapsSearchUrl(query), "_blank", "noopener,noreferrer")
  }

  return (
    <>
      <Field>
        <FieldLabel htmlFor="address">Osoite</FieldLabel>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Input
            autoComplete="street-address"
            className="sm:flex-1"
            defaultValue={addressDefaultValue}
            id="address"
            name="address"
            placeholder="Ala kirjoittaa osoitetta tai hae Mapsista"
            ref={addressRef}
            required
          />
          <Button
            className="w-full shrink-0 sm:w-auto"
            onClick={openMapsSearch}
            size="sm"
            type="button"
            variant="outline"
          >
            <MapsIcon data-icon="inline-start" />
            Hae Mapsista
          </Button>
        </div>
        <FieldDescription>
          {mapsReady
            ? "Google Maps -ehdotukset ovat käytössä. Valitse osoite listasta, niin alue täyttyy automaattisesti."
            : "Voit hakea osoitteen Google Mapsista napilla ja täyttää kentän myös käsin."}
        </FieldDescription>
      </Field>

      <Field>
        <FieldLabel htmlFor="area">Alue</FieldLabel>
        <Input
          autoComplete="address-level2"
          defaultValue={areaDefaultValue}
          id="area"
          name="area"
          placeholder="Täyttyy automaattisesti, mutta on muokattavissa"
          ref={areaRef}
        />
      </Field>
    </>
  )
}
