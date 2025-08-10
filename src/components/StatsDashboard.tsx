import { useMemo, useState } from 'react'
import { Medicine, MedicineIntake } from '@/types/medicine'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Pie, PieChart, PolarAngleAxis, RadialBar, RadialBarChart, ReferenceLine, ResponsiveContainer, XAxis, YAxis } from 'recharts'
import { motion } from 'framer-motion'
import { Download, TrendingUp, AlertTriangle, Timer, CheckCircle2, BarChart3 } from 'lucide-react'

interface StatsDashboardProps {
  medicines: Medicine[]
  intakes: MedicineIntake[]
}

type DailyStat = {
  date: string
  scheduled: number
  taken: number
  skipped: number
  delayed: number
}

type MedicineAdherence = {
  medicineId: string
  name: string
  scheduled: number
  taken: number
}

function isMedicineActiveOnDate(medicine: Medicine, dateISO: string): boolean {
  const date = new Date(dateISO)
  const start = new Date(medicine.startDate)
  const end = medicine.endDate ? new Date(medicine.endDate) : undefined
  if (date < new Date(start.toDateString())) return false
  if (end && date > new Date(end.toDateString())) return false
  return true
}

function generateTimesForMedicine(medicine: Medicine): string[] {
  switch (medicine.frequency) {
    case 'once-daily':
      return ['09:00']
    case 'twice-daily':
      return ['09:00', '21:00']
    case 'three-times-daily':
      return ['08:00', '14:00', '20:00']
    case 'four-times-daily':
      return ['08:00', '12:00', '16:00', '20:00']
    case 'custom-times':
      return medicine.customTimes || []
    case 'interval-hours': {
      const times: string[] = []
      let startHour = 8
      const interval = medicine.intervalHours || 8
      while (startHour < 24) {
        times.push(`${startHour.toString().padStart(2, '0')}:00`)
        startHour += interval
      }
      return times
    }
    default:
      return []
  }
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0]
}

function getDateRange(days: number): string[] {
  const today = new Date()
  const dates: string[] = []
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    dates.push(formatDate(d))
  }
  return dates
}

