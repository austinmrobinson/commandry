import { DocsCodeBlockChrome } from "@/app/components/docs-code-block-chrome";
import type { PackageManagerId } from "@/app/hooks/use-docs-code-prefs";
import { highlightCodeBlockPayload } from "@/app/lib/shiki-highlighter";

const INSTALL_SNIPPETS: Record<PackageManagerId, string> = {
  npm: "npm install commandry",
  pnpm: "pnpm add commandry",
  yarn: "yarn add commandry",
};

export async function InstallCommandBlock() {
  const pms = Object.keys(INSTALL_SNIPPETS) as PackageManagerId[];
  const htmlByPm = {} as Record<PackageManagerId, string>;
  const rawByPm = { ...INSTALL_SNIPPETS };

  await Promise.all(
    pms.map(async (pm) => {
      const { html } = await highlightCodeBlockPayload(INSTALL_SNIPPETS[pm], "bash");
      htmlByPm[pm] = html;
    }),
  );

  return (
    <DocsCodeBlockChrome
      variant="package-manager"
      rawByPm={rawByPm}
      htmlByPm={htmlByPm}
    />
  );
}
