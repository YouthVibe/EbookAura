import { ImageResponse } from 'next/og';
import { NextResponse } from 'next/server';

// Make this route compatible with static export
export const dynamic = "force-static";

// Define static paths for prerendering
export function generateStaticParams() {
  return [
    { id: 'default' },
    // Add IDs of important books here if you want to pre-generate their OG images
  ];
}

// Route to handle Open Graph image generation
export async function GET(request, { params }) {
  try {
    // For static generation, we'll create a default OG image
    // since we can't use dynamic parameters from request.url
    return new ImageResponse(
      (
        <div
          style={{
            display: 'flex',
            fontSize: 40,
            color: 'white',
            background: 'linear-gradient(to bottom, #4b6cb7, #182848)',
            width: '100%',
            height: '100%',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '50px',
          }}
        >
          <div style={{ 
            display: 'flex',
            marginBottom: '20px',
            fontWeight: 'bold'
          }}>
            EbookAura
          </div>
          <div style={{ 
            display: 'flex',
            fontSize: '24px',
            textAlign: 'center'
          }}>
            Free PDF Books - Read and Download
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (error) {
    console.error('Error generating OG image:', error);
    
    // Return a fallback image on error
    return new ImageResponse(
      (
        <div
          style={{
            display: 'flex',
            fontSize: 40,
            color: 'white',
            background: 'linear-gradient(to bottom, #4b6cb7, #182848)',
            width: '100%',
            height: '100%',
            padding: '50px',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <div style={{ 
            display: 'flex',
            marginBottom: '20px',
            fontWeight: 'bold'
          }}>
            EbookAura
          </div>
          <div style={{ 
            display: 'flex',
            fontSize: '24px'
          }}>
            Free PDF Books - Read and Download
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  }
} 