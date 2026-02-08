import Image from "next/image";

export function SiteFooter() {
  return (
    <footer className="w-full max-w-4xl mt-24 border-t pt-8 mx-auto flex flex-col md:flex-row items-center justify-between text-sm text-muted-foreground pb-12 px-4 sm:px-6 lg:px-8">
      <p>© 2026 Async Job Queue. Built with Turborepo & Next.js.</p>
      <div className="flex gap-6 mt-4 md:mt-0">
        <a
          href="https://vercel.com"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 hover:text-foreground transition-colors"
        >
          <Image
            src="/vercel.svg"
            alt="Vercel icon"
            width={14}
            height={14}
            className="dark:invert"
          />
          Powered by Vercel
        </a>
      </div>
    </footer>
  );
}
