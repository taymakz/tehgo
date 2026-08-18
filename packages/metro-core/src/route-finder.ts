import type { Graph, RouteResult, RouteStep, StationsMap } from "./types";

export function findRoutes(
  graph: Graph,
  stations: StationsMap,
  from: string,
  to: string,
  maxRoutes: number = 5
): RouteResult[] {
  if (from === to) return [];

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
      const steps: RouteStep[] = [];
      let prevLine = "";

      for (let i = 0; i < path.length; i++) {
        const stationId = path[i];
        if (!stationId) continue;
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

  const uniqueRoutes = allRoutes.filter((route, index, self) => {
    const pathKey = route.steps.map((s) => s.stationId).join("-");
    return (
      index ===
      self.findIndex((r) => r.steps.map((s) => s.stationId).join("-") === pathKey)
    );
  });

  uniqueRoutes.sort((a, b) => {
    if (a.totalTransfers !== b.totalTransfers) {
      return a.totalTransfers - b.totalTransfers;
    }
    return a.totalStations - b.totalStations;
  });

  return uniqueRoutes.slice(0, maxRoutes);
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
    if (!best || route.totalTransfers < best.totalTransfers) return route;
    return best;
  }, undefined);
}
