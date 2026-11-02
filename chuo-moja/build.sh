#!/bin/bash
# Rebuilds public/index.html from src/. Run: ./build.sh
SRC=${1:-$(cd "$(dirname "$0")" && pwd)/src}
D=$(cd "$(dirname "$0")" && pwd)
{
cat $SRC/shell_head.html
echo "<style>"; cat $SRC/style.css; echo "</style>"
cat $SRC/shell_body.html
echo "<script>"; cat $D/shim.js; echo "</script>"
echo "<script>"; cat $SRC/data.js $SRC/app.js $SRC/phase2.js $SRC/phase3.js $SRC/tail.js; echo "</script>"
} | sed -e 's/ · prototype//' -e "s/'In this prototype'/'Done'/" -e "s/,'Next'\]/,'Live']/" -e "s/i<3?'badge--'/i<4?'badge--'/" > $D/public/index.html
wc -c $D/public/index.html
