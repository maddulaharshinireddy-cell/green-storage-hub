import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Database, TrendingDown, HardDrive, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface Stats {
  totalFiles: number;
  totalOriginalSize: number;
  totalCompressedSize: number;
  totalSavings: number;
}

export default function StorageStats() {
  const [stats, setStats] = useState<Stats>({
    totalFiles: 0,
    totalOriginalSize: 0,
    totalCompressedSize: 0,
    totalSavings: 0,
  });
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const fetchStats = async () => {
      const { data, error } = await supabase
        .from("files")
        .select("original_size, compressed_size")
        .eq("user_id", user.id);

      if (error) {
        console.error("Error fetching stats:", error);
        return;
      }

      const totalOriginalSize = data.reduce((sum, file) => sum + Number(file.original_size), 0);
      const totalCompressedSize = data.reduce((sum, file) => sum + Number(file.compressed_size), 0);

      setStats({
        totalFiles: data.length,
        totalOriginalSize,
        totalCompressedSize,
        totalSavings: totalOriginalSize - totalCompressedSize,
      });
    };

    fetchStats();

    // Set up realtime subscription
    const channel = supabase
      .channel("files-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "files",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchStats();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  };

  const savingsPercent = stats.totalOriginalSize > 0
    ? ((stats.totalSavings / stats.totalOriginalSize) * 100).toFixed(1)
    : "0";

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Files</CardTitle>
          <Database className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalFiles}</div>
          <p className="text-xs text-muted-foreground">Files stored</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Storage Used</CardTitle>
          <HardDrive className="h-4 w-4 text-secondary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatBytes(stats.totalCompressedSize)}</div>
          <p className="text-xs text-muted-foreground">After compression</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Space Saved</CardTitle>
          <TrendingDown className="h-4 w-4 text-success" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatBytes(stats.totalSavings)}</div>
          <p className="text-xs text-muted-foreground">{savingsPercent}% reduction</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Energy Impact</CardTitle>
          <Zap className="h-4 w-4 text-accent" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-success">Low</div>
          <p className="text-xs text-muted-foreground">Efficient storage</p>
        </CardContent>
      </Card>
    </div>
  );
}
