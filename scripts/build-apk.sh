#!/usr/bin/env bash
# Build an AdvGA debug APK with Capacitor + Gradle.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ -z "${ANDROID_HOME:-}${ANDROID_SDK_ROOT:-}" ]]; then
  if [[ -d "$HOME/Android/Sdk" ]]; then
    export ANDROID_HOME="$HOME/Android/Sdk"
  else
    echo "Set ANDROID_HOME to your Android SDK path." >&2
    exit 1
  fi
fi
export ANDROID_SDK_ROOT="${ANDROID_SDK_ROOT:-$ANDROID_HOME}"

if [[ ! -f android/local.properties ]]; then
  echo "sdk.dir=$ANDROID_HOME" > android/local.properties
fi

npm run build:android
(
  cd android
  chmod +x gradlew
  ./gradlew assembleDebug --no-daemon
)

OUT="android/app/build/outputs/apk/debug/app-debug.apk"
VERSION="$(node -p "require('./package.json').version")"
DEST="AdvGA-v${VERSION}-debug.apk"
cp "$OUT" "$DEST"
echo "Built $DEST ($(du -h "$DEST" | cut -f1))"
