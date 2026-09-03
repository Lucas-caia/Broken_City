import { contextBridge } from 'electron';

// Exposição segura de APIs nativas para o React (Clean Code / Segurança)
contextBridge.exposeInMainWorld('electronAPI', {
  // Funções IPC futuras podem ser declaradas aqui
});