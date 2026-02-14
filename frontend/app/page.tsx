import Link from "next/link"
import {
  BookOpen,
  FileText,
  MessageSquare,
  Users,
  ArrowRight,
  Shield,
  Zap,
  Globe,
} from "lucide-react"
import { Button } from "@/components/ui/button"

function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-primary" />
          <span className="text-lg font-semibold text-foreground">
            SyncScript
          </span>
        </Link>
        <nav className="hidden items-center gap-8 md:flex">
          <Link
            href="#features"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Features
          </Link>
          <Link
            href="#how-it-works"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            How it Works
          </Link>
          <Link href="/login">
            <Button variant="ghost" size="sm">
              Sign In
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button size="sm">
              Enter Dashboard
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
        </nav>
        <div className="flex items-center gap-2 md:hidden">
          <Link href="/login">
            <Button variant="ghost" size="sm">
              Sign In
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button size="sm">Dashboard</Button>
          </Link>
        </div>
      </div>
    </header>
  )
}

function HeroSection() {
  return (
    <section className="relative overflow-hidden px-6 py-24 md:py-32">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(217_91%_50%/0.08),transparent_60%)]" />
      <div className="relative mx-auto max-w-4xl text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-sm text-muted-foreground">
          <Shield className="h-3.5 w-3.5 text-primary" />
          Trusted by 2,000+ research teams
        </div>
        <h1 className="text-balance font-serif text-4xl font-bold leading-tight tracking-tight text-foreground md:text-6xl">
          Where Research Teams{" "}
          <span className="text-primary">Think Together</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg leading-relaxed text-muted-foreground">
          SyncScript is the collaborative workspace for academics. Organize
          documents into vaults, annotate PDFs in real-time, manage citations,
          and keep your entire team synchronized.
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link href="/dashboard">
            <Button size="lg" className="gap-2">
              Enter Dashboard
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/login">
            <Button variant="outline" size="lg">
              Create Free Account
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}

function FeaturesSection() {
  const features = [
    {
      icon: FileText,
      title: "Document Vaults",
      description:
        "Organize research papers, drafts, and data files into shared vaults with granular access control.",
    },
    {
      icon: MessageSquare,
      title: "Real-Time Annotations",
      description:
        "Annotate PDFs collaboratively. See your team highlights, comments, and notes as they happen.",
    },
    {
      icon: BookOpen,
      title: "Citation Management",
      description:
        "Import, organize, and format citations in APA, MLA, Chicago, and more. Auto-generate bibliographies.",
    },
    {
      icon: Users,
      title: "Team Collaboration",
      description:
        "Assign roles, track contributions, and maintain a full activity log of every action in the vault.",
    },
    {
      icon: Zap,
      title: "Instant Sync",
      description:
        "Every annotation, file upload, and edit is instantly synced across all collaborators in the vault.",
    },
    {
      icon: Globe,
      title: "Accessible Anywhere",
      description:
        "Access your research vaults from any device. Fully responsive, works on desktop, tablet, and mobile.",
    },
  ]

  return (
    <section id="features" className="border-t border-border px-6 py-20">
      <div className="mx-auto max-w-6xl">
        <div className="text-center">
          <h2 className="font-serif text-3xl font-bold text-foreground">
            Built for Rigorous Research
          </h2>
          <p className="mt-3 text-muted-foreground">
            Every feature designed with academic workflows in mind.
          </p>
        </div>
        <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="rounded-lg border border-border bg-card p-6 transition-colors hover:border-primary/30"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <feature.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="mt-4 font-semibold text-foreground">
                {feature.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function HowItWorksSection() {
  const steps = [
    {
      step: "01",
      title: "Create a Vault",
      description:
        "Set up a shared vault for your project, grant access to collaborators, and define roles.",
    },
    {
      step: "02",
      title: "Upload & Organize",
      description:
        "Upload PDFs, datasets, and documents. Organize them with tags and folders inside your vault.",
    },
    {
      step: "03",
      title: "Annotate & Cite",
      description:
        "Highlight key passages, leave annotations, and manage your citation library in one place.",
    },
  ]

  return (
    <section
      id="how-it-works"
      className="border-t border-border bg-card px-6 py-20"
    >
      <div className="mx-auto max-w-4xl">
        <div className="text-center">
          <h2 className="font-serif text-3xl font-bold text-foreground">
            How It Works
          </h2>
          <p className="mt-3 text-muted-foreground">
            Get your research team up and running in minutes.
          </p>
        </div>
        <div className="mt-14 grid gap-10 md:grid-cols-3">
          {steps.map((item) => (
            <div key={item.step} className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                {item.step}
              </div>
              <h3 className="mt-4 font-semibold text-foreground">
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="border-t border-border px-6 py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" />
          <span className="font-semibold text-foreground">SyncScript</span>
        </div>
        <p className="text-sm text-muted-foreground">
          {"Built for researchers, by researchers."}
        </p>
      </div>
    </footer>
  )
}

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main>
        <HeroSection />
        <FeaturesSection />
        <HowItWorksSection />
      </main>
      <Footer />
    </div>
  )
}
