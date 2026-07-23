import { createFromSource } from "fumadocs-core/search/server";
import { source } from "@/lib/source";

// Server-side search (App Service runs a Node server, not a static export).
export const { GET } = createFromSource(source);
