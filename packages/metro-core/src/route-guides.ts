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

export function getTransferGuide(
  route: RouteResult,
  transferIndex: number,
  lines: LinesMap,
  paths: PathsMap,
  lang: "en" | "fa",
  getStationDisplay: (id: string) => string
): string {
  if (transferIndex >= route.steps.length - 1) return "";

  const currentStep = route.steps[transferIndex];
  const nextStep = route.steps[transferIndex + 1];
  if (!currentStep?.transferTo || !nextStep) return "";

  const toLine = lines[currentStep.transferTo]?.name[lang] || currentStep.transferTo;
  const stationName = getStationDisplay(currentStep.stationId);

  const terminal = getLineTerminal(
    paths,
    currentStep.transferTo,
    currentStep.stationId,
    nextStep.stationId
  );
  const terminalName = getStationDisplay(terminal);

  const base =
    lang === "fa"
      ? `در ایستگاه ${stationName} پیاده شوید و به سمت ${toLine} ${terminalName} بروید`
      : `At ${stationName} station, transfer to ${toLine} towards ${terminalName}`;

  const isLastTransfer = route.steps
    .slice(transferIndex + 1)
    .every((step) => !step.transferTo);
  if (!isLastTransfer) return base;

  const noMoreTransfers =
    lang === "fa" ? "این آخرین تعویض است، تا مقصد بمانید." : "Last transfer — ride to your destination.";
  return `${base} ${noMoreTransfers}`;
}
