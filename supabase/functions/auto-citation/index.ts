// supabase/functions/auto-citation/index.ts
// Edge Function for fetching and generating citations from CrossRef API

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, content-type",
};

interface CitationRequest {
  url: string;
  style?: "apa" | "mla" | "chicago";
}

// Fetch metadata from CrossRef API
async function fetchMetadataFromCrossRef(
  url: string
): Promise<Record<string, any> | null> {
  try {
    // Extract DOI from URL if it's a DOI URL
    let doi = null;
    if (url.includes("doi.org")) {
      doi = url.split("doi.org/")[1];
    }

    if (!doi) {
      // Try to fetch from the URL as a fallback
      return null;
    }

    const response = await fetch(
      `https://api.crossref.org/v1/works/${doi}`
    );
    const data = await response.json();

    if (data.message) {
      return {
        doi: data.message.DOI,
        title: data.message.title?.[0] || "Unknown",
        authors: data.message.author?.map((a: any) => ({
          given: a.given,
          family: a.family,
        })) || [],
        published: data.message.published?.["date-parts"]?.[0] || null,
        publisher: data.message.publisher || null,
        journal: data.message["container-title"]?.[0] || null,
        volume: data.message.volume || null,
        issue: data.message.issue || null,
        pages: data.message.page || null,
        issn: data.message.issn || null,
        url: data.message.URL || url,
      };
    }
  } catch (error) {
    console.error("Error fetching from CrossRef:", error);
  }

  return null;
}

// Generate APA citation format
function generateAPACitation(metadata: Record<string, any>): string {
  const { authors, published, title, journal, volume, issue, pages, url } =
    metadata;

  let citation = "";

  // Authors
  if (authors && authors.length > 0) {
    const authorList = authors
      .slice(0, 3)
      .map((a: any) => `${a.family}, ${a.given?.[0] || ""}`.trim())
      .join(", ");
    citation += authorList;
    if (authors.length > 3) citation += ", et al.";
    citation += " ";
  }

  // Year
  if (published && published.length > 0) {
    citation += `(${published[0]}). `;
  }

  // Title
  citation += `${title}. `;

  // Journal
  if (journal) {
    citation += `*${journal}*`;
    if (volume) citation += `, ${volume}`;
    if (issue) citation += `(${issue})`;
    citation += ", ";
  }

  // Pages
  if (pages) {
    citation += `${pages}. `;
  }

  // DOI
  if (metadata.doi) {
    citation += `https://doi.org/${metadata.doi}`;
  } else if (url) {
    citation += `Retrieved from ${url}`;
  }

  return citation;
}

// Generate MLA citation format
function generateMLACitation(metadata: Record<string, any>): string {
  const { authors, published, title, journal, volume, url } = metadata;

  let citation = "";

  // Authors
  if (authors && authors.length > 0) {
    const firstAuthor = authors[0];
    citation += `${firstAuthor.family}, ${firstAuthor.given}`;
    if (authors.length > 1) {
      citation += `, and ${authors[1].given} ${authors[1].family}`;
    }
    citation += ". ";
  }

  // Title
  citation += `"${title}." `;

  // Journal
  if (journal) {
    citation += `*${journal}*, vol. ${volume}, `;
  }

  // Year
  if (published) {
    citation += `${published[0]}, `;
  }

  // Pages and DOI
  if (metadata.doi) {
    citation += `https://doi.org/${metadata.doi}.`;
  } else if (url) {
    citation += `${url}.`;
  }

  return citation;
}

serve(async (req: Request) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { url, style = "apa" } = (await req.json()) as CitationRequest;

    if (!url) {
      return new Response(
        JSON.stringify({ error: "URL is required" }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Fetch metadata from CrossRef
    const metadata = await fetchMetadataFromCrossRef(url);

    if (!metadata) {
      return new Response(
        JSON.stringify({
          error: "Could not fetch metadata for this URL",
          citation: null,
        }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Generate citation based on style
    let citation = "";
    if (style === "apa") {
      citation = generateAPACitation(metadata);
    } else if (style === "mla") {
      citation = generateMLACitation(metadata);
    }

    return new Response(
      JSON.stringify({
        metadata,
        citation,
        style,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: String(error) }),
      { status: 500, headers: corsHeaders }
    );
  }
});
