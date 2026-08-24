import type { Graph, RouteResult, RouteStep, StationsMap } from "./types";

export interface FindRoutesOptions {
  /** Maximum number of routes to return (default: 5) */
  maxRoutes?: number;
  /** Stations to avoid entirely — they are never traversed, boarded at or exited at */
  blocked?: ReadonlySet<string>;
}

/** Maximum walking distance in meters for a walk-transfer suggestion */
const DEFAULT_WALK_MAX_METERS = 800;
/** Upper bound on candidate walk pairs evaluated so lookups stay fast */
const MAX_WALK_PAIRS = 60;

const EARTH_RADIUS_M = 6371000;

function haversineMeters(
  aLat: number,
  aLon: number,
  bLat: number,
  bLon: number
): number {
  const toRad = Math.PI / 180;
  const dLat = (bLat - aLat) * toRad;
  const dLon = (bLon - aLon) * toRad;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(aLat * toRad) * Math.cos(bLat * toRad) * Math.sin(dLon / 2) ** 2;
  return EARTH_RADIUS_M * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
}

function buildSteps(
  path: string[],
  graph: Graph,
  stations: StationsMap
): RouteStep[] {
  const steps: RouteStep[] = [];
  let prevLine = "";

  for (let i = 0; i < path.length; i++) {
    const stationId = path[i]!;
    const station = stations[stationId];
    if (!station) continue;

    const prevStationId = i > 0 ? path[i - 1] : undefined;
    const edge = prevStationId
      ? graph[prevStationId]?.find((e) => e.to === stationId)
      : null;
    const line = edge?.line || station.lines?.[0] || "";
    const isTransfer = line !== prevLine && prevLine !== "";

    if (isTransfer && steps.length > 0) {
      steps[steps.length - 1]!.transferTo = line;
    }

    steps.push({
      stationId,
      station,
      line,
      isTransfer,
    });

    prevLine = line;
  }

  return steps;
}

export function findRoutes(
  graph: Graph,
  stations: StationsMap,
  from: string,
  to: string,
  options: FindRoutesOptions = {}
): RouteResult[] {
  if (from === to) return [];

  const blocked = options.blocked;
  if (blocked?.has(from) || blocked?.has(to)) return [];

  const allRoutes: RouteResult[] = [];

  const findAllPaths = (
    current: string,
    target: string,
    visited: Set<string>,
    path: string[],
    currentLine: string,
    transfers: number
  ) => {
    if (current === target) {
      const steps = buildSteps(path, graph, stations);
      const uniqueLines = Array.from(
        new Set(steps.map((s) => s.line).filter(Boolean))
      );

      allRoutes.push({
        steps,
        totalStations: path.length,
        totalTransfers: uniqueLines.length - 1,
        lines: uniqueLines,
      });

      return;
    }

    if (path.length > 30 || transfers > 4) return;

    const edges = graph[current] || [];

    const sortedEdges = [...edges].sort((a, b) => {
      const aIsSameLine = a.line === currentLine ? 0 : 1;
      const bIsSameLine = b.line === currentLine ? 0 : 1;
      return aIsSameLine - bIsSameLine;
    });

    for (const edge of sortedEdges) {
      if (blocked?.has(edge.to)) continue;
      if (!visited.has(edge.to) && stations[edge.to]) {
        const newTransfers =
          currentLine && edge.line !== currentLine ? transfers + 1 : transfers;
        const newVisited = new Set(visited);
        newVisited.add(edge.to);

        findAllPaths(
          edge.to,
          target,
          newVisited,
          [...path, edge.to],
          edge.line,
          newTransfers
        );
      }
    }
  };

  const firstStation = stations[from];
  const initialLine = firstStation?.lines?.[0] || "";
  const initialVisited = new Set<string>([from]);

  findAllPaths(from, to, initialVisited, [from], initialLine, 0);

  return rankRoutes(allRoutes).slice(0, options.maxRoutes ?? 5);
}

function routeKey(route: RouteResult): string {
  return route.steps
    .map((s) => `${s.stationId}${s.walk ? "~" + s.walkFrom : ""}`)
    .join("-");
}

function rankRoutes(routes: RouteResult[]): RouteResult[] {
  const unique = routes.filter(
    (route, index, self) =>
      index === self.findIndex((r) => routeKey(r) === routeKey(route))
  );

  return unique.sort((a, b) => {
    if (a.totalTransfers !== b.totalTransfers) {
      return a.totalTransfers - b.totalTransfers;
    }
    return a.totalStations - b.totalStations;
  });
}

function reachableFrom(
  start: string,
  graph: Graph,
  blocked?: ReadonlySet<string>
): Set<string> {
  const seen = new Set<string>([start]);
  const queue = [start];
  while (queue.length > 0) {
    const current = queue.shift()!;
    for (const edge of graph[current] ?? []) {
      if (blocked?.has(edge.to)) continue;
      if (!seen.has(edge.to)) {
        seen.add(edge.to);
        queue.push(edge.to);
      }
    }
  }
  return seen;
}

