import { useState, useCallback } from "react";
import { Upload, FileCheck, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface FileUploadProps {
  onUploadComplete: () => void;
}

export default function FileUpload({ onUploadComplete }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleUpload = async (files: FileList) => {
    if (!user || files.length === 0) return;

    setUploading(true);
    setProgress(0);

    try {
      const file = files[0];
      const filePath = `${user.id}/${Date.now()}-${file.name}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from("user-files")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      setProgress(50);

      // Call edge function to compress and save metadata
      const { data, error: functionError } = await supabase.functions.invoke(
        "compress-file",
        {
          body: {
            filePath,
            filename: file.name,
            originalSize: file.size,
            mimeType: file.type,
          },
        }
      );

      if (functionError) throw functionError;

      setProgress(100);

      toast({
        title: "File uploaded successfully!",
        description: `Saved ${data.savingsPercent}% of storage space through compression.`,
      });

      onUploadComplete();
    } catch (error: any) {
      console.error("Upload error:", error);
      toast({
        title: "Upload failed",
        description: error.message || "An error occurred during upload",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      handleUpload(e.dataTransfer.files);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  return (
    <Card className={`transition-all ${isDragging ? "border-primary shadow-glow" : ""}`}>
      <CardContent className="p-8">
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
            isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25"
          }`}
        >
          {uploading ? (
            <div className="space-y-4">
              <FileCheck className="w-12 h-12 mx-auto text-primary animate-pulse" />
              <div className="space-y-2">
                <p className="text-sm font-medium">Uploading and compressing...</p>
                <Progress value={progress} className="h-2" />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full gradient-primary flex items-center justify-center shadow-glow">
                <Upload className="w-8 h-8 text-white" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Drop files here</h3>
                <p className="text-sm text-muted-foreground">
                  or click to browse from your device
                </p>
              </div>
              <Button
                onClick={() => document.getElementById("file-input")?.click()}
                className="mt-4"
              >
                Select Files
              </Button>
              <input
                id="file-input"
                type="file"
                className="hidden"
                onChange={(e) => e.target.files && handleUpload(e.target.files)}
              />
            </div>
          )}
        </div>
        
        <div className="mt-4 flex items-start gap-2 text-sm text-muted-foreground">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <p>Files are automatically compressed on upload to maximize storage efficiency and reduce energy consumption.</p>
        </div>
      </CardContent>
    </Card>
  );
}
