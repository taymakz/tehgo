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

export function getFirstStepGuide(
  route: RouteResult,
  lines: LinesMap,
  lang: 'en' | 'fa',
  getStationDisplay: (id: string) => string
): string {
  if (!route.steps.length) return '';

  const firstStep = route.steps[0];
  const lastStep = route.steps[route.steps.length - 1];
  const lineName = lines[firstStep.line]?.name[lang] || firstStep.line;

  // سرخط را از مسیر استخراج می‌کنیم: اولین یا آخرین ایستگاه path در همان خط
  let segmentEndIndex = route.steps.length - 1;
  for (let i = route.steps.length - 1; i >= 0; i--) {
    if (route.steps[i].line === firstStep.line) {
      segmentEndIndex = i;
      break;
    }
  }

  const endStationName = getStationDisplay(route.steps[segmentEndIndex].stationId);
  const stationName = getStationDisplay(firstStep.stationId);

  return lang === 'fa'
    ? `از ایستگاه ${stationName} سوار ${lineName} به سمت ${endStationName} شوید`
    : `Board ${lineName} at ${stationName} station towards ${endStationName}`;
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
