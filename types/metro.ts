// Station facility keys
export type FacilityKey =
  | "wc"
  | "coffeeShop"
  | "groceryStore"
  | "fastFood"
  | "atm"
  | "elevator"
  | "bicycleParking"
  | "waterCooler"
  | "cleanFood"
  | "blindPath"
  | "fireSuppressionSystem"
  | "fireExtinguisher"
  | "metroPolice"
  | "creditTicketSales"
  | "waitingChair"
  | "camera"
  | "trashCan"
  | "smoking"
  | "petsAllowed"
  | "freeWifi"
  | "prayerRoom";

// Station interface
export interface Station {
  id: string;
  name: string;
  translations: {
    fa: string;
  };
  lines: string[];
  longitude: string;
  latitude: string;
  address?: string;
  colors: string[];
  disabled: boolean;
  wc?: boolean;
  coffeeShop?: boolean;
  groceryStore?: boolean;
  fastFood?: boolean;
  atm?: boolean;
  elevator?: boolean;
  bicycleParking?: boolean;
  waterCooler?: boolean | null;
  cleanFood?: boolean;
  blindPath?: boolean;
  fireSuppressionSystem?: boolean;
  fireExtinguisher?: boolean;
  metroPolice?: boolean;
  creditTicketSales?: boolean;
  waitingChair?: boolean;
  camera?: boolean;
  trashCan?: boolean;
  smoking?: boolean;
  petsAllowed?: boolean;
  freeWifi?: boolean;
  prayerRoom?: boolean | null;
  relations: string[];
}

// Line interface
export interface Line {
  id: string;
  name: {
    fa: string;
    en: string;
  };
  color: string;
}

// Path interface for route segments
export interface Path {
  id: string;
  from: string;
  to: string;
  stations: string[];
}

// Paths map type
export type PathsMap = Record<string, { paths: Path[] }>;

// Graph edge interface
export interface GraphEdge {
  from: string;
  to: string;
  line: string;
  weight: number;
}

// Graph type (adjacency list)
export type Graph = Record<string, GraphEdge[]>;

// Stations map type
export type StationsMap = Record<string, Station>;

// Lines map type
export type LinesMap = Record<string, Line>;

// Route step interface
export interface RouteStep {
  stationId: string;
  station: Station;
  line: string;
  isTransfer: boolean;
  transferTo?: string;
}

// Route result interface
export interface RouteResult {
  steps: RouteStep[];
  totalStations: number;
  totalTransfers: number;
  lines: string[];
}

// Language type
export type Language = "en" | "fa";

// Theme type
export type Theme = "light" | "dark" | "system";

// Facility info for display
export interface FacilityInfo {
  key: FacilityKey;
  icon: string;
  label: {
    en: string;
    fa: string;
  };
}
