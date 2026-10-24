import { NextRequest, NextResponse } from 'next/server';

function isPrivateIpOrHost(hostname: string): boolean {
  const lower = hostname.toLowerCase();
  if (lower === 'localhost' || lower.endsWith('.local') || lower === '::1' || lower === '0.0.0.0') {
    return true;
  }
  // Check private IP ranges
  const ipv4Match = lower.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipv4Match) {
    const octet1 = parseInt(ipv4Match[1], 10);
    const octet2 = parseInt(ipv4Match[2], 10);
    if (octet1 === 10) return true;
    if (octet1 === 127) return true;
    if (octet1 === 192 && octet2 === 168) return true;
    if (octet1 === 172 && octet2 >= 16 && octet2 <= 31) return true;
    if (octet1 === 169 && octet2 === 254) return true; // Link-local
  }
  return false;
}

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'Valid URL is required' }, { status: 400 });
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch {
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 });
    }

    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
      return NextResponse.json({ error: 'Only http and https protocols are allowed' }, { status: 400 });
    }

    if (isPrivateIpOrHost(parsedUrl.hostname)) {
      return NextResponse.json({ error: 'Access to private or internal network addresses is forbidden' }, { status: 403 });
    }

    const response = await fetch(parsedUrl.toString(), {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 PDFForge/1.0',
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      return NextResponse.json({ error: `Failed to fetch webpage (status ${response.status})` }, { status: 400 });
    }

    const html = await response.text();
    return NextResponse.json({ html, title: parsedUrl.hostname });
  } catch (err: any) {
    console.error('Error fetching webpage for HTML to PDF:', err);
    return NextResponse.json({ error: err.message || 'Failed to fetch webpage' }, { status: 500 });
  }
}
