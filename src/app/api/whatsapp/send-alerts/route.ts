import { NextRequest, NextResponse } from 'next/server';

interface AlertRecipient {
  studentName: string;
  parentName?: string;
  phoneNumber?: string;
}

interface RequestBody {
  sessionId?: string;
  date?: string;
  className?: string;
  recipients?: AlertRecipient[];
}

export async function POST(req: NextRequest) {
  try {
    const body: RequestBody = await req.json();
    const defaultDate = new Intl.DateTimeFormat('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'Asia/Kolkata',
    }).format(new Date());
    const { recipients = [], date = defaultDate, className = 'Class' } = body;

    const token = process.env.WHATSAPP_ACCESS_TOKEN;
    const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;

    let successCount = 0;
    let failCount = 0;

    // Process each parent alert
    for (const item of recipients) {
      if (!item.phoneNumber) {
        failCount++;
        continue;
      }

      const message = `Dear Parent,

Your child ${item.studentName} was absent from school today, ${date}, in ${className}.

Regards,
School Administration`;

      // If official WhatsApp credentials are provided, call Meta Graph API
      if (token && phoneId && !token.includes('your-')) {
        try {
          const res = await fetch(`https://graph.facebook.com/v18.0/${phoneId}/messages`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              messaging_product: 'whatsapp',
              recipient_type: 'individual',
              to: item.phoneNumber.replace(/[^0-9]/g, ''),
              type: 'text',
              text: { body: message },
            }),
          });
          if (res.ok) {
            successCount++;
          } else {
            failCount++;
          }
        } catch {
          failCount++;
        }
      } else {
        // Successful simulation / local mode
        successCount++;
      }
    }

    return NextResponse.json({
      success: true,
      notifiedCount: successCount,
      failedCount: failCount,
    });
  } catch (error) {
    console.error('WhatsApp API endpoint error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process notifications' },
      { status: 500 }
    );
  }
}
