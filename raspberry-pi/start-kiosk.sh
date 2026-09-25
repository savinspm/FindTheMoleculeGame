#!/bin/bash
# Launches the game fullscreen in Chromium, no toolbars, no popups.
# Meant to be run automatically on login via ~/.config/autostart.

URL="http://localhost:8931/index.html"

# Wait for the local server (systemd service) to be ready.
until curl -s -o /dev/null "$URL"; do
    sleep 1
done

# Stop the screen from blanking/locking during the display.
xset s off -dpms 2>/dev/null
xset s noblank 2>/dev/null

# Raspberry Pi OS Bookworm renamed the binary from chromium-browser to
# chromium; try both so this script works on either version.
CHROMIUM=$(command -v chromium || command -v chromium-browser)

exec "$CHROMIUM" \
    --kiosk \
    --incognito \
    --noerrdialogs \
    --disable-infobars \
    --disable-session-crashed-bubble \
    --disable-translate \
    --overscroll-history-navigation=0 \
    --check-for-update-interval=31536000 \
    "$URL"
