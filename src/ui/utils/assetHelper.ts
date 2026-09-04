// Helper para resolver imagens em src/assets/images sem mover arquivos de pasta
// Compatível com Vite dev server e builds empacotados do Electron

interface ImageModule {
  default: string;
}

const imageModules = import.meta.glob<ImageModule>(
  '../../assets/images/*.{jpg,jpeg,png,webp,svg}',
  { eager: true }
);

export function getEventImageUrl(imageName?: string | null): string | null {
  if (!imageName) return null;

  const entry = Object.entries(imageModules).find(([path]) =>
    path.endsWith(`/${imageName}`)
  );

  return entry ? (entry[1] as ImageModule).default : null;
}

