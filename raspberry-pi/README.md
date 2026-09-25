# Running on a Raspberry Pi (offline kiosk)

The game is a static site (HTML/CSS/JS) with no build step and no external
dependencies at runtime — everything it needs (3Dmol.js, the Nunito font,
molecule data) is already vendored inside `molecule-game-web/`. It just
needs to be (1) served over `http://`, not opened as a `file://` path, and
(2) shown fullscreen so it works as a walk-up display.

## 1. Get the code onto the Pi

```bash
git clone git@github.com:savinspm/FindTheMoleculeGame.git ~/FindTheMoleculeGame
```

(Use the HTTPS URL instead if you haven't set up an SSH key on the Pi:
`https://github.com/savinspm/FindTheMoleculeGame.git`.)

If these paths differ from `/home/pi/FindTheMoleculeGame`, adjust the
`WorkingDirectory`/`ExecStart` paths in `molecule-game.service` and
`start-kiosk.sh` to match before installing them.

## 2. Install the local server as a systemd service

This serves the game on `http://localhost:8931` and restarts automatically
on boot or if it ever crashes.

```bash
sudo cp ~/FindTheMoleculeGame/raspberry-pi/molecule-game.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now molecule-game.service
```

Check it's up: `curl -I http://localhost:8931/index.html` should return
`200 OK`.

## 3. Auto-launch the browser in kiosk mode on login

```bash
chmod +x ~/FindTheMoleculeGame/raspberry-pi/start-kiosk.sh
mkdir -p ~/.config/autostart
cp ~/FindTheMoleculeGame/raspberry-pi/molecule-game-kiosk.desktop ~/.config/autostart/
```

This makes Chromium open fullscreen, with no address bar or tabs, pointing
at the local server, every time the Pi boots into the desktop. If you want
the Pi to boot straight to the desktop (no login prompt), set that with
`sudo raspi-config` → System Options → Boot / Auto Login → Desktop Autologin.

## 4. Reboot and check

```bash
sudo reboot
```

The Pi should boot straight into the game, fullscreen, no internet
required. Touch/click still works the same as in a normal browser.

## Updating later

```bash
cd ~/FindTheMoleculeGame && git pull
sudo systemctl restart molecule-game.service
```

Chromium will pick up the new files on its next reload (it's a kiosk
window, so reboot the Pi or reload manually with F5 if you have a
keyboard attached).

## Notes

- A Raspberry Pi 4 or newer is recommended — the 3D molecule viewer uses
  WebGL, which is noticeably slower on a Pi 3 or Zero.
- The official 7" touchscreen (800×480) and common 1024×600 screens were
  both specifically tested and tuned for during development.
- To exit kiosk mode for debugging, SSH in from another machine and run
  `sudo systemctl stop molecule-game.service` / `pkill chromium`, or
  press Alt+F4 if a keyboard is attached.
