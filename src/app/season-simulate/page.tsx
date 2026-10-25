import { SeasonSimulator } from '@/src/components/SeasonSimulator';

export const metadata = {
  title: 'Sezon Simülasyonu | F1 Story',
  description: 'Formula 1 sezonunu adım adım, kazanan fotoğrafları ve canlı puan tabloları ile otomatik simüle edin.',
};

export default function SeasonSimulatePage() {
  return (
    <main style={{ minHeight: '100vh', background: '#0a0b10' }}>
      <SeasonSimulator />
    </main>
  );
}
