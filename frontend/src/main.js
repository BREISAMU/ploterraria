import { Application, Assets, Sprite } from "pixi.js";
import getData from "./utils/getData";

async function main() {
  const app = new Application();
  await app.init({
    width: 700,
    height: 700,
    backgroundColor: 0x222222,
    resizeTo: window,
  });

  document.body.appendChild(app.canvas);

  // Placeholders
  const x = "damage";
  const y = "use_time";

  const result = await getData(x, y);
  const data = result.data;

  var x_min = data[0][x];
  var x_max = data[0][x];
  var y_min = data[0][y];
  var y_max = data[0][y];
  for (const item of data) {
    x_min = Math.min(x_min, item[x]);
    x_max = Math.max(x_max, item[x]);
    y_min = Math.min(y_min, item[y]);
    y_max = Math.max(y_max, item[y]);
  }

  for (const item of data) {
    const encoded_path = "/weapons/" + encodeURIComponent(item.file_name);
    const texture = await Assets.load(encoded_path);
    const sprite = Sprite.from(texture);

    const x_base = (item[x] - x_min) / (x_max - x_min);
    const x_buffer = window.innerWidth * 0.02;
    const y_base = (item[y] - y_min) / (y_max - y_min);
    const y_buffer = window.innerHeight * 0.02;

    sprite.position.set(
      x_buffer + x_base * window.innerWidth,
      y_buffer + y_base * window.innerHeight,
    );
    sprite.scale.set(0.6);
    app.stage.addChild(sprite);
  }
}

main();
