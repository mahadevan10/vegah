'use client';

import { useState } from 'react';
import { Upload, FileText, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { uploadDocuments } from '@/lib/api';

export default function UploadInterface({ onUploadComplete }) {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles(selectedFiles);
    setResult(null);
  };

  const handleUpload = async () => {
    if (files.length === 0) return;

    setUploading(true);
    setResult(null);

    try {
      const response = await uploadDocuments(files);
      setResult({
        success: true,
        message: response.message,
        filesProcessed: response.files_processed,
        totalChunks: response.total_chunks,
      });
      setFiles([]);
      if (onUploadComplete) onUploadComplete();
    } catch (error) {
      setResult({
        success: false,
        message: error.response?.data?.detail || error.message,
      });
    } finally {
      setUploading(false);
    }
  };

  const removeFile = (index) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4 flex items-center">
        <Upload className="w-6 h-6 mr-2 text-blue-600" />
        Upload Documents
      </h2>

      {/* File Input */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors">
        <input
          type="file"
          multiple
          accept=".txt,.md,.doc,.docx"
          onChange={handleFileChange}
          className="hidden"
          id="file-upload"
          disabled={uploading}
        />
        <label
          htmlFor="file-upload"
          className="cursor-pointer flex flex-col items-center space-y-2"
        >
          <Upload className="w-12 h-12 text-gray-400" />
          <p className="text-lg font-medium text-gray-700">
            Click to upload documents
          </p>
          <p className="text-sm text-gray-500">
            .txt, .md, .doc, .docx supported
          </p>
        </label>
      </div>

      {/* Selected Files */}
      {files.length > 0 && (
        <div className="mt-4 space-y-2">
          <h3 className="font-semibold text-gray-700">Selected Files:</h3>
          {files.map((file, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between bg-gray-50 p-3 rounded-lg"
            >
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <span className="text-sm">{file.name}</span>
                <span className="text-xs text-gray-500">
                  ({(file.size / 1024).toFixed(2)} KB)
                </span>
              </div>
              <button
                onClick={() => removeFile(idx)}
                className="text-red-500 hover:text-red-700"
                disabled={uploading}
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload Button */}
      {files.length > 0 && (
        <button
          onClick={handleUpload}
          disabled={uploading}
          className="mt-4 w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
        >
          {uploading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Uploading & Indexing...</span>
            </>
          ) : (
            <>
              <Upload className="w-5 h-5" />
              <span>Upload {files.length} File(s)</span>
            </>
          )}
        </button>
      )}

      {/* Result Message */}
      {result && (
        <div
          className={`mt-4 p-4 rounded-lg flex items-start space-x-2 ${
            result.success
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {result.success ? (
            <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          ) : (
            <XCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          )}
          <div>
            <p className="font-medium">{result.message}</p>
            {result.success && (
              <p className="text-sm mt-1">
                Files processed: {result.filesProcessed} • Chunks created:{' '}
                {result.totalChunks}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">Upload Info:</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Single file upload: ~30-60 seconds</li>
          <li>• Documents are chunked for better retrieval</li>
          <li>• Hybrid indexing: BM25 + Vector embeddings</li>
          <li>• Cost: $0 per upload (forever)</li>
        </ul>
      </div>
    </div>
  );
}
