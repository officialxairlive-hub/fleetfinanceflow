import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function getAdminClient() {
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false }
  });
}

// GET: Retrieve current invoice logo & branding settings
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const shopId = searchParams.get('shopId') || 'default';
    const supabase = getAdminClient();

    const brandingPath = `invoice-branding-${shopId}.json`;
    const { data: fileData, error: fileError } = await supabase
      .storage
      .from('shop-assets')
      .download(brandingPath);

    if (!fileError && fileData) {
      const text = await fileData.text();
      const json = JSON.parse(text);
      return NextResponse.json({ success: true, ...json });
    }

    return NextResponse.json({
      success: true,
      logoUrl: null,
      preferences: {
        showLogoOnInvoices: true,
        logoAlignment: 'left',
        logoSize: 'medium',
        tagline: ''
      }
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}

// POST: Upload or update invoice logo & branding settings
export async function POST(request) {
  try {
    const supabase = getAdminClient();
    const contentType = request.headers.get('content-type') || '';

    let shopId = 'default';
    let logoUrl = null;
    let preferences = {
      showLogoOnInvoices: true,
      logoAlignment: 'left',
      logoSize: 'medium',
      tagline: ''
    };

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file');
      shopId = formData.get('shopId') || 'default';
      const prefsRaw = formData.get('preferences');
      if (prefsRaw) {
        try {
          preferences = { ...preferences, ...JSON.parse(prefsRaw) };
        } catch (_) {}
      }

      if (file && typeof file === 'object' && file.arrayBuffer) {
        const buffer = Buffer.from(await file.arrayBuffer());
        const mime = file.type || 'image/png';
        const ext = mime.includes('svg') ? 'svg' : (mime.includes('jpeg') || mime.includes('jpg')) ? 'jpg' : (mime.includes('webp') ? 'webp' : 'png');
        const filename = `logo-${shopId}.${ext}`;

        const { error: uploadError } = await supabase
          .storage
          .from('shop-assets')
          .upload(filename, buffer, {
            contentType: mime,
            upsert: true
          });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase
          .storage
          .from('shop-assets')
          .getPublicUrl(filename);

        logoUrl = `${urlData.publicUrl}?t=${Date.now()}`;
      }
    } else {
      const body = await request.json();
      shopId = body.shopId || 'default';
      if (body.preferences) {
        preferences = { ...preferences, ...body.preferences };
      }

      if (body.logoData && body.logoData.startsWith('data:')) {
        // Base64 data URL uploaded from canvas or file reader
        const matches = body.logoData.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          const mime = matches[1];
          const base64Data = matches[2];
          const buffer = Buffer.from(base64Data, 'base64');
          const ext = mime.includes('svg') ? 'svg' : (mime.includes('jpeg') || mime.includes('jpg')) ? 'jpg' : (mime.includes('webp') ? 'webp' : 'png');
          const filename = `logo-${shopId}.${ext}`;

          const { error: uploadError } = await supabase
            .storage
            .from('shop-assets')
            .upload(filename, buffer, {
              contentType: mime,
              upsert: true
            });

          if (uploadError) throw uploadError;

          const { data: urlData } = supabase
            .storage
            .from('shop-assets')
            .getPublicUrl(filename);

          logoUrl = `${urlData.publicUrl}?t=${Date.now()}`;
        }
      } else if (body.logoUrl) {
        logoUrl = body.logoUrl;
      }
    }

    // Save JSON branding preferences file in storage bucket
    const brandingPayload = {
      logoUrl,
      preferences,
      shopId,
      updatedAt: new Date().toISOString()
    };

    await supabase
      .storage
      .from('shop-assets')
      .upload(`invoice-branding-${shopId}.json`, Buffer.from(JSON.stringify(brandingPayload, null, 2)), {
        contentType: 'application/json',
        upsert: true
      });

    return NextResponse.json({
      success: true,
      logoUrl,
      preferences
    });
  } catch (err) {
    console.error('Error saving invoice logo:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to save logo' },
      { status: 500 }
    );
  }
}

// DELETE: Remove invoice logo
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const shopId = searchParams.get('shopId') || 'default';
    const supabase = getAdminClient();

    const filesToDelete = [
      `logo-${shopId}.png`,
      `logo-${shopId}.jpg`,
      `logo-${shopId}.svg`,
      `logo-${shopId}.webp`,
      `invoice-branding-${shopId}.json`
    ];

    await supabase.storage.from('shop-assets').remove(filesToDelete);

    return NextResponse.json({ success: true, message: 'Logo removed' });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
