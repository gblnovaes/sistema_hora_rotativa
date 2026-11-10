/** Porta para entregar um arquivo ao usuário. No navegador/Electron vira um download. */
export interface FileSaver {
  save(fileName: string, content: string, mimeType: string): void;
}

export class BrowserFileSaver implements FileSaver {
  save(fileName: string, content: string, mimeType: string): void {
    const url = URL.createObjectURL(new Blob([content], { type: `${mimeType};charset=utf-8` }));
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
  }
}
