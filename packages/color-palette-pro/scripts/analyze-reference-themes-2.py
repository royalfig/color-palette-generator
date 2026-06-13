#!/usr/bin/env python3
"""
Second-pass pattern mining on the top-theme corpus — dimensions not covered by
analyze-reference-themes.py:

  A. palette economy: distinct token colors, hue-family count, within-family separation
  B. accent reuse: is the UI accent (focusBorder/badge/button) a token color?
  C. selection & highlight mechanics: alpha vs solid, hue source, effective ΔL
  D. default foreground: contrast, tint hue vs bg
  E. hue-avoidance: which roles ever sit in the red zone (0–25°)?
  F. UI text ladder: line numbers vs comments vs fg contrast
  G. chroma↔lightness covariance inside each theme
"""

import json
import math
import os
import sys
from collections import defaultdict

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from importlib.machinery import SourceFileLoader

base_mod = SourceFileLoader(
    'ref1', os.path.join(os.path.dirname(os.path.abspath(__file__)), 'analyze-reference-themes.py')
)

# We reuse helpers by re-implementing the tiny ones here (importing would re-run its report).

HERE = os.path.dirname(os.path.abspath(__file__))
DIR = os.path.join(HERE, 'reference-themes')


def strip_jsonc(text):
    out, i, n, in_str = [], 0, len(text), False
    while i < n:
        ch = text[i]
        if in_str:
            out.append(ch)
            if ch == '\\' and i + 1 < n:
                out.append(text[i + 1]); i += 2; continue
            if ch == '"':
                in_str = False
            i += 1; continue
        if ch == '"':
            in_str = True; out.append(ch); i += 1; continue
        if ch == '/' and i + 1 < n and text[i + 1] == '/':
            while i < n and text[i] != '\n': i += 1
            continue
        if ch == '/' and i + 1 < n and text[i + 1] == '*':
            i += 2
            while i + 1 < n and not (text[i] == '*' and text[i + 1] == '/'): i += 1
            i += 2; continue
        out.append(ch); i += 1
    import re
    return re.sub(r',\s*([}\]])', r'\1', ''.join(out))


def load_theme(path):
    with open(path, encoding='utf-8') as f:
        d = json.loads(strip_jsonc(f.read()))
    inc = d.get('include')
    if inc:
        b = load_theme(os.path.join(os.path.dirname(path), inc))
        d = {**b, **d, 'colors': {**b.get('colors', {}), **d.get('colors', {})},
             'tokenColors': b.get('tokenColors', []) + d.get('tokenColors', [])}
    return d


def hex_rgba(h):
    h = h.lstrip('#')
    a = 1.0
    if len(h) in (3, 4):
        h = ''.join(c * 2 for c in h)
    if len(h) == 8:
        a = int(h[6:8], 16) / 255
        h = h[:6]
    return tuple(int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)), a


def lin(c):
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4


def rgb_oklab(rgb):
    r, g, b = (lin(c) for c in rgb)
    l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b
    m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b
    s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b
    l, m, s = l ** (1 / 3), m ** (1 / 3), s ** (1 / 3)
    return (0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s,
            1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s,
            0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s)


def oklch_of(hexstr, bg=None):
    """OKLCH; if color has alpha and bg given, composite first."""
    rgb, a = hex_rgba(hexstr)
    if a < 1 and bg is not None:
        bgrgb, _ = hex_rgba(bg)
        rgb = tuple(rgb[i] * a + bgrgb[i] * (1 - a) for i in range(3))
    L, A, B = rgb_oklab(rgb)
    return L, math.hypot(A, B), math.degrees(math.atan2(B, A)) % 360, a


def de(h1, h2, bg=None):
    a = rgb_oklab(hex_rgba(h1)[0]) if bg is None else None
    # simple: no alpha for ΔE use
    a = rgb_oklab(hex_rgba(h1)[0])
    b = rgb_oklab(hex_rgba(h2)[0])
    return math.dist(a, b) * 100


