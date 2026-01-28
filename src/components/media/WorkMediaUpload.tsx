import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Camera, Video, Upload, X, Check, Loader2, Image as ImageIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface WorkMediaUploadProps {
  serviceRequestId: string;
  onComplete?: () => void;
}

type MediaStage = 'before' | 'during' | 'after';

interface UploadedMedia {
  id: string;
  file_url: string;
  file_type: 'image' | 'video';
  media_stage: MediaStage;
  caption: string;
}

export const WorkMediaUpload = ({ serviceRequestId, onComplete }: WorkMediaUploadProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<MediaStage>('before');
  const [uploading, setUploading] = useState(false);
  const [uploadedMedia, setUploadedMedia] = useState<UploadedMedia[]>([]);
  const [caption, setCaption] = useState('');

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, fileType: 'image' | 'video') => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${serviceRequestId}/${activeTab}-${Date.now()}.${fileExt}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('work-media')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('work-media')
        .getPublicUrl(fileName);

      // Save to database
      const { data: mediaData, error: dbError } = await supabase
        .from('work_media')
        .insert({
          service_request_id: serviceRequestId,
          mechanic_id: user.id,
          file_url: publicUrl,
          file_type: fileType,
          media_stage: activeTab,
          caption: caption || null,
        })
        .select()
        .single();

      if (dbError) throw dbError;

      setUploadedMedia([...uploadedMedia, mediaData as UploadedMedia]);
      setCaption('');
      
      toast({
        title: 'Upload Successful',
        description: `${fileType === 'image' ? 'Photo' : 'Video'} uploaded successfully`,
      });
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload Failed',
        description: error.message || 'Failed to upload file',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const removeMedia = async (mediaId: string, fileUrl: string) => {
    try {
      // Extract file path from URL
      const filePath = fileUrl.split('/work-media/')[1];
      
      if (filePath) {
        await supabase.storage.from('work-media').remove([filePath]);
      }
      
      await supabase.from('work_media').delete().eq('id', mediaId);
      
      setUploadedMedia(uploadedMedia.filter(m => m.id !== mediaId));
      
      toast({
        title: 'Removed',
        description: 'Media removed successfully',
      });
    } catch (error) {
      console.error('Remove error:', error);
    }
  };

  const stageIcons: Record<MediaStage, React.ReactNode> = {
    before: <Camera className="h-4 w-4" />,
    during: <Video className="h-4 w-4" />,
    after: <Check className="h-4 w-4" />,
  };

  const getStageMedia = (stage: MediaStage) => {
    return uploadedMedia.filter(m => m.media_stage === stage);
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="gradient-primary text-primary-foreground">
        <CardTitle className="flex items-center gap-2">
          <Camera className="h-5 w-5" />
          Work Documentation
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as MediaStage)}>
          <TabsList className="grid grid-cols-3 mb-6">
            <TabsTrigger value="before" className="flex items-center gap-2">
              {stageIcons.before}
              Before
            </TabsTrigger>
            <TabsTrigger value="during" className="flex items-center gap-2">
              {stageIcons.during}
              During
            </TabsTrigger>
            <TabsTrigger value="after" className="flex items-center gap-2">
              {stageIcons.after}
              After
            </TabsTrigger>
          </TabsList>

          {(['before', 'during', 'after'] as MediaStage[]).map((stage) => (
            <TabsContent key={stage} value={stage} className="space-y-4">
              {/* Uploaded Media Grid */}
              <AnimatePresence>
                <div className="grid grid-cols-3 gap-3">
                  {getStageMedia(stage).map((media) => (
                    <motion.div
                      key={media.id}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="relative aspect-square rounded-lg overflow-hidden group"
                    >
                      {media.file_type === 'image' ? (
                        <img
                          src={media.file_url}
                          alt={media.caption || 'Work photo'}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <video
                          src={media.file_url}
                          className="w-full h-full object-cover"
                        />
                      )}
                      <button
                        onClick={() => removeMedia(media.id, media.file_url)}
                        className="absolute top-1 right-1 w-6 h-6 rounded-full bg-destructive text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </motion.div>
                  ))}
                </div>
              </AnimatePresence>

              {/* Upload Area */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Add a caption (optional)"
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    className="flex-1"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <Label
                    htmlFor={`photo-upload-${stage}`}
                    className={cn(
                      'flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg cursor-pointer transition-colors',
                      uploading ? 'opacity-50 cursor-not-allowed' : 'hover:border-primary hover:bg-primary/5'
                    )}
                  >
                    {uploading ? (
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    ) : (
                      <>
                        <ImageIcon className="h-8 w-8 text-muted-foreground mb-2" />
                        <span className="text-sm text-muted-foreground">Upload Photo</span>
                      </>
                    )}
                    <input
                      id={`photo-upload-${stage}`}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={uploading}
                      onChange={(e) => handleFileUpload(e, 'image')}
                    />
                  </Label>

                  <Label
                    htmlFor={`video-upload-${stage}`}
                    className={cn(
                      'flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg cursor-pointer transition-colors',
                      uploading ? 'opacity-50 cursor-not-allowed' : 'hover:border-primary hover:bg-primary/5'
                    )}
                  >
                    {uploading ? (
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    ) : (
                      <>
                        <Video className="h-8 w-8 text-muted-foreground mb-2" />
                        <span className="text-sm text-muted-foreground">Upload Video</span>
                      </>
                    )}
                    <input
                      id={`video-upload-${stage}`}
                      type="file"
                      accept="video/*"
                      className="hidden"
                      disabled={uploading}
                      onChange={(e) => handleFileUpload(e, 'video')}
                    />
                  </Label>
                </div>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
};