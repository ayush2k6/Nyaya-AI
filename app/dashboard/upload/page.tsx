'use client';

import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Upload, AlertCircle, CheckCircle, Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function UploadPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedDocs, setUploadedDocs] = useState<string[]>([]);

  const supportedFormats = ['pdf', 'txt', 'docx', 'pptx'];

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files);
    handleFiles(droppedFiles);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.currentTarget.files || []);
    handleFiles(selectedFiles);
  };

  const handleFiles = (newFiles: File[]) => {
    const validFiles = newFiles.filter((file) => {
      const ext = file.name.split('.').pop()?.toLowerCase();
      return ext && supportedFormats.includes(ext);
    });

    if (validFiles.length !== newFiles.length) {
      setError(
        `Only ${supportedFormats.join(', ').toUpperCase()} files are supported`
      );
    }

    setFiles((prev) => [...prev, ...validFiles]);
    setError('');
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (!user || files.length === 0) return;

    setUploading(true);
    setError('');
    const uploaded: string[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileExt = file.name.split('.').pop()?.toLowerCase();

        // Create document record
        const { data: docData, error: docError } = await supabase
          .from('documents')
          .insert({
            user_id: user.id,
            title: file.name.replace(/\.[^.]*$/, ''),
            filename: file.name,
            file_path: `documents/${user.id}/${Date.now()}-${file.name}`,
            file_type: fileExt || 'unknown',
            file_size: file.size,
            status: 'processing',
            content: null,
            metadata: { uploadedAt: new Date().toISOString() },
          })
          .select()
          .single();

        if (docError) throw docError;

        // Upload file to Supabase Storage
        const { error: storageError } = await supabase.storage
          .from('documents')
          .upload(docData.file_path, file, { upsert: false });

        if (storageError) throw storageError;

        // Create analytics record
        await supabase
          .from('document_analytics')
          .insert({
            document_id: docData.id,
            views: 0,
            qa_count: 0,
          })
          .select()
          .single();

        uploaded.push(docData.id);
        setUploadProgress(Math.round(((i + 1) / files.length) * 100));
      }

      setUploadedDocs(uploaded);
      setFiles([]);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to upload documents'
      );
    } finally {
      setUploading(false);
    }
  };

  if (uploadedDocs.length > 0) {
    return (
      <div className="min-h-screen bg-slate-950">
        <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Link>
          </div>
        </header>

        <main className="max-w-2xl mx-auto px-4 py-12">
          <div className="text-center">
            <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">
              Documents Uploaded Successfully!
            </h2>
            <p className="text-slate-400 mb-8">
              {uploadedDocs.length} document{uploadedDocs.length > 1 ? 's' : ''}{' '}
              uploaded. Processing will begin shortly.
            </p>

            <div className="space-y-3 mb-8">
              {uploadedDocs.map((docId) => (
                <div
                  key={docId}
                  className="bg-slate-800/50 border border-slate-700 rounded-lg p-4"
                >
                  <p className="text-slate-300 text-sm">Document ID: {docId}</p>
                </div>
              ))}
            </div>

            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              Return to Dashboard
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-white mb-2">Upload Documents</h1>
        <p className="text-slate-400 mb-8">
          Upload legal documents for AI analysis and insights
        </p>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Drop Zone */}
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          className="border-2 border-dashed border-slate-600 rounded-lg p-12 text-center mb-8 hover:border-slate-500 transition-colors"
        >
          <Upload className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">
            Drag and drop your documents here
          </h3>
          <p className="text-slate-400 mb-4">
            Supported formats: {supportedFormats.join(', ').toUpperCase()}
          </p>
          <label className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg cursor-pointer transition-colors">
            <span>Choose Files</span>
            <input
              type="file"
              multiple
              accept=".pdf,.txt,.docx,.pptx"
              onChange={handleFileSelect}
              className="hidden"
            />
          </label>
        </div>

        {/* Files List */}
        {files.length > 0 && (
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 mb-8">
            <h3 className="text-lg font-semibold text-white mb-4">
              {files.length} file{files.length > 1 ? 's' : ''} selected
            </h3>
            <div className="space-y-2 mb-6">
              {files.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-slate-700/50 rounded border border-slate-600"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white">{file.name}</p>
                    <p className="text-xs text-slate-400">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <button
                    onClick={() => removeFile(index)}
                    className="text-slate-400 hover:text-red-400 transition-colors text-sm font-medium"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>

            {uploading && (
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-slate-300">Upload Progress</span>
                  <span className="text-sm font-medium text-blue-400">
                    {uploadProgress}%
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            <button
              onClick={handleUpload}
              disabled={uploading}
              className="w-full px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-green-600/50 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Upload {files.length} Document{files.length > 1 ? 's' : ''}
                </>
              )}
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
