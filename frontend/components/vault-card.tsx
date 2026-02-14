'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2, FolderOpen } from 'lucide-react';
import { Vault } from '@/lib/database.types';

interface VaultCardProps {
  vault: Vault;
  onClick?: () => void;
  onDelete?: () => void;
}

export default function VaultCard({ vault, onClick, onDelete }: VaultCardProps) {
  return (
    <Card 
      className="hover:shadow-lg transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2">
              <FolderOpen className="h-5 w-5 text-blue-600" />
              {vault.name}
            </CardTitle>
            {vault.description && (
              <CardDescription className="mt-2 line-clamp-2">
                {vault.description}
              </CardDescription>
            )}
          </div>
          {onDelete && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-gray-500">
          Created {new Date(vault.createdAt).toLocaleDateString()}
        </p>
      </CardContent>
    </Card>
  );
}
