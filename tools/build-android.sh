#!/usr/bin/env bash
# Builds the Android app (dist/Runelords-Android.apk) with Capacitor.
# Needs Node, Java 21 and the Android SDK (all preinstalled on GitHub's ubuntu runners).
# The APK is signed with mobile/debug.keystore so each new build installs over the last one
# (keeping saves) instead of needing an uninstall.
set -euo pipefail
cd "$(dirname "$0")/.."

# 1. The game files the app ships with.
rm -rf www && mkdir -p www/voices
cp -r index.html manifest.webmanifest css js icons www/
cp -r voices/index.json voices/clips www/voices/

# 2. The Android project (generated fresh each time).
[ -d android ] || npx cap add android
npx cap sync android

# 3. App icon: the game's icon at every launcher size.
RES=android/app/src/main/res
rm -rf "$RES/mipmap-anydpi-v26"
for pair in mdpi:48 hdpi:72 xhdpi:96 xxhdpi:144 xxxhdpi:192; do
  dir="$RES/mipmap-${pair%%:*}"; size="${pair##*:}"
  mkdir -p "$dir"
  for name in ic_launcher ic_launcher_round ic_launcher_foreground; do
    convert icons/icon-512.png -filter point -resize "${size}x${size}" "$dir/$name.png"
  done
done

# Splash screen: the icon on the game's background colour.
for f in "$RES"/drawable*/splash.png; do
  size=$(identify -format '%wx%h' "$f")
  short=$(identify -format '%[fx:min(w,h)]' "$f")
  convert -size "$size" xc:'#1a1030' \( icons/icon-512.png -filter point -resize "$((short / 2))x$((short / 2))" \) -gravity center -composite "$f"
done

# 4. Version: each build gets a higher number so Android accepts it as an update.
CODE="${BUILD_NUMBER:-1}"
sed -i -E "s/versionCode [0-9]+/versionCode $CODE/; s/versionName \"[^\"]+\"/versionName \"1.0.$CODE\"/" android/app/build.gradle

# 5. Build, signed with the project's fixed debug key.
mkdir -p ~/.android && cp mobile/debug.keystore ~/.android/debug.keystore
(cd android && ./gradlew --no-daemon assembleDebug)
mkdir -p dist && cp android/app/build/outputs/apk/debug/app-debug.apk dist/Runelords-Android.apk
ls -la dist/Runelords-Android.apk
