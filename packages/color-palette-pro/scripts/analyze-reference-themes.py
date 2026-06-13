#!/usr/bin/env python3
"""
Pattern mining across top-marketplace VS Code themes (scripts/reference-themes/).

For each theme: extract syntax roles via TextMate scope matching + key UI surfaces,
convert to OKLCH, then report cross-theme patterns:
  1. loud-token L/C bands
  2. per-role hue conventions (do keywords cluster purple? strings green?)
  3. hue ↔ lightness relationship (is "yellow light, blue dark" a real rule?)
  4. pairwise ΔE distributions (how distinct do real themes keep roles?)
  5. surface structure: chrome chroma/neutrality, sidebar↔editor ΔL, statusbar
  6. comment treatment: chroma, contrast, hue relative to bg
  7. accent structure: how many roles carry the chroma peak
"""

import json
import math
import os
import re
import sys
from collections import defaultdict

HERE = os.path.dirname(os.path.abspath(__file__))
DIR = os.path.join(HERE, 'reference-themes')

# ---------- JSONC ----------

def strip_jsonc(text: str) -> str:
    out = []
    i, n = 0, len(text)
    in_str = False
    while i < n:
        ch = text[i]
        if in_str:
            out.append(ch)
            if ch == '\\' and i + 1 < n:
                out.append(text[i + 1])
                i += 2
                continue
            if ch == '"':
                in_str = False
            i += 1
            continue
        if ch == '"':
            in_str = True
            out.append(ch)
            i += 1
            continue
        if ch == '/' and i + 1 < n and text[i + 1] == '/':
            while i < n and text[i] != '\n':
                i += 1
            continue
        if ch == '/' and i + 1 < n and text[i + 1] == '*':
            i += 2
            while i + 1 < n and not (text[i] == '*' and text[i + 1] == '/'):
                i += 1
            i += 2
            continue
        out.append(ch)
        i += 1
    s = ''.join(out)
    s = re.sub(r',\s*([}\]])', r'\1', s)
    return s


def load_theme(path: str) -> dict:
    with open(path, encoding='utf-8') as f:
        d = json.loads(strip_jsonc(f.read()))
    inc = d.get('include')
    if inc:
        base = load_theme(os.path.join(os.path.dirname(path), inc))
        colors = {**base.get('colors', {}), **d.get('colors', {})}
        tokens = base.get('tokenColors', []) + d.get('tokenColors', [])
        merged = {**base, **d}
        merged['colors'] = colors
        merged['tokenColors'] = tokens
        return merged
    return d

# ---------- color math ----------

def hex_to_rgb(h):
    h = h.lstrip('#')
    if len(h) >= 6:
        return tuple(int(h[i:i + 2], 16) / 255 for i in (0, 2, 4))
    if len(h) == 3:
        return tuple(int(c * 2, 16) / 255 for c in h)
    raise ValueError(h)


def srgb_to_linear(c):
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4


def rgb_to_oklab(rgb):
    r, g, b = (srgb_to_linear(c) for c in rgb)
    l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b
    m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b
    s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b
    l_, m_, s_ = (x ** (1 / 3) for x in (l, m, s))
    return (
        0.2104542553 * l_ + 0.7936177850 * m_ - 0.0040720468 * s_,
        1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_,
        0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_,
    )


def oklch(hexstr):
    L, a, b = rgb_to_oklab(hex_to_rgb(hexstr))
    C = math.hypot(a, b)
    h = math.degrees(math.atan2(b, a)) % 360
    return L, C, h


def delta_e(h1, h2):
    a = rgb_to_oklab(hex_to_rgb(h1))
    b = rgb_to_oklab(hex_to_rgb(h2))
    return math.dist(a, b) * 100


