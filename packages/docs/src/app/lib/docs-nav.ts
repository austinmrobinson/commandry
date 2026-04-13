export type NavItem = {
  title: string;
  href: string;
};

export type NavSection = {
  title: string;
  href?: string;
  children?: NavItem[];
};

export const docsNav: NavSection[] = [
  { title: "Overview", href: "/" },
  { title: "Installation", href: "/getting-started" },
  {
    title: "Concepts",
    children: [
      { title: "Commands", href: "/commands" },
      { title: "Scopes", href: "/scopes" },
      { title: "Shortcuts", href: "/shortcuts" },
    ],
  },
  { title: "Hooks API", href: "/hooks" },
  { title: "Recipes", href: "/recipes" },
  { title: "Adapters", href: "/adapters" },
];

/** Flat reading order (matches sidebar). */
export function flattenDocsNav(): NavItem[] {
  const out: NavItem[] = [];
  for (const section of docsNav) {
    if (section.href) out.push({ title: section.title, href: section.href });
    if (section.children) {
      for (const child of section.children) out.push(child);
    }
  }
  return out;
}

function normalizeDocPath(pathname: string): string {
  if (!pathname || pathname === "/") return "/";
  const trimmed = pathname.replace(/\/+$/, "");
  return trimmed === "" ? "/" : trimmed;
}

export function getDocNeighbors(pathname: string): {
  prev?: NavItem;
  next?: NavItem;
} {
  const flat = flattenDocsNav();
  const path = normalizeDocPath(pathname);
  const idx = flat.findIndex((item) => normalizeDocPath(item.href) === path);
  if (idx === -1) return {};
  return {
    prev: idx > 0 ? flat[idx - 1] : undefined,
    next: idx < flat.length - 1 ? flat[idx + 1] : undefined,
  };
}

/** Slug segment(s) for metadata / titles — empty string = overview `/` */
export const docTitles: Record<string, string> = {
  "": "Overview",
  "getting-started": "Installation",
  commands: "Commands",
  scopes: "Scopes",
  shortcuts: "Shortcuts",
  hooks: "Hooks API",
  recipes: "Recipes",
  adapters: "Adapters",
};
