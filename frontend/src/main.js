import getData from "./utils/getData";
import {
  Application,
  Assets,
  Sprite,
  Graphics,
  Text,
  TextStyle,
} from "pixi.js";

const FIELDS = ["damage", "knockback", "crit_chance", "use_time"];

const xSelect = document.getElementById("x-select");
const ySelect = document.getElementById("y-select");

for (const field of FIELDS) {
  for (const select of [xSelect, ySelect]) {
    const opt = document.createElement("option");
    opt.value = field;
    opt.textContent = field;
    select.appendChild(opt);
  }
}

// Graphics stuff
const TICK_COUNT = 10;
  const X_TICK_SIZE = 8;
  const Y_TICK_SIZE = 8;
  const AXIS_TICK_COLOR = 0xaaaaaa;
  const LABEL_COLOR = "#aaaaaa";
  const AXIS_PADDING = {
    left: 70,
    bottom: 60,
    right: 20,
    top: 20,
  };

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

// Only want to set up app once, but wipe all children on generate button
const app = new Application();
await app.init({
  width: 700,
  height: 700,
  backgroundColor: 0x222222,
  resizeTo: window,
});

async function drawPlot(x, y) {
  app.stage.removeChildren();

  document.body.appendChild(app.canvas);

  const result = await getData(x, y);
  const data = result.data;

  var x_min = 0;
  var x_max = data[0][x];
  var y_min = 0;
  var y_max = data[0][y];

  // Some items are weird and havee negative stats. But want at most 0 axis start
  for (const item of data) {
    x_min = Math.min(x_min, item[x]);
    x_max = Math.max(x_max, item[x]);
    y_min = Math.min(y_min, item[y]);
    y_max = Math.max(y_max, item[y]);
  }

  const plotWidth = window.innerWidth - AXIS_PADDING.left - AXIS_PADDING.right;
  function toScreenX(val) {
    return AXIS_PADDING.left + ((val - x_min) / (x_max - x_min)) * plotWidth;
  }

  const plotHeight =
    window.innerHeight - AXIS_PADDING.top - AXIS_PADDING.bottom;
  function toScreenY(val) {
    return (
      AXIS_PADDING.top + (1 - (val - y_min) / (y_max - y_min)) * plotHeight
    );
  }

  const axes = new Graphics();
  axes
    .moveTo(AXIS_PADDING.left, window.innerHeight - AXIS_PADDING.bottom)
    .lineTo(
      window.innerWidth - AXIS_PADDING.right,
      window.innerHeight - AXIS_PADDING.bottom,
    )
    .stroke({ color: AXIS_TICK_COLOR, width: 1.5 });
  axes
    .moveTo(AXIS_PADDING.left, AXIS_PADDING.top)
    .lineTo(AXIS_PADDING.left, window.innerHeight - AXIS_PADDING.bottom)
    .stroke({ color: AXIS_TICK_COLOR, width: 1.5 });
  app.stage.addChild(axes);

  for (let i = 0; i <= TICK_COUNT; i++) {
    const val = x_min + (i / TICK_COUNT) * (x_max - x_min);
    const screenX = toScreenX(val);
    const screenY = window.innerHeight - AXIS_PADDING.bottom;

    const tick = new Graphics();
    tick
      .moveTo(screenX, screenY)
      .lineTo(screenX, screenY + Y_TICK_SIZE)
      .stroke({ color: AXIS_TICK_COLOR, width: 1 });
    app.stage.addChild(tick);

    const label = new Text({
      text: Math.round(val).toString(),
      style: tickLabelStyle,
    });
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
      .stroke({ color: AXIS_TICK_COLOR, width: 1 });
    app.stage.addChild(tick);

    const label = new Text({
      text: Math.round(val).toString(),
      style: tickLabelStyle,
    });
    label.anchor.set(1, 0.5);
    label.position.set(screenX - X_TICK_SIZE - 4, screenY);
    app.stage.addChild(label);
  }

  const xAxisLabel = new Text({ text: x, style: axisLabelStyle });
  xAxisLabel.anchor.set(0.5, 0);
  xAxisLabel.position.set(
    AXIS_PADDING.left + plotWidth / 2,
    window.innerHeight - AXIS_PADDING.bottom + 30,
  );
  app.stage.addChild(xAxisLabel);

  const yAxisLabel = new Text({ text: y, style: axisLabelStyle });
  yAxisLabel.anchor.set(0.5, 1);
  yAxisLabel.rotation = -Math.PI / 2;
  yAxisLabel.position.set(30, AXIS_PADDING.top + plotHeight / 2);
  app.stage.addChild(yAxisLabel);

  const weaponNameStyle = new TextStyle({
    fill: "#ffffff",
    fontSize: 12,
    fontFamily: "monospace",
    padding: 4,
  });

  for (const item of data) {
    if (item.file_name.toLowerCase().endsWith("gif")) {
      console.log("Skipping GIF images, need to come back to this.");
      continue;
    }

    const encoded_path = "/weapons/" + encodeURIComponent(item.file_name);
    const texture = await Assets.load(encoded_path);
    const sprite = Sprite.from(texture);

    sprite.position.set(toScreenX(item[x]), toScreenY(item[y]));
    sprite.scale.set(0.8);
    sprite.anchor.set(0.5);

    sprite.eventMode = "static";
    sprite.cursor = "pointer";

    const name = new Text({
      text: item.name,
      style: weaponNameStyle,
    });

    sprite.on("pointerover", () => {
      sprite.scale.set(1.4);
      name.position.set(sprite.x - 25, sprite.y - 50);
      app.stage.addChild(sprite);
      app.stage.addChild(name);
    });

    sprite.on("pointerout", () => {
      sprite.scale.set(1.0);
      app.stage.removeChild(name);
    });

    app.stage.addChild(sprite);
  }

  console.log("Reloading render with " + x);
}

await drawPlot(xSelect.value, ySelect.value);
document.getElementById("generate-btn").addEventListener("click", () => {
  drawPlot(xSelect.value, ySelect.value);
});
