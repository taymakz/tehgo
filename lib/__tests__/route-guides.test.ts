import { getFirstStepGuide, getTransferGuide, getLineTerminal } from '../route-guides';
import { RouteResult, LinesMap, StationsMap } from '@/types/metro';
import linesData from '@/data/lines.json';
import stationsData from '@/data/stations.json';

const lines = linesData as LinesMap;
const stations = stationsData as StationsMap;

const getStationDisplay = (id: string) => {
  const station = stations[id];
  if (!station) return id;
  return station.translations?.fa || station.name;
};

describe('getFirstStepGuide – multiple scenarios', () => {
  it('line 3: aghdasiyeh → shahid_mahallati (towards azadegan)', () => {
    const route: RouteResult = {
      steps: [
        { stationId: 'aghdasiyeh', station: stations['aghdasiyeh'], line: 'line_3', isTransfer: false },
        { stationId: 'shahid_mahallati', station: stations['shahid_mahallati'], line: 'line_3', isTransfer: false },
      ],
      totalStations: 2,
      totalTransfers: 0,
      lines: ['line_3'],
    };

    expect(getFirstStepGuide(route, lines, 'fa', getStationDisplay))
      .toBe('از ایستگاه اقدسیه سوار خط 3 به سمت قائم شوید');
  });

  it('line 3: aghdasiyeh → nobonyad (towards qa_em)', () => {
    const route: RouteResult = {
      steps: [
        { stationId: 'aghdasiyeh', station: stations['aghdasiyeh'], line: 'line_3', isTransfer: false },
        { stationId: 'nobonyad', station: stations['nobonyad'], line: 'line_3', isTransfer: false },
      ],
      totalStations: 2,
      totalTransfers: 0,
      lines: ['line_3'],
    };

    expect(getFirstStepGuide(route, lines, 'fa', getStationDisplay))
      .toBe('از ایستگاه اقدسیه سوار خط 3 به سمت آزادگان شوید');
  });

  it('line 1: tajrish → gheytariyeh (towards tajrish)', () => {
    const route: RouteResult = {
      steps: [
        { stationId: 'tajrish', station: stations['tajrish'], line: 'line_1', isTransfer: false },
        { stationId: 'gheytariyeh', station: stations['gheytariyeh'], line: 'line_1', isTransfer: false },
      ],
      totalStations: 2,
      totalTransfers: 0,
      lines: ['line_1'],
    };

    expect(getFirstStepGuide(route, lines, 'fa', getStationDisplay))
      .toBe('از ایستگاه تجریش سوار خط 1 به سمت شاهد - باقرشهر شوید');
  });

  it('line 2: tehran_sadeghiyeh → tarasht (towards farhangsara)', () => {
    const route: RouteResult = {
      steps: [
        { stationId: 'tehran_sadeghiyeh', station: stations['tehran_sadeghiyeh'], line: 'line_2', isTransfer: false },
        { stationId: 'tarasht', station: stations['tarasht'], line: 'line_2', isTransfer: false },
      ],
      totalStations: 2,
      totalTransfers: 0,
      lines: ['line_2'],
    };

    expect(getFirstStepGuide(route, lines, 'fa', getStationDisplay))
      .toBe('از ایستگاه تهران (صادقیه) سوار خط 2 به سمت فرهنگسرا شوید');
  });

  it('line 7: basij → ahang (towards meydan_e_ketab)', () => {
    const route: RouteResult = {
      steps: [
        { stationId: 'basij', station: stations['basij'], line: 'line_7', isTransfer: false },
        { stationId: 'ahang', station: stations['ahang'], line: 'line_7', isTransfer: false },
      ],
      totalStations: 2,
      totalTransfers: 0,
      lines: ['line_7'],
    };

    expect(getFirstStepGuide(route, lines, 'fa', getStationDisplay))
      .toBe('از ایستگاه بسیج سوار خط 7 به سمت میدان کتاب شوید');
  });
});

describe('getLineTerminal', () => {
  it('should return qa_em for line_3 from aghdasiyeh to shahid_mahallati', () => {
    expect(getLineTerminal('line_3', 'aghdasiyeh', 'shahid_mahallati')).toBe('qa_em');
  });

  it('should return azadegan for line_3 from nobonyad to aghdasiyeh', () => {
    expect(getLineTerminal('line_3', 'nobonyad', 'aghdasiyeh')).toBe('qa_em');
  });

  it('should return farhangsara for line_2 from tehran_sadeghiyeh to tarasht', () => {
    expect(getLineTerminal('line_2', 'tehran_sadeghiyeh', 'tarasht')).toBe('farhangsara');
  });

  it('should return shahed_baghershahr for line_1 from tajrish to gheytariyeh', () => {
    expect(getLineTerminal('line_1', 'tajrish', 'gheytariyeh')).toBe('shahed_baghershahr');
  });
});

describe('getTransferGuide', () => {
  it('should generate transfer guide for line change at shahid_beheshti', () => {
    const route: RouteResult = {
      steps: [
        { stationId: 'shahid_beheshti', station: stations['shahid_beheshti'], line: 'line_1', isTransfer: true, transferTo: 'line_3' },
        { stationId: 'sohrevardi', station: stations['sohrevardi'], line: 'line_3', isTransfer: false },
      ],
      totalStations: 2,
      totalTransfers: 1,
      lines: ['line_1', 'line_3'],
    };

    expect(getTransferGuide(route, 0, lines, 'fa', getStationDisplay))
      .toBe('در ایستگاه شهید بهشتی پیاده شوید و به سمت خط 3 قائم بروید');
  });

  it('should return empty string for non-transfer step', () => {
    const route: RouteResult = {
      steps: [
        { stationId: 'aghdasiyeh', station: stations['aghdasiyeh'], line: 'line_3', isTransfer: false },
        { stationId: 'shahid_mahallati', station: stations['shahid_mahallati'], line: 'line_3', isTransfer: false },
      ],
      totalStations: 2,
      totalTransfers: 0,
      lines: ['line_3'],
    };

    expect(getTransferGuide(route, 0, lines, 'fa', getStationDisplay)).toBe('');
  });
});
