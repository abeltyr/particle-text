import * as THREE from "three";
import { Color } from "three";
import { FontLoader } from "three/examples/jsm/loaders/FontLoader.js";
import PlaneAreaMesh from "./mesh/plane";
import particleText from "./mesh/textpartcle";
import { particleGenerator, particleRender } from "./particles";

//--------------Load the needed resources-----------------//
let manager = new THREE.LoadingManager();
let particleMesh: any;
let planeArea: any;
let mouse = new THREE.Vector2(-5, 5);
manager.onLoad = function () {
  planeArea = PlaneAreaMesh({ scene, camera });
  particleMesh = particleText({
    font,
    particle,
    scene,
  });
};

let font = null;
const fontLoader = new FontLoader(manager);

fontLoader.load("./assets/font/data.json", function (loadedFont) {
  font = loadedFont;
});

const particle = new THREE.TextureLoader(manager).load(
  "./assets/images/particle.png",
);

//--------------Loaded the needed resources-----------------//

// setup the Scene
const scene = new THREE.Scene();
scene.background = new THREE.Color("#161F3A");
let newda = new Color("#3C998A");
console.log(newda.r, newda.g, newda.b);
//setup camera
const camera = new THREE.PerspectiveCamera(
  90,
  window.innerWidth / window.innerHeight,
  0.1,
  1000,
);

let renderer;
camera.position.z = 115;

/**
 * setup the resize
 */
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

const resize = () => {
  // Update sizes
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;

  // Update camera
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  // Update renderer
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
};

const clock = new THREE.Clock();
let raycaster = new THREE.Raycaster();

const animate = () => {
  renderer.render(scene, camera); // render the scene using the camera

  const elapsedTime = clock.getElapsedTime();
  raycaster.setFromCamera(mouse, camera);
  if (planeArea && particleMesh) {
    const intersects = raycaster.intersectObject(planeArea, false);
    if (intersects.length > 0) {
      particleMesh.material.uniforms.raycasterDistance.value =
        new THREE.Vector3(
          intersects[0].point.x,
          intersects[0].point.y,
          intersects[0].point.z,
        );
      particleMesh.material.uniforms.elapsedTime.value = elapsedTime + 50;
      if (
        !particleMesh.material.uniforms.randomize.value &&
        particleMesh.material.uniforms.factor.value < 150
      ) {
        particleMesh.material.uniforms.factor.value =
          particleMesh.material.uniforms.factor.value + 5;
      } else if (
        !particleMesh.material.uniforms.randomize.value &&
        particleMesh.material.uniforms.factor.value >= 150 &&
        particleMesh.material.uniforms.factor.value < 2000
      ) {
        particleMesh.material.uniforms.factor.value =
          particleMesh.material.uniforms.factor.value + 10;
      }
      if (particleMesh.material.uniforms.factor.value >= 2000) {
        particleMesh.material.uniforms.done.value = true;
      }
    }
  }
  requestAnimationFrame(animate); //loop the render function
};

export const createScene = (el) => {
  renderer = new THREE.WebGLRenderer({ antialias: true, canvas: el });
  resize();
  animate();
  setTimeout(() => {
    if (particleMesh) {
      particleMesh.material.uniforms.randomize.value = false;
    }
  }, 5000);
};

window.addEventListener("resize", resize);

document.addEventListener("mousedown", (event) => {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  const vector = new THREE.Vector3(mouse.x, mouse.y, 0.5);
  vector.unproject(camera);
  const dir = vector.sub(camera.position).normalize();
  const distance = -camera.position.z / dir.z;
  camera.position.clone().add(dir.multiplyScalar(distance));
  if (particleMesh) {
    particleMesh.material.uniforms.ease.value = 0.01;
  }
});

document.addEventListener("mousemove", (event) => {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
});

document.addEventListener("mouseup", () => {
  if (particleMesh) {
    particleMesh.material.uniforms.randomize.value = false;
    particleMesh.material.uniforms.ease.value = 0.05;
  }
});

document.addEventListener("touchstart", touchHandler, true);
document.addEventListener("touchmove", touchHandler, true);
document.addEventListener("touchend", touchHandler, true);
document.addEventListener("touchcancel", touchHandler, true);

function touchHandler(event) {
  var touches = event.changedTouches,
    first = touches[0],
    type = "";
  switch (event.type) {
    case "touchstart":
      type = "mousedown";
      break;
    case "touchmove":
      type = "mousemove";
      break;
    case "touchend":
      type = "mouseup";
      break;
    default:
      return;
  }

  // initMouseEvent(type, canBubble, cancelable, view, clickCount,
  //                screenX, screenY, clientX, clientY, ctrlKey,
  //                altKey, shiftKey, metaKey, button, relatedTarget);

  var simulatedEvent = document.createEvent("MouseEvent");
  simulatedEvent.initMouseEvent(
    type,
    true,
    true,
    window,
    1,
    first.screenX,
    first.screenY,
    first.clientX,
    first.clientY,
    false,
    false,
    false,
    false,
    0 /*left*/,
    null,
  );

  first.target.dispatchEvent(simulatedEvent);
  event.preventDefault();
}
