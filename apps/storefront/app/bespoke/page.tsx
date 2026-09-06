import Link from 'next/link';
import { FadeIn, Stagger, Item } from '@/components/motion';
import { ArrowRightIcon, CheckIcon, TruckIcon } from '@/components/icons';

export const dynamic = 'force-dynamic';

const STEPS = [
  { n: '01', title: 'Choose Design', desc: 'Select from our atelier catalog or bring your own reference.' },
  { n: '02', title: 'Upload Reference', desc: 'Send us your fabric preferences and creative ideas.' },
  { n: '03', title: 'Measurements', desc: 'Submit your sizes and fit details through our simple guide.' },
  { n: '04', title: 'Production', desc: 'Our master artisans handcraft your garment with couture finishing.' },
  { n: '05', title: 'Delivery', desc: 'Worldwide shipping to your doorstep, wherever you are.' },
];

const SURVEY = [
  'Detailed guide for 30+ measurement points',
  'Profile storage for repeat bespoke orders',
  'AI-assisted measurement verification',
];

const SAMPLE = [
  ['Neck Circumference', '42 cm'],
  ['Shoulder Width', '48 cm'],
  ['Chest', '104 cm'],
];

export default function BespokePage() {
  return (
    <>
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-900 via-brand-800 to-ink-950 text-white">
        <div className="container-page relative py-20 text-center">
          <FadeIn>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-brand-200">
              Bespoke Services
            </div>
            <h1 className="mx-auto mb-4 max-w-3xl font-display text-4xl font-extrabold tracking-tight md:text-5xl">
              Your Custom Masterpiece in 5 Steps
            </h1>
            <p className="mx-auto mb-8 max-w-2xl text-lg text-brand-100/80">
              Experience the ultimate luxury of a garment designed specifically for your silhouette. Our master tailors will
              guide you through fabric selection, measurements and stylistic details to create your bespoke masterpiece.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link href="/shop" className="btn-primary px-7 py-3 text-base">
                Shop the Atelier
              </Link>
              <a href="#process" className="btn-outline border-white text-white hover:bg-white hover:text-ink-900 px-7 py-3 text-base">
                See the Process
              </a>
            </div>
          </FadeIn>
        </div>
      </section>

      <section id="process" className="container-page py-16">
        <FadeIn className="mb-10 text-center">
          <div className="section-kicker">How It Works</div>
          <h2 className="section-title">From Idea to Finished Garment</h2>
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
      </section>

      <section className="bg-ink-50">
        <div className="container-page py-16">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <FadeIn>
              <div className="section-kicker">Digital Precision Tailoring</div>
              <h2 className="mb-4 font-display text-3xl font-extrabold tracking-tight text-ink-900">
                A Perfect Fit, Wherever You Are
              </h2>
              <p className="mb-6 text-ink-600">
                Submit your measurements through our intuitive portal. Our proprietary system ensures a perfect fit for men,
                women and children — anywhere in the world.
              </p>
              <ul className="mb-8 space-y-3">
                {SURVEY.map((s) => (
                  <li key={s} className="flex items-start gap-2 text-sm text-ink-700">
                    <CheckIcon width={18} height={18} className="mt-0.5 shrink-0 text-brand-600" /> {s}
                  </li>
                ))}
              </ul>
              <Link href="/shop" className="btn-primary px-7 py-3">
                Start Your Bespoke Order <ArrowRightIcon width={18} height={18} />
              </Link>
            </FadeIn>

            <FadeIn>
              <div className="overflow-hidden rounded-3xl border border-ink-200 bg-white p-6 shadow-card">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wide text-brand-600">Measurement Profile</div>
                    <div className="text-sm font-bold text-ink-900">Client: Alexander M. · Bespoke Suit</div>
                  </div>
                  <span className="chip border border-ink-200 bg-brand-50 text-brand-700">On-file</span>
                </div>
                <div className="overflow-hidden rounded-2xl border border-ink-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="https://picsum.photos/seed/mesi-measure/560/380"
                    alt="Tailoring measurement diagram"
                    loading="lazy"
                    className="aspect-video h-full w-full object-cover"
                  />
                </div>
                <div className="mt-4 space-y-2">
                  {SAMPLE.map(([k, v]) => (
                    <div key={k} className="flex items-center justify-between border-b border-ink-100 pb-2 text-sm">
                      <span className="text-ink-500">{k}</span>
                      <span className="font-semibold text-ink-900">{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      <FadeIn className="container-page py-16">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-ink-900 to-ink-800 px-8 py-12 text-center sm:py-14">
          <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-brand-500/20 blur-3xl" />
          <div className="relative">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-brand-500/20 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-brand-300">
              <TruckIcon width={16} height={16} /> Worldwide Delivery
            </div>
            <h2 className="mx-auto mb-3 max-w-xl font-display text-2xl font-bold text-white sm:text-3xl">
              Can&rsquo;t find your fit?
            </h2>
            <p className="mx-auto mb-8 max-w-md text-sm text-ink-300">
              Every garment is made to order by our master tailors and delivered to your doorstep, anywhere in the world.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link href="/shop" className="btn-white px-6 py-3">
                Explore the Collection
              </Link>
              <Link href="/training" className="btn-outline border-white text-white hover:bg-white hover:text-ink-900 px-6 py-3">
                Learn the Craft
              </Link>
            </div>
          </div>
        </div>
      </FadeIn>
    </>
  );
}
