
import Reveal from "./Components/Reveal";

const actions = [
  {
    number: "01",
    title: "Check Mandi Prices",
    description:
      "Compare crop prices across nearby mandis and explore market trends.",
    href: "/mandi-prices",
    icon: "₹",
  },
  {
    number: "02",
    title: "Find Suitable Crops",
    description:
      "Discover crops suited to your soil, season, location and land.",
    href: "/crop-suggestions",
    icon: "🌱",
  },
];

const steps = [
  {
    number: "01",
    title: "Tell us about your farm",
    description:
      "Choose your location and enter the details needed for your task.",
  },
  {
    number: "02",
    title: "Explore local information",
    description:
      "Review relevant market prices, crop options and historical trends.",
  },
  {
    number: "03",
    title: "Make an informed choice",
    description:
      "Use transparent information and clearly explained insights to plan your next step.",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen overflow-x-clip bg-[#F5F1E6] text-[#203B2B]">
      {/* Navbar */}
      <Reveal y={-15} duration={0.6}>
        <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 lg:px-12">
          <a href="/" className="flex items-center gap-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#245B3F] text-xl text-white">
              🌾
            </span>
            <span className="text-xl font-bold tracking-tight">
              Krishi Saathi
            </span>
          </a>

          <nav className="hidden items-center gap-8 text-sm font-medium md:flex">
            <a href="#how-it-works" className="hover:text-[#56815D]">
              How it works
            </a>
            <a href="#features" className="hover:text-[#56815D]">
              Features
            </a>
          </nav>

          <a
            href="#features"
            className="rounded-full bg-[#245B3F] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#19442D]"
          >
            Get Started ↗
          </a>
        </header>
      </Reveal>

      {/* Hero */}
      <section className="mx-auto grid max-w-7xl items-center gap-12 px-6 pb-16 pt-10 lg:grid-cols-2 lg:px-12 lg:pb-24 lg:pt-16">
        <div>
          <Reveal delay={0.05}>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#C8D6BF] bg-white/60 px-4 py-2 text-sm">
              <span className="h-2 w-2 rounded-full bg-[#56815D]" />
              Smarter decisions for better farming
            </div>
          </Reveal>

          <Reveal delay={0.15} y={45}>
            <h1 className="max-w-xl text-5xl font-semibold leading-[1.12] tracking-tight sm:text-6xl lg:text-7xl">
              Grow better.
              <br />
              <span className="text-[#56815D]">Earn smarter.</span>
            </h1>
          </Reveal>

          <Reveal delay={0.25}>
            <p className="mt-6 max-w-lg text-lg leading-8 text-[#607064]">
              Find the right crops for your land, check nearby mandi prices,
              and make more informed decisions about when and where to sell.
            </p>
          </Reveal>

          <Reveal delay={0.35}>
            <div className="mt-8 flex flex-wrap justify-center gap-4 md:justify-start">
            <a
              href="#features"
              className="rounded-full bg-[#245B3F] px-7 py-4 font-semibold text-white transition hover:-translate-y-1 hover:bg-[#19442D] hover:shadow-lg"
            >
              Explore your options ↗
            </a>
            <a
              href="#how-it-works"
              className="rounded-full border border-[#C8D6BF] px-7 py-4 font-semibold transition hover:bg-white"
            >
              How it works
            </a>
          </div>
          </Reveal>

          <Reveal delay={0.45}>
            <p className="mt-8 text-sm text-[#718074]">
              Designed around farmers. Built for practical decisions.
            </p>
          </Reveal>
        </div>

        <Reveal delay={0.25} y={55} duration={0.9}>
          <div className="relative">
            <div className="absolute -inset-4 rounded-[2rem] bg-[#DCE6D4] blur-2xl" />

            <div className="relative overflow-hidden rounded-[2rem] border border-white/70 bg-[#DCE6D4] p-3 shadow-xl">
              <img
                src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=85"
                alt="Green agricultural fields stretching across the countryside"
                className="h-[350px] w-full rounded-[1.5rem] object-cover sm:h-[450px]"
              />

              <div className="absolute bottom-7 left-7 right-7 rounded-2xl border border-white/60 bg-[#F5F1E6]/95 p-5 shadow-lg backdrop-blur">
                <p className="text-sm text-[#607064]">
                  Better farming starts with
                </p>
                <p className="mt-1 text-xl font-semibold">
                  The right information.
                </p>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* Features */}
      <section
        id="features"
        className="scroll-mt-6 bg-white/60 px-6 py-16 lg:px-12 lg:py-20"
      >
        <div className="mx-auto max-w-7xl">
          <Reveal>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#56815D]">
              Your farming companion
            </p>
          </Reveal>

          <Reveal delay={0.1}>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              What would you like to do today?
            </h2>
          </Reveal>

          <Reveal delay={0.2}>
            <p className="mt-4 max-w-2xl leading-7 text-[#607064]">
              Choose a task to get started. We’ll keep the information clear
              and easy to understand.
            </p>
          </Reveal>

          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {actions.map((action, index) => (
              <Reveal
                key={action.number}
                delay={index * 0.15}
                y={45}
                duration={0.8}
              >
                <a
                  href={action.href}
                  className="group block h-full rounded-3xl border border-[#E0E6DA] bg-[#F9F8F2] p-7 transition duration-300 hover:-translate-y-2 hover:border-[#A9C5A0] hover:shadow-xl sm:p-9"
                >
                  <div className="flex items-start justify-between">
                    <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#E3EBDD] text-2xl transition duration-300 group-hover:rotate-6 group-hover:scale-110">
                      {action.icon}
                    </span>

                    <span className="text-sm text-[#8A998A]">
                      {action.number}
                    </span>
                  </div>

                  <h3 className="mt-7 text-2xl font-semibold">
                    {action.title}
                  </h3>

                  <p className="mt-3 max-w-md leading-7 text-[#607064]">
                    {action.description}
                  </p>

                  <span className="mt-7 inline-flex items-center gap-2 font-semibold text-[#245B3F]">
                    Get started
                    <span className="transition-transform duration-300 group-hover:translate-x-2">
                      →
                    </span>
                  </span>
                </a>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section
        id="how-it-works"
        className="scroll-mt-6 mx-auto max-w-7xl px-6 py-16 lg:px-12 lg:py-20"
      >
        <Reveal>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#56815D]">
            Simple by design
          </p>
        </Reveal>

        <Reveal delay={0.1}>
          <h2 className="mt-3 max-w-2xl text-3xl font-semibold sm:text-4xl">
            Useful information. Clearer decisions.
          </h2>
        </Reveal>

        <div className="mt-10 grid gap-8 sm:grid-cols-3">
          {steps.map((step, index) => (
            <Reveal
              key={step.number}
              delay={index * 0.15}
              y={40}
              duration={0.8}
            >
              <div className="h-full border-t border-[#C8D6BF] pt-5">
                <span className="text-sm font-semibold text-[#56815D]">
                  STEP {step.number}
                </span>

                <h3 className="mt-4 text-xl font-semibold">
                  {step.title}
                </h3>

                <p className="mt-3 leading-7 text-[#607064]">
                  {step.description}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Footer */}
      <Reveal y={25}>
        <footer className="border-t border-[#DCE3D6] px-6 py-7 lg:px-12">
          <div className="mx-auto flex max-w-7xl flex-col gap-3 text-sm text-[#607064] sm:flex-row sm:items-center sm:justify-between">
            <p className="font-semibold text-[#245B3F]">
              🌾 Krishi Saathi
            </p>
            <p>Helping farmers make more informed decisions.</p>
          </div>
        </footer>
      </Reveal>
    </main>
  );
}
