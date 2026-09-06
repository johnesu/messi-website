import Link from 'next/link';
import { FadeIn, Stagger, Item } from '@/components/motion';
import { ArrowRightIcon, CheckIcon, HeartIcon } from '@/components/icons';

export const dynamic = 'force-dynamic';

const PROGRAMS = [
  {
    type: 'Professional Certificate · 12 Months',
    title: 'Fashion Design Mastery',
    desc: 'A comprehensive journey from conceptualization to collection launch. Students learn color theory, mood-boarding and structural design.',
    length: '12 Months · Full-Time',
    lead: 'Lead: Madame Elizabeth',
    highlights: ['Creative Direction & Textiles', 'Portfolio Development', 'Fashion Business & Ethics'],
    img: 'mesi-prog-1',
  },
  {
    type: 'Specialist Track · 6 Months',
    title: 'Precision Pattern Drafting',
    desc: 'The architectural core of tailoring. Master the mathematical precision required to create perfectly fitted garments for any body type.',
    length: '6 Months · Intermediate',
    lead: 'Lead: Prof. Alistair Kaye',
    highlights: ['Flat Pattern Manipulation', 'Fit Correction Techniques', 'Industrial Grading Methods'],
    img: 'mesi-prog-2',
  },
  {
    type: 'Advanced Diploma · 18 Months',
    title: 'Advanced Fashion Tech',
    desc: 'Bridging the gap between traditional craft and digital innovation. Includes 3D garment rendering and sustainable tech solutions.',
    length: '18 Months · Digital & Sustainable',
    lead: 'Lead: Dr. Elena Vane',
    highlights: ['CLO3D Digital Design', 'Sustainable Material Science', 'Smart Textile Integration'],
    img: 'mesi-prog-3',
  },
];

const FAQS = [
  { q: 'Do I need my own sewing machine to enroll?', a: 'No. Our atelier is fully equipped with industrial machines and CAD workstations for every student. If you have your own machine we encourage you to bring it, but it is never required.' },
  { q: 'Are the certifications internationally recognized?', a: 'Yes. Our accredited programs are recognized by global industry leaders and fashion councils, opening doors to international fashion houses.' },
  { q: 'Can I take these courses online?', a: 'Several of our advanced tracks blend in-person mentorship with digital instruction. Reach out to the admissions team to confirm the format for your chosen program.' },
  { q: 'How do I pay my tuition?', a: 'We offer flexible payment plans, early-bird discounts and a thriving scholarship fund for talented artisans from underserved backgrounds.' },
];

