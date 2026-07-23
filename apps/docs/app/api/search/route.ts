import { source } from "@/lib/source";
import { createFromSource } from "fumadocs-core/search/server";

// Server-side search (App Service runs a Node server, not a static export).
export const { GET } = createFromSource(source);
