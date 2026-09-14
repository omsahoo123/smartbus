"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

const CATEGORIES = ["driver_rating", "bus_rating", "punctuality_rating", "overall_rating"] as const;

export default function FeedbackPage() {
  const supabase = createClient();
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) return;
    await supabase.from("feedback").insert({ user_id: user.id, comment, ...ratings });
    setSubmitted(true);
  }

  if (submitted) {
    return <Card className="mx-auto max-w-md text-center">Thanks for the feedback &mdash; it helps us improve.</Card>;
  }

  return (
    <div className="mx-auto max-w-md space-y-4">
      <h1 className="font-display text-2xl text-ink">Share feedback</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        {CATEGORIES.map((cat) => (
          <div key={cat}>
            <label className="text-sm font-medium capitalize text-ink">{cat.replace(/_/g, " ")}</label>
            <div className="mt-1 flex gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  type="button"
                  key={n}
                  onClick={() => setRatings((r) => ({ ...r, [cat]: n }))}
                  className={`h-9 w-9 rounded-md border text-sm ${
                    ratings[cat] === n ? "border-primary bg-primary text-white" : "border-line text-ink"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        ))}
        <div>
          <label className="text-sm font-medium text-ink">Comments</label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="mt-1 w-full rounded-md border border-line px-3 py-2 text-sm"
            rows={3}
          />
        </div>
        <Button type="submit" className="w-full">Submit feedback</Button>
      </form>
    </div>
  );
}
