import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 p-8 text-center">
      <h1 className="text-3xl font-bold">Platform Foundations</h1>
      <p className="max-w-xl text-fd-muted-foreground">
        The shared theme, conventions, and showcase for PlainConcepts Platform apps. Built on
        Next.js, shadcn/ui and Tailwind, themed with the Platform styleguide.
      </p>
      <Link
        href="/docs"
        className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
      >
        Open the docs
      </Link>
    </main>
  );
}
