import { Application, Assets, Sprite, Graphics, Text, TextStyle } from "pixi.js";
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

  const TICK_COUNT = 10;
  const X_TICK_SIZE = 1;
  const Y_TICK_SIZE = Math.floor(y_max / TICK_COUNT) + 1;

  const AXIS_COLOR = 0xaaaaaa;
  const TICK_COLOR = 0xaaaaaa;
  const LABEL_COLOR = "#aaaaaa";
  const AXIS_PADDING = {
    left: 70,
    bottom: 60,
    right: 20,
    top: 20,
  };

  const plotWidth = window.innerWidth - AXIS_PADDING.left - AXIS_PADDING.right;
  function toScreenX(val) {
    return AXIS_PADDING.left + ((val - x_min) / (x_max - x_min)) * plotWidth;
  }

  const plotHeight = window.innerHeight - AXIS_PADDING.top - AXIS_PADDING.bottom;
  function toScreenY(val) {
    return AXIS_PADDING.top + (1 - (val - y_min) / (y_max - y_min)) * plotHeight;
  }

  const axes = new Graphics();

  axes
    .moveTo(AXIS_PADDING.left, window.innerHeight - AXIS_PADDING.bottom)
    .lineTo(window.innerWidth - AXIS_PADDING.right, window.innerHeight - AXIS_PADDING.bottom)
    .stroke({ color: AXIS_COLOR, width: 1.5 });

  axes
    .moveTo(AXIS_PADDING.left, AXIS_PADDING.top)
    .lineTo(AXIS_PADDING.left, window.innerHeight - AXIS_PADDING.bottom)
    .stroke({ color: AXIS_COLOR, width: 1.5 });

  app.stage.addChild(axes);

  const tickLabelStyle = new TextStyle({
    fill: LABEL_COLOR,
    fontSize: 11,
    fontFamily: "monospace",
  });

  const axisLabelStyle = new TextStyle({
    fill: LABEL_COLOR,
    fontSize: 13,
    fontFamily: "monospace",
  });

  for (let i = 0; i <= TICK_COUNT; i++) {
    const val = x_min + (i / TICK_COUNT) * (x_max - x_min);
    const screenX = toScreenX(val);
    const screenY = window.innerHeight - AXIS_PADDING.bottom;

    const tick = new Graphics();
    tick
      .moveTo(screenX, screenY)
      .lineTo(screenX, screenY + Y_TICK_SIZE)
      .stroke({ color: TICK_COLOR, width: 1 });
    app.stage.addChild(tick);

    const label = new Text({ text: Math.round(val).toString(), style: tickLabelStyle });
    label.anchor.set(0.5, 0);
    label.position.set(screenX, screenY + Y_TICK_SIZE + 3);
    app.stage.addChild(label);
  }

  for (let i = 0; i <= TICK_COUNT; i++) {
    const val = y_min + (i / TICK_COUNT) * (y_max - y_min);
    const screenY = toScreenY(val);
    const screenX = AXIS_PADDING.left;

    const tick = new Graphics();
    tick
      .moveTo(screenX, screenY)
      .lineTo(screenX - X_TICK_SIZE, screenY)
      .stroke({ color: TICK_COLOR, width: 1 });
    app.stage.addChild(tick);

    const label = new Text({ text: Math.round(val).toString(), style: tickLabelStyle });
    label.anchor.set(1, 0.5);
    label.position.set(screenX - X_TICK_SIZE - 4, screenY);
    app.stage.addChild(label);
  }

  const xAxisLabel = new Text({ text: x, style: axisLabelStyle });
  xAxisLabel.anchor.set(0.5, 0);
  xAxisLabel.position.set(
    AXIS_PADDING.left + plotWidth / 2,
    window.innerHeight - AXIS_PADDING.bottom + 28
  );
  app.stage.addChild(xAxisLabel);

  const yAxisLabel = new Text({ text: y, style: axisLabelStyle });
  yAxisLabel.anchor.set(0.5, 1);
  yAxisLabel.rotation = -Math.PI / 2;
  yAxisLabel.position.set(14, AXIS_PADDING.top + plotHeight / 2);
  app.stage.addChild(yAxisLabel);

  for (const item of data) {
    const encoded_path = "/weapons/" + encodeURIComponent(item.file_name);
    const texture = await Assets.load(encoded_path);
    const sprite = Sprite.from(texture);

    sprite.position.set(toScreenX(item[x]), toScreenY(item[y]));
    sprite.scale.set(0.6);
    sprite.anchor.set(0.5); // center the sprite on its data point
    app.stage.addChild(sprite);
  }
}

main();