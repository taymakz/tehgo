import { describe, expect, it } from "vitest";

import { graph, lines, paths, stations } from "./index";

/**
 * Guards the metro dataset against the class of bugs that silently
 * broke routing (e.g. Shahid Kolahdooz -> Amirkabir rendered nothing):
 * missing directed edges, ids referenced in paths/graph but absent
 * from stations.json, unreachable stations, and wrong marker colors.
 */

function edgeExists(from: string, to: string, line?: string): boolean {
  return (graph[from] ?? []).some(
    (e) => e.to === to && (line === undefined || e.line === line)
  );
}

describe("dataset integrity", () => {
  it("every path references known lines and stations", () => {
    for (const [lineId, entry] of Object.entries(paths)) {
      expect(lines[lineId], `unknown line ${lineId}`).toBeDefined();

      for (const path of entry.paths) {
        for (const stationId of path.stations) {
          expect(
            stations[stationId],
            `${lineId}/${path.id}: unknown station ${stationId}`
          ).toBeDefined();
        }
      }
    }
  });

  it("every graph endpoint is a known station with matching metadata", () => {
    for (const [from, edges] of Object.entries(graph)) {
      expect(stations[from], `unknown graph key ${from}`).toBeDefined();
      for (const edge of edges) {
        expect(
          stations[edge.to],
          `${from} -> unknown station ${edge.to}`
        ).toBeDefined();
        expect(edge.from).toBe(from);
        expect(lines[edge.line], `unknown line ${edge.line}`).toBeDefined();
      }
    }
  });

  it("every consecutive pair on a path has bidirectional edges on the same line", () => {
    for (const [lineId, entry] of Object.entries(paths)) {
      for (const path of entry.paths) {
        const tag = `${lineId}/${path.id}`;
        for (let i = 0; i < path.stations.length - 1; i++) {
          const a = path.stations[i]!;
          const b = path.stations[i + 1]!;
          expect(
            edgeExists(a, b, lineId),
            `${tag}: missing forward edge ${a} -> ${b}`
          ).toBe(true);
          expect(
            edgeExists(b, a, lineId),
            `${tag}: missing reverse edge ${b} -> ${a}`
          ).toBe(true);
        }
      }
    }
  });

  it("no duplicate edges between the same pair of stations", () => {
    for (const [from, edges] of Object.entries(graph)) {
      const seen = new Set<string>();
      for (const edge of edges) {
        expect(seen.has(edge.to), `duplicate edge ${from} -> ${edge.to}`).toBe(
          false
        );
        seen.add(edge.to);
      }
    }
  });

  it("no enabled station with claimed lines is unreachable from the network", () => {
    const start = "shahid_kolahdooz";
    const seen = new Set<string>([start]);
    const queue = [start];
    while (queue.length > 0) {
      const current = queue.shift()!;
      for (const edge of graph[current] ?? []) {
        if (!seen.has(edge.to)) {
          seen.add(edge.to);
          queue.push(edge.to);
        }
      }
    }

    for (const [id, station] of Object.entries(stations)) {
      if (station.disabled) continue;
      if ((station.lines ?? []).length === 0) continue;
      expect(
        seen.has(id),
        `enabled station unreachable from network: ${id}`
      ).toBe(true);
    }
  });

  it("path endpoints match their first/last stations", () => {
    for (const [, entry] of Object.entries(paths)) {
      for (const path of entry.paths) {
        expect(path.stations[0]).toBe(path.from);
        expect(path.stations[path.stations.length - 1]).toBe(path.to);
        expect(path.stations.length).toBeGreaterThanOrEqual(2);
      }
    }
  });

  it("stations referenced by a path are marked as belonging to that line", () => {
    for (const [lineId, entry] of Object.entries(paths)) {
      for (const path of entry.paths) {
        for (const stationId of path.stations) {
          expect(
            stations[stationId]?.lines,
            `${stationId} on ${path.id} but not marked on ${lineId}`
          ).toContain(lineId);
        }
      }
    }
  });

  it("every station lists the color of every line it belongs to", () => {
    for (const [id, station] of Object.entries(stations)) {
      for (const lineId of station.lines) {
        const color = lines[lineId]?.color;
        expect(color, `line ${lineId} has no color`).toBeDefined();
        expect(
          station.colors,
          `station ${id} missing color ${color} for ${lineId}`
        ).toContain(color);
      }
    }
  });
});
