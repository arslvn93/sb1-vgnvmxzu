interface WebhookData {
  fullName: string;
  email: string;
  submission_type: 'sales' | 'marketing';
  recordings: Array<{
    url: string;
    client_name: string;
    interaction_date: string;
    timestamp_notes: string;
    strengths?: string;
    improvements?: string;
  }>;
  submissionDate: string;
}

export const submitToWebhook = async (data: any): Promise<void> => {
  const webhookData = {
    full_name: data.fullName,
    email: data.email,
    submission_type: data.formType,
    submission_date: new Date().toISOString(),
    recordings: data.recordings.map(recording => ({
      url: recording.url,
      client_name: data.formType === 'sales' ? recording.clientName : recording.clientName, // For marketing, this is the document name
      interaction_date: data.formType === 'sales' ? recording.interactionDate : recording.interactionDate, // For marketing, this is the content creation date
      timestamp_notes: recording.timestamp_notes || '',
      ...(data.formType === 'sales' && {
        strengths: recording.strengths || '',
        improvements: recording.improvements || ''
      })
    }))
  };

  try {
    const response = await fetch('https://connect.pabbly.com/workflow/sendwebhookdata/IjU3NjYwNTZlMDYzNzA0Mzc1MjZiNTUzMjUxMzIi_pc', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(webhookData),
    });

    if (!response.ok) {
      throw new Error(`Webhook submission failed: ${response.statusText}`);
    }
  } catch (error) {
    console.error('Webhook Error:', error);
    throw new Error('Failed to submit form data');
  }
};