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

export interface Line {
  id: string;
  name: {
    fa: string;
    en: string;
  };
  color: string;
}

export interface Path {
  id: string;
  from: string;
  to: string;
  stations: string[];
}

export type PathsMap = Record<string, { paths: Path[] }>;

export interface GraphEdge {
  from: string;
  to: string;
  line: string;
  weight: number;
}

export type Graph = Record<string, GraphEdge[]>;

export type StationsMap = Record<string, Station>;

export type LinesMap = Record<string, Line>;

export interface RouteStep {
  stationId: string;
  station: Station;
  line: string;
  isTransfer: boolean;
  transferTo?: string;
  /** True when this step is reached on foot from the previous station */
  walk?: boolean;
  /** Station id the walk started from (only set when walk is true) */
  walkFrom?: string;
}

export interface RouteResult {
  steps: RouteStep[];
  totalStations: number;
  totalTransfers: number;
  lines: string[];
}

export type Language = "en" | "fa";

export interface FacilityInfo {
  key: FacilityKey;
  icon: string;
  label: {
    en: string;
    fa: string;
  };
}