def apca(fg_hex, bg_hex):
    def y(hexstr):
        r, g, b = hex_to_rgb(hexstr)
        Y = 0.2126729 * r ** 2.4 + 0.7151522 * g ** 2.4 + 0.0721750 * b ** 2.4
        return Y + (0.022 - Y) ** 1.414 if Y < 0.022 else Y
    yf, yb = y(fg_hex), y(bg_hex)
    if yb > yf:
        s = (yb ** 0.56 - yf ** 0.57) * 1.14
        out = 0 if s < 0.1 else s - 0.027
    else:
        s = (yb ** 0.65 - yf ** 0.62) * 1.14
        out = 0 if s > -0.1 else s + 0.027
    return out * 100


def hue_gap(a, b):
    d = abs(a - b) % 360
    return 360 - d if d > 180 else d

# ---------- role extraction (TextMate prefix matching) ----------

ROLE_TARGETS = {
    'keyword': ['keyword.control', 'keyword'],
    'storage': ['storage.type', 'storage'],
    'string': ['string.quoted.double', 'string'],
    'number': ['constant.numeric'],
    'function': ['entity.name.function', 'support.function'],
    'type': ['entity.name.type.class', 'entity.name.type', 'support.class', 'entity.name.class', 'support.type'],
    'variable': ['variable.other.readwrite', 'variable'],
    'property': ['variable.other.property', 'support.type.property-name'],
    'operator': ['keyword.operator'],
    'punctuation': ['punctuation.separator', 'punctuation'],
    'tag': ['entity.name.tag'],
    'constant': ['constant.language'],
    'comment': ['comment.line', 'comment'],
}


def scope_matches(selector: str, target: str) -> int:
    """Return specificity (len of matched prefix) if simple selector matches target scope."""
    selector = selector.strip()
    if not selector or ' ' in selector or ',' in selector:
        return 0
    if target == selector or target.startswith(selector + '.'):
        return len(selector)
    return 0


def extract_roles(theme: dict) -> dict:
    best = {}  # role -> (specificity, order, hex)
    for order, rule in enumerate(theme.get('tokenColors', [])):
        settings = rule.get('settings', {})
        fg = settings.get('foreground')
        if not fg or not isinstance(fg, str) or not fg.startswith('#'):
            continue
        scopes = rule.get('scope', [])
        if isinstance(scopes, str):
            scopes = [s.strip() for s in scopes.split(',')]
        flat = []
        for s in scopes:
            flat.extend(x.strip() for x in s.split(','))
        for sel in flat:
            for role, targets in ROLE_TARGETS.items():
                for t in targets:
                    spec = scope_matches(sel, t)
                    if spec:
                        cur = best.get(role)
                        # higher specificity wins; later rule wins ties
                        if cur is None or (spec, order) >= (cur[0], cur[1]):
                            best[role] = (spec, order, fg[:7])
    out = {r: v[2] for r, v in best.items()}
    # storage folds into keyword if keyword missing
    if 'keyword' not in out and 'storage' in out:
        out['keyword'] = out['storage']
    return out


SURFACE_KEYS = [
    'editor.background', 'editor.foreground', 'sideBar.background',
    'activityBar.background', 'statusBar.background', 'panel.background',
    'titleBar.activeBackground', 'tab.activeBackground',
    'editorGroupHeader.tabsBackground', 'editorLineNumber.foreground',
]

LOUD = ['keyword', 'function', 'string', 'number', 'type']

# ---------- load corpus ----------

themes = []
for f in sorted(os.listdir(DIR)):
    if not f.endswith('.json') or f.endswith('_vs.json') or f in ('dark_plus.json', 'light_plus.json'):
        continue
    path = os.path.join(DIR, f)
    try:
        t = load_theme(path)
    except Exception as e:
        print(f'SKIP {f}: {e}', file=sys.stderr)
        continue
    colors = t.get('colors', {})
    bg = colors.get('editor.background')
    if not bg:
        print(f'SKIP {f}: no editor.background', file=sys.stderr)
        continue
    mode = t.get('type')
    if mode not in ('dark', 'light'):
        mode = 'dark' if oklch(bg)[0] < 0.5 else 'light'
    roles = extract_roles(t)
    fg = colors.get('editor.foreground') or roles.get('variable')
    themes.append({
        'name': f.replace('.json', ''),
        'mode': mode,
        'bg': bg[:7],
        'fg': (fg or '#888888')[:7],
        'roles': roles,
        'colors': {k: colors[k][:7] for k in SURFACE_KEYS if k in colors and isinstance(colors[k], str)},
    })