def apca(fg_hex, bg_hex):
    def y(hh):
        (r, g, b), a = hex_rgba(hh)
        if a < 1:
            (br, bgc, bb), _ = hex_rgba(bg_hex)
            r, g, b = r * a + br * (1 - a), g * a + bgc * (1 - a), b * a + bb * (1 - a)
        Y = 0.2126729 * r ** 2.4 + 0.7151522 * g ** 2.4 + 0.0721750 * b ** 2.4
        return Y + (0.022 - Y) ** 1.414 if Y < 0.022 else Y
    yf, yb = y(fg_hex), y(bg_hex)
    if yb > yf:
        s = (yb ** 0.56 - yf ** 0.57) * 1.14
        out = 0 if s < 0.1 else s - 0.027
    else:
        s = (yb ** 0.65 - yf ** 0.62) * 1.14
        out = 0 if s > -0.1 else s + 0.027
    return abs(out * 100)


def gap(a, b):
    d = abs(a - b) % 360
    return 360 - d if d > 180 else d


ROLE_TARGETS = {
    'keyword': ['keyword.control', 'keyword'],
    'string': ['string'],
    'number': ['constant.numeric'],
    'function': ['entity.name.function', 'support.function'],
    'type': ['entity.name.type', 'support.class', 'entity.name.class', 'support.type'],
    'variable': ['variable'],
    'property': ['variable.other.property', 'support.type.property-name'],
    'operator': ['keyword.operator'],
    'tag': ['entity.name.tag'],
    'constant': ['constant.language'],
    'comment': ['comment'],
}


def matches(sel, target):
    sel = sel.strip()
    if not sel or ' ' in sel:
        return 0
    return len(sel) if (target == sel or target.startswith(sel + '.')) else 0


def extract(theme):
    best = {}
    all_fgs = set()
    for order, rule in enumerate(theme.get('tokenColors', [])):
        st = rule.get('settings', {})
        fg = st.get('foreground')
        if not isinstance(fg, str) or not fg.startswith('#'):
            continue
        all_fgs.add(fg[:7].upper())
        scopes = rule.get('scope', [])
        if isinstance(scopes, str):
            scopes = scopes.split(',')
        flat = []
        for s in scopes:
            flat.extend(x.strip() for x in s.split(','))
        for sel in flat:
            for role, targets in ROLE_TARGETS.items():
                for t in targets:
                    sp = matches(sel, t)
                    if sp:
                        cur = best.get(role)
                        if cur is None or (sp, order) >= (cur[0], cur[1]):
                            best[role] = (sp, order, fg[:7])
    return {r: v[2] for r, v in best.items()}, all_fgs


themes = []
for f in sorted(os.listdir(DIR)):
    if not f.endswith('.json') or f.endswith('_vs.json') or f in ('dark_plus.json', 'light_plus.json'):
        continue
    try:
        t = load_theme(os.path.join(DIR, f))
    except Exception:
        continue
    colors = t.get('colors', {})
    bg = colors.get('editor.background')
    if not bg:
        continue
    roles, all_fgs = extract(t)
    mode = t.get('type') or ('dark' if oklch_of(bg)[0] < 0.5 else 'light')
    if mode not in ('dark', 'light'):
        mode = 'dark' if oklch_of(bg)[0] < 0.5 else 'light'
    themes.append({'name': f[:-5], 'mode': mode, 'bg': bg, 'roles': roles,
                   'all_fgs': all_fgs, 'colors': colors})

dark = [t for t in themes if t['mode'] == 'dark']
light = [t for t in themes if t['mode'] == 'light']
print(f'corpus: {len(themes)} themes ({len(dark)} dark, {len(light)} light)')

CHROMATIC_ROLES = ['keyword', 'string', 'number', 'function', 'type', 'tag', 'constant', 'variable', 'property', 'operator']

# ---------- A. palette economy + hue families ----------

