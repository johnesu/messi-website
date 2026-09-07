import Link from 'next/link';
import type { Category } from '@/lib/catalog';
import { getHomePage, getCategories } from '@/lib/catalog';
import { HeroBackground } from '@/components/HeroBackground';
import { FadeIn, Stagger, Float, Item } from '@/components/motion';
import {
  ArrowRightIcon,
  StarIcon,
} from '@/components/icons';

export const dynamic = 'force-dynamic';

async function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-ink-950 text-white">
      <HeroBackground interval={3000} />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-ink-950/90 via-ink-950/60 to-ink-950/30" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-ink-950/80 to-transparent" />

      <Float
        amplitude={26}
        duration={9}
        className="pointer-events-none absolute right-[4%] top-[8%] h-96 w-96 rounded-full bg-gradient-to-tr from-brand-500/30 to-transparent blur-3xl"
      >
        <span aria-hidden="true" className="block h-full w-full" />
      </Float>
      <Float
        amplitude={20}
        duration={11}
        className="pointer-events-none absolute top-[6%] right-[26%] h-56 w-56 rounded-full bg-gradient-to-br from-accent-500/25 to-transparent blur-2xl"
      >
        <span aria-hidden="true" className="block h-full w-full" />
      </Float>
      <Float
        amplitude={30}
        duration={13}
        className="pointer-events-none absolute bottom-[36%] right-[14%] h-64 w-64 rounded-full bg-gradient-to-bl from-brand-400/25 to-accent-400/15 blur-3xl"
      >
        <span aria-hidden="true" className="block h-full w-full" />
      </Float>

      <div className="container-page relative pt-16 pb-24 md:pt-20 md:pb-32">
        <Stagger className="max-w-3xl">
          <Item as="div" className="mb-5 inline-flex items-center gap-2 rounded-full bg-ink-900/40 px-4 py-1.5 text-sm font-semibold text-white ring-1 ring-white/20 backdrop-blur">
            <StarIcon width={16} height={16} className="text-accent-400" />
            Africa’s Leading Fashion Institute
          </Item>
          <Item as="h1" className="mb-6 font-display text-5xl font-extrabold leading-tight tracking-tight text-white drop-shadow md:text-6xl">
            Transforming Lives Through Fashion, Creativity &amp; Skills
          </Item>
          <Item as="p" className="mb-9 max-w-2xl text-xl text-white/85">
            Where heritage craftsmanship meets modern innovation. Master the art of tailoring and design under expert mentorship.
          </Item>
          <Item as="div" className="flex flex-wrap gap-3">
            <Link href="/training" className="btn-primary px-9 py-3.5 text-lg">
              Apply for Training <ArrowRightIcon width={20} height={20} />
            </Link>
            <Link
              href="/shop"
              className="btn-primary px-9 py-3.5 text-lg"
            >
              Shop Collections
            </Link>
            <Link href="/bespoke" className="btn-primary px-9 py-3.5 text-lg">
              Request Custom Design
            </Link>
          </Item>

          <Item as="dl" className="mt-14 flex flex-wrap divide-x divide-white/20 text-center">
            <div className="pr-8">
              <dt className="text-3xl font-extrabold text-white">2,500+</dt>
              <dd className="mt-1.5 text-sm text-white/70">Students Trained</dd>
            </div>
            <div className="px-8">
              <dt className="text-3xl font-extrabold text-white">180+</dt>
              <dd className="mt-1.5 text-sm text-white/70">Brands Launched</dd>
            </div>
            <div className="pl-8">
              <dt className="text-3xl font-extrabold text-white">100%</dt>
              <dd className="mt-1.5 text-sm text-white/70">Job Placement</dd>
            </div>
          </Item>
        </Stagger>
      </div>
    </section>
  );
}

