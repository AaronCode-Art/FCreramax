import { ArrowRight } from 'lucide-react'

interface HeroSectionProps {
  onExplore: () => void
}

export function HeroSection({ onExplore }: HeroSectionProps) {
  return (
    <section className="mx-auto w-[92%] pt-5 lg:pt-8">
      <div className="relative min-h-[440px] overflow-hidden rounded-md bg-ink sm:min-h-[500px] lg:min-h-[540px]">
        <img
          src="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=2200&q=90"
          alt="Interior con pisos y acabados cerámicos"
          className="absolute inset-0 h-full w-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#171814]/85 via-[#171814]/55 to-[#171814]/5" />
        <div className="relative z-10 flex min-h-[440px] max-w-2xl flex-col justify-center px-6 py-12 text-white sm:min-h-[500px] sm:px-12 lg:min-h-[540px] lg:px-16">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/75">Cerámax</p>
          <h1 className="mt-6 max-w-xl font-display text-[42px] font-medium leading-[1.04] tracking-[-0.04em] sm:text-6xl lg:text-[68px]">
            Materiales para vivir cada espacio.
          </h1>
          <p className="mt-5 max-w-md text-sm leading-6 text-white/80 sm:text-base sm:leading-7">
            Explora los productos disponibles en nuestro catálogo.
          </p>
          <button
            type="button"
            onClick={onExplore}
            className="mt-8 inline-flex h-12 w-fit items-center gap-3 bg-white px-5 text-xs font-bold uppercase tracking-wide text-ink transition hover:bg-[#e9ba98]"
          >
            Ver productos <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </section>
  )
}
