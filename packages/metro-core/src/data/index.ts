import graphJson from "./graph.json";
import linesJson from "./lines.json";
import pathsJson from "./paths.json";
import stationsJson from "./stations.json";

import type { Graph, LinesMap, PathsMap, StationsMap } from "../types";

export const graph = graphJson as Graph;
export const lines = linesJson as LinesMap;
export const paths = pathsJson as PathsMap;
export const stations = stationsJson as StationsMap;
