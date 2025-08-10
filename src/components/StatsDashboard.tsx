import { useMemo, useState } from "react";
import { Medicine, MedicineIntake } from "@/types/medicine";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { computeSeries, computePerMedicineAdherence, buildExpectedForDate } from "@/lib/stats";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Line, Legend, PieChart, Pie, Cell } from "recharts";
import { motion } from "framer-motion";

const COLORS = ["#6d6df6", "#22c55e", "#ef4444", "#06b6d4", "#a855f7", "#f59e0b"]; // primary, green, red, cyan, violet, amber

interface StatsDashboardProps {
  medicines: Medicine[];
  intakes: MedicineIntake[];
}

export function StatsDashboard({ medicines, intakes }: StatsDashboardProps) {
  const [range, setRange] = useState<7 | 30 | 90>(30);
  const [drillDate, setDrillDate] = useState<string | null>(null);

  const dailySeries = useMemo(() => computeSeries(medicines, intakes, range), [medicines, intakes, range]);
  const perMedicine = useMemo(() => computePerMedicineAdherence(medicines, intakes, range), [medicines, intakes, range]);

  const overall = useMemo(() => {
    const totals = dailySeries.reduce(
      (acc, d) => {
        acc.taken += d.taken;
        acc.skipped += d.skipped;
        acc.missed += d.missed;
        return acc;
      },
      { taken: 0, skipped: 0, missed: 0 }
    );
    const denom = totals.taken + totals.skipped + totals.missed;
    const rate = denom > 0 ? Math.round((totals.taken / denom) * 100) : 0;
    return { ...totals, rate };
  }, [dailySeries]);

  const drillData = useMemo(() => {
    if (!drillDate) return null;
    const expected = buildExpectedForDate(medicines, intakes, drillDate);
    return expected;
  }, [drillDate, medicines, intakes]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-xl font-semibold">Adherence Overview</h2>
          <p className="text-sm text-muted-foreground">Last {range} days</p>
        </div>
        <div className="flex gap-2">
          {[7, 30, 90].map((r) => (
            <Button key={r} variant={r === range ? "default" : "outline"} onClick={() => setRange(r as 7 | 30 | 90)}>
              {r}d
            </Button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-card/60 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Overall Adherence</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{overall.rate}%</div>
            <p className="text-xs text-muted-foreground">Taken vs. missed/skipped</p>
          </CardContent>
        </Card>
        <Card className="bg-card/60 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Taken</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{overall.taken}</div>
            <p className="text-xs text-muted-foreground">Recorded intakes</p>
          </CardContent>
        </Card>
        <Card className="bg-card/60 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Missed/Skipped</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{overall.missed + overall.skipped}</div>
            <p className="text-xs text-muted-foreground">Missed or skipped doses</p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card/60 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>Daily Adherence</CardTitle>
        </CardHeader>
        <CardContent className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedDailyChart data={dailySeries} onClickBar={(date) => setDrillDate(date)} />
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="bg-card/60 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>Per-medicine adherence</CardTitle>
        </CardHeader>
        <CardContent className="h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={perMedicine.map((m) => ({ name: m.medicine.name, rate: m.rate }))}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="name" hide={false} interval={0} angle={-20} textAnchor="end" height={60} />
              <YAxis domain={[0, 100]} />
              <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))" }} />
              <Bar dataKey="rate" fill={COLORS[0]} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Dialog open={!!drillDate} onOpenChange={() => setDrillDate(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Details for {drillDate}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="h-[240px]">
              {drillData && (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      dataKey="value"
                      data={[
                        { name: "Taken", value: drillData.filter(d => d.intake?.status === 'taken' || d.intake?.status === 'delayed').length },
                        { name: "Skipped", value: drillData.filter(d => d.intake?.status === 'skipped').length },
                        { name: "Unrecorded", value: drillData.filter(d => !d.intake).length },
                      ]}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label
                    >
                      {[0,1,2].map((i) => (
                        <Cell key={i} fill={[COLORS[1], COLORS[2], COLORS[5]][i]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))" }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
            <div className="space-y-2">
              {drillData?.map((d, idx) => (
                <motion.div key={idx} className="flex items-center justify-between rounded-md border p-2 bg-card/50" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
                  <div>
                    <div className="font-medium">{d.medicine.name}</div>
                    <div className="text-xs text-muted-foreground">{d.scheduledTime}</div>
                  </div>
                  <div className="text-sm">
                    {d.intake?.status ?? 'unrecorded'}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
          <div className="flex justify-end pt-2">
            <Button variant="outline" onClick={() => setDrillDate(null)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ComposedDailyChart({ data, onClickBar }: { data: { date: string; taken: number; skipped: number; missed: number; adherenceRate: number }[]; onClickBar: (date: string) => void }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} onClick={(e: any) => { if (e?.activeLabel) onClickBar(e.activeLabel); }}>
        <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
        <XAxis dataKey="date" />
        <YAxis yAxisId="left" orientation="left" />
        <YAxis yAxisId="right" orientation="right" domain={[0, 100]} hide />
        <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))" }} />
        <Legend />
        <Bar yAxisId="left" dataKey="taken" fill={COLORS[1]} stackId="a" name="Taken" radius={[6,6,0,0]} />
        <Bar yAxisId="left" dataKey="skipped" fill={COLORS[2]} stackId="a" name="Skipped" radius={[6,6,0,0]} />
        <Bar yAxisId="left" dataKey="missed" fill={COLORS[5]} stackId="a" name="Missed" radius={[6,6,0,0]} />
        <Line yAxisId="right" type="monotone" dataKey="adherenceRate" stroke={COLORS[0]} name="Adherence %" strokeWidth={2} dot={false} />
      </BarChart>
    </ResponsiveContainer>
  );
}