export default function TrainingPage() {
  return (
    <>
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-900 via-brand-800 to-ink-950 text-white">
        <div className="container-page relative py-20 text-center">
          <FadeIn>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-brand-200">
              World-Class Craftsmanship
            </div>
            <h1 className="mx-auto mb-4 max-w-3xl font-display text-4xl font-extrabold tracking-tight md:text-5xl">
              Excellence in Fashion Education
            </h1>
            <p className="mx-auto mb-8 max-w-2xl text-lg text-brand-100/80">
              Master the art of bespoke tailoring and modern fashion design in our elite atelier. From foundational skills
              to advanced technology, we shape the next generation of global fashion leaders.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <a href="#catalog" className="btn-primary px-7 py-3 text-base">
                Explore Programs <ArrowRightIcon width={18} height={18} />
              </a>
              <a href="#scholarship" className="btn-outline border-white text-white hover:bg-white hover:text-ink-900 px-7 py-3 text-base">
                View Scholarships
              </a>
            </div>
          </FadeIn>
        </div>
      </section>

      <section id="catalog" className="container-page py-16">
        <FadeIn className="mb-10 text-center">
          <div className="section-kicker">Academic Catalog</div>
          <h2 className="section-title">Elite Training Paths</h2>
        </FadeIn>

        <Stagger className="grid gap-6 md:grid-cols-3">
          {PROGRAMS.map((p) => (
            <Item key={p.title} className="flex flex-col overflow-hidden rounded-2xl border border-ink-200 bg-white shadow-card">
              <div className="relative aspect-[4/3] overflow-hidden bg-ink-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://picsum.photos/seed/${p.img}/600/450`}
                  alt={p.title}
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="flex flex-1 flex-col p-6">
                <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-accent-600">{p.type}</div>
                <h3 className="mb-2 font-display text-lg font-bold text-ink-900">{p.title}</h3>
                <p className="mb-4 text-sm text-ink-500">{p.desc}</p>
                <div className="mb-4 text-xs font-medium text-ink-400">{p.length}</div>
                <ul className="mb-5 space-y-2 text-sm text-ink-700">
                  {p.highlights.map((h) => (
                    <li key={h} className="flex items-start gap-2">
                      <CheckIcon width={16} height={16} className="mt-0.5 shrink-0 text-brand-600" /> {h}
                    </li>
                  ))}
                </ul>
                <div className="mt-auto flex items-center justify-between border-t border-ink-100 pt-4">
                  <span className="text-xs font-semibold text-ink-500">{p.lead}</span>
                  <Link href="/bespoke" className="btn-outline px-4 py-2 text-sm">
                    Enquire
                  </Link>
                </div>
              </div>
            </Item>
          ))}
        </Stagger>
      </section>

      <section id="scholarship" className="bg-ink-50">
        <div className="container-page py-16">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <FadeIn>
              <div className="mb-3 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-brand-600">
                <HeartIcon width={16} height={16} /> Community Empowerment
              </div>
              <h2 className="mb-3 font-display text-3xl font-extrabold tracking-tight text-ink-900">Sponsor a Student</h2>
              <p className="mb-6 text-ink-600">
                At MESI, we believe excellence shouldn&rsquo;t be limited by financial barriers. Our Scholarship Fund helps
                talented artisans from underserved backgrounds access world-class training and modern equipment.
              </p>
              <Stagger className="mb-8 grid grid-cols-3 gap-4 text-center">
                <Item as="div" className="rounded-2xl border border-ink-200 bg-white p-5 shadow-card">
                  <div className="text-2xl font-extrabold text-brand-700">250+</div>
                  <div className="text-xs text-ink-500">Alumni Supported</div>
                </Item>
                <Item as="div" className="rounded-2xl border border-ink-200 bg-white p-5 shadow-card">
                  <div className="text-2xl font-extrabold text-brand-700">15</div>
                  <div className="text-xs text-ink-500">Full Grants / Yr</div>
                </Item>
                <Item as="div" className="rounded-2xl border border-ink-200 bg-white p-5 shadow-card">
                  <div className="text-2xl font-extrabold text-brand-700">100%</div>
                  <div className="text-xs text-ink-500">Job Placement</div>
                </Item>
              </Stagger>
              <div className="flex flex-wrap gap-3">
                <Link href="/bespoke" className="btn-primary px-6 py-3">Apply for Scholarship</Link>
                <Link href="/bespoke" className="btn-outline px-6 py-3">Support the Fund</Link>
              </div>
            </FadeIn>

            <div className="hidden lg:block">
              <div className="overflow-hidden rounded-3xl border border-ink-200 bg-white shadow-card">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://picsum.photos/seed/mesi-scholarship/640/520"
                  alt="A young artisan supported by the scholarship fund"
                  loading="lazy"
                  className="aspect-[4/3] h-full w-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container-page py-16">
        <FadeIn className="mb-10 text-center">
          <div className="section-kicker">Admissions Timeline</div>
          <h2 className="section-title">Plan Your Intake</h2>
        </FadeIn>
        <Stagger className="mx-auto grid max-w-3xl gap-4 sm:grid-cols-2">
          <Item as="div" className="rounded-2xl border border-ink-200 bg-white p-6 shadow-card">
            <div className="font-display text-3xl font-extrabold text-brand-200">01</div>
            <div className="mt-1 font-bold text-ink-900">Fall Intake</div>
            <div className="text-sm text-ink-500">Deadline: Aug 15th</div>
          </Item>
          <Item as="div" className="rounded-2xl border border-ink-200 bg-white p-6 shadow-card">
            <div className="font-display text-3xl font-extrabold text-brand-200">02</div>
            <div className="mt-1 font-bold text-ink-900">Spring Intake</div>
            <div className="text-sm text-ink-500">Deadline: Jan 10th</div>
          </Item>
        </Stagger>
      </section>

      <section id="faq" className="bg-ink-50">
        <div className="container-page py-16">
          <FadeIn className="mb-8 text-center">
            <div className="section-kicker">Training FAQ</div>
            <h2 className="section-title">Everything You Need to Know</h2>
          </FadeIn>
          <Stagger className="mx-auto max-w-3xl space-y-4">
            {FAQS.map((f) => (
              <Item key={f.q} as="details" className="group rounded-2xl border border-ink-200 bg-white p-5 shadow-card">
                <summary className="flex cursor-pointer items-center justify-between text-sm font-bold text-ink-900">
                  <span>{f.q}</span>
                  <span className="text-brand-600 transition-transform group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-ink-600">{f.a}</p>
              </Item>
            ))}
          </Stagger>
        </div>
      </section>
    </>
  );
}
