import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-24 text-center">
      <h1 className="mb-2 text-5xl font-extrabold text-slate-800">404</h1>
      <p className="mb-6 text-slate-500">The page you're looking for doesn't exist.</p>
      <Link href="/" className="btn-primary">
        Back to home
      </Link>
    </div>
  );
}
