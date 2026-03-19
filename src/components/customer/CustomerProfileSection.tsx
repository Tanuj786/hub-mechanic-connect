import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { AnimatedCard } from '@/components/ui/animated-card';
import { useToast } from '@/hooks/use-toast';
import { Camera, Save, User, Mail, Phone, Loader2, CheckCircle } from 'lucide-react';

export const CustomerProfileSection = () => {
  const { user } = useAuth();
  const { profile, loading, updateProfile, refetch } = useProfile();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    full_name: '',
    phone_number: '',
    email: '',
  });

  useEffect(() => {
    if (profile) {
      setForm({
        full_name: profile.full_name || '',
        phone_number: profile.phone_number || '',
        email: profile.email || '',
      });
    }
  }, [profile]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `${user.id}/avatar.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(path);

      await updateProfile({ avatar_url: publicUrl });
      toast({ title: 'Avatar updated!' });
    } catch (error: any) {
      toast({ title: 'Upload failed', description: error.message, variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    const { error } = await updateProfile({
      full_name: form.full_name,
      phone_number: form.phone_number,
    });

    if (error) {
      toast({ title: 'Update failed', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Profile updated!' });
      setIsEditing(false);
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const initials = profile?.full_name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase() || 'U';

  return (
    <motion.div
      key="profile"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6 max-w-2xl mx-auto"
    >
      <h2 className="text-3xl font-bold">My Profile</h2>

      {/* Avatar Card */}
      <AnimatedCard className="p-8 flex flex-col items-center gap-4">
        <div className="relative group">
          <Avatar className="h-28 w-28 border-4 border-primary/20 shadow-lg">
            <AvatarImage src={profile?.avatar_url || undefined} />
            <AvatarFallback className="text-3xl font-bold bg-primary/10 text-primary">
              {initials}
            </AvatarFallback>
          </Avatar>
          <label className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
            {uploading ? (
              <Loader2 className="h-6 w-6 text-white animate-spin" />
            ) : (
              <Camera className="h-6 w-6 text-white" />
            )}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarUpload}
              disabled={uploading}
            />
          </label>
        </div>
        <div className="text-center">
          <h3 className="text-xl font-semibold">{profile?.full_name}</h3>
          <p className="text-muted-foreground text-sm">{profile?.email || user?.email}</p>
        </div>
      </AnimatedCard>

      {/* Profile Details */}
      <AnimatedCard delay={0.1} className="p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Personal Information</h3>
          {!isEditing ? (
            <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
              Edit Profile
            </Button>
          ) : (
            <Button variant="ghost" size="sm" onClick={() => { setIsEditing(false); if (profile) setForm({ full_name: profile.full_name, phone_number: profile.phone_number || '', email: profile.email || '' }); }}>
              Cancel
            </Button>
          )}
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-muted-foreground">
              <User className="h-4 w-4" /> Full Name
            </Label>
            {isEditing ? (
              <Input
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              />
            ) : (
              <p className="text-base font-medium pl-6">{profile?.full_name || '—'}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-muted-foreground">
              <Mail className="h-4 w-4" /> Email
            </Label>
            <p className="text-base font-medium pl-6 text-muted-foreground">
              {profile?.email || user?.email || '—'}
            </p>
            {isEditing && (
              <p className="text-xs text-muted-foreground pl-6">Email cannot be changed here.</p>
            )}
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-muted-foreground">
              <Phone className="h-4 w-4" /> Phone Number
            </Label>
            {isEditing ? (
              <Input
                value={form.phone_number}
                onChange={(e) => setForm({ ...form, phone_number: e.target.value })}
                placeholder="Enter phone number"
              />
            ) : (
              <p className="text-base font-medium pl-6">{profile?.phone_number || '—'}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-muted-foreground">
              <CheckCircle className="h-4 w-4" /> Account Type
            </Label>
            <p className="text-base font-medium pl-6 capitalize">{profile?.user_type || 'customer'}</p>
          </div>
        </div>

        {isEditing && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Button onClick={handleSave} disabled={saving} className="w-full gradient-primary">
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save Changes
            </Button>
          </motion.div>
        )}
      </AnimatedCard>

      {/* Account Info */}
      <AnimatedCard delay={0.2} className="p-6">
        <h3 className="text-lg font-semibold mb-3">Account Details</h3>
        <div className="text-sm text-muted-foreground space-y-1">
          <p>Member since: {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'}</p>
          <p>Last updated: {profile?.updated_at ? new Date(profile.updated_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'}</p>
        </div>
      </AnimatedCard>
    </motion.div>
  );
};
