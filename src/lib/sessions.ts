export type PastSession = {
  id: string;
  date: string;
  length: string;
  title: string;
};

export const PAST_SESSIONS: PastSession[] = [
  {
    id: "s-04",
    date: "May 12",
    length: "18 min",
    title: "Untangling pressure at work and what to drop first",
  },
  {
    id: "s-03",
    date: "May 8",
    length: "9 min",
    title: "A quick check-in after the rough morning",
  },
  {
    id: "s-02",
    date: "May 4",
    length: "24 min",
    title: "Coming back to your breath when the day feels loud",
  },
  {
    id: "s-01",
    date: "Apr 30",
    length: "31 min",
    title: "First session — getting to know each other",
  },
];
