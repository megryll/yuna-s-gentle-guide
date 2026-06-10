import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Check, ChevronLeft, EyeOff, X } from "lucide-react";
import { PhoneFrame } from "@/components/PhoneFrame";
import { Button } from "@/components/Button";
import { useAppMode } from "@/lib/theme-prefs";
import { HOME_CARDS, KIND_META, KIND_PLURAL, type HomeCard } from "@/lib/home-cards";

type BookCard = Extract<HomeCard, { type: "book" }>;

function findBook(id: string): BookCard | undefined {
  return HOME_CARDS.find((c): c is BookCard => c.type === "book" && c.id === id);
}

export const Route = createFileRoute("/book/$id")({
  head: ({ params }) => {
    const book = findBook(params.id);
    return { meta: [{ title: book ? `${book.title} — Yuna` : "Book — Yuna" }] };
  },
  component: BookDetailRoute,
});

function BookDetailRoute() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const mode = useAppMode();
  const surface = mode === "dark" ? "dark" : "light";
  const book = findBook(id);
  const close = () => navigate({ to: "/home" });

  return (
    <PhoneFrame themed>
      <div className="relative flex-1 flex flex-col text-white min-h-0">
        <header className="flex justify-start px-6 pt-14 pb-2 shrink-0">
          <Button
            surface={surface}
            variant="secondary"
            size="icon"
            onClick={close}
            aria-label="Back"
          >
            <ChevronLeft strokeWidth={1.5} />
          </Button>
        </header>

        {book ? (
          <div className="flex-1 overflow-y-auto px-6 pt-2 pb-10 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {/* Hero keeps the book reco's pale-cream identity from the feed
                card — a fixed solid fill (mode-independent), dark ink. */}
            <div
              className="rounded-[2.5rem] px-6 py-10 flex flex-col items-center text-center"
              style={{ backgroundColor: KIND_META.book.solidBg }}
            >
              {book.cover ? (
                <img
                  src={book.cover}
                  alt={`${book.title} cover`}
                  className="w-36 rounded-lg border border-black/10 shadow-[0_14px_34px_rgba(0,0,0,0.28)]"
                />
              ) : (
                <span
                  aria-hidden
                  className="h-52 w-36 rounded-lg bg-gradient-to-br from-pink-300 via-amber-200 to-sky-300 border border-black/10 shadow-md"
                />
              )}
              <p className="mt-7 text-sm tracking-wide text-neutral-900/60">
                {book.author}
              </p>
              <h1 className="mt-1 font-display text-3xl leading-tight tracking-tight text-neutral-900">
                {book.title}
              </h1>
            </div>

            <h2 className="mt-8 font-display text-xl leading-snug tracking-tight text-white">
              Why this might be a good book for you?
            </h2>
            <p className="mt-3 text-base leading-relaxed text-white/85">
              {book.blurb}
            </p>

            <div className="mt-8 flex flex-col gap-2.5">
              <Button surface={surface} variant="primary" fullWidth onClick={close}>
                <Check size={18} strokeWidth={1.75} aria-hidden />
                Mark as Completed
              </Button>
              <Button surface={surface} variant="secondary" fullWidth onClick={close}>
                <X size={18} strokeWidth={1.75} aria-hidden />
                Dismiss this card
              </Button>
              <Button surface={surface} variant="secondary" fullWidth onClick={close}>
                <EyeOff size={18} strokeWidth={1.75} aria-hidden />
                Stop seeing {KIND_PLURAL.book}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-4">
            <p className="text-base text-white/85">We couldn't find that book.</p>
            <Button surface={surface} variant="secondary" size="sm" onClick={close}>
              Back home
            </Button>
          </div>
        )}
      </div>
    </PhoneFrame>
  );
}
