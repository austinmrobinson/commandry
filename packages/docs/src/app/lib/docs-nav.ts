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
