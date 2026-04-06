type GoogleMapsWindow = Window & {
  google?: {
    maps?: {
      importLibrary?: (library: string) => Promise<unknown>
    }
  }
}

export type GoogleAddressComponent = {
  long_name?: string
  types?: string[]
}

export type GoogleAutocompletePlace = {
  formatted_address?: string
  address_components?: readonly GoogleAddressComponent[] | null
}

type GoogleMapsListener = {
  remove?: () => void
}

export type GooglePlacesAutocomplete = {
  addListener: (
    eventName: "place_changed",
    handler: () => void
  ) => GoogleMapsListener
  getPlace?: () => GoogleAutocompletePlace | undefined
}

type GoogleAutocompleteOptions = {
  componentRestrictions?: {
    country?: string[]
  }
  fields?: string[]
  types?: string[]
}

export type GooglePlacesLibrary = {
  Autocomplete: new (
    input: HTMLInputElement,
    options?: GoogleAutocompleteOptions
  ) => GooglePlacesAutocomplete
}

const GOOGLE_MAPS_SCRIPT_ID = "google-maps-places-script"
const GOOGLE_MAPS_BASE_URL = "https://maps.googleapis.com/maps/api/js"

let googleMapsScriptPromise: Promise<void> | null = null

export const buildGoogleMapsSearchUrl = (query: string) => {
  const normalized = query.trim()

  if (!normalized) {
    return "https://www.google.com/maps"
  }

  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(normalized)}`
}

const findAreaByTypes = (
  components: readonly GoogleAddressComponent[],
  type: string
) =>
  components.find((component) => component.types?.includes(type))?.long_name

export const extractAreaFromAddressComponents = (
  components?: readonly GoogleAddressComponent[] | null
) => {
  if (!components?.length) {
    return undefined
  }

  return (
    findAreaByTypes(components, "sublocality_level_1") ??
    findAreaByTypes(components, "postal_town") ??
    findAreaByTypes(components, "locality") ??
    findAreaByTypes(components, "administrative_area_level_3") ??
    findAreaByTypes(components, "administrative_area_level_2") ??
    findAreaByTypes(components, "administrative_area_level_1")
  )
}

export const loadGoogleMapsPlacesLibrary = async (apiKey?: string) => {
  if (!apiKey || typeof window === "undefined") {
    return null
  }

  const browserWindow = window as GoogleMapsWindow

  if (!googleMapsScriptPromise) {
    googleMapsScriptPromise = new Promise<void>((resolve, reject) => {
      if (browserWindow.google?.maps?.importLibrary) {
        resolve()
        return
      }

      const finishLoading = () => {
        if (browserWindow.google?.maps?.importLibrary) {
          resolve()
          return
        }

        reject(new Error("Google Maps ei alustunut oikein."))
      }

      const existingScript = document.getElementById(
        GOOGLE_MAPS_SCRIPT_ID
      ) as HTMLScriptElement | null

      if (existingScript) {
        existingScript.addEventListener("load", finishLoading, { once: true })
        existingScript.addEventListener(
          "error",
          () => reject(new Error("Google Maps -skripti ei latautunut.")),
          { once: true }
        )
        return
      }

      const script = document.createElement("script")
      const params = new URLSearchParams({
        key: apiKey,
        libraries: "places",
        loading: "async",
        v: "weekly",
        language: "fi",
        region: "FI",
      })

      script.id = GOOGLE_MAPS_SCRIPT_ID
      script.src = `${GOOGLE_MAPS_BASE_URL}?${params.toString()}`
      script.async = true
      script.defer = true
      script.onload = finishLoading
      script.onerror = () =>
        reject(new Error("Google Maps -skripti ei latautunut."))

      document.head.appendChild(script)
    }).catch((error) => {
      googleMapsScriptPromise = null
      throw error
    })
  }

  await googleMapsScriptPromise

  const library = await browserWindow.google?.maps?.importLibrary?.("places")

  return (library as GooglePlacesLibrary | undefined) ?? null
}
