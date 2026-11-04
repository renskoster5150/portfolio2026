# renskoster.com

Portfolio of Rens Koster, digital & graphic designer. Plain HTML, CSS and
JavaScript modules: no build step, GitHub Pages serves the files as they are.
The 3D riso head and shapes use [three.js](https://threejs.org) from a CDN.

## Structure

```
index.html, about.html, projects.html, contact.html, 404.html
project-*.html          one page per project
css/styles.css          all styling, sections numbered in the table of contents
js/boot.js              tiny script in <head>: page-transition arrival + safety net
js/main.js              entry point, loads the module for the current page
js/data/projects.js     every project in one list (home, grid, "next project")
js/lib/                 small helpers and the shared animation loop
js/ui/                  header/footer, page transitions, reveals, cursor, lightbox, media
js/pages/               one module per page type
js/three/               the riso-printed 3D head and shapes
img/  audio/  models/   web-ready media (webp, m4a, glb)
```

The header and footer are rendered by `js/ui/chrome.js`, so a nav link or
an email address only needs changing in one place.

## Add a project

1. Add an entry to `js/data/projects.js`. The order there is the order on the
   site; `featured: true` puts it in the stack on the home page.
2. Give it a colour in `css/styles.css` (search for "project colours").
3. Copy an existing `project-*.html` page, rename it to `project-<slug>.html`
   and replace the content. Images go in `img/` as `.webp`.

Each speciality on the home page links to `projects.html?filter=<category>`,
so a filtered view can be linked to and shared.

## Run locally

Any static server works, for example:

```
python3 -m http.server
```

Then open http://localhost:8000. (Opening the files directly won't work,
because JavaScript modules need a server.)
