import Image from "next/image";

export function SiteHeader() {
  return (
    <header className="w-full max-w-4xl flex items-center justify-between mb-16 mx-auto pt-12 px-4 sm:px-6 lg:px-8">
      <div className="flex items-center gap-4">
        <Image
          src="/turborepo-dark.svg"
          alt="Turborepo logo"
          width={140}
          height={30}
          priority
          className="inline-block dark:hidden"
        />
        <Image
          src="/turborepo-light.svg"
          alt="Turborepo logo"
          width={140}
          height={30}
          priority
          className="hidden dark:inline-block"
        />
      </div>
      <div className="flex gap-4 text-sm text-muted-foreground">
        <a href="/" className="hover:text-foreground transition-colors font-medium">
          Home
        </a>
        <a href="/admin/queues" className="hover:text-foreground transition-colors font-medium">
          Dashboard
        </a>
        <a
          href="https://github.com/Mesmon/async-job-queue#readme"
          className="hover:text-foreground transition-colors"
        >
          Documentation
        </a>
        <a
          href="https://github.com/Mesmon/async-job-queue"
          className="hover:text-foreground transition-colors"
        >
          GitHub
        </a>
      </div>
    </header>
  );
}
