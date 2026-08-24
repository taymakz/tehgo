import { describe, expect, it } from "vitest";

import { graph, lines, paths, stations } from "./data";
import { findRoutes, findRoutesWithWalkBridge } from "./route-finder";
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

  it("Maryam-e Moghaddas is open and routable from both directions", () => {
    expect(stations["maryam_e_moghaddas"]?.disabled).toBe(false);

    const outgoing = findRoutes(
      graph,
      stations,
      "maryam_e_moghaddas",
      "amirkabir"
    );
    const incoming = findRoutes(
      graph,
      stations,
      "shahid_kolahdooz",
      "maryam_e_moghaddas"
    );
    expect(outgoing.length).toBeGreaterThan(0);
    expect(incoming.length).toBeGreaterThan(0);
  });
});

describe("blocked stations", () => {
  it("never routes through a blocked station", () => {
    const blocked = new Set(["ayatollah_kashani"]);
    const routes = findRoutes(graph, stations, "shahid_kolahdooz", "amirkabir", {
      blocked,
    });

    expect(routes.length).toBeGreaterThan(0);
    for (const route of routes) {
      for (const step of route.steps) {
        expect(blocked.has(step.stationId)).toBe(false);
      }
    }
  });

  it("returns nothing when origin or destination is blocked", () => {
    const blocked = new Set(["shahid_kolahdooz"]);
    expect(
      findRoutes(graph, stations, "shahid_kolahdooz", "amirkabir", { blocked })
    ).toEqual([]);
  });

  it("still finds routes when an unrelated station is blocked", () => {
    const blocked = new Set(["kouhsar"]);
    const routes = findRoutes(graph, stations, "shahid_kolahdooz", "amirkabir", {
      blocked,
    });
    expect(routes.length).toBeGreaterThan(0);
  });
});

describe("walk bridge", () => {
  const blocked = new Set(["meydan_e_shohada", "ayatollah_kashani"]);

  it("finds no direct route when every interchange is blocked", () => {
    expect(
      findRoutes(graph, stations, "shahid_kolahdooz", "amirkabir", { blocked })
    ).toEqual([]);
  });

  it("bridges the gap with a single walk transfer", () => {
    const routes = findRoutesWithWalkBridge(
      graph,
      stations,
      "shahid_kolahdooz",
      "amirkabir",
      { blocked, walkMaxMeters: 1500 }
    );

    expect(routes.length).toBeGreaterThan(0);
    for (const route of routes) {
      const walks = route.steps.filter((s) => s.walk);
      expect(walks.length).toBe(1);
      for (const step of route.steps) {
        expect(blocked.has(step.stationId)).toBe(false);
      }

      const first = route.steps[0]!;
      const last = route.steps[route.steps.length - 1]!;
      expect(first.stationId).toBe("shahid_kolahdooz");
      expect(last.stationId).toBe("amirkabir");

      const walk = walks[0]!;
      expect(walk.walkFrom).toBeDefined();
      expect(stations[walk.walkFrom!]).toBeDefined();
    }

    // Best route walks the shortest gap straight into the destination:
    // ebn_e_sina -> amirkabir (~1 km apart)
    const best = routes[0]!;
    const walkStep = best.steps.find((s) => s.walk)!;
    expect(walkStep.stationId).toBe("amirkabir");
    expect(walkStep.walkFrom).toBe("ebn_e_sina");

    // Alternative bridges keep riding after the walk (walk is mid-route)
    if (routes.length > 1) {
      const alt = routes[1]!;
      const altWalkIndex = alt.steps.findIndex((s) => s.walk)!;
      expect(altWalkIndex).toBeLessThan(alt.steps.length - 1);
    }
  });

  it("returns nothing when no station pair is within walking distance", () => {
    expect(
      findRoutesWithWalkBridge(
        graph,
        stations,
        "shahid_kolahdooz",
        "amirkabir",
        { blocked, walkMaxMeters: 500 }
      )
    ).toEqual([]);
  });

  it("describes the walk in localized transfer guides", () => {
    const routes = findRoutesWithWalkBridge(
      graph,
      stations,
      "shahid_kolahdooz",
      "amirkabir",
      { blocked, walkMaxMeters: 1500 }
    );

    // Mid-route walk: walk text plus boarding instructions for the next line
    const midRoute = routes.find((r) => {
      const idx = r.steps.findIndex((s) => s.walk);
      return idx > 0 && idx < r.steps.length - 1;
    });
    expect(midRoute).toBeDefined();
    const midIndex = midRoute!.steps.findIndex((s) => s.walk);
    const enMid = getTransferGuide(midRoute!, midIndex, lines, paths, "en", display);
    const faMid = getTransferGuide(midRoute!, midIndex, lines, paths, "fa", (id) =>
      display(id, "fa")
    );
    expect(enMid).toContain("taxi/Snapp");
    expect(enMid).toContain("board");
    expect(faMid).toContain("پیاده بروید");
    expect(faMid).toContain("سوار");

    // Final walk into the destination: pure walking instruction, no boarding
    const finalRoute = routes.find((r) => {
      const last = r.steps[r.steps.length - 1]!;
      return !!last.walk;
    });
    expect(finalRoute).toBeDefined();
    const enFinal = getTransferGuide(
      finalRoute!,
      finalRoute!.steps.length - 1,
      lines,
      paths,
      "en",
      display
    );
    const faFinal = getTransferGuide(
      finalRoute!,
      finalRoute!.steps.length - 1,
      lines,
      paths,
      "fa",
      (id) => display(id, "fa")
    );
    expect(enFinal).toContain("Amirkabir");
    expect(enFinal).not.toContain("board");
    expect(faFinal).toContain("پیاده بروید");
    expect(faFinal).not.toContain("سوار");
  });

  it("long broken-line gaps suggest taxi/Snapp in the guide", () => {
    // ahang blocked splits line 7; basij -> chehel_tan_e_doulab is ~2.3 km
    const blocked7 = new Set(["ahang"]);
    const [route] = findRoutesWithWalkBridge(
      graph,
      stations,
      "varzeshgah_e_takhti",
      "chehel_tan_e_doulab",
      { blocked: blocked7 }
    );

    expect(route).toBeDefined();
    const walkIndex = route!.steps.findIndex((s) => s.walk);
    const walk = route!.steps[walkIndex]!;
    expect(walk.walkFrom).toBe("basij");
    expect(walk.stationId).toBe("chehel_tan_e_doulab");
    expect(walk.walkMeters ?? 0).toBeGreaterThan(1500);

    const fa = getTransferGuide(route!, walkIndex, lines, paths, "fa", (id) =>
      display(id, "fa")
    );
    expect(fa).toContain("اسنپ");
    expect(fa).toContain("پیاده شوید");
    expect(fa).toContain("بسیج");
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
