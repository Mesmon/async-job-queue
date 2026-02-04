import Image, { type ImageProps } from "next/image";
import { FileUpload } from "./components/file-upload";

type Props = Omit<ImageProps, "src"> & {
  srcLight: string;
  srcDark: string;
};

const ThemeImage = (props: Props) => {
  const { srcLight, srcDark, ...rest } = props;

  return (
    <>
      <Image {...rest} src={srcLight} className="inline-block dark:hidden" />
      <Image {...rest} src={srcDark} className="hidden dark:inline-block" />
    </>
  );
};

export default function Home() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <header className="w-full max-w-4xl flex items-center justify-between mb-16">
        <ThemeImage
          srcLight="turborepo-dark.svg"
          srcDark="turborepo-light.svg"
          alt="Turborepo logo"
          width={140}
          height={30}
          priority
        />
        <div className="flex gap-4 text-sm text-muted-foreground">
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

      <main className="w-full max-w-4xl flex flex-col items-center flex-grow">
        <div className="text-center mb-12 space-y-4">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl bg-clip-text text-transparent bg-gradient-to-r from-primary to-muted-foreground">
            Async Job Queue
          </h1>
          <p className="max-w-2xl mx-auto text-lg text-muted-foreground">
            A modern, scalable solution for handling long-running image processing tasks. Upload
            your files and watch the magic happen in real-time.
          </p>
        </div>

        <FileUpload />

        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 w-full">
          <Feature
            title="Fast Uploads"
            description="Direct-to-cloud uploading ensures your files reach storage safely and quickly."
          />
          <Feature
            title="Async Processing"
            description="Our robust queue handles the heavy lifting without blocking your workflow."
          />
          <Feature
            title="Real-time Updates"
            description="Stay informed with live status polling and instant feedback on job completion."
          />
        </div>
      </main>

      <footer className="w-full max-w-4xl mt-24 border-t pt-8 flex flex-col md:flex-row items-center justify-between text-sm text-muted-foreground pb-8">
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
    </div>
  );
}

function Feature({ title, description }: { title: string; description: string }) {
  return (
    <div className="p-6 rounded-xl border bg-card/50 backdrop-blur-sm">
      <h3 className="font-bold text-lg mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
}
