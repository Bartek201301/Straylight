import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

// Maximum file size: 5MB
const MAX_FILE_SIZE = 5 * 1024 * 1024;

// Allowed image types
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
];

export async function POST(request: NextRequest) {
  try {
    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const userId = formData.get('userId') as string;
    const documentId = formData.get('documentId') as string;

    // Validate required fields
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          error:
            'Invalid file type. Only JPEG, PNG, WebP, and GIF images are allowed.',
          allowedTypes: ALLOWED_TYPES,
        },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          error: `File too large. Maximum size is ${Math.round(MAX_FILE_SIZE / 1024 / 1024)}MB.`,
          maxSize: MAX_FILE_SIZE,
        },
        { status: 400 }
      );
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 15);
    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const fileName = `${timestamp}_${randomId}.${fileExt}`;

    // Create storage path: images/userId/documentId/fileName
    const storagePath = documentId
      ? `images/${userId}/${documentId}/${fileName}`
      : `images/${userId}/${fileName}`;

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);

    // Try to upload to Supabase Storage with fallback
    let publicUrl: string;
    let uploadSuccess = false;

    try {
      // First, try to upload to Supabase Storage
      const supabase = getSupabaseAdmin();
      const { error: uploadError } = await supabase.storage
        .from('uploads') // This bucket needs to exist in Supabase
        .upload(storagePath, fileBuffer, {
          contentType: file.type,
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        console.warn('Supabase storage not available:', uploadError);
        throw new Error('Supabase storage bucket not found');
      }

      // Get public URL from Supabase
      const { data: urlData } = supabase.storage
        .from('uploads')
        .getPublicUrl(storagePath);

      if (urlData?.publicUrl) {
        publicUrl = urlData.publicUrl;
        uploadSuccess = true;
      } else {
        throw new Error('Failed to generate public URL');
      }
    } catch (storageError) {
      console.warn('Falling back to base64 storage:', storageError);

      // Fallback: Convert image to base64 data URL
      const base64 = fileBuffer.toString('base64');
      publicUrl = `data:${file.type};base64,${base64}`;
      uploadSuccess = true;
    }

    // Save image metadata to database (optional)
    const imageMetadata = {
      file_name: fileName,
      original_name: file.name,
      file_size: file.size,
      file_type: file.type,
      storage_path: storagePath,
      public_url: publicUrl,
      user_id: userId,
      document_id: documentId || null,
      uploaded_at: new Date().toISOString(),
    };

    // Insert metadata into images table (create this table if needed)
    const supabase = getSupabaseAdmin();
    const { data: dbData, error: dbError } = await supabase
      .from('images')
      .insert(imageMetadata)
      .select()
      .single();

    if (dbError) {
      console.warn('Failed to save image metadata:', dbError);
      // Continue anyway - the image was uploaded successfully
    }

    // Return success response
    return NextResponse.json({
      success: true,
      message: uploadSuccess
        ? publicUrl.startsWith('data:')
          ? 'Image uploaded successfully (using fallback base64 storage)'
          : 'Image uploaded successfully to Supabase storage'
        : 'Image uploaded successfully',
      fallback: publicUrl.startsWith('data:'),
      data: {
        id: dbData?.id || null,
        fileName: fileName,
        originalName: file.name,
        url: publicUrl,
        size: file.size,
        type: file.type,
        storagePath: storagePath,
        uploadedAt: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error('Image upload error:', error);

    return NextResponse.json(
      {
        error: 'Internal server error during image upload',
        message: error.message || 'Unknown error occurred',
        details: process.env.NODE_ENV === 'development' ? error : undefined,
      },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve image metadata
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const documentId = searchParams.get('documentId');
    const imageId = searchParams.get('imageId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Build query based on parameters
    let data, error;

    const supabase = getSupabaseAdmin();

    if (imageId) {
      // Get specific image
      const result = await supabase
        .from('images')
        .select('*')
        .eq('user_id', userId)
        .eq('id', imageId)
        .single();
      data = result.data;
      error = result.error;
    } else if (documentId) {
      // Get images for specific document
      const result = await supabase
        .from('images')
        .select('*')
        .eq('user_id', userId)
        .eq('document_id', documentId)
        .order('uploaded_at', { ascending: false });
      data = result.data;
      error = result.error;
    } else {
      // Get all images for user
      const result = await supabase
        .from('images')
        .select('*')
        .eq('user_id', userId)
        .order('uploaded_at', { ascending: false });
      data = result.data;
      error = result.error;
    }

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { message: 'No images found' },
          { status: 404 }
        );
      }
      throw error;
    }

    return NextResponse.json({
      success: true,
      data: data,
    });
  } catch (error: any) {
    console.error('Image fetch error:', error);

    return NextResponse.json(
      {
        error: 'Failed to fetch images',
        message: error.message || 'Internal server error',
      },
      { status: 500 }
    );
  }
}
