import { describe, expect, it } from "vitest";

import { buildGoogleMapsSearchUrl, extractAreaFromAddressComponents } from "@/lib/google-maps";

describe("google maps helpers", () => {
  it("builds a search url for a populated address", () => {
    expect(buildGoogleMapsSearchUrl("Aleksanterinkatu 1, Helsinki")).toBe(
      "https://www.google.com/maps/search/?api=1&query=Aleksanterinkatu%201%2C%20Helsinki",
    );
  });

  it("falls back to Google Maps home for an empty query", () => {
    expect(buildGoogleMapsSearchUrl("   ")).toBe("https://www.google.com/maps");
  });

  it("prefers a more specific sublocality when extracting area", () => {
    expect(
      extractAreaFromAddressComponents([
        { long_name: "Helsinki", types: ["locality"] },
        { long_name: "Kallio", types: ["sublocality_level_1"] },
      ]),
    ).toBe("Kallio");
  });

  it("uses locality when a sublocality is not available", () => {
    expect(
      extractAreaFromAddressComponents([
        { long_name: "Helsinki", types: ["locality"] },
      ]),
    ).toBe("Helsinki");
  });
});
