const downloadBlob = (blob: Blob, filename: string): void => {
  const objectUrl = URL.createObjectURL(blob);
  const downloadLink = document.createElement('a');

  downloadLink.href = objectUrl;
  downloadLink.download = filename;
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);
  URL.revokeObjectURL(objectUrl);
};

export { downloadBlob };
