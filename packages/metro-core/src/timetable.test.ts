import { describe, expect, it } from "vitest";

import { stations, timetables } from "./data";
import {
  dayTypeForDate,
  formatMinutes,
  getDirectionTimes,
  getFirstLast,
  getNextArrivals,
  getNextStationDeparture,
  getRouteBoardingDirection,
  getStationTimetable,
  getTimetableDirections,
  getTimetableLines,
  resolveLineTerminal,
  tehranNowMinutes,
} from "./timetable";
import type { RouteResult, RouteStep } from "./types";

function utc(y: number, mo: number, d: number, h: number, mi = 0): Date {
  return new Date(Date.UTC(y, mo - 1, d, h, mi));
}

describe("dayTypeForDate (Asia/Tehran)", () => {
  // 2026-09-10 = Thursday, 2026-09-11 = Friday, 2026-09-12 = Saturday
  it("maps Thursday to thursday", () => {
    expect(dayTypeForDate(utc(2026, 9, 10, 9))).toBe("thursday");
  });
  it("maps Friday to friday", () => {
    expect(dayTypeForDate(utc(2026, 9, 11, 9))).toBe("friday");
  });
  it("maps Saturday to weekday", () => {
    expect(dayTypeForDate(utc(2026, 9, 12, 9))).toBe("weekday");
  });
  it("maps Sunday to weekday", () => {
    expect(dayTypeForDate(utc(2026, 9, 13, 9))).toBe("weekday");
  });
  it("respects the Tehran day boundary (UTC evening = next Tehran day)", () => {
    // 2026-09-10 21:00 UTC = 2026-09-11 00:30 Tehran (Friday)
    expect(dayTypeForDate(utc(2026, 9, 10, 21))).toBe("friday");
  });
});

describe("tehranNowMinutes", () => {
  it("converts a known instant to Tehran wall time", () => {
    // 09:00 UTC = 12:30 Tehran
    expect(tehranNowMinutes(utc(2026, 9, 12, 9))).toBe(12 * 60 + 30);
  });
});

describe("getNextArrivals", () => {
  const times = [330, 350, 370, 1320];
  it("returns upcoming trains today", () => {
    expect(getNextArrivals(times, 340, 2)).toEqual([
      { minutes: 350, dayOffset: 0 },
      { minutes: 370, dayOffset: 0 },
    ]);
  });
  it("includes a train departing right now", () => {
    expect(getNextArrivals(times, 350, 1)).toEqual([{ minutes: 350, dayOffset: 0 }]);
  });
  it("wraps to tomorrow when service ended", () => {
    expect(getNextArrivals(times, 1330, 2)).toEqual([
      { minutes: 330, dayOffset: 1 },
      { minutes: 350, dayOffset: 1 },
    ]);
  });
  it("keeps a just-departed train for one grace minute", () => {
    expect(getNextArrivals([330, 350], 331, 2)).toEqual([
      { minutes: 330, dayOffset: 0 },
      { minutes: 350, dayOffset: 0 },
    ]);
    expect(getNextArrivals([330, 350], 332, 2)).toEqual([
      { minutes: 350, dayOffset: 0 },
      { minutes: 330, dayOffset: 1 },
    ]);
  });
  it("returns empty for empty timetables", () => {
    expect(getNextArrivals([], 500)).toEqual([]);
  });
});

describe("formatMinutes / getFirstLast", () => {
  it("formats minutes as HH:MM", () => {
    expect(formatMinutes(330)).toBe("05:30");
    expect(formatMinutes(0)).toBe("00:00");
  });
  it("reads first/last departures", () => {
    expect(getFirstLast([330, 370])).toEqual({ first: 330, last: 370 });
    expect(getFirstLast([])).toEqual({ first: null, last: null });
  });
});

describe("generated timetable index", () => {
  it("covers Tajrish weekday service to Kahrizak starting 05:30", () => {
    const times = getDirectionTimes("tajrish", "line_1", "kahrizak", "weekday");
    expect(times.length).toBeGreaterThan(100);
    expect(times[0]).toBe(330);
    expect(times).toEqual([...times].sort((a, b) => a - b));
  });

  it("every entry references real stations/lines and holds sorted unique times", () => {
    expect(Object.keys(timetables.stations).length).toBeGreaterThan(100);
    for (const [sid, lines] of Object.entries(timetables.stations)) {
      expect(stations[sid], sid).toBeDefined();
      for (const [lineId, dirs] of Object.entries(lines)) {
        expect(stations[sid]!.lines, `${sid}/${lineId}`).toContain(lineId);
        for (const [dirId, days] of Object.entries(dirs)) {
          expect(stations[dirId], `${sid}/${lineId}/${dirId}`).toBeDefined();
          for (const arr of Object.values(days)) {
            expect(arr.length).toBeGreaterThan(0);
            expect(arr).toEqual([...arr].sort((a, b) => a - b));
            expect(new Set(arr).size).toBe(arr.length);
            for (const m of arr) expect(m >= 0 && m < 1440).toBe(true);
          }
        }
      }
    }
  });

  it("stations without source data return null (e.g. Vavan)", () => {
    expect(getStationTimetable("vavan")).toBeNull();
    expect(getTimetableDirections("vavan", "line_1")).toEqual([]);
  });

  it("direction ids are real stations", () => {
    for (const dir of getTimetableDirections("tajrish", "line_1")) {
      expect(stations[dir]).toBeDefined();
    }
  });

  it("line order follows the station's own line list", () => {
    const order = stations["tehran_sadeghiyeh"]!.lines;
    expect(getTimetableLines("tehran_sadeghiyeh", order)).toEqual(
      order.filter((l) => ["line_2", "line_5"].includes(l))
    );
  });
});

