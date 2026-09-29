import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, isValidUuid, boundedText } from '@/lib/api-auth';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { document_id, question } = await request.json();
    const user = await getAuthenticatedUser(request);

    if (!user || !isValidUuid(document_id) || !boundedText(question, 4000)) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify document belongs to the authenticated user
    const { data: doc, error: docError } = await supabase
      .from('documents')
      .select('id, content')
      .eq('id', document_id)
      .eq('user_id', user.id)
      .single();

    if (docError || !doc) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    // Call Python backend for Q&A
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000';
    const response = await fetch(`${backendUrl}/ask-question`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        document_id,
        user_id: user.id,
        question,
      }),
    });

    if (!response.ok) {
      throw new Error('Backend Q&A failed');
    }

    const result = await response.json();
    return NextResponse.json(result);
  } catch (error) {
    console.error('Q&A error:', error);
    return NextResponse.json(
      { error: 'Failed to process question' },
      { status: 500 }
    );
  }
}
