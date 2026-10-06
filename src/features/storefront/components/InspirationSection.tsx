import { ArrowRight } from 'lucide-react'

interface InspirationSectionProps {
  onExplore: () => void
}

export function InspirationSection({ onExplore }: InspirationSectionProps) {
  return (
    <section className="mx-auto w-[92%] pb-10">
      <div className="grid overflow-hidden rounded-md bg-[#e9e2d8] md:grid-cols-2">
        <div className="flex min-h-[300px] flex-col justify-center p-7 sm:p-12 lg:p-16">
          <p className="eyebrow">Cerámax</p>
          <h2 className="mt-3 max-w-md font-display text-4xl leading-tight text-ink sm:text-5xl">
            Encuentra materiales para tu proyecto.
          </h2>
          <button
            type="button"
            onClick={onExplore}
            className="mt-7 inline-flex w-fit items-center gap-2 border-b border-terracotta pb-1 text-xs font-bold uppercase tracking-wide text-ink"
          >
            Explorar catálogo <ArrowRight size={14} />
          </button>
        </div>
        <img
          src="https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1400&q=85"
          alt="Ambiente interior con acabados naturales"
          className="min-h-[280px] w-full object-cover md:min-h-full"
          loading="lazy"
        />
      </div>
    </section>
  )
}
