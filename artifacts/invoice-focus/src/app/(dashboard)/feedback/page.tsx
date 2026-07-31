import { useState, useRef } from 'react'
import { Star, MessageSquare, Bug, Lightbulb, Heart, Sparkles, Upload, X, Check } from 'lucide-react'
import { DashboardLayout } from '../layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/useAuth'
import { submitFeedback, uploadFeedbackScreenshot, type FeedbackCategory } from '@/lib/feedback'
import { cn } from '@/lib/utils'

const categories: Array<{ value: FeedbackCategory; label: string; icon: typeof Bug }> = [
  { value: 'bug', label: 'Report Bug', icon: Bug },
  { value: 'feature_request', label: 'Feature Request', icon: Lightbulb },
  { value: 'general_feedback', label: 'General Feedback', icon: Heart },
  { value: 'improvement', label: 'Improvement Suggestion', icon: Sparkles },
]

export default function FeedbackPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [rating, setRating] = useState<number | null>(null)
  const [category, setCategory] = useState<FeedbackCategory | null>(null)
  const [message, setMessage] = useState('')
  const [email, setEmail] = useState(user?.email || '')
  const [screenshot, setScreenshot] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleUploadScreenshot = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const dataUrl = await uploadFeedbackScreenshot(file)
      setScreenshot(dataUrl)
    } catch (error) {
      toast({ title: 'Upload failed', description: error instanceof Error ? error.message : 'Please try again.', variant: 'destructive' })
    } finally {
      setUploading(false)
    }
  }

  const handleRemoveScreenshot = () => {
    setScreenshot(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleSubmit = async () => {
    if (!message.trim()) {
      toast({ title: 'Message required', description: 'Please enter your feedback before submitting.', variant: 'destructive' })
      return
    }
    setSubmitting(true)
    try {
      await submitFeedback({
        rating: rating || undefined,
        category: category || undefined,
        message,
        email: email || undefined,
            screenshotUrl: screenshot || undefined,
      })
      setSubmitted(true)
      toast({ title: 'Thank you!', description: 'Your feedback has been received. We’ll review it carefully.' })
    } catch (error) {
      toast({ title: 'Could not submit feedback', description: error instanceof Error ? error.message : 'Please try again.', variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  const handleReset = () => {
    setRating(null)
    setCategory(null)
    setMessage('')
    setEmail(user?.email || '')
    setScreenshot(null)
    setSubmitted(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  if (submitted) {
    return (
      <DashboardLayout>
        <div className="mx-auto max-w-3xl space-y-8">
          <div>
            <p className="label-caps">Feedback Center</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight">Thank you!</h1>
          </div>
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <Check className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-xl">Your feedback has been received.</CardTitle>
              <CardDescription className="mt-2">
                We’ll review it carefully.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <Button onClick={handleReset} variant="outline" data-testid="button-submit-more">
                Submit More Feedback
              </Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-3xl space-y-8">
        <div>
          <p className="label-caps">Feedback Center</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">Help us improve Invoice Focus</h1>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
            Your feedback directly shapes upcoming releases.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Overall Experience</CardTitle>
            <CardDescription>How is Invoice Focus working for you?</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setRating(value)}
                  className="group transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  aria-label={`Rate ${value} stars`}
                  data-testid={`button-rating-${value}`}
                >
                  <Star
                    className={cn(
                      'h-8 w-8 transition-colors sm:h-10 sm:w-10',
                      rating && value <= rating
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-muted-foreground group-hover:text-amber-300',
                    )}
                  />
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Feedback Type</CardTitle>
            <CardDescription>Choose the closest fit.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {categories.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setCategory(value)}
                  className={cn(
                    'flex items-start gap-3 rounded-lg border p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                    category === value ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40',
                  )}
                  data-testid={`button-category-${value}`}
                >
                  <Icon className={cn('mt-0.5 h-5 w-5 shrink-0', category === value ? 'text-primary' : 'text-muted-foreground')} />
                  <span className={cn('text-sm font-medium', category === value ? 'text-primary' : 'text-foreground')}>{label}</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Message</CardTitle>
            <CardDescription>Tell us what happened or what you’d like to see improved.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="message">
                Message <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Tell us what happened or what you'd like to see improved..."
                rows={6}
                data-testid="textarea-message"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                data-testid="input-email"
              />
              <p className="text-xs text-muted-foreground">Automatically filled from your account. You can edit it.</p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="screenshot">Screenshot</Label>
              <div className="flex flex-col gap-3">
                {screenshot ? (
                  <div className="relative overflow-hidden rounded-lg border border-border">
                    <img src={screenshot} alt="Screenshot preview" className="h-auto w-full" />
                    <button
                      type="button"
                      onClick={handleRemoveScreenshot}
                      className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-background/80 backdrop-blur-sm transition-colors hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      aria-label="Remove screenshot"
                      data-testid="button-remove-screenshot"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <input
                      ref={fileInputRef}
                      id="screenshot"
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onChange={handleUploadScreenshot}
                      disabled={uploading}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="gap-2"
                      data-testid="button-upload-screenshot"
                    >
                      <Upload className="h-4 w-4" />
                      {uploading ? 'Uploading...' : 'Upload Screenshot'}
                    </Button>
                  </>
                )}
              </div>
               <p className="text-xs text-muted-foreground">Optional. Add an image to help us understand what happened.</p>
            </div>

            <div className="rounded-lg border border-border bg-muted/30 p-4">
              <p className="text-sm text-muted-foreground">
                <strong className="font-medium text-foreground">Privacy note:</strong> Your feedback may include browser and device information to help us debug issues. We never share your data with third parties.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button onClick={handleSubmit} disabled={submitting || !message.trim()} size="lg" className="gap-2" data-testid="button-submit">
            <MessageSquare className="h-4 w-4" />
            {submitting ? 'Sending...' : 'Send Feedback'}
          </Button>
        </div>
      </div>
    </DashboardLayout>
  )
}
