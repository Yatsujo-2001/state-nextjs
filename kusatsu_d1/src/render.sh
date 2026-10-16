#!/bin/bash
# usage: render.sh <basename>   (expects <basename>.svg)
set -e
B=$1
python3 - "$B" <<'PY'
import sys
b=sys.argv[1]
svg=open(b+'.svg',encoding='utf-8').read()
svg=svg.split('?>',1)[1]
html='''<!doctype html><html><head><meta charset="utf-8"><style>
@page { size: 420mm 297mm; margin: 0; }
html,body{margin:0;padding:0;background:#fff;}
svg{display:block;width:420mm;height:297mm;}
</style></head><body>'''+svg+'</body></html>'
open(b+'.html','w',encoding='utf-8').write(html)
PY
/opt/pw-browsers/chromium-1194/chrome-linux/chrome --headless --no-sandbox --disable-gpu --no-pdf-header-footer \
  --print-to-pdf="$B.pdf" "file://$PWD/$B.html" 2>/dev/null
pdfinfo "$B.pdf" | grep -E "Pages|Page size"
