import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

/* ─── Animated counter ─────────────────────────────────────────────────────── */
function useCountUp(target: number, duration = 1800) {
  const [value, setValue] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || started.current) return;
        started.current = true;
        const start = performance.now();
        const tick = (now: number) => {
          const progress = Math.min((now - start) / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          setValue(Math.floor(eased * target));
          if (progress < 1) requestAnimationFrame(tick);
          else setValue(target);
        };
        requestAnimationFrame(tick);
      },
      { threshold: 0.3 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [target, duration]);

  return { value, ref };
}

function Stat({
  target,
  suffix = "",
  label,
}: {
  target: number;
  suffix?: string;
  label: string;
}) {
  const { value, ref } = useCountUp(target);
  return (
    <div ref={ref} className="flex flex-col items-center gap-1">
      <span className="text-4xl font-extrabold text-white tabular-nums">
        {value.toLocaleString()}{suffix}
      </span>
      <span className="text-sm text-gray-400 uppercase tracking-widest">{label}</span>
    </div>
  );
}

/* ─── Stars ─────────────────────────────────────────────────────────────────── */
function Stars({ n }: { n: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill={i < n ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth="1.5"
          className={i < n ? "text-yellow-400" : "text-gray-600"}
        >
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
    </div>
  );
}

/* ─── Data ───────────────────────────────────────────────────────────────────── */
const TESTIMONIALS = [
  {
    name: "Maxime R.",
    role: "Compétiteur régional",
    stars: 5,
    text: "Le meilleur site pour trouver des cartes rares. La recherche par set et couleur m'a fait gagner un temps fou pour compléter mon deck Luffy.",
  },
  {
    name: "Sarah K.",
    role: "Collectionneuse",
    stars: 5,
    text: "Catalogue incroyable, toutes les extensions disponibles. Le système de devis par email est super pratique pour commander en gros.",
  },
  {
    name: "Thomas B.",
    role: "Joueur casual",
    stars: 4,
    text: "Interface claire et rapide. J'ai trouvé les cartes qu'il me manquait en deux minutes. Je recommande sans hésiter.",
  },
];

/* ─── Page ───────────────────────────────────────────────────────────────────── */
export function HomePage() {
  return (
    <div className="bg-gray-950 text-white">

      {/* ── Hero ──────────────────────────────────────────────────────────────── */}
      <section className="relative flex items-center justify-center min-h-[calc(100vh-65px)] overflow-hidden px-6">
        {/* Background layers */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_40%,_#0f2744_0%,_transparent_70%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_40%_40%_at_80%_70%,_#2d1b4e55_0%,_transparent_60%)]" />
        {/* Subtle grid */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />

        <div className="relative z-10 text-center max-w-3xl mx-auto">
          <span className="inline-block text-xs font-semibold uppercase tracking-[0.2em] text-blue-400 mb-4 px-3 py-1 rounded-full border border-blue-400/30 bg-blue-400/10">
            One Piece TCG · Official Shop
          </span>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.05] mt-2">
            Trouvez la carte
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-violet-400 to-blue-400 bg-[length:200%] animate-[shimmer_3s_linear_infinite]">
              qui vous manque
            </span>
          </h1>

          <p className="mt-6 text-gray-400 text-lg max-w-xl mx-auto leading-relaxed">
            Plus de 2 500 cartes issues de toutes les extensions. Filtrez, sélectionnez et recevez un devis instantané par email.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/cards"
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-semibold px-8 py-3.5 rounded-2xl transition-all text-sm shadow-lg shadow-blue-600/25"
            >
              Explorer le catalogue →
            </Link>
            <a
              href="#about"
              className="w-full sm:w-auto text-gray-400 hover:text-white border border-gray-700 hover:border-gray-500 font-medium px-8 py-3.5 rounded-2xl transition-all text-sm text-center"
            >
              En savoir plus
            </a>
          </div>
        </div>

        {/* Scroll hint */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-gray-600 animate-bounce">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19" />
            <polyline points="19 12 12 19 5 12" />
          </svg>
        </div>
      </section>

      {/* ── Stats ─────────────────────────────────────────────────────────────── */}
      <section className="border-y border-gray-800 bg-gray-900/50">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-8 py-14 grid grid-cols-2 lg:grid-cols-4 gap-10">
          <Stat target={2560}  suffix="+"  label="Cartes disponibles" />
          <Stat target={30}    suffix="+"  label="Extensions" />
          <Stat target={6}             label="Couleurs" />
          <Stat target={98}    suffix="%" label="Clients satisfaits" />
        </div>
      </section>

      {/* ── Testimonials ──────────────────────────────────────────────────────── */}
      <section className="max-w-[1280px] mx-auto px-6 lg:px-8 py-20">
        <div className="text-center mb-12">
          <p className="text-xs font-semibold uppercase tracking-widest text-blue-400 mb-2">Avis clients</p>
          <h2 className="text-3xl font-extrabold">Ce qu'ils disent de nous</h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {TESTIMONIALS.map(({ name, role, stars, text }) => (
            <div
              key={name}
              className="bg-gray-900 border border-gray-800 rounded-2xl p-6 flex flex-col gap-4 hover:border-gray-700 transition-colors"
            >
              <Stars n={stars} />
              <p className="text-gray-300 text-sm leading-relaxed flex-1">"{text}"</p>
              <div>
                <p className="text-white font-semibold text-sm">{name}</p>
                <p className="text-gray-500 text-xs">{role}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── About + Contact ───────────────────────────────────────────────────── */}
      <section id="about" className="border-t border-gray-800 bg-gray-900/40">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-8 py-20 grid lg:grid-cols-2 gap-12 lg:gap-20">

          {/* About */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-blue-400 mb-2">À propos</p>
            <h2 className="text-3xl font-extrabold mb-5">La référence One Piece TCG</h2>
            <p className="text-gray-400 leading-relaxed mb-4">
              Passionnés du jeu de cartes One Piece, nous proposons un catalogue complet couvrant toutes les extensions officielles — de OP-01 Romance Dawn aux dernières sorties.
            </p>
            <p className="text-gray-400 leading-relaxed mb-6">
              Notre outil de devis vous permet de sélectionner vos cartes, de visualiser le total en temps réel et de recevoir une offre personnalisée directement dans votre boîte mail.
            </p>
            <Link
              to="/cards"
              className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
            >
              Voir le catalogue
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </Link>
          </div>

          {/* Contact */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-blue-400 mb-2">Contact</p>
            <h2 className="text-3xl font-extrabold mb-5">Parlons-en</h2>
            <p className="text-gray-400 leading-relaxed mb-8">
              Une question sur une carte, une commande spéciale ou un partenariat ? N'hésitez pas à nous écrire.
            </p>

            <div className="flex flex-col gap-4">
              {[
                {
                  icon: (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
                    </svg>
                  ),
                  label: "Email",
                  value: "youremail@gmail.com",
                  href: "mailto:youremail@gmail.com",
                },
                {
                  icon: (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                    </svg>
                  ),
                  label: "Disponibilité",
                  value: "Lun – Ven, 9h – 18h",
                  href: null,
                },
              ].map(({ icon, label, value, href }) => (
                <div key={label} className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-gray-800 border border-gray-700 flex items-center justify-center text-blue-400 shrink-0">
                    {icon}
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">{label}</p>
                    {href ? (
                      <a href={href} className="text-sm text-white hover:text-blue-400 transition-colors font-medium">
                        {value}
                      </a>
                    ) : (
                      <p className="text-sm text-white font-medium">{value}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────────────── */}
      <footer className="border-t border-gray-800 py-6 text-center text-xs text-gray-600">
        © {new Date().getFullYear()} One Piece TCG Shop — Tous droits réservés
      </footer>

    </div>
  );
}