print('\n===== A. PALETTE ECONOMY & HUE FAMILIES =====')
print(f'{"theme":<26} {"#tokFgs":<8} {"#chromatic":<11} {"#hueFams":<9} {"fam sizes":<12} within-fam ΔL/ΔC')
for t in themes:
    pts = []
    seen = set()
    for r in CHROMATIC_ROLES:
        if r not in t['roles']:
            continue
        hx = t['roles'][r].upper()
        L, C, H, _ = oklch_of(hx)
        if C >= 0.04 and hx not in seen:
            seen.add(hx)
            pts.append((H, L, C, r))
    pts.sort()
    fams = []
    for p in pts:
        placed = False
        for fam in fams:
            if any(gap(p[0], q[0]) <= 28 for q in fam):
                fam.append(p); placed = True; break
        if not placed:
            fams.append([p])
    # merge wraparound
    if len(fams) > 1 and gap(fams[0][0][0], fams[-1][-1][0]) <= 28:
        fams[0].extend(fams.pop())
    dls, dcs = [], []
    for fam in fams:
        if len(fam) >= 2:
            Ls = [p[1] for p in fam]
            Cs = [p[2] for p in fam]
            dls.append(max(Ls) - min(Ls))
            dcs.append(max(Cs) - min(Cs))
    wf = f'{sum(dls)/len(dls):.2f}/{sum(dcs)/len(dcs):.3f}' if dls else '—'
    print(f'{t["name"]:<26} {len(t["all_fgs"]):<8} {len(pts):<11} {len(fams):<9} '
          f'{str(sorted((len(f) for f in fams), reverse=True)):<12} {wf}')

# ---------- B. accent reuse ----------

print('\n===== B. UI ACCENT vs TOKEN PALETTE =====')
ACCENT_KEYS = ['focusBorder', 'button.background', 'activityBarBadge.background',
               'badge.background', 'progressBar.background', 'textLink.foreground']
print(f'{"theme":<26} {"key":<28} {"hex":<9} {"nearest token (ΔE)"}')
for t in themes:
    toks = {r: t['roles'][r] for r in CHROMATIC_ROLES if r in t['roles'] and oklch_of(t['roles'][r])[1] >= 0.04}
    for k in ACCENT_KEYS:
        v = t['colors'].get(k)
        if not isinstance(v, str) or not v.startswith('#'):
            continue
        L, C, H, a = oklch_of(v, t['bg'])
        if C < 0.04:
            continue
        if toks:
            best = min(toks.items(), key=lambda kv: de(v[:7], kv[1]))
            print(f'{t["name"]:<26} {k:<28} {v[:7]:<9} {best[0]} ({de(v[:7], best[1]):.1f}) h={int(H)}')
        break  # one representative accent per theme keeps output readable

# ---------- C. selection mechanics ----------

print('\n===== C. SELECTION / LINE HIGHLIGHT / FIND MATCH =====')
print(f'{"theme":<26} {"selection":<10} {"α":<5} {"selΔL":<7} {"sel hue":<8} {"Δhue(bg)":<9} {"lineHL α/ΔL":<13} {"findMatch hue"}')
for t in themes:
    bgL, bgC, bgH, _ = oklch_of(t['bg'])
    sel = t['colors'].get('editor.selectionBackground')
    row = f'{t["name"]:<26} '
    if isinstance(sel, str) and sel.startswith('#'):
        L, C, H, a = oklch_of(sel, t['bg'])
        dh = int(gap(H, bgH)) if (C > 0.01 and bgC > 0.004) else None
        row += f'{sel[:7]:<10} {a:<5.2f} {L-bgL:+.2f}  {int(H) if C>0.01 else "gray":<8} {str(dh):<9} '
    else:
        row += f'{"—":<10} {"":<5} {"":<7} {"":<8} {"":<9} '
    lh = t['colors'].get('editor.lineHighlightBackground')
    if isinstance(lh, str) and lh.startswith('#'):
        L, C, H, a = oklch_of(lh, t['bg'])
        row += f'{a:.2f}/{L-bgL:+.2f}   '
    else:
        row += f'{"—":<13} '
    fm = t['colors'].get('editor.findMatchBackground')
    if isinstance(fm, str) and fm.startswith('#'):
        L, C, H, a = oklch_of(fm, t['bg'])
        row += f'{int(H) if C>0.02 else "gray"}'
    print(row)

