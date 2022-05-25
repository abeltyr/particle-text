import {
  AdditiveBlending,
  BufferGeometry,
  Color,
  Float32BufferAttribute,
  Points,
  Scene,
  ShaderMaterial,
  ShapeBufferGeometry,
  Texture,
  Vector3,
} from "three";
import type { Font } from "three/examples/jsm/loaders/FontLoader";
import fragmentShader from "../shader/fragmentShader";
import vertexShader from "../shader/vertexShader";

const particleText = ({
  font,
  scene,
  particle,
}: {
  particle: Texture;
  font: Font;
  scene: Scene;
}) => {
  let thePoints: any = [];
  let colorChange: THREE.Color = new Color("#02d6c8");
  let data: any = {
    // text: "Say Hello To\n  The World",
    text: "Hello I Am\n Abel Lamesgen",
    // text: "F U T U R E\nI S   N O W",
    amount: 2500,
    particleSize: 1,
    particleColor: 0xffffff,
    textSize: 12,
    area: 1500,
    ease: 0.05,
  };
  /**
   *  using the imported font we generate the shape of the text
   *  once we have the shape we use ShapeGeometry to get the geometry of our 3d text.
   *  and the we run computeBoundingBox since bounding boxes aren't computed by default.
   *  They need to be explicitly computed, otherwise they are null.
   *
   *  this is used to get the xMid and yMid position to be latter used
   */
  let shapes = font.generateShapes(data.text, data.textSize);
  let geometry: any = new ShapeBufferGeometry(shapes);
  geometry.computeBoundingBox();
  const xMid = -0.5 * (geometry.boundingBox.max.x - geometry.boundingBox.min.x);
  const yMid = (geometry.boundingBox.max.y - geometry.boundingBox.min.y) / 2.85;

  //// removing this doesn't seem to cause any issues
  geometry.center();

  //--------------------//--------------------//

  /**
   *   This is used to collect the holes that are generated from the shape
   *   and collect them in them in the holeShapes array
   *   and then add them back to shapes as path
   *  */

  let holeShapes: any = [];
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
  let colors: any = [];
  let sizes: any = [];
  let show: any = [];

  for (let x = 0; x < shapes.length; x++) {
    let shape = shapes[x];

    const amountPoints = shape.type == "Path" ? data.amount / 2 : data.amount;

    let points = shape.getSpacedPoints(amountPoints);

    points.forEach((element, z) => {
      const a = new Vector3(
        element.x,
        element.y,
        // element.x + Math.sin(z / 100),
        // element.y + Math.sin(z / 100),
        0,
      );
      thePoints.push(a);
      colors.push(colorChange.r, colorChange.g, colorChange.b);
      sizes.push(1);
      show.push(z % 5 === 0 ? 1 : 0);
    });
  }
  let geoParticles = new BufferGeometry().setFromPoints(thePoints);
  geoParticles.translate(xMid, yMid, 0);

  geoParticles.setAttribute(
    "customColor",
    new Float32BufferAttribute(colors, 3),
  );
  geoParticles.setAttribute("size", new Float32BufferAttribute(sizes, 1));
  geoParticles.setAttribute("show", new Float32BufferAttribute(show, 1));

  //--------------------//--------------------//

  const material = new ShaderMaterial({
    uniforms: {
      color: { value: new Color(0xe0d6fd) },
      pointTexture: { value: particle },
      raycasterDistance: { value: new Vector3(1) },
      area: { value: data.area },
      clicked: { value: false },
      particleSize: { value: data.size },
      ease: { value: 0.05 },
      elapsedTime: { value: 0 },
      randomize: { value: true },
      factor: { value: 1 },
      done: { value: false },
    },
    vertexShader: vertexShader(),
    fragmentShader: fragmentShader(),
    blending: AdditiveBlending,
    depthTest: false,
    transparent: true,
  });

  let particles = new Points(geoParticles, material);
  scene.add(particles);
  return particles;
};

export default particleText;
