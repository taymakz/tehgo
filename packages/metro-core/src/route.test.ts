import { describe, expect, it } from "vitest";

import { graph, lines, paths, stations } from "./data";
import { findRoutes } from "./route-finder";
import {
  getFirstStepGuide,
  getLineTerminal,
  getTransferGuide,
} from "./route-guides";
import type { RouteResult } from "./types";

import type { Language } from "./types";

const display = (id: string, lang: Language = "en") =>
  lang === "fa"
    ? (stations[id]?.translations.fa ?? id)
    : (stations[id]?.name ?? id);

function firstGuide(route: RouteResult, lang: Language = "en") {
  return getFirstStepGuide(route, lines, paths, lang, (id) => display(id, lang));
}

function transferGuideAt(
  route: RouteResult,
  index: number,
  lang: Language = "en"
) {
  return getTransferGuide(route, index, lines, paths, lang, (id) =>
    display(id, lang)
  );
}

describe("route finding", () => {
  it("finds routes from Shahid Kolahdooz to Amirkabir", () => {
    const routes = findRoutes(graph, stations, "shahid_kolahdooz", "amirkabir");
    expect(routes.length).toBeGreaterThan(0);

    for (const route of routes) {
      expect(route.steps[0]?.stationId).toBe("shahid_kolahdooz");
      expect(route.steps[route.steps.length - 1]?.stationId).toBe("amirkabir");
    }
  });

  it("starts the Shahid Kolahdooz route on line_4 (yellow)", () => {
    const [route] = findRoutes(graph, stations, "shahid_kolahdooz", "amirkabir");
    expect(route).toBeDefined();
    expect(lines[route!.steps[0]!.line]?.color).toBe("#F8E100");
  });

  it("routes are reversible (every to->from also finds a route)", () => {
    const pairs: [string, string][] = [
      ["shahid_kolahdooz", "amirkabir"],
      ["amirkabir", "shahid_kolahdooz"],
      ["chaharbagh", "shahid_kolahdooz"],
      ["tajrish", "haram_e_hazrat_e_abdol_azim"],
      ["golshahr", "kahrizak"],
      ["varzeshgah_e_takhti", "kouhsar"],
      ["mehrabad_airport_terminal_4_6", "farhangsara"],
    ];
    for (const [from, to] of pairs) {
      const routes = findRoutes(graph, stations, from, to);
      expect(routes.length, `no route ${from} -> ${to}`).toBeGreaterThan(0);
    }
  });

  it("returns no routes when origin equals destination", () => {
    expect(findRoutes(graph, stations, "amirkabir", "amirkabir")).toEqual([]);
  });
});

describe("route guides", () => {
  it("first-step guide names the boarding station and correct terminal", () => {
    const [route] = findRoutes(graph, stations, "shahid_kolahdooz", "amirkabir");
    const guide = firstGuide(route!);

    expect(guide).toContain("Shahid Kolahdooz");
    expect(guide).toContain("Chaharbagh");
  });

  it("first-step guide is localized in Persian", () => {
    const [route] = findRoutes(graph, stations, "shahid_kolahdooz", "amirkabir");
    const guide = firstGuide(route!, "fa");

    expect(guide).toContain("شهید کلاهدوز");
    expect(guide).toContain("چهارباغ");
  });

  it("getLineTerminal resolves direction-aware terminals on branched lines", () => {
    expect(getLineTerminal(paths, "line_4", "shahid_kolahdooz", "ebn_e_sina")).toBe(
      "chaharbagh"
    );
    expect(getLineTerminal(paths, "line_4", "chaharbagh", "ebn_e_sina")).toBe(
      "shahid_kolahdooz"
    );
    expect(getLineTerminal(paths, "line_4", "bimeh", "mehrabad_airport_terminal_1_2")).toBe(
      "mehrabad_airport_terminal_4_6"
    );
  });

  it("transfer guide resolves the next line and its terminal station", () => {
    const [route] = findRoutes(graph, stations, "shahid_kolahdooz", "amirkabir");
    const transferIndex = route!.steps.findIndex((s) => s.transferTo);
    expect(transferIndex).toBeGreaterThan(0);

    const guide = transferGuideAt(route!, transferIndex);
    expect(guide.length).toBeGreaterThan(0);
    expect(guide).not.toContain("undefined");
  });

  it("guides never contain unresolved placeholders for any found route", () => {
    const routes = findRoutes(graph, stations, "shahid_kolahdooz", "amirkabir");
    for (const route of routes) {
      expect(firstGuide(route)).not.toMatch(/towards\s*$/);
      expect(firstGuide(route)).not.toContain("undefined");

      route.steps.forEach((_, i) => {
        if (route.steps[i]?.transferTo) {
          const transfer = transferGuideAt(route, i);
          expect(transfer.length).toBeGreaterThan(0);
          expect(transfer).not.toContain("undefined");
        }
      });
    }
  });
});
