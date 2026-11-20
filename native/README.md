# Windows, Mac and Android apps

The Codex is one web page (`index.html`). The apps are thin wrappers around that same page:

| | What it uses | What people download |
|---|---|---|
| **Windows** | [Tauri](https://tauri.app) (Microsoft Edge WebView2, built into Windows 10 and 11) | `…-Windows-setup.exe` (or `.msi`), about 3–5 MB |
| **Mac** | The same Tauri app (Safari's WebKit, built into macOS 10.15 and later); one app for Apple silicon and Intel | `…-Mac.dmg` |
| **Android** | [Capacitor](https://capacitorjs.com) (Android System WebView) | `…-Android.apk` |
| **Any device** | The website itself, installable as an app (PWA) | Nothing. Open the site and choose **Install app** |

Characters are saved on each device, inside the app. Use **Export** and **Import** to move them between devices.
In the Windows and Mac apps, **Options → Save location** also keeps them in a folder of your choice (NAS, Dropbox, OneDrive, iCloud Drive) and syncs it, so several computers can share the same characters. The page talks to that folder through six small commands in `tauri/src-tauri/src/main.rs` (pick, check, list, read, write, remove), which only reach files inside the chosen folder.
On Android, **Export** opens the share sheet, so you can save the file to Drive or Files, or send it to yourself.

## Building with GitHub (no tools needed on your computer)

1. The workflow is already in the repository at **`.github/workflows/build-apps.yml`**.
   (If it's missing, for example because the upload skipped hidden folders, create that file on GitHub and paste its contents in.)
2. On GitHub, open **Actions → Build Windows, Mac and Android apps → Run workflow** and click **Run workflow**. Leave the version blank to use the newest version in `src/changelog.json` (the version the app shows in Options), or type one.
3. After about 10–15 minutes, the installers appear under **Releases** on your repository's main page.

The workflow builds the app from the top of the repository (or an `app/` folder). You can also type the folder name when you run it.

Use a higher version number each time (1.0.1, 1.1.0 …). Android only updates an installed app when the new one has a higher version.

## Building on your own computer

You need [Node.js 20+](https://nodejs.org). First build the page: `python tools/build.py`.

**Windows or Mac app:** install [Rust](https://rustup.rs) plus, on Windows, the Visual Studio C++ Build Tools, or on a Mac, Xcode's command line tools (`xcode-select --install`). See Tauri's prerequisites. Then

```bash
cd native/tauri
npm install
npm run build          # installers end up in src-tauri/target/release/bundle/
npm run dev            # or open a test window
```

On a Mac, `npx tauri build --bundles app,dmg` makes a `.dmg` for that Mac; add `--target universal-apple-darwin` (after `rustup target add aarch64-apple-darwin x86_64-apple-darwin`) for one that runs on both kinds of Mac.

**Android app:** install [Android Studio](https://developer.android.com/studio) (it brings Java and the Android SDK), then

```bash
cd native/android
npm install
npm run setup          # creates native/android/android, with icons and splash screens
npx cap open android   # opens it in Android Studio: Run ▶ on a phone or emulator, or Build → Build APK
```

After changing the app, run `python tools/build.py` and then `npm run sync` (Android) or `npm run build` (Windows or Mac).

## Notes

- **Unsigned builds.** The Windows installer isn't code-signed, so Windows SmartScreen may say "unknown publisher"
  (choose *More info → Run anyway*). The Mac app is only ad-hoc signed (no paid Apple developer account), so the first
  time it opens macOS asks you to allow it in *System Settings → Privacy & Security → Open Anyway*. The Android APK is signed with a debug key: fine for installing from GitHub, but
  the Google Play Store needs a release key. Both can be added later without changing the app.
- **Icons** are drawn by `tools/make_icons.py` (run it after changing the design).
- `native/www/`, `node_modules/`, `native/android/android/` and `native/tauri/src-tauri/target/` are build output. Don't commit them.
