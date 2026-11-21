import { existsSync, readFileSync } from "node:fs";
import ts from "typescript";

const root = new URL("../", import.meta.url);

export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith("@/") || specifier.startsWith(".")) {
    const url = specifier.startsWith("@/")
      ? new URL(specifier.slice(2), root)
      : new URL(specifier, context.parentURL);
    if (url.href.startsWith(root.href) && !url.href.includes("/node_modules/")) {
      const base = url.href.replace(/\.js$/, "");
      for (const path of [url.href, base + ".ts", base + ".tsx", base + ".js", base + "/index.ts"]) {
        if (/\.(?:tsx?|js)$/.test(path) && existsSync(new URL(path))) {
          return { url: path, shortCircuit: true };
        }
      }
    }
  }
  return nextResolve(specifier, context);
}

export async function load(url, context, nextLoad) {
  if (url.startsWith(root.href) && /\.tsx?$/.test(url) && !url.includes("/node_modules/")) {
    const source = ts.transpileModule(readFileSync(new URL(url), "utf8"), {
      compilerOptions: {
        module: ts.ModuleKind.ESNext,
        target: ts.ScriptTarget.ES2022,
        jsx: ts.JsxEmit.ReactJSX,
      },
    }).outputText;
    return { format: "module", source, shortCircuit: true };
  }
  return nextLoad(url, context);
}