# ---------- D. default foreground ----------

print('\n===== D. DEFAULT FOREGROUND =====')
print(f'{"theme":<26} {"fg":<9} {"Lc":<6} {"C":<7} {"hue":<5} {"Δhue vs bg"}')
for t in themes:
    fg = t['colors'].get('editor.foreground')
    if not isinstance(fg, str):
        continue
    L, C, H, _ = oklch_of(fg)
    bgL, bgC, bgH, _ = oklch_of(t['bg'])
    dh = int(gap(H, bgH)) if (C > 0.008 and bgC > 0.004) else None
    print(f'{t["name"]:<26} {fg[:7]:<9} {apca(fg[:7], t["bg"]):<6.1f} {C:<7.3f} {int(H) if C > 0.008 else "—":<5} {dh}')

# ---------- E. red-zone usage ----------

print('\n===== E. RED ZONE (hue 345–25, C ≥ 0.06): which roles use it? =====')
counts = defaultdict(int)
for t in themes:
    for r in CHROMATIC_ROLES:
        if r in t['roles']:
            L, C, H, _ = oklch_of(t['roles'][r])
            if C >= 0.06 and (H >= 345 or H <= 25):
                counts[r] += 1
                print(f'  {t["name"]:<26} {r:<10} {t["roles"][r]} h={int(H)}')
print('  totals:', dict(counts))

# ---------- F. UI text ladder ----------

print('\n===== F. UI TEXT LADDER (Lc vs editor bg) =====')
print(f'{"theme":<26} {"fg":<6} {"comment":<8} {"lineNum":<8} {"lineNum/comment"}')
for t in themes:
    fg = t['colors'].get('editor.foreground')
    ln = t['colors'].get('editorLineNumber.foreground')
    cm = t['roles'].get('comment')
    fgc = f'{apca(fg[:7], t["bg"]):.0f}' if isinstance(fg, str) else '—'
    lnc = apca(ln[:7], t['bg']) if isinstance(ln, str) else None
    cmc = apca(cm, t['bg']) if cm else None
    ratio = f'{lnc/cmc:.2f}' if (lnc and cmc) else '—'
    print(f'{t["name"]:<26} {fgc:<6} {(f"{cmc:.0f}" if cmc else "—"):<8} {(f"{lnc:.0f}" if lnc else "—"):<8} {ratio}')

# ---------- G. chroma vs lightness covariance ----------

print('\n===== G. WITHIN-THEME C↔L COVARIANCE (loud roles) =====')
for mode, group in (('dark', dark), ('light', light)):
    cors = []
    for t in group:
        pts = []
        for r in ['keyword', 'string', 'number', 'function', 'type']:
            if r in t['roles']:
                L, C, H, _ = oklch_of(t['roles'][r])
                if C > 0.03:
                    pts.append((L, C))
        if len(pts) >= 4:
            n = len(pts)
            mL = sum(p[0] for p in pts) / n
            mC = sum(p[1] for p in pts) / n
            num = sum((p[0] - mL) * (p[1] - mC) for p in pts)
            den = math.sqrt(sum((p[0] - mL) ** 2 for p in pts) * sum((p[1] - mC) ** 2 for p in pts))
            if den > 0:
                cors.append(num / den)
    if cors:
        print(f'{mode}: mean Pearson r(L,C) = {sum(cors)/len(cors):+.2f}  '
              f'(n={len(cors)}, range {min(cors):+.2f}…{max(cors):+.2f})')
