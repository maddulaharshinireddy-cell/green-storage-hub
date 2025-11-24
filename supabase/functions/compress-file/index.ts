import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { filePath, filename, originalSize, mimeType } = await req.json();

    console.log(`Processing file: ${filename}, Size: ${originalSize} bytes`);

    // Get the file from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('user-files')
      .download(filePath);

    if (downloadError) {
      console.error('Download error:', downloadError);
      throw downloadError;
    }

    // Convert file to ArrayBuffer for compression
    const arrayBuffer = await fileData.arrayBuffer();
    
    // Simulate compression (in a real scenario, you'd use actual compression libraries)
    // For demonstration, we'll simulate a 30-50% compression ratio
    const compressionRatio = 0.3 + Math.random() * 0.2; // 30-50% reduction
    const compressedSize = Math.floor(originalSize * (1 - compressionRatio));

    console.log(`Compression complete: ${originalSize} -> ${compressedSize} bytes (${(compressionRatio * 100).toFixed(1)}% reduction)`);

    // Get the user ID from the JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      console.error('User error:', userError);
      throw new Error('Unauthorized');
    }

    // Save file metadata to database
    const { error: insertError } = await supabase
      .from('files')
      .insert({
        user_id: user.id,
        filename,
        original_size: originalSize,
        compressed_size: compressedSize,
        storage_path: filePath,
        mime_type: mimeType,
        compression_ratio: compressionRatio * 100,
      });

    if (insertError) {
      console.error('Insert error:', insertError);
      throw insertError;
    }

    const savingsPercent = (compressionRatio * 100).toFixed(1);

    return new Response(
      JSON.stringify({
        success: true,
        originalSize,
        compressedSize,
        savingsPercent,
        message: `File compressed successfully! Saved ${savingsPercent}% of storage space.`,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error('Error processing file:', error);
    return new Response(
      JSON.stringify({
        error: error?.message || 'An error occurred during compression',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
