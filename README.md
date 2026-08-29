# Clean-room n8n agents

B2B landing page for Cristopher Guido. Home sells a custom n8n build. `work.html` has one Wayfair case-study card. The five projects live on `wayfair.html`. No insurance demo on home.

`site/` is the source. Netlify publishes it. `docs/` is a stale GitHub Pages copy — update it from `site/` if Pages should stay in sync.

## Netlify

From the repo root:

```
netlify deploy --dir=site
```

Production:

```
netlify deploy --dir=site --prod
```

Or connect this GitHub repo in the Netlify UI. `netlify.toml` already sets `publish = "site"`.

`MAILTO` is the constant at the top of `site/app.js`. Drop your address there if you want the button to open mail. Leave it empty and the button uses the Netlify form (submissions land in the Netlify dashboard).

After you edit `site/`, copy it to `docs/` if you still want Pages in sync:

```
cp -R site/. docs/
```

## GitHub Pages

Enable Pages: Settings → Pages → Deploy from a branch → `main` / `/docs`.

After Pages is enabled, the site will be at https://chrisguido11.github.io/n8n-case-studies/
