import Image from "next/image";

export default function AboutPage() {
  return (
    <section className="mx-auto max-w-3xl space-y-4 rounded-xl border border-zinc-800 bg-zinc-900 p-6">
      <h1 className="text-2xl font-semibold">About BingeBoard</h1>
      <p className="text-zinc-300">
        BingeBoard is a TVTime-like app for tracking movies and series, built
        for a short-term technical assessment.
      </p>
      <p className="text-sm text-zinc-300">
        This product uses the TMDB API but is not endorsed or certified by TMDB.
      </p>
      <a
        href="https://www.themoviedb.org/"
        target="_blank"
        rel="noreferrer"
        className="inline-block"
      >
        <Image
          src="https://www.themoviedb.org/assets/2/v4/logos/v2/blue_short-2a99db58c2d1cc5f6c84599b47f3ed4f5f5cdffca3fe5ef749398972d292f8f1.svg"
          alt="TMDB logo"
          className="h-8"
          width={102}
          height={40}
        />
      </a>
    </section>
  );
}
