// app/api/gdrive/files/route.js
import { NextResponse } from 'next/server';

export async function GET(request) {
  // In a real app, you'd authenticate and use the Google Drive API via your MCP
  // For now, we simulate a delay and return mock data.
  await new Promise(resolve => setTimeout(resolve, 1500));

  const mockFiles = [
    { id: 'file_abc123', name: 'Competitor Keyword Analysis Q4.xlsx' },
    { id: 'file_def456', name: 'Blog Post Ideas - Drafts.gsheet' },
    { id: 'file_ghi789', name: 'SEO Strategy Document.xlsx' },
    { id: 'file_jkl012', name: 'Market Research Data.gsheet' },
  ];

  return NextResponse.json({ files: mockFiles });
}