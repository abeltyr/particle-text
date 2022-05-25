import {
  AdditiveBlending,
  BufferGeometry,
  Color,
  Float32BufferAttribute,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  Points,
  Raycaster,
  Scene,
  ShaderMaterial,
  ShapeBufferGeometry,
  ShapeGeometry,
  Texture,
  Vector2,
  Vector3,
} from "three";
import type { Font } from "three/examples/jsm/loaders/FontLoader";

let mouse = new Vector2(-5, 5);
let button = false;
let planeArea;
let particles;
let geometryCopy;
let colorChange;
let data;

const particleGenerator = ({
  scene,
  font,
  particleImg,
  camera,
}: {
  scene: Scene;
  font: Font;
  particleImg: Texture;
  camera: PerspectiveCamera;
}) => {
  document.addEventListener("mousedown", (event) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    const vector = new Vector3(mouse.x, mouse.y, 0.5);
    vector.unproject(camera);
    const dir = vector.sub(camera.position).normalize();
    const distance = -camera.position.z / dir.z;
    camera.position.clone().add(dir.multiplyScalar(distance));

    const pos = particles.geometry.attributes.position;
    button = true;
    data.ease = 0.01;
  });

  document.addEventListener("mousemove", (event) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  });

  document.addEventListener("mouseup", () => {
    button = false;
    data.ease = 0.05;
  });

  colorChange = new Color("#7cd6c8");

  data = {
    text: "FUTURE\nIS NOW",
    // text: "F U T U R E\nI S   N O W",
    amount: 1500,
    particleSize: 1,
    particleColor: 0xffffff,
    textSize: 20,
    area: 1500,
    ease: 0.05,
  };

  const createText = () => {
    let thePoints = [];

    /**
     *  using the imported font we generate the shape of the text
     *  once we have the shape we use ShapeGeometry to get the geometry of our 3d text.
     *  and the we run computeBoundingBox since bounding boxes aren't computed by default.
     *  They need to be explicitly computed, otherwise they are null.
     *
     *  this is used to get the xMid and yMid position to be latter used
     */
    let shapes = font.generateShapes(data.text, data.textSize);
    let geometry = new ShapeBufferGeometry(shapes);
    geometry.computeBoundingBox();
    const xMid =
      -0.5 * (geometry.boundingBox.max.x - geometry.boundingBox.min.x);
    const yMid =
      (geometry.boundingBox.max.y - geometry.boundingBox.min.y) / 2.85;

    //// removing this doesn't seem to cause any issues
    // geometry.center();

    //--------------------//--------------------//

    /**
     *   This is used to collect the holes that are generated from the shape
     *   and collect them in them in the holeShapes array
     *   and then add them back to shapes as path
     *  */

    let holeShapes = [];
    for (let q = 0; q < shapes.length; q++) {
      let shape = shapes[q];

      if (shape.holes && shape.holes.length > 0) {
        for (let j = 0; j < shape.holes.length; j++) {
          let hole = shape.holes[j];
          holeShapes.push(hole);
        }
      }
    }

    shapes.push.apply(shapes, holeShapes);

    //--------------------//--------------------//

    /**
     * Not completely sure here but i think what happening is
     * we go through all the vertex created in order to make the geometry
     * and map the position to the thePoints there sizes to sizes and color to the colors array
     * and then we generate a new geometry named geoParticles using the points from thePoints
     */
    let colors = [];
    let sizes = [];

    for (let x = 0; x < shapes.length; x++) {
      let shape = shapes[x];

      const amountPoints = shape.type == "Path" ? data.amount / 2 : data.amount;

      let points = shape.getSpacedPoints(amountPoints);

      points.forEach((element, z) => {
        const a = new Vector3(
          element.x,
          element.y,
          // element.x + Math.sin(z / 15),
          // element.y + Math.sin(z / 15),
          0,
        );
        thePoints.push(a);
        colors.push(colorChange.r, colorChange.g, colorChange.b);
        sizes.push(1);
      });
    }
    let geoParticles = new BufferGeometry().setFromPoints(thePoints);
    geoParticles.translate(xMid, yMid, 0);

    geoParticles.setAttribute(
      "customColor",
      new Float32BufferAttribute(colors, 3),
    );
    geoParticles.setAttribute("size", new Float32BufferAttribute(sizes, 1));

    //--------------------//--------------------//

    const material = new ShaderMaterial({
      uniforms: {
        color: { value: new Color(0xe9ee3a) },
        pointTexture: { value: particleImg },
      },
      vertexShader: `
        attribute float size;
        attribute vec3 customColor;
        varying vec3 vColor;
        void main() {
            vColor = customColor;
            vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
            gl_PointSize = size * ( 500.0 / -mvPosition.z );
            gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform vec3 color;
        uniform sampler2D pointTexture;
        
        varying vec3 vColor;
        
        void main() {
            gl_FragColor = vec4((vColor * color)/2.0 , 1.0 );
            gl_FragColor = gl_FragColor * vec4(vColor, 1.0) * texture2D( pointTexture, gl_PointCoord );
        
        }
      `,
      blending: AdditiveBlending,
      depthTest: false,
      transparent: true,
    });

    particles = new Points(geoParticles, material);
    scene.add(particles);

    geometryCopy = new BufferGeometry();
    geometryCopy.copy(particles.geometry);
  };

  const visibleHeightAtZDepth = (depth, camera) => {
    const cameraOffset = camera.position.z;
    if (depth < cameraOffset) depth -= cameraOffset;
    else depth += cameraOffset;

    const vFOV = (camera.fov * Math.PI) / 180;

    return 2 * Math.tan(vFOV / 2) * Math.abs(depth);
  };

  const visibleWidthAtZDepth = (depth, camera) => {
    const height = visibleHeightAtZDepth(depth, camera);
    return height * camera.aspect;
  };

  const geometry = new PlaneGeometry(
    visibleWidthAtZDepth(115, camera),
    visibleHeightAtZDepth(115, camera),
  );
  const material = new MeshBasicMaterial({
    color: 0xffff00,
    transparent: true,
  });
  planeArea = new Mesh(geometry, material);
  planeArea.visible = false;
  scene.add(planeArea);
  createText();
};

