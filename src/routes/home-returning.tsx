import { createFileRoute } from "@tanstack/react-router";
import { HomeScreen } from "@/components/HomeScreen";

export const Route = createFileRoute("/home-returning")({
  head: () => ({
    meta: [
      { title: "Home — Yuna (returning)" },
      { name: "description", content: "Continue a conversation with Yuna." },
    ],
  }),
  component: () => <HomeScreen variant="returning" />,
});