print(f'corpus: {len(themes)} themes '
      f'({sum(1 for t in themes if t["mode"] == "dark")} dark, '
      f'{sum(1 for t in themes if t["mode"] == "light")} light)')

# ---------- 1. loud bands ----------

print('\n===== 1. LOUD-TOKEN BANDS (keyword/function/string/number/type) =====')
print(f'{"theme":<26} {"mode":<6} {"L range":<16} {"C range":<16} {"minΔE":<7} {"#accents"}')
for t in themes:
    vals = [(r, oklch(t['roles'][r])) for r in LOUD if r in t['roles']]
    if len(vals) < 4:
        continue
    Ls = [v[1][0] for v in vals]
    Cs = [v[1][1] for v in vals]
    cmax = max(Cs)
    accents = sum(1 for c in Cs if c >= 0.85 * cmax)
    des = [delta_e(t['roles'][a], t['roles'][b])
           for i, (a, _) in enumerate(vals) for (b, _) in vals[i + 1:]]
    print(f'{t["name"]:<26} {t["mode"]:<6} '
          f'{min(Ls):.2f}–{max(Ls):.2f} (Δ{max(Ls)-min(Ls):.2f})  '
          f'{min(Cs):.3f}–{max(Cs):.3f}   {min(des):5.1f}   {accents}')

# ---------- 2. hue conventions per role ----------

print('\n===== 2. HUE CONVENTIONS (OKLCH hue per role, dark themes) =====')
for role in ['keyword', 'function', 'string', 'number', 'type', 'tag', 'constant', 'comment', 'variable']:
    rows = []
    for t in themes:
        if t['mode'] != 'dark' or role not in t['roles']:
            continue
        L, C, h = oklch(t['roles'][role])
        if C < 0.02:
            rows.append((t['name'], 'gray'))
        else:
            rows.append((t['name'], int(h)))
    hues = sorted(x[1] for x in rows if isinstance(x[1], int))
    print(f'{role:<10} hues={hues}')

print('\n----- same, light themes -----')
for role in ['keyword', 'function', 'string', 'number', 'type', 'comment']:
    hues = []
    for t in themes:
        if t['mode'] != 'light' or role not in t['roles']:
            continue
        L, C, h = oklch(t['roles'][role])
        if C >= 0.02:
            hues.append(int(h))
    print(f'{role:<10} hues={sorted(hues)}')

# ---------- 3. hue vs lightness ----------

