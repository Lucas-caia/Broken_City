// Helper para detecção e resolução de arquivos de áudio em src/assets/audio/
// Compatível com Vite dev server e builds empacotados do Electron

interface AudioModule {
  default: string;
}

const audioModules = import.meta.glob<AudioModule>(
  '../../assets/audio/**/*.{mp3,ogg,wav,m4a}',
  { eager: true }
);

export function getAudioFileUrl(filename: string): string | null {
  const entry = Object.entries(audioModules).find(([path]) =>
    path.endsWith(`/${filename}`)
  );
  return entry ? (entry[1] as AudioModule).default : null;
}

export function hasAudioFile(filename: string): boolean {
  return getAudioFileUrl(filename) !== null;
}

