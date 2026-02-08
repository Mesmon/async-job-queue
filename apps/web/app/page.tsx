import { ProcessorView } from "./components/processor-view";

export default function Home() {
  return (
    <div className="w-full max-w-4xl px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-12 space-y-4">
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl bg-clip-text text-transparent bg-gradient-to-r from-primary to-muted-foreground">
          Async Job Queue
        </h1>
        <p className="max-w-2xl mx-auto text-lg text-muted-foreground">
          A modern, scalable solution for handling long-running image processing tasks. Upload your
          files and configure processing options in real-time.
        </p>
      </div>

      <div className="flex justify-center">
        <ProcessorView />
      </div>

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
