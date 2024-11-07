#!/bin/sh
#
# Usage example:
#
#   dockerlatex.sh pdflatex foo.tex
#

# Convert current working directory to absolute path and ensure proper format
CURRENT_DIR=$(realpath "$(pwd)")

docker run --rm -i --user="$(id -u):$(id -g)" -v "$CURRENT_DIR":/data mingc/latex "$@"
