import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Camera, 
  Video, 
  X, 
  Upload, 
  Image as ImageIcon,
  Loader2,
  Plus
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface MediaFile {
  id: string;
  file: File;
  preview: string;
  type: 'image' | 'video';
}

interface CustomerMediaUploadProps {
  onMediaChange: (files: File[]) => void;
  maxFiles?: number;
  disabled?: boolean;
}

export const CustomerMediaUpload = ({
  onMediaChange,
  maxFiles = 5,
  disabled = false,
}: CustomerMediaUploadProps) => {
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;

    const newFiles: MediaFile[] = [];
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/quicktime'];

    Array.from(files).forEach((file) => {
      if (!allowedTypes.includes(file.type)) return;
      if (mediaFiles.length + newFiles.length >= maxFiles) return;

      const preview = URL.createObjectURL(file);
      newFiles.push({
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        file,
        preview,
        type: file.type.startsWith('image/') ? 'image' : 'video',
      });
    });

    const updatedFiles = [...mediaFiles, ...newFiles];
    setMediaFiles(updatedFiles);
    onMediaChange(updatedFiles.map((f) => f.file));
  };

  const removeFile = (id: string) => {
    const updatedFiles = mediaFiles.filter((f) => f.id !== id);
    // Revoke the URL to avoid memory leaks
    const fileToRemove = mediaFiles.find((f) => f.id === id);
    if (fileToRemove) {
      URL.revokeObjectURL(fileToRemove.preview);
    }
    setMediaFiles(updatedFiles);
    onMediaChange(updatedFiles.map((f) => f.file));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <motion.div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        animate={{ 
          scale: isDragging ? 1.02 : 1,
          borderColor: isDragging ? 'hsl(var(--primary))' : 'hsl(var(--border))'
        }}
        className={cn(
          'relative border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer',
          isDragging ? 'bg-primary/5 border-primary' : 'hover:bg-muted/50',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
        onClick={() => !disabled && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          multiple
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
          disabled={disabled}
        />

        <motion.div
          animate={{ y: isDragging ? -5 : 0 }}
          className="flex flex-col items-center gap-3"
        >
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Camera className="h-8 w-8 text-primary" />
          </div>
          <div>
            <p className="font-semibold text-lg">Upload Vehicle Photos/Videos</p>
            <p className="text-sm text-muted-foreground">
              Drag & drop or click to select • Max {maxFiles} files
            </p>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <ImageIcon className="h-4 w-4" />
              JPG, PNG
            </span>
            <span className="flex items-center gap-1">
              <Video className="h-4 w-4" />
              MP4
            </span>
          </div>
        </motion.div>
      </motion.div>

      {/* Preview Grid */}
      <AnimatePresence>
        {mediaFiles.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="grid grid-cols-4 gap-3"
          >
            {mediaFiles.map((media, index) => (
              <motion.div
                key={media.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ delay: index * 0.05 }}
                className="relative aspect-square rounded-xl overflow-hidden group border-2 border-border"
              >
                {media.type === 'image' ? (
                  <img
                    src={media.preview}
                    alt={`Upload ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <video
                    src={media.preview}
                    className="w-full h-full object-cover"
                  />
                )}
                
                {/* Type Badge */}
                <div className="absolute bottom-2 left-2">
                  <span className="px-2 py-0.5 rounded-full text-xs bg-black/60 text-white flex items-center gap-1">
                    {media.type === 'image' ? (
                      <ImageIcon className="h-3 w-3" />
                    ) : (
                      <Video className="h-3 w-3" />
                    )}
                    {media.type}
                  </span>
                </div>

                {/* Remove Button */}
                <motion.button
                  initial={{ opacity: 0 }}
                  whileHover={{ scale: 1.1 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(media.id);
                  }}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-4 w-4" />
                </motion.button>
              </motion.div>
            ))}

            {/* Add More Button */}
            {mediaFiles.length < maxFiles && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={() => fileInputRef.current?.click()}
                className="aspect-square rounded-xl border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center gap-1 hover:border-primary hover:bg-primary/5 transition-colors"
              >
                <Plus className="h-6 w-6 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Add More</span>
              </motion.button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* File Count */}
      {mediaFiles.length > 0 && (
        <p className="text-sm text-muted-foreground text-center">
          {mediaFiles.length} of {maxFiles} files selected
        </p>
      )}
    </div>
  );
};
