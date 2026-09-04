import { docs } from "@/.source";
import { loader } from "fumadocs-core/source";

// Version-compat shim: fumadocs-mdx 11.x returns `files` as a lazy function,
// while fumadocs-core 15.8.x `loader` expects `files` to be an array. Resolve
// the function to an array so both work together. Remove once the versions are
// aligned (core >= the release that accepts a function).
const mdxSource = docs.toFumadocsSource();
type Files = typeof mdxSource.files;
const files = (mdxSource as { files: Files | (() => Files) }).files;
const resolvedFiles = typeof files === "function" ? files() : files;

export const source = loader({
  baseUrl: "/docs",
  source: { files: resolvedFiles },
});
