export function getImagePixelData(img) {
    let canvas = document.createElement('canvas');
    let context = canvas.getContext('2d');
    context.drawImage(img, 0, 0);
    const width = img.width;
    const height = img.height;
    const pixels = context.getImageData(0, 0, width, height).data;
    return {
        width,
        height,
        pixels,
    };
}
