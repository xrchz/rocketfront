import { writeImportMapFiles } from "@jsenv/importmap-node-module";

await writeImportMapFiles({
  projectDirectoryUrl: new URL("./", import.meta.url),
  importMapFiles: {
    "./project.importmap": {
      mappingsForNodeResolution: true,
      entryPointsToCheck: ["./index.js"],
      removeUnusedMappings: true,
      manualImportMap: {
        scopes: {
          "./node_modules/ethers/lib.esm/": {
            "./node_modules/ethers/lib.esm/crypto/crypto.js": "./node_modules/ethers/lib.esm/crypto/crypto-browser.js",
            "./node_modules/ethers/lib.esm/providers/provider-ipcsocket.js": "./node_modules/ethers/lib.esm/providers/provider-ipcsocket-browser.js",
            "./node_modules/ethers/lib.esm/providers/ws.js": "./node_modules/ethers/lib.esm/providers/ws-browser.js",
            "./node_modules/ethers/lib.esm/utils/base64.js": "./node_modules/ethers/lib.esm/utils/base64-browser.js",
            "./node_modules/ethers/lib.esm/utils/geturl.js": "./node_modules/ethers/lib.esm/utils/geturl-browser.js",
            "./node_modules/ethers/lib.esm/wordlists/wordlists.js": "./node_modules/ethers/lib.esm/wordlists/wordlists-browser.js"
          },
        },
      },
    },
  },
});
