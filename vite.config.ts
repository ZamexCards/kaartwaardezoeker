# ZamexCards kaartwaardezoeker

Deze versie is klaargemaakt voor GitHub Pages.

## Uploaden naar GitHub

1. Maak op GitHub een nieuwe repository.
2. Open de repository en kies **Add file → Upload files**.
3. Pak eerst het gedownloade ZIP-bestand uit.
4. Upload **alle bestanden en mappen uit de map** naar de repository.
5. Kies onderaan **Commit changes**.

Let op: upload de bestanden uit de map, niet het ZIP-bestand zelf.

## GitHub Pages aanzetten

1. Open in de repository **Settings**.
2. Klik links op **Pages**.
3. Kies bij **Source** voor **GitHub Actions**.
4. Open daarna het tabblad **Actions**.
5. Wacht tot **Publiceer op GitHub Pages** een groen vinkje krijgt.

De openbare webpagina staat daarna bij **Settings → Pages**.

## Op JouwWeb plaatsen

Voeg op JouwWeb een HTML-/embed-element toe en gebruik:

```html
<iframe
  src="VUL-HIER-JOUW-GITHUB-PAGES-LINK-IN"
  title="Wat is mijn Pokémonkaart waard?"
  style="width:100%;height:1200px;border:0;border-radius:16px;"
></iframe>
```

Vervang `VUL-HIER-JOUW-GITHUB-PAGES-LINK-IN` door de link uit GitHub Pages.

## Lokaal testen

```bash
npm install
npm run dev
```

De zoekfunctie haalt actuele beschikbare kaartgegevens op uit de openbare
TCGdex-kaartendatabron.
