"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { Pass, PassType } from "@/types/database";

const PASS_PRICING: Record<PassType, number> = {
  daily: 60,
  weekly: 350,
  monthly: 1200,
  route_specific: 800,
};

export default function PassesPage() {
  const supabase = createClient();
  const [passes, setPasses] = useState<Pass[]>([]);
  const [passType, setPassType] = useState<PassType>("weekly");
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) return;
    const { data } = await supabase.from("passes").select("*").eq("user_id", user.id).order("valid_from", { ascending: false });
    setPasses((data as Pass[]) ?? []);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleBuy() {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) return;

    const validFrom = new Date();
    const validUntil = new Date(validFrom);
    if (passType === "daily") validUntil.setDate(validUntil.getDate() + 1);
    if (passType === "weekly") validUntil.setDate(validUntil.getDate() + 7);
    if (passType === "monthly") validUntil.setMonth(validUntil.getMonth() + 1);
    if (passType === "route_specific") validUntil.setDate(validUntil.getDate() + 30);

    const { error: insertError } = await supabase.from("passes").insert({
      user_id: user.id,
      pass_type: passType,
      valid_from: validFrom.toISOString().slice(0, 10),
      valid_until: validUntil.toISOString().slice(0, 10),
      amount: PASS_PRICING[passType],
    });

    if (insertError) return setError(insertError.message);
    load();
  }

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl text-ink">Passes</h1>

      <Card>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <Select label="Pass type" value={passType} onChange={(e) => setPassType(e.target.value as PassType)}>
            <option value="daily">Daily &mdash; ₹{PASS_PRICING.daily}</option>
            <option value="weekly">Weekly &mdash; ₹{PASS_PRICING.weekly}</option>
            <option value="monthly">Monthly &mdash; ₹{PASS_PRICING.monthly}</option>
            <option value="route_specific">Route-specific &mdash; ₹{PASS_PRICING.route_specific}</option>
          </Select>
          <Button onClick={handleBuy}>Buy pass</Button>
        </div>
        {error && <p className="mt-2 text-sm text-danger">{error}</p>}
      </Card>

      <div className="space-y-3">
        {passes.map((p) => (
          <Card key={p.id} className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium capitalize text-ink">{p.pass_type.replace("_", " ")} pass</p>
              <p className="text-xs text-muted">{p.valid_from} &rarr; {p.valid_until}</p>
            </div>
            <StatusBadge status={p.status} />
          </Card>
        ))}
      </div>
    </div>
  );
}
