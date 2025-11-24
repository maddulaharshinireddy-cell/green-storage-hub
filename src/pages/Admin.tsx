import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, HardDrive, TrendingDown, Database } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface SystemStats {
  totalUsers: number;
  totalFiles: number;
  totalOriginalSize: number;
  totalCompressedSize: number;
}

interface UserFile {
  id: string;
  email: string;
  full_name: string;
  file_count: number;
  total_size: number;
}

export default function Admin() {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<SystemStats>({
    totalUsers: 0,
    totalFiles: 0,
    totalOriginalSize: 0,
    totalCompressedSize: 0,
  });
  const [userFiles, setUserFiles] = useState<UserFile[]>([]);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }

    if (!isAdmin) {
      navigate("/");
      return;
    }

    fetchAdminData();
  }, [user, isAdmin, navigate]);

  const fetchAdminData = async () => {
    // Fetch user count
    const { count: userCount } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true });

    // Fetch file statistics
    const { data: files } = await supabase
      .from("files")
      .select("original_size, compressed_size, user_id");

    const totalOriginalSize = files?.reduce((sum, file) => sum + Number(file.original_size), 0) || 0;
    const totalCompressedSize = files?.reduce((sum, file) => sum + Number(file.compressed_size), 0) || 0;

    // Fetch user file statistics
    const { data: userStats } = await supabase
      .from("profiles")
      .select(`
        id,
        email,
        full_name,
        files:files(compressed_size)
      `);

    const processedUserStats = userStats?.map(user => ({
      id: user.id,
      email: user.email,
      full_name: user.full_name || "Unknown",
      file_count: user.files?.length || 0,
      total_size: user.files?.reduce((sum: number, file: any) => sum + Number(file.compressed_size), 0) || 0,
    })) || [];

    setStats({
      totalUsers: userCount || 0,
      totalFiles: files?.length || 0,
      totalOriginalSize,
      totalCompressedSize,
    });

    setUserFiles(processedUserStats);
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  };

  if (!user || !isAdmin) return null;

  const savingsPercent = stats.totalOriginalSize > 0
    ? (((stats.totalOriginalSize - stats.totalCompressedSize) / stats.totalOriginalSize) * 100).toFixed(1)
    : "0";

  return (
    <div className="min-h-screen bg-gradient-secondary">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            System overview and user management
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
              <p className="text-xs text-muted-foreground">Registered accounts</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Files</CardTitle>
              <Database className="h-4 w-4 text-secondary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalFiles}</div>
              <p className="text-xs text-muted-foreground">Files stored</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Storage Used</CardTitle>
              <HardDrive className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatBytes(stats.totalCompressedSize)}</div>
              <p className="text-xs text-muted-foreground">After compression</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Savings</CardTitle>
              <TrendingDown className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{savingsPercent}%</div>
              <p className="text-xs text-muted-foreground">
                {formatBytes(stats.totalOriginalSize - stats.totalCompressedSize)} saved
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>User Storage Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Files</TableHead>
                    <TableHead>Storage Used</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {userFiles.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                        No users have uploaded files yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    userFiles.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.full_name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{user.file_count}</TableCell>
                        <TableCell>{formatBytes(user.total_size)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