function toCSV(rows: Array<Record<string, string | number | null | undefined>>): string {
  if (!rows.length) return ''
  const headers = Object.keys(rows[0])
  const escape = (val: any) => {
    if (val === null || val === undefined) return ''
    const s = String(val)
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`
    return s
  }
  const lines = [headers.join(',')]
  for (const row of rows) {
    lines.push(headers.map(h => escape(row[h])).join(','))
  }
  return lines.join('\n')
}

export function StatsDashboard({ medicines, intakes }: StatsDashboardProps) {
  const [rangeDays, setRangeDays] = useState<number>(14)

  const dateRange = useMemo(() => getDateRange(rangeDays), [rangeDays])

  const dayToStats: DailyStat[] = useMemo(() => {
    return dateRange.map((date) => {
      const activeMeds = medicines.filter(m => isMedicineActiveOnDate(m, date))
      const scheduledCount = activeMeds.reduce((acc, m) => acc + generateTimesForMedicine(m).length, 0)
      const taken = intakes.filter(i => i.date === date && i.status === 'taken').length
      const skipped = intakes.filter(i => i.date === date && i.status === 'skipped').length
      const delayed = intakes.filter(i => i.date === date && i.status === 'delayed').length
      return { date, scheduled: scheduledCount, taken, skipped, delayed }
    })
  }, [dateRange, medicines, intakes])

  const overall = useMemo(() => {
    const pastOrToday = dayToStats.filter(d => new Date(d.date) <= new Date())
    const totalScheduled = pastOrToday.reduce((a, d) => a + d.scheduled, 0)
    const totalTaken = pastOrToday.reduce((a, d) => a + d.taken, 0)
    const totalSkipped = pastOrToday.reduce((a, d) => a + d.skipped, 0)
    const totalDelayed = pastOrToday.reduce((a, d) => a + d.delayed, 0)
    const adherence = totalScheduled > 0 ? Math.round((totalTaken / totalScheduled) * 100) : 0

    // perfect day: all scheduled taken and none missed when scheduled > 0
    let streak = 0
    for (let i = pastOrToday.length - 1; i >= 0; i--) {
      const d = pastOrToday[i]
      if (d.scheduled > 0 && d.taken === d.scheduled) streak++
      else break
    }
    const perfectDays = pastOrToday.filter(d => d.scheduled > 0 && d.taken === d.scheduled).length

    return { totalScheduled, totalTaken, totalSkipped, totalDelayed, adherence, streak, perfectDays }
  }, [dayToStats])

  const perMedicine: MedicineAdherence[] = useMemo(() => {
    const map = new Map<string, MedicineAdherence>()
    for (const med of medicines) {
      map.set(med.id, { medicineId: med.id, name: med.name, scheduled: 0, taken: 0 })
    }
    for (const date of dateRange) {
      const activeMeds = medicines.filter(m => isMedicineActiveOnDate(m, date))
      for (const m of activeMeds) {
        const dailyTimes = generateTimesForMedicine(m)
        const scheduled = dailyTimes.length
        const taken = intakes.filter(i => i.date === date && i.medicineId === m.id && i.status === 'taken').length
        const curr = map.get(m.id)!
        curr.scheduled += scheduled
        curr.taken += taken
      }
    }
    return Array.from(map.values())
  }, [medicines, intakes, dateRange])

  const takenVsMissedData = useMemo(() => {
    const totalMissed = Math.max(0, overall.totalScheduled - overall.totalTaken)
    return [
      { name: 'Taken', value: overall.totalTaken, fill: 'hsl(var(--primary))' },
      { name: 'Missed', value: totalMissed, fill: 'hsl(var(--destructive))' },
    ]
  }, [overall])

  const adherenceTrendData = useMemo(() => {
    return dayToStats.map(d => ({
      date: new Date(d.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      adherence: d.scheduled > 0 ? Math.round((d.taken / d.scheduled) * 100) : 0,
      scheduled: d.scheduled,
      taken: d.taken,
    }))
  }, [dayToStats])

  const perMedicineChartData = useMemo(() => {
    return perMedicine
      .filter(m => m.scheduled > 0)
      .map(m => ({ name: m.name, adherence: Math.round((m.taken / m.scheduled) * 100) }))
      .sort((a, b) => b.adherence - a.adherence)
  }, [perMedicine])

  const lowStock = useMemo(() => {
    const today = formatDate(new Date())
    return medicines
      .map(m => {
        const daily = generateTimesForMedicine(m).length || 0
        const daysLeft = daily > 0 ? Math.floor(m.currentStock / daily) : Infinity
        const runOut = Number.isFinite(daysLeft)
          ? formatDate(new Date(new Date(today).setDate(new Date(today).getDate() + daysLeft)))
          : '—'
        return { name: m.name, daysLeft, runOut, currentStock: m.currentStock, lowStockAlert: m.lowStockAlert }
      })
      .filter(m => Number.isFinite(m.daysLeft))
      .sort((a, b) => (a.daysLeft as number) - (b.daysLeft as number))
      .slice(0, 3)
  }, [medicines])

  const handleExportCSV = () => {
    const rows = intakes.map(i => {
      const med = medicines.find(m => m.id === i.medicineId)
      return {
        id: i.id,
        medicineId: i.medicineId,
        medicineName: med?.name || '',
        date: i.date,
        scheduledTime: i.scheduledTime,
        actualTime: i.actualTime || '',
        status: i.status,
        notes: i.notes || '',
      }
    })
    const csv = toCSV(rows)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `meditrack-intakes-${formatDate(new Date())}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const hasAnySchedule = dayToStats.some(d => d.scheduled > 0)

  if (!hasAnySchedule) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Add medicines and start recording to see your analytics.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-semibold">Your Analytics</h2>
          <Badge variant="secondary">Last {rangeDays} days</Badge>
        </div>
        <div className="flex items-center gap-2">
          <Select value={String(rangeDays)} onValueChange={(v) => setRangeDays(Number(v))}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="14">Last 14 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleExportCSV}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 220, damping: 20 }}>
          <Card className="overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Adherence</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center gap-4">
                <div className="w-32 h-32">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadialBarChart innerRadius="70%" outerRadius="100%" data={[{ name: 'Adherence', value: overall.adherence, fill: 'hsl(var(--primary))' }]} startAngle={90} endAngle={-270}>
                      <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                      <RadialBar dataKey="value" cornerRadius={8} isAnimationActive />
                      <ReferenceLine angle={90} />
                    </RadialBarChart>
                  </ResponsiveContainer>
                </div>
                <div>
                  <div className="text-3xl font-bold">{overall.adherence}%</div>
                  <div className="text-sm text-muted-foreground">of scheduled doses taken</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05, type: 'spring', stiffness: 220, damping: 20 }}>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2"><TrendingUp className="h-4 w-4" /> Taken</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-3xl font-bold">{overall.totalTaken}</div>
              <div className="text-sm text-muted-foreground">out of {overall.totalScheduled} scheduled</div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, type: 'spring', stiffness: 220, damping: 20 }}>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2"><Timer className="h-4 w-4" /> Streak</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-3xl font-bold">{overall.streak}d</div>
              <div className="text-sm text-muted-foreground">perfect days in a row</div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, type: 'spring', stiffness: 220, damping: 20 }}>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2"><CheckCircle2 className="h-4 w-4" /> Perfect Days</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-3xl font-bold">{overall.perfectDays}</div>
              <div className="text-sm text-muted-foreground">in the selected range</div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <motion.div className="lg:col-span-2" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 220, damping: 20 }}>
          <Card>
            <CardHeader>
              <CardTitle>Adherence Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={{}} className="h-[280px]">
                <AreaChart data={adherenceTrendData}>
                  <defs>
                    <linearGradient id="fillAdherence" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis dataKey="date" tickLine={false} axisLine={false} />
                  <YAxis domain={[0, 100]} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} width={40} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area type="monotone" dataKey="adherence" stroke="hsl(var(--primary))" fill="url(#fillAdherence)" isAnimationActive />
                </AreaChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05, type: 'spring', stiffness: 220, damping: 20 }}>
          <Card>
            <CardHeader>
              <CardTitle>Taken vs. Missed</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4">
              <div className="h-[220px]">
                <ChartContainer config={{}} className="h-full">
                  <PieChart>
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Pie data={takenVsMissedData} dataKey="value" nameKey="name" innerRadius={60} outerRadius={80} isAnimationActive />
                  </PieChart>
                </ChartContainer>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {takenVsMissedData.map(s => (
                  <div key={s.name} className="flex items-center justify-between">
                    <span className="text-muted-foreground">{s.name}</span>
                    <span className="font-medium">{s.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <motion.div className="lg:col-span-2" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 220, damping: 20 }}>
          <Card>
            <CardHeader>
              <CardTitle>Adherence by Medicine</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={{}} className="h-[280px]">
                <BarChart data={perMedicineChartData}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} />
                  <YAxis domain={[0, 100]} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} width={40} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="adherence" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} isAnimationActive />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05, type: 'spring', stiffness: 220, damping: 20 }}>
          <Card>
            <CardHeader>
              <CardTitle>Low Stock</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {lowStock.length === 0 && (
                <div className="text-sm text-muted-foreground">No low stock alerts</div>
              )}
              {lowStock.map((m) => {
                const isLow = m.currentStock <= m.lowStockAlert
                return (
                  <div key={m.name} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium flex items-center gap-2">
                        {m.name}
                        {isLow && <Badge variant="destructive" className="gap-1"><AlertTriangle className="h-3 w-3" /> Low</Badge>}
                      </div>
                      <div className="text-xs text-muted-foreground">Run out in {m.daysLeft} days • est. {m.runOut}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm">Stock: <span className="font-medium">{m.currentStock}</span></div>
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}