import {
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  Scene,
} from "three";

const PlaneAreaMesh = ({
  camera,
  scene,
}: {
  camera: PerspectiveCamera;
  scene: Scene;
}) => {
  const visibleHeightAtZDepth = (depth: number) => {
    const cameraOffset = camera.position.z;
    if (depth < cameraOffset) depth -= cameraOffset;
    else depth += cameraOffset;

    const vFOV = (camera.fov * Math.PI) / 180;

    return 2 * Math.tan(vFOV / 2) * Math.abs(depth);
  };

  const visibleWidthAtZDepth = (depth: number) => {
    const height = visibleHeightAtZDepth(depth);
    return height * camera.aspect;
  };

  const geometry = new PlaneGeometry(
    visibleWidthAtZDepth(115),
    visibleHeightAtZDepth(115),
  );
  const material = new MeshBasicMaterial({
    color: 0xffff00,
    transparent: true,
  });
  let planeArea = new Mesh(geometry, material);
  planeArea.visible = false;
  scene.add(planeArea);
  return planeArea;
};

export default PlaneAreaMesh;
