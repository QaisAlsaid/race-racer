export function preloadImages(urls: Array<string>) {
  urls.forEach((url) => {
    const img = new Image();
    img.src = url;
  });
}
