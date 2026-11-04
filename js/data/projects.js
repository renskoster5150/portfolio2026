// Every project in one place. The home page, the projects grid, the "next
// project" links and the page-transition labels are all built from this list.
//
// To add a project:
//   1. add an entry below (the order here is the order on the site)
//   2. give it a colour in css/styles.css (search for "project colours")
//   3. copy one of the project-*.html pages and fill in the content

export const CATEGORIES = [
  {
    id: "branding",
    label: "branding",
    title: "brand identity",
    blurb: "logo design, visual systems, brand guidelines",
    color: "pink",
  },
  {
    id: "ux-ui",
    label: "ux/ui",
    title: "digital design",
    blurb: "ux/ui design, web design, app interfaces",
    color: "lilac",
  },
  {
    id: "editorial",
    label: "editorial",
    title: "print & editorial",
    blurb: "book layouts, packaging, print collateral",
    color: "yellow",
  },
  {
    id: "exhibition",
    label: "exhibition",
    title: "exhibition design",
    blurb: "interactive installations, museum experiences",
    color: "mint",
  },
];

const image = (src, width, height) => ({ src, width, height });

export const PROJECTS = [
  {
    slug: "km-brandbook",
    title: "Klein Media Brand Book",
    year: 2026,
    categories: ["branding"],
    summary: "A complete brand manual for an organic growth agency: logo, colour, type, icons and the shard in use.",
    thumb: image("img/thumbs/km-brandbook.webp", 1200, 900),
    cover: image("img/km-brandbook/hero.webp", 1760, 900),
    featured: true,
  },
  {
    slug: "km-icons",
    title: "Klein Media Icons",
    year: 2026,
    categories: ["branding"],
    summary: "Six main icons and nineteen sub icons for Klein Media's services, each cluster with its own colour.",
    thumb: image("img/km-icons/hero.webp", 1500, 868),
    cover: image("img/km-icons/hero.webp", 1500, 868),
  },
  {
    slug: "qualiko-cookbook",
    title: "Qualiko Cookbook",
    year: 2025,
    categories: ["editorial"],
    summary: "A complete recipe book for Qualiko, from the cover to every recipe spread.",
    thumb: image("img/thumbs/Frontandbackv1.webp", 900, 637),
    cover: image("img/qualiko/Frontandbackv1.webp", 1280, 906),
    featured: true,
  },
  {
    slug: "main", // page: project-main.html
    title: "Ze zei het al",
    year: 2026,
    categories: ["exhibition"],
    summary: "An interactive installation at Foam that lets visitors feel how male-based medical research misdiagnoses women.",
    thumb: image("img/thumbs/finalexhibit3.webp", 900, 675),
    cover: image("img/week6/finalexhibit2.webp", 1600, 1200),
    featured: true,
  },
  {
    slug: "aeck",
    title: "Aeck",
    year: 2025,
    categories: ["branding", "ux-ui"],
    summary: "Logo, apparel mockups and a landing page for an up-and-coming sports brand.",
    thumb: image("img/thumbs/mockupaeckmaino.webp", 900, 591),
    cover: image("img/Aeck/mockupaeckmaino.webp", 926, 608),
  },
  {
    slug: "axventures",
    title: "Axventures",
    year: 2025,
    categories: ["ux-ui", "branding"],
    summary: "A calm, professional website for a spiritual care practice for footballers and coaches.",
    thumb: image("img/thumbs/frontpage.webp", 900, 587),
    cover: image("img/axventures/frontpage.webp", 1092, 712),
    featured: true,
  },
  {
    slug: "breek-het-beeld",
    title: "Breek het Beeld",
    year: 2025,
    categories: ["exhibition"],
    summary: "A museum experience for the Wereldmuseum that helps teenagers question stereotypes about Asian women.",
    thumb: image("img/thumbs/MOCKUPDOOS.webp", 900, 600),
    cover: image("img/WM/MOCKUPDOOS.webp", 1536, 1024),
  },
  {
    slug: "qualiko-freezer",
    title: "Qualiko Freezer Stickers",
    year: 2025,
    categories: ["editorial"],
    summary: "Freezer stickers that make Qualiko's products stand out in a busy supermarket.",
    thumb: image("img/thumbs/freerzermockup.webp", 900, 598),
    cover: image("img/qualiko/freerzermockup.webp", 1600, 1063),
  },

  // Audio-visual work: the pages exist but are left out of every list.
  {
    slug: "abstraction",
    title: "Product van je Omgeving",
    year: 2026,
    categories: ["audio-visual"],
    thumb: image("img/thumbs/Secondediton.webp", 660, 926),
    hidden: true,
  },
  {
    slug: "windowinto",
    title: "Safe Space",
    year: 2026,
    categories: ["audio-visual"],
    thumb: image("img/thumbs/windowgood.webp", 900, 725),
    hidden: true,
  },
  {
    slug: "shiftingcontext",
    title: "Framing Story",
    year: 2026,
    categories: ["audio-visual"],
    thumb: image("img/thumbs/presentators.webp", 772, 558),
    hidden: true,
  },
  {
    slug: "tutorial",
    title: "Thai Basil Chicken Tutorial",
    year: 2026,
    categories: ["audio-visual"],
    thumb: image("img/thumbs/thedish.webp", 900, 918),
    hidden: true,
  },
  {
    slug: "soundscape",
    title: "Robbery",
    year: 2026,
    categories: ["audio-visual"],
    thumb: image("img/thumbs/robber.webp", 506, 366),
    hidden: true,
  },
  {
    slug: "nummer",
    title: "Bereboot (Uptempo remix)",
    year: 2026,
    categories: ["audio-visual"],
    thumb: image("img/thumbs/bereboot.webp", 616, 616),
    hidden: true,
  },
  {
    slug: "jokerscore",
    title: "Joker Score",
    year: 2026,
    categories: ["audio-visual"],
    thumb: image("img/thumbs/jokeronstairs.webp", 682, 656),
    hidden: true,
  },
];

export const LISTED = PROJECTS.filter((project) => !project.hidden);
export const FEATURED = LISTED.filter((project) => project.featured);

export const pageOf = (project) => `project-${project.slug}.html`;
export const categoryOf = (id) => CATEGORIES.find((category) => category.id === id);
export const projectsIn = (id) => LISTED.filter((project) => project.categories.includes(id));
export const findProject = (slug) => PROJECTS.find((project) => project.slug === slug);

/** The project after this one in the list (hidden pages lead back to the first). */
export function nextProject(slug) {
  const index = LISTED.findIndex((project) => project.slug === slug);
  return LISTED[(index + 1) % LISTED.length];
}
