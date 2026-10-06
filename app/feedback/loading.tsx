import { Header } from "@/components/layout/header";

export default function FeedbackLoading() {
  return (
    <>
      <Header title="Feedback" />
      <p
        role="status"
        className="px-6 py-8 text-sm"
        style={{ color: "var(--muted-foreground)" }}
      >
        Loading feedback…
      </p>
    </>
  );
}
