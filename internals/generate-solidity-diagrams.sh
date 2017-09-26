#!/usr/bin/env bash
#
# @package: Consensys Academy exam pt2
# @author:  pospi <sam.pospi@consensys.net>
# @since:   2017-09-24
#
##

if [[ $# -ne 2 ]]
then
    echo "Usage: $0 {sourceFilesGlob} {destFolder}"
    echo "Renders diagrams of all source files into given output folder"
    exit 1
fi

SOURCEFILES=$1
OUTPUTDIR=$2

for srcFile in $SOURCEFILES; do
    echo "Rendering `basename $srcFile`..."
    cat "$srcFile" | solgraph | dot -Tpng > "$OUTPUTDIR/`basename $srcFile ".sol"`.png"
done
