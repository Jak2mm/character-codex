"""Bundle src/ + data/srd.json into one self-contained HTML file.

Usage:
    python tools/build.py              # writes index.html (standalone page, for GitHub Pages or opening locally)
    python tools/build.py --fragment   # writes dist/fragment.html (page body only, for hosts that add their own <html>/<head>)
"""
import os, sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
JS_ORDER = ['app-shell.js', 'core.js', 'images.js', 'bonuses.js', 'ref.js', 'store.js', 'folder.js', 'updates.js', 'ui-sheet.js', 'ui-other.js', 'ui-rules.js', 'ui-bonus.js', 'ui-custom.js', 'ui-gear.js', 'ui-attacks.js', 'ui-world.js', 'ui-mention.js', 'ui-links.js', 'ui-map.js', 'ui-companion.js', 'ui-prestige.js', 'ui-newchar.js', 'ui-start.js', 'ui-panels.js', 'ui-compact.js', 'ui-combatopts.js', 'ui-targets.js', 'ui-scenes.js', 'ui-themes.js', 'ui-rest.js', 'ui-heal.js', 'rulesets/dnd35.js', 'ui-nav.js', 'events.js']

def read(*p):
    with open(os.path.join(ROOT, *p), encoding='utf-8') as f:
        return f.read()

def art_js():
    # Painted theme backgrounds: src/art/<theme id>.jpg, built into the page so it stays one file
    import base64, json
    # (and how bright each one is, so bright pictures can be dimmed in dark mode)
    d = os.path.join(ROOT, 'src', 'art'); art = {}; lum = {}
    if os.path.isdir(d):
        for n in sorted(os.listdir(d)):
            if n.endswith('.jpg'):
                p = os.path.join(d, n)
                with open(p, 'rb') as f:
                    art[n[:-4]] = 'data:image/jpeg;base64,' + base64.b64encode(f.read()).decode()
                try:
                    from PIL import Image, ImageStat
                    lum[n[:-4]] = round(ImageStat.Stat(Image.open(p).convert('L').resize((64, 32))).mean[0] / 255, 3)
                except ImportError:
                    lum[n[:-4]] = 0.3
    return 'const SCENE_ART = ' + json.dumps(art) + ';\nconst SCENE_ART_LUM = ' + json.dumps(lum) + ';\n'

def version_js():
    # The version and change log come from src/changelog.json (newest first). The first entry is this version.
    import json
    log = json.loads(read('src', 'changelog.json'))
    return 'const APP_VERSION = ' + json.dumps(log[0]['v']) + ';\nconst CHANGELOG = ' + json.dumps(log) + ';\n'

def write_version_file():
    # version.json on the website: what installed copies check to see whether a newer version is out
    import json
    log = json.loads(read('src', 'changelog.json'))
    with open(os.path.join(ROOT, 'version.json'), 'w', encoding='utf-8') as f:
        json.dump({'version': log[0]['v'], 'date': log[0]['date'], 'title': log[0].get('title', ''), 'items': log[0]['items'],
                   'changelog': [{k: e[k] for k in ('v', 'date', 'title', 'items') if k in e} for e in log[:10]]}, f, indent=1)
        f.write('\n')

def build(fragment=False):
    data = read('data', 'srd.json').replace('</', '<\\/')  # keep the JSON from closing its <script> tag
    js = art_js() + version_js() + '\n'.join(read('src', 'js', f) for f in JS_ORDER)
    inner = (read('src', 'head.html') + read('src', 'body.html') +
             '<script type="application/json" id="srd-data">' + data + '</script>\n'
             '<script>\n"use strict";\n' + js + '\n</script>\n')
    if fragment:
        os.makedirs(os.path.join(ROOT, 'dist'), exist_ok=True)
        out = os.path.join(ROOT, 'dist', 'fragment.html'); html = inner
    else:
        head, body = read('src', 'head.html'), read('src', 'body.html')
        html = ('<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n'
                '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n'
                '<style>body{margin:0}[hidden]{display:none!important}img{max-width:100%}</style>\n'
                '<link rel="manifest" href="manifest.webmanifest">\n<meta name="theme-color" content="#1b1d22">\n'
                '<link rel="icon" type="image/png" href="icons/favicon-64.png">\n<link rel="apple-touch-icon" href="icons/apple-touch-icon.png">\n'
                + head + '\n</head>\n<body>\n' + body +
                '<script type="application/json" id="srd-data">' + data + '</script>\n'
                '<script>\n"use strict";\n' + js + '\n</script>\n</body>\n</html>\n')
        out = os.path.join(ROOT, 'index.html')
    with open(out, 'w', encoding='utf-8') as f:
        f.write(html)
    if not fragment:  # service worker for the installable web app, versioned by the page's contents
        import hashlib
        ver = hashlib.sha1(html.encode('utf-8')).hexdigest()[:12]
        write_version_file()
        with open(os.path.join(ROOT, 'sw.js'), 'w', encoding='utf-8') as f:
            f.write(read('src', 'sw.js').replace('__VERSION__', ver))
    print(f'wrote {os.path.relpath(out, ROOT)} ({len(html) / 1e6:.2f} MB)')

if __name__ == '__main__':
    build(fragment='--fragment' in sys.argv)
