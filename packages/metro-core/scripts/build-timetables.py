#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Build the metro timetable index from the official station timetables.
Reads the legacy .xls files in <repo>/_excel and writes
packages/metro-core/src/data/timetables.json.

Run from this directory:
    python build-timetables.py
Requires: xlrd  (python -m pip install xlrd)

Source files (Mehr 1404, line 7: Khordad 1405, Parand: Mehr 1403):
  each workbook  = one line (or branch)
  each sheet     = one direction x one day-type
  header row     = [trainNo?, headway, station, gap, station, gap, ...]
                   (line 5 has no gap columns)
  data rows      = one train per row, excel-time fractions per station.
                   empty cell = train skips / does not serve that station.

Output JSON:
  { version, source, dayTypes,
    stations: { stationId: { lineId: { directionId: { weekday: [min...],
                                                     thursday: [...],
                                                     friday: [...] } } } } }
  times are integer minutes since midnight, sorted, deduped.
  directionId = destination (terminal) station id of that sheet.
  dayTypes: weekday = Sat-Wed, thursday = Thu, friday = Fri & holidays.
"""

import glob
import json
import os
import re
import sys

try:
    import xlrd
except ImportError:
    sys.exit("xlrd is required: python -m pip install xlrd")

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", "..", ".."))
EXCEL_DIR = os.path.join(ROOT, "_excel")
OUT_PATH = os.path.join(HERE, "..", "src", "data", "timetables.json")
STATIONS_PATH = os.path.join(HERE, "..", "src", "data", "stations.json")

WEEKDAY = "weekday"
THURSDAY = "thursday"
FRIDAY = "friday"

# ---------------------------------------------------------------- config
# file match (substring of workbook file name) -> line + direction terminals.
# dirs: [direction-of-first-half-sheets, direction-of-second-half-sheets]
# day2: files with only 2 day-types (adi vs tatil). adi fills weekday+thursday.
FILES = [
    {"match": ["1_"], "line": "line_1",
     "dirs": ["kahrizak", "tajrish"]},
    {"match": ["2_"], "line": "line_2",
     "dirs": ["farhangsara", "tehran_sadeghiyeh"]},
    {"match": ["3_"], "line": "line_3",
     "dirs": ["qa_em", "azadegan"]},
    {"match": ["4_", "فرودگاه"], "line": "line_4",
     "dirs": ["mehrabad_airport_terminal_4_6", "bimeh"], "day2": True},
    {"match": ["4_"], "line": "line_4",
     "dirs": ["shahid_kolahdooz", "allameh_jafari"]},
    {"match": ["5_", "پنج"], "line": "line_5",
     "dirs": ["tehran_sadeghiyeh", "golshahr"]},
    {"match": ["7_"], "line": "line_7",
     "dirs": ["varzeshgah_e_takhti", "meydan_e_ketab"]},
    {"match": ["پرند"], "line": "line_1",
     "dirs": ["shahed_baghershahr", "shahr_e_parand"], "daily": True},
    {"match": ["زمانبندی"], "line": "line_6",
     "dirs": ["shohada_ye_dowlat_abad", "kouhsar"]},
]
# NOTE: "5_" + هشتگرد (Hashtgerd extension) is intentionally skipped:
# Hashtgerd/Mamout stations are not on the map (no station ids).

# Stations missing from the official tables that sit BETWEEN two timetabled
# stops of the same trains: per-train midpoint of the neighbors (bounded,
# ~1-2 min error).
INTERPOLATE = [
    {"line": "line_1", "station": "vavan",
     "prev": "namayeshgah_e_shahr_e_aftab", "next": "emam_khomeini_airport"},
    {"line": "line_6", "station": "shohada_ye_hefdah_e_shahrivar",
     "prev": "amirkabir", "next": "meydan_e_khorasan"},
]

# Endpoint extensions beyond the official tables' edges. Unlike INTERPOLATE
# above, these assume through-service past the last tabulated station, so the
# segment time is MEASURED per sheet from a real neighboring segment
# (seg_pair) and applied with an explicit sign per direction. Grounded, but
# still estimates — every target lands in the output "estimated" list.
#   (line, dir) -> { seg_pair, anchor, add: {station: signed_steps} }
EXTRAPOLATE = {
    ("line_6", "shohada_ye_dowlat_abad"): {
        "seg_pair": ("kiyan_shahr", "shohada_ye_dowlat_abad"),
        "anchor": "shohada_ye_dowlat_abad",
        "add": {"cheshmeh_ali": 1, "ebn_e_babviyeh": 2,
                "meydan_e_hazrat_e_abdol_azim": 3,
                "haram_e_hazrat_e_abdol_azim": 4}},
    ("line_6", "kouhsar"): {
        "seg_pair": ("kiyan_shahr", "shohada_ye_dowlat_abad"),
        "anchor": "shohada_ye_dowlat_abad",
        "add": {"cheshmeh_ali": -1, "ebn_e_babviyeh": -2,
                "meydan_e_hazrat_e_abdol_azim": -3,
                "haram_e_hazrat_e_abdol_azim": -4}},
    ("line_5", "golshahr"): {
        "seg_pair": ("mohammadshahr", "golshahr"),
        "anchor": "golshahr",
        "add": {"shahid_sepahbod_qasem_soleimani": 1}},
    ("line_5", "tehran_sadeghiyeh"): {
        "seg_pair": ("mohammadshahr", "golshahr"),
        "anchor": "golshahr",
        "add": {"shahid_sepahbod_qasem_soleimani": -1}},
    ("line_4", "shahid_kolahdooz"): {
        "seg_pair": ("allameh_jafari", "eram_e_sabz"),
        "anchor": "allameh_jafari",
        "add": {"ayatollah_kashani": -1, "chaharbagh": -2}},
    ("line_4", "allameh_jafari"): {
        "seg_pair": ("allameh_jafari", "eram_e_sabz"),
        "anchor": "allameh_jafari",
        "add": {"ayatollah_kashani": 1, "chaharbagh": 2}},
}


def norm(s):
    """Normalize a Persian station label for matching."""
    s = str(s).strip()
    s = s.replace("ي", "ی").replace("ك", "ک").replace("ؤ", "و").replace("ئ", "ی")
    s = s.replace("آ", "ا")
    s = s.replace("ـ", "")  # kashida
    # source files inconsistently write single/double ل (عبداله/عبدالله، اله/الله)
    s = s.replace("لل", "ل")
    # drop parenthetical suffixes like (ع)، (ره)، (س)، (عج)، (بیمارستان ...)
    s = re.sub(r"\(.*?\)", "", s)
    s = s.replace("‌", "").replace(" ", "").replace("\n", "").replace("\t", "")
    # strip Arabic diacritics (tashkeel: shadda, fatha, ...)
    s = re.sub(r"[ً-ٟ]", "", s)
    # unify digits
    out = []
    for ch in s:
        o = ord(ch)
        if 0x06F0 <= o <= 0x06F9:
            out.append(chr(ord("0") + o - 0x06F0))
        elif 0x0660 <= o <= 0x0669:
            out.append(chr(ord("0") + o - 0x0660))
        else:
            out.append(ch)
    return "".join(out)


# explicit excel-label -> station id (keys are normalized on load)
ALIASES_RAW = {
    "آیت الله کاشانی": "ayatollah_kashani",
    "اشرفی اصفهانی": "shahid_ashrafi_esfahani",
    "بهار شیراز": "bahar_shiraz_khanevadeh_hospital",
    "بهارشیراز": "bahar_shiraz_khanevadeh_hospital",
    "تربیت مدرس": "daneshgah_e_tarbiat_modarres",
    "حرم مطهر امام خمینی": "holy_shrine_of_imam_khomeini",
    "دولت آباد": "shohada_ye_dowlat_abad",
    "سربازوطن": "sarbaz",
    "شاهد": "shahed_baghershahr",
    "شهدای 17شهریور": "shohada_ye_hefdah_e_shahrivar",
    "شهدای هفت تیر": "shohada_ye_haftom_e_tir",
    "شهرری": "shahr_e_rey",
    "شهرزیبا": "shahr_e_ziba",
    "شهید آرمان": "kouhsar",
    "شهید بخارایی": "shahid_bokharaei",
    "شهیدمفتح": "shahid_mofattah",
    "صادقیه": "tehran_sadeghiyeh",
    "طالقانی": "ayatollah_taleghani",
    "کیانشهر": "kiyan_shahr",
    "مریم مقدس": "maryam_e_moghaddas",
    "میدان ولیعصر": "meydan_e_hazrat_vali_asr",
    "میرزای شیرازی": "mirza_ye_shirazi",
    "هروی": "meydan_e_heravi",
    "پایانه جنوب": "payaneh_jonoub_jonoub_terminal",
    "خواجه عبداله انصاری": "khajeh_abdollah_e_ansari",
    "پایانه 1و2فرودگاه مهرآباد": "mehrabad_airport_terminal_1_2",
    "پایانه 4و6فرودگاه مهرآباد": "mehrabad_airport_terminal_4_6",
    "گرمدره": "garmdareh",
    "زمزم": "zamzam",
    "پرند": "shahr_e_parand",
    "شهر آفتاب": "namayeshgah_e_shahr_e_aftab",
}
ALIASES = {norm(k): v for k, v in ALIASES_RAW.items()}


def detect_day_types(sheet_name):
    n = norm(sheet_name)
    if "پنجشنبه" in n:
        return [THURSDAY]
    if "جمعه" in n or "تعطیل" in n:
        return [FRIDAY]
    return [WEEKDAY]  # عادی


def find_header_row(sh):
    """Pick the most station-like header row.

    Title rows may also mention headway ("هدوی"), so among all candidate
    rows (headway- or departure-wording) choose the one holding the most
    non-empty label cells: the real per-station header always wins.
    """
    best, best_count = -1, 0
    for r in range(min(sh.nrows, 8)):
        texts = [sh.cell_value(r, c) for c in range(sh.ncols)]
        if not any(isinstance(v, str) and ("هدو" in v or "اعزام" in v or "دریافت" in v)
                   for v in texts):
            continue
        count = sum(1 for v in texts
                    if isinstance(v, str) and v.strip()
                    and not is_headway_cell(v) and v.strip() != "EXP")
        if count > best_count:
            best, best_count = r, count
    return best


def frac_to_minutes(v):
    if not isinstance(v, (int, float)) or isinstance(v, bool):
        return None
    if v < 0 or v >= 1:
        return None
    return int(round(float(v) * 24 * 60)) % 1440


def is_headway_cell(s):
    # headway columns read "هدوی"/"هدوی EXP". NOTE: plain substring match is
    # wrong — "کلاهدوز" contains "هدو" but is a real station.
    return str(s).strip().startswith("هدو")


def safe(s):
    return str(s).encode("unicode_escape").decode("ascii")


def main():
    with open(STATIONS_PATH, encoding="utf-8") as f:
        stations = json.load(f)
    fa_index = {norm(v["translations"]["fa"]): k for k, v in stations.items()}

    def resolve(label):
        """excel header label -> station id (or None)."""
        s = str(label).strip()
        if not s or is_headway_cell(s) or s == "EXP":
            return None
        n = norm(s)
        # departure/arrival wording on the Parand sheets (normalized: no spaces)
        for prefix in ("اعزاماز", "دریافت"):
            if n.startswith(prefix):
                n = n[len(prefix):]
                break
        sid = ALIASES.get(n, fa_index.get(n))
        if sid is not None and sid not in stations:
            print(f"WARN alias target missing from stations.json: {safe(s)} -> {sid}")
            return None
        return sid

    files = sorted(glob.glob(os.path.join(EXCEL_DIR, "*")))
    if not files:
        sys.exit(f"no files in {EXCEL_DIR}")

    index = {}  # station -> line -> direction -> day -> set(minutes)
    stats = []
    unmatched = set()
    skipped_files = []

    for path in files:
        base = os.path.basename(path)
        nbase = norm(base)
        cfg = next((c for c in FILES
                    if all(norm(m) in nbase for m in c["match"])), None)
        if cfg is None:
            skipped_files.append(base)
            continue
        wb = xlrd.open_workbook(path)
        half = wb.nsheets // 2
        for si in range(wb.nsheets):
            sh = wb.sheet_by_index(si)
            direction = cfg["dirs"][0] if si < half else cfg["dirs"][1]
            if cfg.get("daily"):
                day_types = [WEEKDAY, THURSDAY, FRIDAY]
            else:
                day_types = detect_day_types(sh.name)
                if cfg.get("day2") and day_types == [WEEKDAY]:
                    day_types = [WEEKDAY, THURSDAY]
            hr = find_header_row(sh)
            if hr < 0:
                print(f"WARN no header row: {safe(base)} / {safe(sh.name)}")
                continue
            # station columns = header cells holding a resolvable label
            cols = []  # (col, station_id)
            for c in range(sh.ncols):
                v = sh.cell_value(hr, c)
                if isinstance(v, str) and v.strip():
                    sid = resolve(v)
                    if sid is None:
                        if not is_headway_cell(v) and v.strip() != "EXP":
                            unmatched.add(v.strip())
                        continue
                    cols.append((c, sid))
            trains = 0
            col_by_sid = {}
            for c, sid in cols:
                col_by_sid.setdefault(sid, c)
            interp_targets = []
            for spec in INTERPOLATE:
                if spec["line"] != cfg["line"]:
                    continue
                if spec["station"] not in stations:
                    print(f"WARN interp target missing: {safe(spec['station'])}")
                    continue
                if spec["prev"] in col_by_sid and spec["next"] in col_by_sid:
                    interp_targets.append(
                        (spec["station"], col_by_sid[spec["prev"]],
                         col_by_sid[spec["next"]]))
            # endpoint extrapolation: measure the reference segment per sheet
            extrap = None
            espec = EXTRAPOLATE.get((cfg["line"], direction))
            if espec:
                sa, sb = espec["seg_pair"]
                anchor = espec["anchor"]
                if anchor in col_by_sid and sa in col_by_sid and sb in col_by_sid:
                    diffs = []
                    for r in range(hr + 1, sh.nrows):
                        a = frac_to_minutes(sh.cell_value(r, col_by_sid[sa]))
                        b = frac_to_minutes(sh.cell_value(r, col_by_sid[sb]))
                        if a is not None and b is not None and abs(b - a) < 30:
                            diffs.append(abs(b - a))
                    diffs.sort()
                    seg = diffs[len(diffs) // 2] if diffs else 2
                    targets = [(t, k) for t, k in espec["add"].items()
                               if t in stations]
                    if targets:
                        extrap = (col_by_sid[anchor], seg, targets)
            interp_rows = 0
            extrap_rows = 0
            for r in range(hr + 1, sh.nrows):
                hit = False
                for c, sid in cols:
                    m = frac_to_minutes(sh.cell_value(r, c))
                    if m is None:
                        continue
                    hit = True
                    for dt in day_types:
                        index.setdefault(sid, {}).setdefault(cfg["line"], {}) \
                            .setdefault(direction, {}).setdefault(dt, set()).add(m)
                for target, cp, cn in interp_targets:
                    a = frac_to_minutes(sh.cell_value(r, cp))
                    b = frac_to_minutes(sh.cell_value(r, cn))
                    if a is None or b is None:
                        continue
                    m = (a + b + 1) // 2
                    hit = True
                    interp_rows += 1
                    for dt in day_types:
                        index.setdefault(target, {}).setdefault(cfg["line"], {}) \
                            .setdefault(direction, {}).setdefault(dt, set()).add(m)
                if extrap is not None:
                    ca, seg, targets = extrap
                    anchor_t = frac_to_minutes(sh.cell_value(r, ca))
                    if anchor_t is not None:
                        for target, k in targets:
                            m = (anchor_t + k * seg) % 1440
                            hit = True
                            extrap_rows += 1
                            for dt in day_types:
                                index.setdefault(target, {}) \
                                    .setdefault(cfg["line"], {}) \
                                    .setdefault(direction, {}) \
                                    .setdefault(dt, set()).add(m)
                if hit:
                    trains += 1
            stats.append({"file": base, "sheet": sh.name, "line": cfg["line"],
                          "direction": direction, "days": day_types,
                          "stations": len(cols), "trains": trains,
                          "interp_rows": interp_rows, "extrap_rows": extrap_rows,
                          "seg": extrap[1] if extrap is not None else None})

    # finalize: sorted lists
    out_stations = {}
    total_times = 0
    for sid, lines in index.items():
        out_stations[sid] = {}
        for line, dirs in lines.items():
            out_stations[sid][line] = {}
            for d, days in dirs.items():
                out_stations[sid][line][d] = {}
                for dt, vals in days.items():
                    arr = sorted(vals)
                    out_stations[sid][line][d][dt] = arr
                    total_times += len(arr)

    out = {
        "version": 1,
        "source": "Tehran metro station timetables: Mehr 1404 (line 7: Khordad 1405, Parand branch: Mehr 1403)",
        "dayTypes": [WEEKDAY, THURSDAY, FRIDAY],
        "estimated": sorted(
            {s["station"] for s in INTERPOLATE} |
            {t for spec in EXTRAPOLATE.values() for t in spec["add"]}),
        "stations": out_stations,
    }
    os.makedirs(os.path.dirname(OUT_PATH), exist_ok=True)
    with open(OUT_PATH, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, separators=(",", ":"))
    size_kb = os.path.getsize(OUT_PATH) / 1024

    print(f"stations with data: {len(out_stations)}")
    print(f"total departure times: {total_times}")
    print(f"wrote {OUT_PATH} ({size_kb:.0f} KB)")
    print("per-sheet stats:")
    for s in stats:
        extra = ""
        if s.get("interp_rows"):
            extra += f" interp={s['interp_rows']}"
        if s.get("extrap_rows"):
            extra += f" extrap={s['extrap_rows']} seg={s.get('seg')}"
        print(f"  {s['line']} -> {s['direction']} [{','.join(s['days'])}]"
              f" stations={s['stations']} trains={s['trains']}{extra} :: {safe(s['sheet'])}")
    print(f"skipped files (no config): {len(skipped_files)}")
    for s in skipped_files:
        print(f"  SKIP {safe(s)}")
    if unmatched:
        print(f"UNMATCHED labels ({len(unmatched)}):")
        for u in sorted(unmatched):
            print(f"  ?? {safe(u)}")
    # coverage per line: stations on map without any data
    from collections import defaultdict
    covered = defaultdict(set)
    for sid, lines in out_stations.items():
        for line in lines:
            covered[line].add(sid)
    print("coverage gaps (map stations with no timetable):")
    for line in sorted({s["line"] for s in stats}):
        map_ids = {k for k, v in stations.items() if line in v.get("lines", [])}
        missing = sorted(map_ids - covered[line])
        print(f"  {line}: {len(map_ids) - len(missing)}/{len(map_ids)}"
              + (f" missing: {', '.join(missing)}" if missing else ""))


if __name__ == "__main__":
    main()