const distance = (x1, y1, x2, y2) => {
  return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
};

let raycaster = new Raycaster();
raycaster.layers.set(0);

const particleRender = ({
  camera,
  elapsedTime,
}: {
  camera: PerspectiveCamera;
  elapsedTime: number;
}) => {
  const time = ((0.001 * performance.now()) % 12) / 12;
  const zigzagTime = (1 + Math.sin(time * 2 * Math.PI)) / 6;
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObject(planeArea, false);
  // console.log(intersects);
  if (intersects.length > 0) {
    const pos = particles.geometry.attributes.position;
    const copy = geometryCopy.attributes.position;
    const colors = particles.geometry.attributes.customColor;
    const size = particles.geometry.attributes.size;
    const mx = intersects[0].point.x;
    const my = intersects[0].point.y;
    const mz = intersects[0].point.z;

    // console.log(intersects[0].point);
    // console.log(pos.getX(0), pos.getY(0), pos.getZ(0));
    // console.log("mouseDistance", distance(mx, my, pos.getX(0), pos.getY(0)));
    // console.log(
    //   "distance2",
    //   (mx - pos.getX(0)) * (mx - pos.getX(0)) +
    //     (my - pos.getY(0)) * (my - pos.getY(0)),
    // );
    // let g =
    //   -data.area /
    //   ((mx - pos.getX(0)) * (mx - pos.getX(0)) +
    //     (my - pos.getY(0)) * (my - pos.getY(0)));
    // console.log(
    //   "f",
    //   -data.area /
    //     ((mx - pos.getX(0)) * (mx - pos.getX(0)) +
    //       (my - pos.getY(0)) * (my - pos.getY(0))),
    // );
    // console.log("t", Math.atan2(mx - pos.getX(0), my - pos.getY(0)));
    // console.log("button", button);
    console.log(
      "x",
      (-data.area /
        ((mx - pos.getX(0)) * (mx - pos.getX(0)) +
          (my - pos.getY(0)) * (my - pos.getY(0)))) *
        Math.cos(Math.atan2(mx - pos.getX(0), my - pos.getY(0))),
    );
    console.log(
      "y",
      (-data.area /
        ((mx - pos.getX(0)) * (mx - pos.getX(0)) +
          (my - pos.getY(0)) * (my - pos.getY(0)))) *
        Math.sin(Math.atan2(mx - pos.getX(0), my - pos.getY(0))),
    );
    // // const t = Math.atan2(my - pos.getY(0), mx - pos.getX(0));
    // console.log(t, "T");
    for (var i = 0, l = pos.count; i < l; i++) {
      const initX = copy.getX(i);
      const initY = copy.getY(i);
      const initZ = copy.getZ(i);

      let px = pos.getX(i);
      let py = pos.getY(i);
      let pz = pos.getZ(i);

      let newColor = new Color(0x93ffb4);
      colorChange.setHSL(newColor.r, newColor.g, newColor.b);

      colors.setXYZ(i, colorChange.r, colorChange.g, colorChange.b);
      colors.needsUpdate = true;

      size.array[i] = data.particleSize;
      size.needsUpdate = true;

      let dx = mx - px;
      let dy = my - py;
      const dz = mz - pz;

      const mouseDistance = distance(mx, my, px, py);
      let d = (dx = mx - px) * dx + (dy = my - py) * dy;
      const f = -data.area / d;

      if (button) {
        const t = Math.atan2(dy, dx);
        px -= f * Math.cos(t);
        py -= f * Math.sin(t);
        colorChange.setHSL(0.5 + zigzagTime, 1.0, 0.5);
        colors.setXYZ(i, colorChange.r, colorChange.g, colorChange.b);
        colors.needsUpdate = true;
        if (
          px > initX + 70 ||
          px < initX - 70 ||
          py > initY + 70 ||
          py < initY - 70
        ) {
          colorChange.setHSL(0.15, 1.0, 0.5);
          colors.setXYZ(i, colorChange.r, colorChange.g, colorChange.b);
          colors.needsUpdate = true;
        }
      } else {
        if (mouseDistance < data.area) {
          if (i % 5 == 0) {
            const t = Math.atan2(dy, dx);
            px -= 0.075 * Math.cos(t);
            py -= 0.075 * Math.sin(t);
            colorChange.setHSL(0.15, 1.0, 0.5);
            colors.setXYZ(i, colorChange.r, colorChange.g, colorChange.b);
            colors.needsUpdate = true;
            size.array[i] = data.particleSize / 1.2;
            size.needsUpdate = true;
          } else {
            const t = Math.atan2(dy, dx);
            px += f * Math.cos(t);
            py += f * Math.sin(t);
            pos.needsUpdate = true;
            size.array[i] = data.particleSize * 1.3;
            size.needsUpdate = true;
          }
          if (
            px > initX + 10 ||
            px < initX - 10 ||
            py > initY + 10 ||
            py < initY - 10
          ) {
            colorChange.setHSL(0.15, 1.0, 0.5);
            colors.setXYZ(i, colorChange.r, colorChange.g, colorChange.b);
            colors.needsUpdate = true;
            size.array[i] = data.particleSize / 1.8;
            size.needsUpdate = true;
          }
        }
      }
      px += (initX - px) * data.ease;
      py += (initY - py) * data.ease;
      pz += (initZ - pz) * data.ease;
      pos.setXYZ(i, px, py, pz);
      pos.needsUpdate = true;
    }
  }
};

export { particleGenerator, particleRender };
