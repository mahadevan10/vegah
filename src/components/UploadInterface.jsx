'use client';

import { useState } from 'react';
import { Upload, FileText, CheckCircle, XCircle, Loader2, Trash2 } from 'lucide-react';
import { uploadDocuments } from '../lib/api';

export default function UploadInterface({ onUploadComplete }) {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles(prev => [...prev, ...selectedFiles]);
    setResult(null);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    setFiles(prev => [...prev, ...droppedFiles]);
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

  const clearAll = () => {
    setFiles([]);
    setResult(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-lg">
        <h2 className="text-2xl font-bold mb-2 flex items-center">
          <Upload className="w-6 h-6 mr-2" />
          Upload Documents to Knowledge Base
        </h2>
        <p className="text-sm opacity-90">
          Upload documents to index with hybrid search (BM25 + Vector embeddings)
        </p>
      </div>

      {/* Upload Area */}
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <div
          className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
            dragActive
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            type="file"
            multiple
            accept=".txt,.md,.doc,.docx,.pdf"
            onChange={handleFileChange}
            className="hidden"
            id="file-upload"
            disabled={uploading}
          />
          <label htmlFor="file-upload" className="cursor-pointer">
            <Upload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-xl font-semibold text-gray-700 mb-2">
              Drop files here or click to browse
            </p>
            <p className="text-sm text-gray-500">
              Supports: .txt, .md, .doc, .docx, .pdf
            </p>
            <p className="text-xs text-gray-400 mt-2">
              Upload time: ~30-60 seconds per document
            </p>
          </label>
        </div>

        {/* Selected Files */}
        {files.length > 0 && (
          <div className="mt-6">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-semibold text-gray-700">
                Selected Files ({files.length})
              </h3>
              <button
                onClick={clearAll}
                className="text-red-500 hover:text-red-700 text-sm flex items-center"
                disabled={uploading}
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Clear All
              </button>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {files.map((file, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between bg-gray-50 p-3 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <FileText className="w-5 h-5 text-blue-600 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{file.name}</p>
                      <p className="text-xs text-gray-500">
                        {(file.size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => removeFile(idx)}
                    className="text-red-500 hover:text-red-700 ml-3"
                    disabled={uploading}
                  >
                    <XCircle className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upload Button */}
        {files.length > 0 && (
          <button
            onClick={handleUpload}
            disabled={uploading}
            className="mt-6 w-full bg-blue-600 text-white py-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 font-semibold text-lg transition-colors"
          >
            {uploading ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" />
                <span>Uploading & Indexing...</span>
              </>
            ) : (
              <>
                <Upload className="w-6 h-6" />
                <span>Upload {files.length} Document{files.length > 1 ? 's' : ''}</span>
              </>
            )}
          </button>
        )}

        {/* Result Message */}
        {result && (
          <div
            className={`mt-6 p-4 rounded-lg flex items-start space-x-3 ${
              result.success
                ? 'bg-green-50 text-green-800 border-2 border-green-200'
                : 'bg-red-50 text-red-800 border-2 border-red-200'
            }`}
          >
            {result.success ? (
              <CheckCircle className="w-6 h-6 flex-shrink-0 mt-0.5" />
            ) : (
              <XCircle className="w-6 h-6 flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <p className="font-semibold text-lg">{result.message}</p>
              {result.success && (
                <div className="mt-2 space-y-1 text-sm">
                  <p>✅ Files processed: {result.filesProcessed}</p>
                  <p>✅ Document chunks created: {result.totalChunks}</p>
                  <p>✅ Indexed with hybrid search (BM25 + Vector)</p>
                  <p className="text-xs mt-2 opacity-75">
                    Documents are now searchable via chat interface
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* How It Works */}
        <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
          <h3 className="font-bold text-blue-900 mb-3 text-lg">📚 How It Works</h3>
          <ol className="space-y-2 text-sm text-blue-800">
            <li><strong>1. Document Upload:</strong> Files are uploaded to backend</li>
            <li><strong>2. Text Chunking:</strong> Documents split into ~500 word chunks</li>
            <li><strong>3. BM25 Indexing:</strong> Traditional keyword search index created</li>
            <li><strong>4. Vector Embeddings:</strong> Chunks encoded with sentence-transformers</li>
            <li><strong>5. ChromaDB Storage:</strong> Embeddings stored in vector database</li>
            <li><strong>6. Ready to Query:</strong> Knowledge base ready for chat queries</li>
          </ol>
        </div>

        {/* Indexing Info */}
        <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-6">
          <h3 className="font-bold text-purple-900 mb-3 text-lg">⚡ Indexing Info</h3>
          <ul className="space-y-2 text-sm text-purple-800">
            <li><strong>Time per document:</strong> 30-60 seconds</li>
            <li><strong>Supported formats:</strong> TXT, MD, DOC, DOCX, PDF</li>
            <li><strong>Chunk size:</strong> ~500 words with overlap</li>
            <li><strong>Embedding model:</strong> all-MiniLM-L6-v2 (384 dim)</li>
            <li><strong>Storage:</strong> Persistent ChromaDB</li>
            <li><strong>Cost:</strong> $0 (free tier forever)</li>
          </ul>
        </div>
      </div>

      {/* Bulk Upload Info */}
      <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-6">
        <h3 className="font-bold text-yellow-900 mb-2">💡 Uploading 100+ Documents?</h3>
        <p className="text-sm text-yellow-800 mb-3">
          For bulk uploads of 100+ documents, consider these optimized strategies:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="bg-white p-3 rounded">
            <p className="font-semibold text-gray-900 mb-1">Option 1: Overnight Indexing</p>
            <p className="text-gray-600 text-xs">
              Upload all documents and let them index overnight (~8 hours for 1000 docs)
            </p>
          </div>
          <div className="bg-white p-3 rounded">
            <p className="font-semibold text-gray-900 mb-1">Option 2: Temp Upgrade</p>
            <p className="text-gray-600 text-xs">
              Upgrade to e2-small during indexing (~3 hours for 1000 docs), then downgrade
            </p>
          </div>
          <div className="bg-white p-3 rounded">
            <p className="font-semibold text-gray-900 mb-1">Option 3: Incremental</p>
            <p className="text-gray-600 text-xs">
              Upload 10-20 documents per day gradually over time
            </p>
          </div>
        </div>
      </div>

      {/* Upload Speed Improvements Info Card */}
      <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6 mt-6">
        <h3 className="font-bold text-green-900 mb-3 text-lg">🚀 Key Changes to Improve Upload Speed</h3>
        <ul className="space-y-2 text-sm text-green-800">
          <li><strong>Background Task Processing:</strong> Uploads are now handled asynchronously, reducing response time from 30+ seconds to under 1 second.</li>
          <li><strong>Job Tracking System:</strong> Each upload is tracked with a unique job ID, allowing users to monitor progress.</li>
          <li><strong>Status Polling Endpoint:</strong> The frontend can poll for upload status (processing, completed, or failed) via a new API.</li>
          <li><strong>Immediate Response:</strong> Uploads respond instantly with job details, so you don't have to wait for processing to finish.</li>
        </ul>
      </div>
    </div>
  );
}
