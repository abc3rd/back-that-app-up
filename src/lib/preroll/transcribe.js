import { base44 } from '@/api/base44Client';

// Local captures live in IndexedDB. To read one back as text we upload it to
// private storage, sign it briefly, and let the backend run speech-to-text.
export async function transcribeLocalRecording(rec) {
  const file = new File([rec.blob], rec.name || `${rec.id}.wav`, { type: 'audio/wav' });
  const { file_uri } = await base44.integrations.Core.UploadPrivateFile({ file });
  const { signed_url } = await base44.integrations.Core.CreateFileSignedUrl({ file_uri, expires_in: 900 });
  const res = await base44.functions.invoke('transcribeRecording', { audioUrl: signed_url });
  if (res.data?.error) throw new Error(res.data.error);
  return res.data?.transcript || '';
}