function HeritageSection() {
  return (
    <section id="heritage" className="container-page py-16">
      <div className="grid grid-cols-1 items-center gap-20 lg:grid-cols-2">
        <FadeIn>
          <div className="relative">
            <div className="relative z-10 mx-auto aspect-[3/4] w-full max-w-xs overflow-hidden rounded-2xl shadow-2xl sm:max-w-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAyr1TD2b9MjPZxV03h_C74btFiHKo5qpfcmQdv8oOWR1qcDwhhZsEtMrjgJRj_tpBaNxH4ZaWSX-DygxF6ZUFIHEDk3fD9iJmVn-_OZfHTbH4WuayYbFgGw8X-6K8v2HpYeNjpJQ7PX6sXZqWNimRNbrXJNIEV7SgFA0qHz-phwX2q6XtJT0Ecsvb2onrA9TfVb-CYZM3-tjvNVp2mgGM0GvH9gGcHrPA1p5C5MHjAw9UBZyxbMgyq2doc5I1fNLMBYCwsba0ywGmw"
                alt="Portrait of Mother Elizabeth, founder, in a custom-tailored dress with intricate patterns, smiling warmly in a designer workshop filled with mannequins and high-end fabrics."
                className="h-full w-full object-cover"
              />
            </div>
            <div className="absolute -left-10 -top-10 -z-10 h-48 w-48 rounded-full bg-brand-500/5 blur-3xl" />
          </div>
        </FadeIn>

        <div>
          <div className="section-kicker">Our Heritage</div>
          <h2 className="mb-8 font-display text-3xl font-extrabold tracking-tight text-ink-900 md:text-4xl">
            The Vision of Mother Elizabeth
          </h2>
          <p className="mb-6 leading-relaxed text-ink-600">
            What started as a small tailoring workshop has blossomed into a beacon of excellence for African fashion. Mother
            Elizabeth&rsquo;s sewing institute was founded on the belief that fashion is a powerful tool for economic
            independence.
          </p>
          <p className="mb-10 leading-relaxed text-ink-600 opacity-80">
            Today, MESI stands as a world-class institute dedicated to nurturing the next generation of fashion moguls,
            tailors and designers — ensuring the rich legacy of bespoke craftsmanship continues to thrive in a modern world.
          </p>

          <div className="grid grid-cols-2 gap-8">
            <div>
              <h4 className="mb-2 font-display text-xl font-bold italic text-brand-700">Vision</h4>
              <p className="leading-relaxed text-ink-600 opacity-70">
                To lead the global conversation on African couture and technical education.
              </p>
            </div>
            <div>
              <h4 className="mb-2 font-display text-xl font-bold italic text-brand-700">Mission</h4>
              <p className="leading-relaxed text-ink-600 opacity-70">
                Empowering individuals through rigorous skill-based training and professional mentorship.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

const COURSES = [
  {
    duration: '6 Months',
    title: 'Fashion Design & Illustration',
    desc: 'From concept to catwalk. Learn sketching, color theory and digital fashion rendering.',
    img: 'https://www.motthelabel.com/cdn/shop/files/Sanaa1b.jpg?crop=center&height=1620&width=1080',
  },
  {
    duration: '1 Year',
    title: 'Advanced Bespoke Tailoring',
    desc: 'The pinnacle of technical skill. Master pattern drafting, fitting and structural construction.',
    img: 'https://www.motthelabel.com/cdn/shop/files/1V5A6272_copy.jpg?crop=center&height=2400&width=1600',
  },
  {
    duration: '4 Months',
    title: 'Bridal & Evening Wear',
    desc: 'Specialized techniques for couture finishing, lace manipulation and corsetry.',
    img: 'https://www.motthelabel.com/cdn/shop/files/Atsi1d.jpg?crop=center&height=1620&width=1080',
  },
];

function TrainingSection() {
  return (
    <section className="bg-ink-50">
      <div className="container-page py-16">
        <FadeIn className="mb-10 text-center">
          <div className="section-kicker">Elite Training Curriculums</div>
          <h2 className="section-title">Master the Art of the Craft</h2>
          <p className="mx-auto mt-2 max-w-xl text-ink-600">
            Master the intricacies of garment construction through our specialized vocational paths.
          </p>
        </FadeIn>

        <Stagger className="grid gap-6 md:grid-cols-3">
          {COURSES.map((c) => (
            <Item key={c.title}>
              <Link
                href="/training"
                className="group block h-full overflow-hidden rounded-2xl border border-ink-200 bg-white shadow-card transition-shadow hover:shadow-lift"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-ink-200">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={c.img}
                    alt={c.title}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <span className="chip absolute left-4 top-4 border-0 bg-brand-900 text-white">
                    {c.duration}
                  </span>
                </div>
                <div className="p-6">
                  <h3 className="mb-2 font-display text-lg font-bold text-ink-900">{c.title}</h3>
                  <p className="text-sm text-ink-500">{c.desc}</p>
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand-600 group-hover:text-brand-700">
                    Course details <ArrowRightIcon width={16} height={16} />
                  </span>
                </div>
              </Link>
            </Item>
          ))}
        </Stagger>
      </div>
    </section>
  );
}

const STEPS = [
  { n: '01', title: 'Choose Design', desc: 'Select from our catalog or provide yours.' },
  { n: '02', title: 'Upload Reference', desc: 'Send us your fabric preferences and ideas.' },
  { n: '03', title: 'Measurements', desc: 'Submit your sizes and fit details online.' },
  { n: '04', title: 'Production', desc: 'Our artisans handcraft your garment.' },
  { n: '05', title: 'Delivery', desc: 'Worldwide shipping to your doorstep.' },
];

function BespokeSection() {
  return (
    <section className="container-page py-16">
      <FadeIn className="mb-10 text-center">
        <div className="section-kicker">Bespoke Services</div>
        <h2 className="section-title">Your Custom Masterpiece in 5 Steps</h2>
      </FadeIn>
      <Stagger className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
        {STEPS.map((s) => (
          <Item key={s.n} className="rounded-2xl border border-ink-200 bg-white p-6 shadow-card">
            <div className="mb-3 font-display text-3xl font-extrabold text-brand-200">{s.n}</div>
            <div className="mb-1 text-sm font-bold text-ink-900">{s.title}</div>
            <div className="text-sm text-ink-500">{s.desc}</div>
          </Item>
        ))}
      </Stagger>
      <div className="mt-10 text-center">
        <Link href="/bespoke" className="btn-primary px-7 py-3">
          Request a Bespoke Design <ArrowRightIcon width={18} height={18} />
        </Link>
      </div>
    </section>
  );
}

async function CategorySection() {
  let categories: Category[] = [];
  try {
    categories = await getCategories();
  } catch {
    categories = [];
  }
  return (
    <section className="bg-ink-50">
      <div className="container-page py-14">
        <FadeIn className="mb-8 text-center">
          <div className="section-kicker">Browse</div>
          <h2 className="section-title">Shop by collection</h2>
        </FadeIn>
        <Stagger className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {categories.map((c) => (
            <Item key={c.id}>
              <Link
                href={`/category/${c.slug}`}
                className="group relative block aspect-[4/5] overflow-hidden rounded-xl bg-ink-200"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={c.imageUrl ?? `https://picsum.photos/seed/cat-${c.slug}/400/500`}
                  alt={c.name}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink-950/85 via-ink-950/20 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-4 text-white">
                  <div className="font-display text-lg font-bold">{c.name}</div>
                  <div className="text-xs text-white/70">
                    {c._count?.productCategories ?? 0} pieces
                  </div>
                </div>
              </Link>
            </Item>
          ))}
        </Stagger>
      </div>
    </section>
  );
}

const TESTIMONIALS = [
  {
    quote: 'MESI didn’t just teach me how to sew; they taught me how to think like a designer. I launched my bridal line just 3 months after graduation.',
    name: 'Amara Nwosu',
    role: 'Founder, Amara Bridal',
  },
  {
    quote: 'The tailoring skills I acquired here are world-class. The attention to detail has set me apart in the industry.',
    name: 'David Okafor',
    role: 'Creative Director, Okafor Menswear',
  },
  {
    quote: 'The mentorship from Mother Elizabeth is invaluable. She pushed me to find my unique voice.',
    name: 'Sarah Bello',
    role: 'Textile Artist & Designer',
  },
];

function TestimonialsSection() {
  return (
    <section className="container-page py-16">
      <FadeIn className="mb-10 text-center">
        <div className="section-kicker">Stories of Transformation</div>
        <h2 className="section-title">From Student to Fashion Mogul</h2>
      </FadeIn>
      <Stagger className="grid gap-6 md:grid-cols-3">
        {TESTIMONIALS.map((t) => (
          <Item key={t.name} className="flex flex-col rounded-2xl border border-ink-200 bg-white p-6 shadow-card">
            <StarIcon width={16} height={16} className="mb-3 text-accent-500" />
            <p className="mb-5 flex-1 text-sm leading-relaxed text-ink-700">“{t.quote}”</p>
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-900 text-sm font-bold text-white">
                {t.name.charAt(0)}
              </span>
              <div>
                <div className="text-sm font-bold text-ink-900">{t.name}</div>
                <div className="text-xs text-ink-500">{t.role}</div>
              </div>
            </div>
          </Item>
        ))}
      </Stagger>
    </section>
  );
}

function PromoBanner() {
  return (
    <FadeIn className="container-page py-14">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-ink-900 to-ink-800 px-8 py-12 text-center sm:py-16">
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-brand-500/20 blur-3xl" />
        <div className="relative">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-brand-500/20 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-brand-300">
            The Craftsmanship Promise
          </div>
          <h2 className="mx-auto mb-3 max-w-xl font-display text-2xl font-bold text-white sm:text-3xl">
            Begin Your Fashion Journey Today
          </h2>
          <p className="mx-auto mb-8 max-w-md text-sm text-ink-300">
            Whether you’re looking to master the craft or own a bespoke masterpiece, Mother Elizabeth’s Sewing Institute is
            where your excellence begins.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/training" className="btn-white px-6 py-3">
              Enroll for Training
            </Link>
            <Link href="/bespoke" className="btn-outline border-white text-white hover:bg-white hover:text-ink-900 px-6 py-3">
              Book Consultation
            </Link>
          </div>
        </div>
      </div>
    </FadeIn>
  );
}

export default async function HomePage() {
  const home = await getHomePage();
  const sections = home.sections.filter((s) => s.enabled !== false);

  return (
    <>
      <HeroSection />
      <HeritageSection />
      <TrainingSection />

      <BespokeSection />

      {sections.some((s) => /CATEGORY_GRID/.test(s.type)) && <CategorySection />}
      <TestimonialsSection />
      {(sections.some((s) => /BANNER|PROMO/.test(s.type)) || !sections.length) && <PromoBanner />}
    </>
  );
}
