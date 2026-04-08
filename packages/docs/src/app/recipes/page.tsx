import type { Metadata } from "next";
import { DocProse } from "@/app/lib/doc-prose";

export const metadata: Metadata = {
  title: "Recipes",
};

export default function RecipesPage() {
  return (
    <DocProse>
      <h1>Recipes</h1>
      <p>
        Opinionated examples for command palettes (cmdk), context menus, toolbars, and bulk
        actions — built to copy and adapt.
      </p>
      <p>Recipes will link to patterns used in the demo package where helpful.</p>
    </DocProse>
  );
}
