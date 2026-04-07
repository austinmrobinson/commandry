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
  { title: "Getting Started", href: "/docs/getting-started" },
  {
    title: "Concepts",
    children: [
      { title: "Commands", href: "/docs/concepts/commands" },
      { title: "Scopes", href: "/docs/concepts/scopes" },
      { title: "Shortcuts", href: "/docs/concepts/shortcuts" },
    ],
  },
  { title: "Hooks API", href: "/docs/hooks" },
  { title: "Recipes", href: "/docs/recipes" },
  { title: "Adapters", href: "/docs/adapters" },
];

export const docTitles: Record<string, string> = {
  "getting-started": "Getting Started",
  "concepts/commands": "Commands",
  "concepts/scopes": "Scopes",
  "concepts/shortcuts": "Shortcuts",
  hooks: "Hooks API",
  recipes: "Recipes",
  adapters: "Adapters",
};
