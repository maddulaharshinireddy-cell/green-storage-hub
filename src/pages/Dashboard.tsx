import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import StorageStats from "@/components/StorageStats";
import FileUpload from "@/components/FileUpload";
import FilesList from "@/components/FilesList";

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
    }
  }, [user, navigate]);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-secondary">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Welcome back!</h1>
          <p className="text-muted-foreground">
            Manage your files with intelligent compression and storage optimization.
          </p>
        </div>

        <StorageStats key={refreshKey} />

        <FileUpload onUploadComplete={() => setRefreshKey(prev => prev + 1)} />

        <FilesList key={refreshKey} />
      </main>
    </div>
  );
}
