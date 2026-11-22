// Decodes the embedded base64 PNG data URIs (window ASSETS, written by tools/build.py)
// into Image objects. No network requests are made: all images are data: URIs.
const IMG = {};

function loadAssets(done) {
  const names = Object.keys(ASSETS);
  let left = names.length;
  if (!left) { done(); return; }
  names.forEach(function (name) {
    const img = new Image();
    img.onload = function () {
      IMG[name] = img;
      if (--left === 0) done();
    };
    img.onerror = function () {
      console.error("asset failed to decode: " + name);
      if (--left === 0) done();
    };
    img.src = ASSETS[name];
  });
}

// Makes a seamlessly repeating parallax strip: image + mirrored image side by side.
function makeMirroredStrip(img) {
  const c = document.createElement("canvas");
  c.width = img.width * 2; c.height = img.height;
  const g = c.getContext("2d");
  g.drawImage(img, 0, 0);
  g.save(); g.translate(img.width * 2, 0); g.scale(-1, 1); g.drawImage(img, 0, 0); g.restore();
  return c;
}
