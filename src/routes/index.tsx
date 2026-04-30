import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { PhoneFrame } from "@/components/PhoneFrame";
import { YunaMark, YunaWordmark } from "@/components/YunaMark";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Yuna — A quiet space for your mind" },
      { name: "description", content: "Yuna is a gentle mental health companion built with researchers from Harvard." },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <PhoneFrame>
      <div className="flex-1 flex flex-col px-8 pt-16 pb-10">
        <div className="yuna-fade-in">
          <YunaWordmark className="text-foreground" />
        </div>

        <div className="flex-1 flex flex-col justify-center items-start gap-10 yuna-rise">
          <YunaMark size={56} className="text-primary" />
          <div>
            <h1 className="text-3xl leading-snug tracking-tight">
              Hi, I'm Yuna.
            </h1>
            <p className="mt-3 text-base text-muted-foreground leading-relaxed max-w-[18rem]">
              A quiet companion for the moments your mind feels loud.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <Link
            to="/auth"
            className="w-full text-center rounded-full hairline px-6 py-3.5 text-sm tracking-wide hover:bg-accent transition-colors"
          >
            Begin
          </Link>
          <Link
            to="/auth"
            search={{ mode: "signin" }}
            className="w-full text-center text-xs text-muted-foreground tracking-wide py-2 hover:text-foreground transition-colors"
          >
            I already have an account
          </Link>
        </div>
      </div>
    </PhoneFrame>
  );
}
