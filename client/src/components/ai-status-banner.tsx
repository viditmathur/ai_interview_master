import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info, Zap } from 'lucide-react';

export function AIStatusBanner() {
  return (
    <Alert className="mb-6 bg-blue-50">
      <Info className="h-4 w-4 text-blue-600" />
      <AlertDescription className="text-blue-700">
        <div className="flex items-center space-x-2">
          <Zap className="h-4 w-4" />
          <span>
            <strong>AI System Active:</strong> This platform uses intelligent question generation and evaluation. 
            If OpenAI services are unavailable, the system automatically uses our backup AI for seamless operation.
          </span>
        </div>
      </AlertDescription>
    </Alert>
  );
}