describe("getNextStationDeparture", () => {
  it("finds the earliest departure across all directions", () => {
    // Tajrish weekday 05:00 -> first train 05:30 toward Kahrizak
    expect(getNextStationDeparture("tajrish", "weekday", 300)).toEqual({
      minutes: 330,
      dayOffset: 0,
      lineId: "line_1",
      directionId: "kahrizak",
    });
  });
  it("wraps to tomorrow after service ends", () => {
    expect(getNextStationDeparture("tajrish", "weekday", 1381)).toMatchObject({
      dayOffset: 1,
      lineId: "line_1",
    });
  });
  it("returns null without data", () => {
    expect(getNextStationDeparture("vavan", "weekday", 300)).toBeNull();
  });
});

function fakeStep(
  stationId: string,
  line: string,
  extra: Partial<RouteStep> = {}
): RouteStep {
  return {
    stationId,
    station: stations[stationId]!,
    line,
    isTransfer: false,
    ...extra,
  };
}

describe("getRouteBoardingDirection", () => {
  const route: RouteResult = {
    steps: [
      fakeStep("tajrish", "line_1"),
      fakeStep("gheytariyeh", "line_1"),
      fakeStep("shahid_beheshti", "line_1", { isTransfer: true, transferTo: "line_3" }),
      fakeStep("shahid_beheshti", "line_3"),
      fakeStep("qa_em", "line_3"),
    ],
    totalStations: 5,
    totalTransfers: 1,
    lines: ["line_1", "line_3"],
  };
  it("resolves the run destination on the boarding line", () => {
    // alighting mid-line maps to the line terminal beyond it (timetable key)
    expect(getRouteBoardingDirection(route, "tajrish", "line_1")).toBe("kahrizak");
    expect(getRouteBoardingDirection(route, "shahid_beheshti", "line_3")).toBe("qa_em");
  });
  it("returns null for unknown or walk legs", () => {
    expect(getRouteBoardingDirection(route, "tajrish", "line_2")).toBeNull();
    const walkRoute: RouteResult = {
      ...route,
      steps: [fakeStep("a", "line_1", { walk: true, walkFrom: "b" })],
    };
    expect(getRouteBoardingDirection(walkRoute, "a", "line_1")).toBeNull();
  });
  it("resolves boarding after a walk leg", () => {
    const walkRoute: RouteResult = {
      steps: [
        fakeStep("tarasht", "line_2"),
        {
          ...fakeStep("eram_e_sabz", "line_5"),
          walk: true,
          walkFrom: "tarasht",
          isTransfer: true,
          transferTo: "line_5",
        },
        fakeStep("eram_e_sabz", "line_5"),
        fakeStep("golshahr", "line_5"),
      ],
      totalStations: 4,
      totalTransfers: 1,
      lines: ["line_2", "line_5"],
    };
    // walk departure wins over the ride that ended at the same station
    expect(getRouteBoardingDirection(walkRoute, "tarasht", "line_5")).toBe("golshahr");
  });
  it("maps a mid-line transfer alighting to the terminal (Karaj->Ketab case)", () => {
    // line_5 Karaj -> Sadeghiyeh, transfer to line_2 toward Shademan
    const r: RouteResult = {
      steps: [
        fakeStep("karaj", "line_5"),
        fakeStep("tehran_sadeghiyeh", "line_5", {
          isTransfer: true,
          transferTo: "line_2",
        }),
        fakeStep("tehran_sadeghiyeh", "line_2"),
        fakeStep("shademan", "line_2", { isTransfer: true, transferTo: "line_4" }),
      ],
      totalStations: 4,
      totalTransfers: 2,
      lines: ["line_5", "line_2", "line_4"],
    };
    expect(getRouteBoardingDirection(r, "tehran_sadeghiyeh", "line_2")).toBe("farhangsara");
    expect(getRouteBoardingDirection(r, "karaj", "line_5")).toBe("tehran_sadeghiyeh");
  });
});

describe("resolveLineTerminal", () => {
  it("resolves forward/backward terminals on a straight line", () => {
    expect(resolveLineTerminal("line_2", "tehran_sadeghiyeh", "shademan")).toBe("farhangsara");
    expect(resolveLineTerminal("line_2", "shademan", "tehran_sadeghiyeh")).toBe(
      "tehran_sadeghiyeh"
    );
  });
  it("joins trunk+branch paths", () => {
    expect(resolveLineTerminal("line_1", "tajrish", "kahrizak")).toBe("kahrizak");
    expect(resolveLineTerminal("line_1", "shahed_baghershahr", "shahr_e_parand")).toBe(
      "shahr_e_parand"
    );
  });
  it("returns null for unknown stations", () => {
    expect(resolveLineTerminal("line_2", "tajrish", "shademan")).toBeNull();
  });
});
