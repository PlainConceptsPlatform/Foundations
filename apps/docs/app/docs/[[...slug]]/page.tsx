import { source } from "@/lib/source";
import { getMDXComponents } from "@/mdx-components";
import { DocsBody, DocsDescription, DocsPage, DocsTitle } from "fumadocs-ui/page";
import { notFound } from "next/navigation";
import type { ComponentProps, ComponentType } from "react";

type ContentPage = {
  body: ComponentType<{ components?: ReturnType<typeof getMDXComponents> }>;
  description: string;
  full: ComponentProps<typeof DocsPage>["full"];
  title: string;
  toc: ComponentProps<typeof DocsPage>["toc"];
};

export default async function Page(props: { params: Promise<{ slug?: string[] }> }) {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) notFound();

  // The Fumadocs 11/15 compatibility shim in lib/source loses this generated type.
  const data = page.data as unknown as ContentPage;
  const MDX = data.body;

  return (
    <DocsPage toc={data.toc} full={data.full}>
      <DocsTitle>{data.title}</DocsTitle>
      <DocsDescription>{data.description}</DocsDescription>
      <DocsBody>
        <MDX components={getMDXComponents()} />
      </DocsBody>
    </DocsPage>
  );
}

export function generateStaticParams() {
  return source.generateParams();
}

export async function generateMetadata(props: { params: Promise<{ slug?: string[] }> }) {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) notFound();

  return {
    title: page.data.title,
    description: page.data.description,
  };
}
