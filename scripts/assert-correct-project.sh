#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="${1:-$(pwd)}"
PROJECT_BASENAME="$(basename "$PROJECT_ROOT")"

if [[ "$PROJECT_ROOT" == *"/_trash"* ]] || [[ "$PROJECT_BASENAME" == "_trash" ]]; then
  echo "Refusing to run from _trash."
  echo "Use the real project folder:"
  echo "/Users/makengolokombo/Downloads/cs341_sp25_avr_root_like_avr_v3 (1)/cs341-spring-2025-cs341_sp25_avr"
  exit 1
fi
