// Capture a still from a video file in the browser. The admin server has no
// ffmpeg, so the poster is produced here and uploaded as a normal image.
export async function captureVideoPoster(file: File): Promise<Blob> {
  const url = URL.createObjectURL(file);
  const video = document.createElement("video");
  video.preload = "auto";
  video.muted = true;
  video.playsInline = true;
  video.src = url;

  try {
    await new Promise<void>((resolve, reject) => {
      video.onloadeddata = () => resolve();
      video.onerror = () => reject(new Error(`Could not read ${file.name}. Use MP4 (H.264/AAC) or WebM.`));
    });

    const duration = Number.isFinite(video.duration) ? video.duration : 0;
    const at = duration > 1 ? 1 : 0;
    if (at > 0) {
      await new Promise<void>((resolve, reject) => {
        video.onseeked = () => resolve();
        video.onerror = () => reject(new Error(`Could not capture a poster from ${file.name}.`));
        video.currentTime = at;
      });
    }

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 360;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Could not capture a poster.");
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", 0.85));
    if (blob) return blob;
    const jpeg = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.85));
    if (!jpeg) throw new Error(`Could not encode a poster for ${file.name}.`);
    return jpeg;
  } finally {
    video.src = "";
    URL.revokeObjectURL(url);
  }
}