/**
 * Like findRoutes but when no direct route exists with the given
 * restrictions it tries to bridge the gap with one walking transfer:
 * ride to the closest reachable station A, walk to a nearby station B,
 * then continue by metro to the destination.
 */
export function findRoutesWithWalkBridge(
  graph: Graph,
  stations: StationsMap,
  from: string,
  to: string,
  options: FindRoutesOptions & { walkMaxMeters?: number } = {}
): RouteResult[] {
  const direct = findRoutes(graph, stations, from, to, options);
  if (direct.length > 0) return direct;

  const blocked = options.blocked;
  if (blocked?.has(from) || blocked?.has(to)) return [];

  const maxWalk = options.walkMaxMeters ?? DEFAULT_WALK_MAX_METERS;

  const forwardReach = reachableFrom(from, graph, blocked);
  const backwardReach = reachableFrom(to, reverseGraph(graph), blocked);

  interface Candidate {
    aId: string;
    bId: string;
    distance: number;
  }
  const candidates: Candidate[] = [];

  const latLon = (id: string) => ({
    lat: parseFloat(stations[id]?.latitude ?? ""),
    lon: parseFloat(stations[id]?.longitude ?? ""),
  });

  for (const aId of forwardReach) {
    if (aId === to || blocked?.has(aId)) continue;
    const a = latLon(aId);
    if (Number.isNaN(a.lat) || Number.isNaN(a.lon)) continue;

    for (const bId of backwardReach) {
      if (bId === aId || bId === from || blocked?.has(bId)) continue;
      const b = latLon(bId);
      if (Number.isNaN(b.lat) || Number.isNaN(b.lon)) continue;

      const distance = haversineMeters(a.lat, a.lon, b.lat, b.lon);
      if (distance <= maxWalk) candidates.push({ aId, bId, distance });
    }
  }

  candidates.sort((x, y) => x.distance - y.distance);

  const composed: RouteResult[] = [];

  for (const { aId, bId } of candidates.slice(0, MAX_WALK_PAIRS)) {
    const leg1 =
      aId === from ? [] : findRoutes(graph, stations, from, aId, { blocked });
    if (leg1.length === 0 && aId !== from) continue;
    const best1 = leg1[0];

    let steps: RouteStep[];
    if (bId === to) {
      // Walk straight into the destination
      const head =
        best1?.steps ??
        ([
          {
            stationId: from,
            station: stations[from]!,
            line: stations[from]?.lines?.[0] || "",
            isTransfer: false,
          },
        ] as RouteStep[]);
      steps = [...head, walkStepTo(stations, bId, aId)];
    } else {
      const leg2 = findRoutes(graph, stations, bId, to, { blocked });
      if (leg2.length === 0) continue;
      const best2 = leg2[0]!;
      const head = best1?.steps ?? [];
      steps = [...head, walkStepTo(stations, bId, aId), ...best2.steps.slice(1)];
    }

    const uniqueLines = Array.from(
      new Set(steps.map((s) => s.line).filter(Boolean))
    );
    const walkCount = steps.filter((s) => s.walk).length;

    composed.push({
      steps,
      totalStations: steps.length,
      totalTransfers: Math.max(uniqueLines.length - 1, walkCount),
      lines: uniqueLines,
    });
  }

  return rankRoutes(composed).slice(0, options.maxRoutes ?? 5);
}

function walkStepTo(
  stations: StationsMap,
  stationId: string,
  walkFrom: string
): RouteStep {
  return {
    stationId,
    station: stations[stationId]!,
    line: stations[stationId]?.lines?.[0] || "",
    isTransfer: true,
    transferTo: stations[stationId]?.lines?.[0] || "",
    walk: true,
    walkFrom,
  };
}

function reverseGraph(graph: Graph): Graph {
  const reversed: Graph = {};
  for (const [fromId, edges] of Object.entries(graph)) {
    for (const edge of edges) {
      (reversed[edge.to] ??= []).push({
        from: edge.to,
        to: fromId,
        line: edge.line,
        weight: edge.weight,
      });
    }
  }
  return reversed;
}

export function fastestRoute(routes: RouteResult[]): RouteResult | undefined {
  return routes.reduce<RouteResult | undefined>((best, route) => {
    if (!best || route.totalStations < best.totalStations) return route;
    return best;
  }, undefined);
}

export function fewestTransfersRoute(
  routes: RouteResult[]
): RouteResult | undefined {
  return routes.reduce<RouteResult | undefined>((best, route) => {
    if (!best || route.totalTransfers < best.totalTransfers) return best;
    return best;
  }, undefined);
}
