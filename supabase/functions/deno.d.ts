// Deno type declarations for development environment
declare namespace Deno {
  interface Env {
    get(key: string): string | undefined;
  }
  const env: Env;
}

declare module "https://deno.land/std@0.168.0/http/server.ts" {
  export function serve(options: any): Promise<void>;
  export function serve(handler: (request: Request) => Response | Promise<Response>): Promise<void>;
}

declare module "https://esm.sh/@supabase/supabase-js@2" {
  export function createClient(url: string, key: string, options?: any): any;
}
