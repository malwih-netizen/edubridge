"""
Renders Mermaid diagrams (diagrams/*.mmd) to PNG with headless Microsoft Edge, then trims the white margin.
Usage:  python render_diagrams.py            (all)
        python render_diagrams.py erd_overview use_case
"""
import pathlib
import subprocess
import sys

from PIL import Image, ImageChops

HERE = pathlib.Path(__file__).resolve().parent
SRC = HERE / 'diagrams'
OUT = HERE / 'images'
TMP = HERE / '.render'
EDGE = r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'

PAGE = """<!doctype html><html><head><meta charset="utf-8">
<style>
  html, body {{ margin: 0; background: #ffffff; }}
  #wrap {{ display: inline-block; padding: 24px; }}
  .mermaid {{ font-family: 'Segoe UI', Arial, sans-serif; }}
</style></head><body>
<div id="wrap"><pre class="mermaid">
{code}
</pre></div>
<script src="https://cdn.jsdelivr.net/npm/mermaid@10.9.1/dist/mermaid.min.js"></script>
<script>
mermaid.initialize({{
  startOnLoad: true, securityLevel: 'loose', theme: 'base',
  fontFamily: 'Segoe UI, Arial, sans-serif',
  themeVariables: {{
    fontSize: '15px',
    primaryColor: '#f2f2f2', primaryBorderColor: '#000000', primaryTextColor: '#000000',
    secondaryColor: '#e6e6e6', tertiaryColor: '#ffffff', lineColor: '#333333',
    noteBkgColor: '#f5f5f5', noteBorderColor: '#808080',
    actorBkg: '#f2f2f2', actorTextColor: '#000000', actorBorder: '#000000', actorLineColor: '#8c8c8c', signalColor: '#333333', signalTextColor: '#000000',
    activationBkgColor: '#e6e6e6', activationBorderColor: '#808080',
    labelBoxBkgColor: '#e6e6e6', labelBoxBorderColor: '#808080', labelTextColor: '#000000', loopTextColor: '#000000', noteTextColor: '#000000', sequenceNumberColor: '#ffffff',
    attributeBackgroundColorOdd: '#ffffff', attributeBackgroundColorEven: '#f5f5f5'
  }},
  er: {{ useMaxWidth: false }}, flowchart: {{ useMaxWidth: false, htmlLabels: true, curve: 'basis' }},
  sequence: {{ useMaxWidth: false, mirrorActors: false, showSequenceNumbers: true }},
  class: {{ useMaxWidth: false }}, state: {{ useMaxWidth: false }}
}});
</script></body></html>"""


def trim(path: pathlib.Path) -> None:
    im = Image.open(path).convert('RGB')
    bg = Image.new('RGB', im.size, (255, 255, 255))
    box = ImageChops.difference(im, bg).getbbox()
    if box:
        pad = 20
        box = (max(0, box[0] - pad), max(0, box[1] - pad), min(im.width, box[2] + pad), min(im.height, box[3] + pad))
        im.crop(box).save(path, optimize=True)


def render(name: str, width: int = 2200, height: int = 2400) -> None:
    code = (SRC / f'{name}.mmd').read_text(encoding='utf-8')
    TMP.mkdir(exist_ok=True)
    OUT.mkdir(exist_ok=True)
    html = TMP / f'{name}.html'
    html.write_text(PAGE.format(code=code), encoding='utf-8')
    png = OUT / f'{name}.png'
    subprocess.run([EDGE, '--headless=new', '--disable-gpu', '--hide-scrollbars', '--force-device-scale-factor=2',
                    f'--user-data-dir={TMP / "edge"}', '--virtual-time-budget=8000', f'--window-size={width},{height}',
                    f'--screenshot={png}', html.as_uri()], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    trim(png)
    im = Image.open(png)
    print(f'✓ {name}.png  {im.width}x{im.height}')


if __name__ == '__main__':
    names = sys.argv[1:] or sorted(p.stem for p in SRC.glob('*.mmd'))
    for n in names:
        first = (SRC / f'{n}.mmd').read_text(encoding='utf-8').splitlines()[0]
        # optional first-line hint:  %% size: 1600x3000
        w, h = 2200, 2400
        if first.startswith('%% size:'):
            w, h = map(int, first.split(':')[1].strip().split('x'))
        render(n, w, h)
