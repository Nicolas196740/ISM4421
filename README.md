# FAU Owl Weather 🦉

A weather app branded for Florida Atlantic University. It defaults to the FAU Boca Raton campus and uses the free [Open-Meteo](https://open-meteo.com/) API, which needs no key or login.

## Features
- Current conditions for FAU Boca Raton (26.3705, -80.1024) on load
- Next 24 hours and a 7-day forecast
- City search with autocomplete (Open-Meteo Geocoding API)
- "My location" button (browser geolocation)
- °F / °C toggle; your last city and unit are remembered
- Welcome message for Nicolas with a greeting for the time of day and a weather tip
- Four themes: System (follows your device), Light, White and Dark. Your choice is remembered
- FAU Blue (#003366) and FAU Red (#CC0000) branding with the FAU owl logo, plus a mobile layout

## Files
| File | Purpose |
|---|---|
| `index.html` | Page markup |
| `styles.css` | FAU theme |
| `app.js` | Open-Meteo calls and rendering |
| `assets/fau-owl-logo.png` | FAU owl logo (transparent background) |
| `assets/favicon.png`, `assets/apple-touch-icon.png` | Browser tab and iPhone/iPad home-screen icons |
| `netlify.toml` | Netlify config (no build step, security headers) |

## Run locally
Any static server works, for example:
```bash
python3 -m http.server 8000
# open http://localhost:8000
```

## Deploy to Netlify
**Option A: from GitHub (auto-deploys on every push)**
1. Log in at https://app.netlify.com.
2. Click **Add new site → Import an existing project → GitHub**.
3. Pick the `ISM4421` repo and the branch you want to deploy.
4. Leave **Build command** empty and set **Publish directory** to `.` (`netlify.toml` already sets both).
5. Click **Deploy**.

**Option B: drag and drop**
1. Download or zip this folder.
2. Go to https://app.netlify.com/drop and drop the folder onto the page.

## Logo
The FAU owl logo is a trademark of Florida Atlantic University. It's used here for a class project. Check FAU's brand guidelines (https://www.fau.edu/styleguide/) before you promote the site publicly.

Built by Nicolas Munoz.
