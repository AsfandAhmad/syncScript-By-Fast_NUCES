import Link from 'next/link';
import { BookOpen, Users, Shield, ArrowRight, FileText, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Navigation */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-14 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg">
            <BookOpen className="h-5 w-5 text-primary" />
            SyncScript
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost" size="sm">
                Sign In
              </Button>
            </Link>
            <Link href="/signup">
              <Button size="sm">Get Started</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="flex flex-1 flex-col items-center justify-center px-4 py-20 text-center">
        <div className="mx-auto max-w-3xl space-y-6">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Research collaboration,{' '}
            <span className="text-primary">simplified</span>
          </h1>
          <p className="mx-auto max-w-xl text-lg text-muted-foreground">
            Organize sources, annotate PDFs, manage citations, and collaborate with your
            research team — all in one place.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link href="/signup">
              <Button size="lg">
                Start for free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="lg">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t bg-muted/30 py-20">
        <div className="container mx-auto px-4">
          <h2 className="mb-12 text-center text-2xl font-bold">
            Everything your research team needs
          </h2>
          <div className="mx-auto grid max-w-4xl gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <FeatureCard
              icon={<FileText className="h-6 w-6" />}
              title="Source Management"
              description="Add, organize, and annotate your research sources with auto-citation support."
            />
            <FeatureCard
              icon={<Users className="h-6 w-6" />}
              title="Team Collaboration"
              description="Invite team members, assign roles, and collaborate on research in real-time."
            />
            <FeatureCard
              icon={<Shield className="h-6 w-6" />}
              title="Access Control"
              description="Fine-grained roles — owner, contributor, and viewer — keep your data safe."
            />
            <FeatureCard
              icon={<BookOpen className="h-6 w-6" />}
              title="Annotation Engine"
              description="Add annotations to any source with version tracking and real-time sync."
            />
            <FeatureCard
              icon={<Zap className="h-6 w-6" />}
              title="Real-Time Updates"
              description="See changes instantly across your team with Supabase Realtime subscriptions."
            />
            <FeatureCard
              icon={<FileText className="h-6 w-6" />}
              title="File Storage"
              description="Upload and manage research files with secure, signed download links."
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 text-center text-sm text-muted-foreground">
        <p>
          &copy; {new Date().getFullYear()} SyncScript &mdash; Built by FAST NUCES students.
        </p>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border bg-background p-6 text-left shadow-sm">
      <div className="mb-3 inline-flex rounded-lg bg-primary/10 p-2 text-primary">
        {icon}
      </div>
      <h3 className="mb-1 font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
