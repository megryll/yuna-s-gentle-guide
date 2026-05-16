import { createFileRoute } from "@tanstack/react-router";
import { HomeScreen } from "@/components/HomeScreen";
import { useUserType } from "@/lib/user-type";

export const Route = createFileRoute("/home")({
  head: () => ({
    meta: [
      { title: "Home — Yuna" },
      { name: "description", content: "Begin a conversation with Yuna." },
    ],
  }),
  component: HomeRoute,
});

function HomeRoute() {
  const userType = useUserType();

  return (
    <HomeScreen
      variant={userType}
      showWelcome={userType === "new"}
    />
  );
}
