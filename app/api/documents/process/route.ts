import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, isValidUuid, boundedText } from '@/lib/api-auth';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { document_id, file_path, file_type } = await request.json();
    const user = await getAuthenticatedUser(request);

    if (!user || !isValidUuid(document_id) || !boundedText(file_path, 512) || !boundedText(file_type, 128)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify document belongs to the authenticated user
    const { data: doc, error: docError } = await supabase
      .from('documents')
      .select('id')
      .eq('id', document_id)
      .eq('user_id', user.id)
      .single();

    if (docError || !doc) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    // Call Python backend for processing
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000';
    const response = await fetch(`${backendUrl}/process-document`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        document_id,
        user_id: user.id,
        file_path,
        file_type,
      }),
    });

    if (!response.ok) {
      throw new Error('Backend processing failed');
    }

    const result = await response.json();
    return NextResponse.json(result);
  } catch (error) {
    console.error('Document processing error:', error);
    return NextResponse.json(
      { error: 'Failed to process document' },
      { status: 500 }
    );
  }
}
