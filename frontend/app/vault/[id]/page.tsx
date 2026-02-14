'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Plus, Loader2, ArrowLeft, Trash2 } from 'lucide-react';
import { vaultService } from '@/lib/services/vault.service';
import { sourceService } from '@/lib/services/source.service';
import { Vault, Source } from '@/lib/database.types';
import FileUploader from '@/components/file-uploader';

export default function VaultDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const vaultId = params.id as string;

  const [vault, setVault] = useState<Vault | null>(null);
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [addingSource, setAddingSource] = useState(false);
  const [newSourceUrl, setNewSourceUrl] = useState('');
  const [showFileUpload, setShowFileUpload] = useState(false);

  // Check authentication
  useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);

  // Load vault and sources
  useEffect(() => {
    if (!user || !vaultId) return;

    const loadVaultData = async () => {
      try {
        setLoading(true);
        const [vaultData, sourcesData] = await Promise.all([
          vaultService.getVaultById(vaultId),
          sourceService.getSourcesByVault(vaultId),
        ]);
        setVault(vaultData);
        setSources(sourcesData);
        setError('');
  const handleAddSource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSourceUrl.trim()) return;

    setAddingSource(true);
    try {
      const source = await sourceService.createSource({
        vaultId,
        url: newSourceUrl,
        title: newSourceUrl,
        sourceType: 'web',
        author: '',
        publicationDate: new Date().toISOString(),
        content: '',
        metadata: {},
      });
      setSources([...sources, source]);
      setNewSourceUrl('');
      setError('');
    } catch (err) {
      setError('Failed to add source. Please try again.');
      console.error(err);
    } finally {
      setAddingSource(false);
    }
  };

  const handleDeleteSource = async (sourceId: string) => {
    try {
      await sourceService.deleteSource(sourceId);
      setSources(sources.filter(s => s.id !== sourceId));
    } catch (err) {
      setError('Failed to delete source. Please try again.');
      console.error(err);
    }
  };

  const handleFileUploadComplete = async (filename: string) => {
    try {
      const source = await sourceService.createSource({
        vaultId,
        url: '',
        title: filename,
        sourceType: 'file',
        author: '',
        publicationDate: new Date().toISOString(),
        content: '',
        metadata: { filename },
      });
      setSources([...sources, source]);
      setShowFileUpload(false);
      setError('');
    } catch (err) {
      setError('Failed to create source. Please try again.');
      console.error(err);
    }
  };

  if (!user) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!vault) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <Button
          variant="outline"
          onClick={() => router.back()}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <div className="mt-8 text-center">
          <p className="text-gray-600">Vault not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.back()}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{vault.name}</h1>
              <p className="text-gray-600 text-sm mt-1">{sources.length} sources</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Add source section */}
        <div className="mb-8 space-y-4">
          <div className="flex gap-2">
            {!showFileUpload ? (
              <>
                <form onSubmit={handleAddSource} className="flex-1 flex gap-2">
                  <Input
                    placeholder="https://example.com/research-paper"
                    value={newSourceUrl}
                    onChange={(e) => setNewSourceUrl(e.target.value)}
                    disabled={addingSource}
                    type="url"
                  />
                  <Button
                    type="submit"
                    disabled={addingSource || !newSourceUrl.trim()}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {addingSource ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      <>
                        <Plus className="mr-2 h-4 w-4" />
                        Add URL
                      </>
                    )}
                  </Button>
                </form>
                <Button
                  variant="outline"
                  onClick={() => setShowFileUpload(true)}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Upload File
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={() => setShowFileUpload(false)}
                  className="gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
              </>
            )}
          </div>

          {showFileUpload && (
            <FileUploader
              vaultId={vaultId}
              onUploadComplete={handleFileUploadComplete}
            />
          )}
        </div>

        {/* Sources list */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Sources</h2>

          {sources.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-gray-600 mb-4">
                  No sources yet. Add a URL or upload a file to get started.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {sources.map((source) => (
                <Card key={source.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1 cursor-pointer" onClick={() => router.push(`/vault/${vaultId}/source/${source.id}`)}>
                        <CardTitle className="text-lg hover:text-blue-600">
                          {source.title || source.url || 'Untitled Source'}
                        </CardTitle>
                        {source.author && (
                          <CardDescription>By {source.author}</CardDescription>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteSource(source.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {source.url && (
                      <p className="text-sm text-gray-600 mb-3 break-all">
                        <a href={source.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                          {source.url}
                        </a>
                      </p>
                    )}
                    <p className="text-xs text-gray-500">
                      {new Date(source.createdAt).toLocaleDateString()}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
