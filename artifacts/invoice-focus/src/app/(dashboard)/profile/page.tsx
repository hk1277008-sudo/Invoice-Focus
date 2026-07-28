import { useState, useRef } from 'react'
import { DashboardLayout } from '../layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useAuth } from '@/hooks/useAuth'
import { supabase, getApiBaseUrl } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'
import { format } from 'date-fns'

export default function ProfilePage() {
  const { user, refreshSession } = useAuth()
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fullNameFromMetadata = (user?.user_metadata?.full_name as string) || ''
  const avatarUrlFromMetadata = (user?.user_metadata?.avatar_url as string) || ''

  const [fullName, setFullName] = useState(fullNameFromMetadata)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState(avatarUrlFromMetadata)

  const initials = fullName
    ? fullName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : user?.email?.slice(0, 2).toUpperCase() || 'IF'

  const createdAt = user?.created_at ? format(new Date(user.created_at), 'MMMM d, yyyy') : '—'

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append('avatar', file)
      const { data: sessionData } = await supabase.auth.getSession()

      const response = await fetch(`${getApiBaseUrl()}/api/auth/avatar`, {
        method: 'POST',
        headers: sessionData.session?.access_token
          ? { Authorization: `Bearer ${sessionData.session.access_token}` }
          : {},
        body: formData,
      })

      const data = await response.json().catch(() => ({ error: 'Upload failed' }))

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload avatar')
      }

      setAvatarUrl(data.url)
      await supabase.auth.updateUser({ data: { avatar_url: data.url } })
      await refreshSession()
      toast({ title: 'Photo updated', description: 'Your profile photo has been updated.' })
    } catch (error) {
      toast({
        title: 'Upload failed',
        description: error instanceof Error ? error.message : 'Could not upload photo',
        variant: 'destructive',
      })
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setIsUpdating(true)
    try {
      const { error } = await supabase.auth.updateUser({
        data: { full_name: fullName, avatar_url: avatarUrl },
      })

      if (error) throw error

      await refreshSession()
      toast({ title: 'Profile updated', description: 'Your profile changes have been saved.' })
    } catch (error) {
      toast({
        title: 'Update failed',
        description: error instanceof Error ? error.message : 'Could not update profile',
        variant: 'destructive',
      })
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-2xl">
        <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">
          Profile
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage your account details.</p>

        <form onSubmit={handleUpdateProfile} className="mt-8 space-y-6">
          <div className="flex items-center gap-6">
            <Avatar className="h-20 w-20">
              <AvatarImage src={avatarUrl} alt={fullName || 'Profile'} />
              <AvatarFallback className="text-lg">{initials}</AvatarFallback>
            </Avatar>
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={handleAvatarUpload}
                aria-label="Upload profile photo"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                {isUploading ? 'Uploading...' : 'Upload photo'}
              </Button>
              <p className="mt-1 text-xs text-muted-foreground">JPG, PNG, or GIF. Max 2MB.</p>
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="full-name">Full name</Label>
              <Input
                id="full-name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Alex Kim"
                disabled={isUpdating}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={user?.email || ''}
                disabled
                readOnly
              />
              <p className="text-xs text-muted-foreground">Email cannot be changed here.</p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="created-at">Account created</Label>
              <Input id="created-at" value={createdAt} disabled readOnly />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="avatar-url">Profile photo URL</Label>
              <Input
                id="avatar-url"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://example.com/photo.jpg"
                disabled={isUpdating}
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={isUpdating || isUploading}>
              {isUpdating ? 'Saving...' : 'Save changes'}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  )
}
