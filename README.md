# FAU Owl Weather 🦉

A weather app branded for Florida Atlantic University. It defaults to the FAU Boca Raton campus and uses the free [Open-Meteo](https://open-meteo.com/) API, which needs no key or login.

## Features
- Current conditions for FAU Boca Raton (26.3705, -80.1024) on load
- Next 24 hours and a 7-day forecast
- City search with autocomplete (Open-Meteo Geocoding API)
- "My location" button (browser geolocation)
- °F / °C toggle; your last city and unit are remembered
- FAU Blue (#003366) and FAU Red (#CC0000) theme, dark mode, mobile layout

## Files
| File | Purpose |
|---|---|
| `index.html` | Page markup |
| `styles.css` | FAU theme |
| `app.js` | Open-Meteo calls and rendering |
| `assets/fau-logo.svg` | Logo (placeholder owl badge, see below) |
| `assets/favicon.svg` | Browser tab icon |
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

## Using the official FAU logo
`assets/fau-logo.svg` is a custom owl badge in FAU colors, not the official logo. To use the real one:
1. Download it from FAU's brand site (https://www.fau.edu/styleguide/).
2. Save it as `assets/fau-logo.svg`. If it's a PNG, save it as `assets/fau-logo.png` and update the `<img>` in `index.html`.

FAU's logos are trademarks. A class project is usually fine, but check FAU's brand guidelines before you make the site public or promote it.