print('\n===== 3. HUE vs LIGHTNESS (all loud tokens, dark themes) =====')
buckets = defaultdict(list)
for t in themes:
    if t['mode'] != 'dark':
        continue
    for r in LOUD:
        if r in t['roles']:
            L, C, h = oklch(t['roles'][r])
            if C >= 0.03:
                buckets[int(h // 30) * 30].append(L)
print('hue bucket → mean L (n)')
for b in sorted(buckets):
    Ls = buckets[b]
    mean = sum(Ls) / len(Ls)
    model = 0.5 + 0.5 * math.cos(math.radians(b + 15 - 100))  # current hueNaturalL center model
    print(f'  {b:3d}–{b+30:<3d}  L={mean:.3f}  (n={len(Ls):2d})   cos-model relative={model:.2f}')

# ---------- 4. pairwise ΔE distribution ----------

print('\n===== 4. PAIRWISE ΔE BETWEEN LOUD ROLES =====')
all_des = {'dark': [], 'light': []}
for t in themes:
    vals = [t['roles'][r] for r in LOUD if r in t['roles']]
    for i in range(len(vals)):
        for j in range(i + 1, len(vals)):
            all_des[t['mode']].append(delta_e(vals[i], vals[j]))
for mode, des in all_des.items():
    des.sort()
    n = len(des)
    print(f'{mode}: n={n} min={des[0]:.1f} p10={des[n//10]:.1f} p25={des[n//4]:.1f} '
          f'median={des[n//2]:.1f} | pairs<5: {sum(1 for d in des if d < 5)} '
          f'| pairs<8: {sum(1 for d in des if d < 8)}')

# ---------- 5. surfaces ----------

print('\n===== 5. SURFACES =====')
print(f'{"theme":<26} {"mode":<6} {"bg L/C":<13} {"sidebar ΔL":<11} {"actBar ΔL":<10} '
      f'{"statBar ΔL":<11} {"chrome Cmax":<12} {"sameHue"}')
for t in themes:
    bgL, bgC, bgH = oklch(t['bg'])
    c = t['colors']
    def dl(key):
        if key not in c:
            return None
        return oklch(c[key])[0] - bgL
    chrome_keys = ['sideBar.background', 'activityBar.background', 'statusBar.background',
                   'titleBar.activeBackground', 'panel.background']
    chromas = [oklch(c[k])[1] for k in chrome_keys if k in c]
    hues_same = None
    if 'sideBar.background' in c and bgC > 0.005:
        sbC = oklch(c['sideBar.background'])[1]
        hues_same = hue_gap(oklch(c['sideBar.background'])[2], bgH) < 25 if sbC > 0.005 else None
    sb = dl('sideBar.background')
    ab = dl('activityBar.background')
    st = dl('statusBar.background')
    fmt = lambda v: f'{v:+.3f}' if v is not None else '  —  '
    print(f'{t["name"]:<26} {t["mode"]:<6} {bgL:.2f}/{bgC:.3f}   '
          f'{fmt(sb):<11} {fmt(ab):<10} {fmt(st):<11} '
          f'{(f"{max(chromas):.3f}" if chromas else "—"):<12} {hues_same}')

# ---------- 6. comments ----------

print('\n===== 6. COMMENTS =====')
print(f'{"theme":<26} {"mode":<6} {"Lc":<7} {"C":<7} {"hue":<5} {"Δhue vs bg":<11} {"Δhue vs string"}')
for t in themes:
    if 'comment' not in t['roles']:
        continue
    ch = t['roles']['comment']
    L, C, h = oklch(ch)
    lc = abs(apca(ch, t['bg']))
    _, bgC, bgH = oklch(t['bg'])
    dbg = int(hue_gap(h, bgH)) if (C > 0.015 and bgC > 0.004) else None
    ds = None
    if 'string' in t['roles'] and C > 0.015:
        ds = int(hue_gap(h, oklch(t['roles']['string'])[2]))
    print(f'{t["name"]:<26} {t["mode"]:<6} {lc:5.1f}  {C:.3f}  {int(h):<5} '
          f'{str(dbg):<11} {ds}')

# ---------- 7. bg hue vs token hues ----------

print('\n===== 7. BG TINT RELATION (themes with chromatic bg) =====')
for t in themes:
    bgL, bgC, bgH = oklch(t['bg'])
    if bgC < 0.008:
        continue
    gaps = []
    for r in LOUD:
        if r in t['roles']:
            L, C, h = oklch(t['roles'][r])
            if C > 0.03:
                gaps.append((r, int(hue_gap(h, bgH))))
    closest = min(gaps, key=lambda x: x[1]) if gaps else None
    print(f'{t["name"]:<26} bg C={bgC:.3f} h={int(bgH):3d} | closest role: {closest}')
