import { Graph, RouteResult, RouteStep, StationsMap } from '@/types/metro';

export function findRoutes(
  graph: Graph,
  stations: StationsMap,
  from: string,
  to: string,
  maxRoutes: number = 5
): RouteResult[] {
  if (from === to) return [];

  const allRoutes: RouteResult[] = [];

  // Use DFS with path tracking to find multiple routes
  const findAllPaths = (
    current: string,
    target: string,
    visited: Set<string>,
    path: string[],
    lines: string[], // Track lines used in path
    currentLine: string,
    transfers: number
  ) => {
    if (current === target) {
      // Build route from path
      const steps: RouteStep[] = [];
      let prevLine = '';

      for (let i = 0; i < path.length; i++) {
        const stationId = path[i];
        const station = stations[stationId];
        if (!station) continue;

        const edge = i > 0 ? graph[path[i - 1]]?.find(e => e.to === stationId) : null;
        const line = edge?.line || station.lines?.[0] || '';
        const isTransfer = line !== prevLine && prevLine !== '';

        let transferTo: string | undefined;
        if (isTransfer) {
          transferTo = line;
        }

        steps.push({
          stationId,
          station,
          line,
          isTransfer,
          transferTo,
        });

        prevLine = line;
      }

      const uniqueLines = Array.from(new Set(steps.map(s => s.line).filter(Boolean)));

      allRoutes.push({
        steps,
        totalStations: path.length,
        totalTransfers: uniqueLines.length - 1,
        lines: uniqueLines,
      });

      return;
    }

    // Stop if path is too long or too many transfers
    if (path.length > 30 || transfers > 4) return;

    const edges = graph[current] || [];

    // Sort edges to prioritize continuing on same line
    const sortedEdges = [...edges].sort((a, b) => {
      const aIsSameLine = a.line === currentLine ? 0 : 1;
      const bIsSameLine = b.line === currentLine ? 0 : 1;
      return aIsSameLine - bIsSameLine;
    });

    for (const edge of sortedEdges) {
      if (!visited.has(edge.to) && stations[edge.to]) {
        const newTransfers = currentLine && edge.line !== currentLine ? transfers + 1 : transfers;
        const newVisited = new Set(visited);
        newVisited.add(edge.to);

        const newLines = edge.line !== currentLine ? [...lines, edge.line] : lines;

        findAllPaths(
          edge.to,
          target,
          newVisited,
          [...path, edge.to],
          newLines,
          edge.line,
          newTransfers
        );
      }
    }
  };

  const firstStation = stations[from];
  const initialLine = firstStation?.lines?.[0] || '';
  const initialVisited = new Set<string>([from]);

  findAllPaths(from, to, initialVisited, [from], [initialLine], initialLine, 0);

  // Remove duplicate routes (same stations in same order)
  const uniqueRoutes = allRoutes.filter((route, index, self) => {
    const pathKey = route.steps.map(s => s.stationId).join('-');
    return index === self.findIndex(r => r.steps.map(s => s.stationId).join('-') === pathKey);
  });

  // Sort by transfers first (PRIORITY), then by total stations
  uniqueRoutes.sort((a, b) => {
    // First compare by number of transfers
    if (a.totalTransfers !== b.totalTransfers) {
      return a.totalTransfers - b.totalTransfers;
    }
    // If transfers are equal, compare by total stations
    return a.totalStations - b.totalStations;
  });

  // Return top routes
  return uniqueRoutes.slice(0, maxRoutes);
}
