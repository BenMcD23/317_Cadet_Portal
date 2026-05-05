import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Award } from "lucide-react"

export default function BadgeOrderPage() {
  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div className="flex items-center gap-3">
        <Award className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Badge Order</h1>
          <p className="text-sm text-muted-foreground">Order proficiency badges you have qualified for.</p>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Coming soon</CardTitle>
          <CardDescription>The badge order form is being built.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Check back shortly.</p>
        </CardContent>
      </Card>
    </div>
  )
}
