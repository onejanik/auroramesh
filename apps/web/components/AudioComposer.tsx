import { useState, useRef } from 'react';

type Props = {
  onCreated?: () => void;
};

export const AudioComposer = ({ onCreated }: Props) => {
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState('');
  const [isSaving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setRecordedBlob(blob);
        const audioFile = new File([blob], `recording-${Date.now()}.webm`, { type: 'audio/webm' });
        setFile(audioFile);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setError(null);
    } catch (err) {
      setError('Mikrofon-Zugriff fehlgeschlagen. Bitte Berechtigung erteilen.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleSubmit = async () => {
    if (!file) {
      setError('Bitte wähle eine Audiodatei aus oder nimm eine auf');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData });
      if (!uploadRes.ok) throw new Error('Upload fehlgeschlagen');
      const { storagePath, mediaType } = await uploadRes.json();
      if (mediaType !== 'audio') {
        throw new Error('Nur Audiodateien werden unterstützt');
      }
      const response = await fetch('/api/audios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audioUrl: storagePath, caption })
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.message ?? 'Audio konnte nicht gespeichert werden');
      }
      setCaption('');
      setFile(null);
      setRecordedBlob(null);
      onCreated?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unbekannter Fehler');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="card">
      <h3 style={{ marginTop: 0 }}>Audio-Notiz</h3>
      <textarea value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Beschreibung (optional)" style={{ width: '100%', minHeight: 80, padding: 8 }} />
      
      <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
        {!isRecording && !recordedBlob && (
          <button
            type="button"
            className="pill-button"
            style={{ background: '#e74c3c', color: '#fff' }}
            onClick={startRecording}
          >
            <i className="bi bi-mic-fill" />
            Aufnahme starten
          </button>
        )}
        
        {isRecording && (
          <button
            type="button"
            className="pill-button"
            style={{ background: '#95a5a6', color: '#fff' }}
            onClick={stopRecording}
          >
            <i className="bi bi-stop-fill" />
            Aufnahme stoppen
          </button>
        )}
        
        {isRecording && (
          <span style={{ color: '#e74c3c', fontWeight: 'bold' }}>
            <i className="bi bi-circle-fill" style={{ fontSize: '0.6rem', marginRight: '0.3rem' }} />
            Aufnahme läuft...
          </span>
        )}
        
        {recordedBlob && (
          <span style={{ color: 'var(--accent)', fontWeight: 'bold' }}>
            <i className="bi bi-check-circle-fill" />
            Aufnahme bereit
          </span>
        )}
      </div>
      
      <div style={{ marginTop: '1rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--muted)', fontSize: '0.9rem' }}>
          Oder Datei hochladen:
        </label>
        <input type="file" accept="audio/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
      </div>
      
      {recordedBlob && (
        <audio controls src={URL.createObjectURL(recordedBlob)} style={{ width: '100%', marginTop: '1rem' }} />
      )}
      
      {error && <p style={{ color: '#d63031', marginTop: '0.5rem' }}>{error}</p>}
      <button
        type="button"
        className="pill-button"
        style={{ background: 'var(--accent)', color: 'var(--accent-contrast)', marginTop: '1rem' }}
        onClick={handleSubmit}
        disabled={isSaving || isRecording}
      >
        {isSaving ? 'Wird erstellt...' : 'Audio teilen'}
      </button>
    </div>
  );
};

