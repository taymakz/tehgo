import { RouteResult, LinesMap, PathsMap } from '@/types/metro';
import pathsData from '@/data/paths.json';

const paths = pathsData as PathsMap;

function getLineTerminal(line: string, startStationId: string, nextStationId: string): string {
  const linePaths = paths[line]?.paths;
  if (!linePaths) return '';

  for (const path of linePaths) {
    const stationIndex = path.stations.indexOf(startStationId);
    const nextIndex = path.stations.indexOf(nextStationId);
    if (stationIndex !== -1 && nextIndex !== -1) {
      if (nextIndex > stationIndex) {
        return path.to;
      } else {
        return path.from;
      }
    }
  }
  return '';
}

export { getLineTerminal };

export function getFirstStepGuide(
  route: RouteResult,
  lines: LinesMap,
  lang: 'en' | 'fa',
  getStationDisplay: (id: string) => string
): string {
  if (route.steps.length === 0) return '';

  const firstStep = route.steps[0];
  const lineId = firstStep.line;
  const lineName = lines[lineId]?.name[lang] || lineId;

  // پیدا کردن آخرین ایستگاه این خط در مسیر
  let lastStationOnLine = firstStep.stationId;
  for (const step of route.steps) {
    if (step.line !== lineId) break;
    lastStationOnLine = step.stationId;
  }

  const terminal = getLineTerminal(
    lineId,
    firstStep.stationId,
    lastStationOnLine
  );

  const stationName = getStationDisplay(firstStep.stationId);
  const terminalName = getStationDisplay(terminal);

  return lang === 'fa'
    ? `از ایستگاه ${stationName} سوار ${lineName} به سمت ${terminalName} شوید`
    : `Board ${lineName} at ${stationName} station towards ${terminalName}`;
}


export function getTransferGuide(
  route: RouteResult,
  transferIndex: number,
  lines: LinesMap,
  lang: 'en' | 'fa',
  getStationDisplay: (id: string) => string
): string {
  if (transferIndex >= route.steps.length - 1) return '';

  const currentStep = route.steps[transferIndex];
  const nextStep = route.steps[transferIndex + 1];
  if (!currentStep.transferTo) return '';

  const toLine = lines[currentStep.transferTo]?.name[lang] || currentStep.transferTo;
  const stationName = getStationDisplay(currentStep.stationId);

  const terminal = getLineTerminal(currentStep.transferTo, currentStep.stationId, nextStep.stationId);
  const terminalName = getStationDisplay(terminal);

  return lang === 'fa'
    ? `در ایستگاه ${stationName} پیاده شوید و به سمت ${toLine} ${terminalName} بروید`
    : `At ${stationName} station, transfer to ${toLine} towards ${terminalName}`;
}
