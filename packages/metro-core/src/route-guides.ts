import type { LinesMap, PathsMap, RouteResult } from "./types";

export function getLineTerminal(
  paths: PathsMap,
  line: string,
  startStationId: string,
  nextStationId: string
): string {
  const linePaths = paths[line]?.paths;
  if (!linePaths) return "";

  for (const path of linePaths) {
    const stationIndex = path.stations.indexOf(startStationId);
    const nextIndex = path.stations.indexOf(nextStationId);
    if (stationIndex !== -1 && nextIndex !== -1) {
      return nextIndex > stationIndex ? path.to : path.from;
    }
  }
  return "";
}

export function getFirstStepGuide(
  route: RouteResult,
  lines: LinesMap,
  paths: PathsMap,
  lang: "en" | "fa",
  getStationDisplay: (id: string) => string
): string {
  const firstStep = route.steps[0];
  if (!firstStep) return "";

  const lineId = firstStep.line;
  const lineName = lines[lineId]?.name[lang] || lineId;

  let lastStationOnLine = firstStep.stationId;
  for (const step of route.steps) {
    if (step.line !== lineId) break;
    lastStationOnLine = step.stationId;
  }

  const terminal = getLineTerminal(
    paths,
    lineId,
    firstStep.stationId,
    lastStationOnLine
  );

  const stationName = getStationDisplay(firstStep.stationId);
  const terminalName = getStationDisplay(terminal);

  return lang === "fa"
    ? `از ایستگاه ${stationName} سوار ${lineName} به سمت ${terminalName} شوید`
    : `Board ${lineName} at ${stationName} station towards ${terminalName}`;
}

const WALK_ONLY_MAX_METERS = 1000;

function formatKm(meters: number): string {
  return (meters / 1000).toFixed(1);
}

function walkSegmentText(
  lang: "en" | "fa",
  fromName: string,
  toName: string,
  meters?: number
): string {
  const long = (meters ?? 0) > WALK_ONLY_MAX_METERS;
  if (lang === "fa") {
    return long
      ? `برای رسیدن به ایستگاه ${toName} (${formatKm(meters!)} کیلومتر) می‌توانید پیاده بروید یا با اسنپ/تاکسی بروید`
      : `تا ایستگاه ${toName} پیاده بروید`;
  }
  return long
    ? `To reach ${toName} station (${formatKm(meters!)} km), take a taxi/Snapp or walk`
    : `Walk to ${toName} station`;
}

/**
 * Guide shown at the last usable station before a walk gap: names the
 * broken station(s) being bypassed and tells the rider to exit and
 * cover the gap on foot or by taxi/Snapp.
 */
export function getWalkDepartureGuide(
  route: RouteResult,
  walkIndex: number,
  lang: "en" | "fa",
  getStationDisplay: (id: string) => string
): string {
  const step = route.steps[walkIndex];
  if (!step?.walk || !step.walkFrom) return "";
  const fromName = getStationDisplay(step.walkFrom);
  const toName = getStationDisplay(step.stationId);
  const brokenNames = (step.walkBlocked ?? [])
    .map((id) => getStationDisplay(id))
    .filter(Boolean);

  const long = (step.walkMeters ?? 0) > WALK_ONLY_MAX_METERS;
  const km = `(${formatKm(step.walkMeters ?? 0)} ${lang === "fa" ? "کیلومتر" : "km"})`;

  const reason =
    brokenNames.length > 0
      ? lang === "fa"
        ? `ایستگاه ${brokenNames.join(" و ")} خراب است`
        : `${brokenNames.join(" and ")} station is closed`
      : lang === "fa"
        ? "مسیر از ایستگاه بعدی قطع است"
        : "the line is interrupted after this stop";

  const action =
    lang === "fa"
      ? long
        ? `از ایستگاه ${fromName} خارج شوید و تا ایستگاه ${toName} ${km} با اسنپ/تاکسی بروید یا پیاده روی کنید`
        : `از اینجا خارج شوید و تا ایستگاه ${toName} پیاده بروید`
      : long
        ? `Exit at ${fromName} station and take a taxi/Snapp or walk ${km} to ${toName} station`
        : `Exit here and walk to ${toName} station`;

  return `${reason}${lang === "fa" ? "؛ " : ". "}${action}`;
}

export function getTransferGuide(
  route: RouteResult,
  transferIndex: number,
  lines: LinesMap,
  paths: PathsMap,
  lang: "en" | "fa",
  getStationDisplay: (id: string) => string
): string {
  if (transferIndex >= route.steps.length - 1) {
    const only = route.steps[transferIndex];
    if (only?.walk) {
      const fromName = getStationDisplay(only.walkFrom ?? "");
      const toName = getStationDisplay(only.stationId);
      const segment = walkSegmentText(lang, fromName, toName, only.walkMeters);
      return lang === "fa"
        ? `در ایستگاه ${fromName} پیاده شوید و ${segment}`
        : `Get off at ${fromName} station and ${segment.charAt(0).toLowerCase()}${segment.slice(1)}`;
    }
    return "";
  }

  const currentStep = route.steps[transferIndex];
  const nextStep = route.steps[transferIndex + 1];
  if (!currentStep?.transferTo || !nextStep) return "";

  const toLine =
    lines[currentStep.transferTo]?.name[lang] || currentStep.transferTo;
  const stationName = getStationDisplay(currentStep.stationId);

  const terminal = getLineTerminal(
    paths,
    currentStep.transferTo,
    currentStep.stationId,
    nextStep.stationId
  );
  const terminalName = getStationDisplay(terminal);

  let base: string;
  if (currentStep.walk) {
    // Arrival side of a walk gap only needs the boarding instruction —
    // the walk/broken-station explanation lives at the departure marker.
    base =
      lang === "fa"
        ? `سوار ${toLine} به سمت ${terminalName} شوید`
        : `Board ${toLine} towards ${terminalName}`;
  } else {
    base =
      lang === "fa"
        ? `در ایستگاه ${stationName} پیاده شوید و به سمت ${toLine} ${terminalName} بروید`
        : `At ${stationName} station, transfer to ${toLine} towards ${terminalName}`;
  }

  const isLastTransfer = route.steps
    .slice(transferIndex + 1)
    .every((step) => !step.transferTo);
  if (!isLastTransfer) return base;

  const noMoreTransfers =
    lang === "fa"
      ? "این آخرین تعویض است، تا مقصد بمانید."
      : "Last transfer — ride to your destination.";
  return `${base} ${noMoreTransfers}`;
}
