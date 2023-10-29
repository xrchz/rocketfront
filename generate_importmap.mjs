import { writeImportMapFiles } from "@jsenv/importmap-node-module";

await writeImportMapFiles({
  projectDirectoryUrl: new URL("./", import.meta.url),
  importMapFiles: {
    "./project.importmap": {
      mappingsForNodeResolution: true,
      entryPointsToCheck: ["./index.js"],
      removeUnusedMappings: true,
      magicExtensions: ["inherit"],
      manualImportMap: {
        scopes: {
          "./node_modules/multiformats/": {
            "./node_modules/multiformats/esm/src/hashes/sha2.js": "./node_modules/multiformats/esm/src/hashes/sha2-browser.js",
          },
          "./node_modules/@motionone/": {
            "./node_modules/@motionone/svelte/dist/index.es.js": "./node_modules/@motionone/svelte/dist/index.js",
          },
        },
      },
    },
  },
});
