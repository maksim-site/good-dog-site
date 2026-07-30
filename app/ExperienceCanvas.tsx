"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

export type LinkKind = "classic" | "smoked" | "plant";
export type SauceKind = "ketchup" | "mustard";
export type CrunchKind = "none" | "onion" | "herb";

type ExperienceCanvasProps = {
  link: LinkKind;
  sauce: SauceKind;
  crunch: CrunchKind;
  paused: boolean;
  builderOpen: boolean;
  onReady: () => void;
};

type Tween = {
  start: number;
  duration: number;
  update: (progress: number) => void;
  complete?: () => void;
};

type ObjectSnapshot = {
  position: THREE.Vector3;
  scale: THREE.Vector3;
  rotation: THREE.Euler;
};

type SceneApi = {
  setLink: (value: LinkKind, immediate?: boolean) => void;
  setSauce: (value: SauceKind, immediate?: boolean) => void;
  setCrunch: (value: CrunchKind, immediate?: boolean) => void;
};

const LINK_OBJECTS: Record<LinkKind, string> = {
  classic: "Sausage_Classic",
  smoked: "Sausage_Smoked",
  plant: "Sausage_Plant",
};

const SAUCE_OBJECTS: Record<SauceKind, string> = {
  ketchup: "Sauce_Ketchup",
  mustard: "Sauce_Mustard",
};

const easeInOut = (value: number) =>
  value < 0.5
    ? 4 * value * value * value
    : 1 - Math.pow(-2 * value + 2, 3) / 2;

function meshMaterials(object: THREE.Object3D) {
  const materials: THREE.Material[] = [];
  object.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;
    const childMaterials = Array.isArray(child.material)
      ? child.material
      : [child.material];
    materials.push(...childMaterials);
  });
  return materials;
}

function setOpacity(object: THREE.Object3D, opacity: number) {
  meshMaterials(object).forEach((material) => {
    material.transparent = opacity < 0.999;
    material.opacity = opacity;
    material.depthWrite = opacity > 0.92;
    material.needsUpdate = true;
  });
}

function setSauceDraw(object: THREE.Object3D, progress: number) {
  object.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;
    const geometry = child.geometry as THREE.BufferGeometry;
    const maxCount =
      (geometry.userData.goodDogMaxCount as number | undefined) ??
      geometry.index?.count ??
      geometry.attributes.position.count;
    geometry.userData.goodDogMaxCount = maxCount;
    geometry.setDrawRange(0, Math.max(0, Math.floor(maxCount * progress)));
  });
}

function addSteam(scene: THREE.Scene) {
  const wisps: Array<{
    mesh: THREE.Mesh<THREE.TubeGeometry, THREE.MeshBasicMaterial>;
    phase: number;
    baseX: number;
  }> = [];

  [-1.5, 0.15, 1.55].forEach((x, index) => {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(x, 0.78, 0),
      new THREE.Vector3(x - 0.09, 1.08, 0),
      new THREE.Vector3(x + 0.08, 1.35, 0),
      new THREE.Vector3(x - 0.04, 1.66, 0),
    ]);
    const geometry = new THREE.TubeGeometry(curve, 24, 0.012, 5, false);
    const material = new THREE.MeshBasicMaterial({
      color: 0xffefcf,
      transparent: true,
      opacity: 0.08,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.renderOrder = 4;
    scene.add(mesh);
    wisps.push({ mesh, phase: index * 0.31, baseX: x });
  });

  return wisps;
}

export function ExperienceCanvas({
  link,
  sauce,
  crunch,
  paused,
  builderOpen,
  onReady,
}: ExperienceCanvasProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<SceneApi | null>(null);
  const pausedRef = useRef(paused);
  const builderOpenRef = useRef(builderOpen);
  const onReadyRef = useRef(onReady);
  const [status, setStatus] = useState<"loading" | "ready" | "failed">(
    "loading",
  );

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  useEffect(() => {
    builderOpenRef.current = builderOpen;
  }, [builderOpen]);

  useEffect(() => {
    onReadyRef.current = onReady;
  }, [onReady]);

  useEffect(() => {
    apiRef.current?.setLink(link);
  }, [link]);

  useEffect(() => {
    apiRef.current?.setSauce(sauce);
  }, [sauce]);

  useEffect(() => {
    apiRef.current?.setCrunch(crunch);
  }, [crunch]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let renderer: THREE.WebGLRenderer | null = null;
    let frame = 0;
    let disposed = false;
    const tweens: Tween[] = [];
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const isCompact = window.matchMedia("(max-width: 760px)").matches;

    try {
      renderer = new THREE.WebGLRenderer({
        antialias: !isCompact,
        alpha: true,
        powerPreference: "high-performance",
      });
    } catch {
      setStatus("failed");
      return;
    }

    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(
      Math.min(window.devicePixelRatio || 1, isCompact ? 1.25 : 1.75),
    );
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    renderer.localClippingEnabled = true;
    renderer.domElement.className = "experience-canvas";
    renderer.domElement.setAttribute("aria-hidden", "true");
    host.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(29, 1, 0.1, 100);
    camera.position.set(0, 0.75, 10.2);
    camera.lookAt(0, 0.1, 0);

    const ambient = new THREE.HemisphereLight(0xfff1d0, 0x5f1c15, 2.25);
    scene.add(ambient);
    const key = new THREE.DirectionalLight(0xffd6a1, 4.8);
    key.position.set(-4, 6, 7);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xff8b72, 2.1);
    fill.position.set(5, 1, 4);
    scene.add(fill);
    const rim = new THREE.PointLight(0xff4e35, 10, 20);
    rim.position.set(2, 3.5, -4);
    scene.add(rim);

    const modelPivot = new THREE.Group();
    scene.add(modelPivot);
    const steam = addSteam(scene);
    const loader = new GLTFLoader();
    let modelRoot: THREE.Object3D | null = null;
    let baseScale = 1;
    let activeLink: LinkKind = link;
    let activeSauce: SauceKind = sauce;
    let activeCrunch: CrunchKind = crunch;
    let currentYaw = 0;
    let targetYaw = 0;
    let pulseYaw = 0;
    let dragging = false;
    let pointerStart = 0;
    let yawStart = 0;

    const linkObjects = {} as Record<LinkKind, THREE.Object3D>;
    const sauceObjects = {} as Record<SauceKind, THREE.Object3D>;
    const toppingObjects: Record<Exclude<CrunchKind, "none">, THREE.Object3D[]> =
      {
        onion: [],
        herb: [],
      };
    const toppingSnapshots = new Map<THREE.Object3D, ObjectSnapshot>();

    const tween = (
      duration: number,
      update: (progress: number) => void,
      complete?: () => void,
    ) => {
      if (reducedMotion || duration === 0) {
        update(1);
        complete?.();
        return;
      }
      tweens.push({
        start: performance.now(),
        duration,
        update,
        complete,
      });
    };

    const api: SceneApi = {
      setLink(value, immediate = false) {
        if (!modelRoot || !linkObjects[value]) return;
        const previous = linkObjects[activeLink];
        const next = linkObjects[value];
        activeLink = value;
        if (previous === next) {
          next.visible = true;
          setOpacity(next, 1);
          return;
        }
        next.visible = true;
        setOpacity(next, immediate ? 1 : 0);
        pulseYaw = value === "smoked" ? -0.18 : value === "plant" ? 0.18 : 0.1;
        tween(
          immediate ? 0 : 560,
          (raw) => {
            const progress = easeInOut(raw);
            setOpacity(previous, 1 - progress);
            setOpacity(next, progress);
            next.scale.set(1, 0.88 + progress * 0.12, 1);
          },
          () => {
            previous.visible = false;
            setOpacity(previous, 1);
            next.scale.setScalar(1);
          },
        );
      },
      setSauce(value, immediate = false) {
        if (!modelRoot || !sauceObjects[value]) return;
        const previous = sauceObjects[activeSauce];
        const next = sauceObjects[value];
        activeSauce = value;
        previous.visible = false;
        next.visible = true;
        setSauceDraw(next, immediate ? 1 : 0);
        tween(immediate ? 0 : 760, (raw) => {
          setSauceDraw(next, easeInOut(raw));
        });
      },
      setCrunch(value, immediate = false) {
        if (!modelRoot) return;
        (["onion", "herb"] as const).forEach((kind) => {
          toppingObjects[kind].forEach((piece) => {
            piece.visible = false;
            const snapshot = toppingSnapshots.get(piece);
            if (!snapshot) return;
            piece.position.copy(snapshot.position);
            piece.scale.copy(snapshot.scale);
            piece.rotation.copy(snapshot.rotation);
          });
        });
        activeCrunch = value;
        if (value === "none") return;
        toppingObjects[value].forEach((piece, index) => {
          const snapshot = toppingSnapshots.get(piece);
          if (!snapshot) return;
          piece.visible = true;
          if (immediate) {
            piece.position.copy(snapshot.position);
            piece.scale.copy(snapshot.scale);
            return;
          }
          const fall = 0.68 + (index % 4) * 0.09;
          piece.position.copy(snapshot.position);
          piece.position.y += fall;
          piece.scale.copy(snapshot.scale).multiplyScalar(0.08);
          tween(430 + (index % 5) * 58, (raw) => {
            const progress = easeInOut(Math.max(0, raw - index * 0.012));
            piece.position.y = snapshot.position.y + fall * (1 - progress);
            piece.scale
              .copy(snapshot.scale)
              .multiplyScalar(0.08 + progress * 0.92);
            piece.rotation.z =
              snapshot.rotation.z + (1 - progress) * (index % 2 ? 1.1 : -1.1);
          });
        });
      },
    };
    apiRef.current = api;

    loader.load(
      "/models/good-dog.glb",
      (gltf) => {
        if (disposed) return;
        modelRoot = gltf.scene;
        modelRoot.traverse((child) => {
          if (!(child instanceof THREE.Mesh)) return;
          child.frustumCulled = false;
          if (Array.isArray(child.material)) {
            child.material = child.material.map((material) => material.clone());
          } else {
            child.material = child.material.clone();
          }
        });

        (Object.keys(LINK_OBJECTS) as LinkKind[]).forEach((kind) => {
          const object = modelRoot?.getObjectByName(LINK_OBJECTS[kind]);
          if (object) linkObjects[kind] = object;
        });
        (Object.keys(SAUCE_OBJECTS) as SauceKind[]).forEach((kind) => {
          const object = modelRoot?.getObjectByName(SAUCE_OBJECTS[kind]);
          if (object) sauceObjects[kind] = object;
        });

        modelRoot.traverse((child) => {
          if (child.name.startsWith("Topping_Onion_")) {
            toppingObjects.onion.push(child);
          }
          if (child.name.startsWith("Topping_Herb_")) {
            toppingObjects.herb.push(child);
          }
        });

        [...toppingObjects.onion, ...toppingObjects.herb].forEach((piece) => {
          toppingSnapshots.set(piece, {
            position: piece.position.clone(),
            scale: piece.scale.clone(),
            rotation: piece.rotation.clone(),
          });
          piece.visible = false;
        });

        const box = new THREE.Box3().setFromObject(modelRoot);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        modelRoot.position.sub(center);
        baseScale = 8.35 / Math.max(size.x, 0.01);
        modelPivot.scale.setScalar(baseScale);
        modelPivot.add(modelRoot);

        (Object.keys(linkObjects) as LinkKind[]).forEach((kind) => {
          linkObjects[kind].visible = kind === link;
          setOpacity(linkObjects[kind], 1);
        });
        (Object.keys(sauceObjects) as SauceKind[]).forEach((kind) => {
          sauceObjects[kind].visible = kind === sauce;
          setSauceDraw(sauceObjects[kind], 1);
        });
        activeLink = link;
        activeSauce = sauce;
        activeCrunch = "none";
        api.setCrunch(crunch, true);

        setStatus("ready");
        onReadyRef.current();
      },
      undefined,
      () => {
        if (!disposed) setStatus("failed");
      },
    );

    const resize = () => {
      if (!renderer) return;
      const width = Math.max(1, host.clientWidth);
      const height = Math.max(1, host.clientHeight);
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      const compactScale = width < 700 ? 0.69 : 1;
      modelPivot.scale.setScalar(baseScale * compactScale);
    };
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(host);
    resize();

    const onPointerDown = (event: PointerEvent) => {
      dragging = true;
      pointerStart = event.clientX;
      yawStart = targetYaw;
      renderer?.domElement.setPointerCapture(event.pointerId);
      host.classList.add("is-dragging");
    };
    const onPointerMove = (event: PointerEvent) => {
      if (!dragging) return;
      const delta = (event.clientX - pointerStart) / Math.max(host.clientWidth, 1);
      targetYaw = THREE.MathUtils.clamp(yawStart + delta * 2.6, -0.72, 0.72);
    };
    const endPointer = (event: PointerEvent) => {
      dragging = false;
      renderer?.domElement.releasePointerCapture?.(event.pointerId);
      host.classList.remove("is-dragging");
    };

    renderer.domElement.addEventListener("pointerdown", onPointerDown);
    renderer.domElement.addEventListener("pointermove", onPointerMove);
    renderer.domElement.addEventListener("pointerup", endPointer);
    renderer.domElement.addEventListener("pointercancel", endPointer);

    const clock = new THREE.Clock();
    const render = (now: number) => {
      if (disposed || !renderer) return;
      const elapsed = clock.getElapsedTime();

      for (let index = tweens.length - 1; index >= 0; index -= 1) {
        const item = tweens[index];
        const progress = Math.min(1, (now - item.start) / item.duration);
        item.update(progress);
        if (progress >= 1) {
          item.complete?.();
          tweens.splice(index, 1);
        }
      }

      const pauseMotion = pausedRef.current || reducedMotion;
      currentYaw += (targetYaw + pulseYaw - currentYaw) * 0.075;
      pulseYaw *= 0.92;
      modelPivot.rotation.y = currentYaw;
      modelPivot.position.y = pauseMotion
        ? 0
        : Math.sin(elapsed * 1.12) * 0.045;
      modelPivot.position.x +=
        ((builderOpenRef.current ? 0.72 : 0) - modelPivot.position.x) * 0.06;

      steam.forEach((wisp, index) => {
        const cycle = pauseMotion ? 0.35 : (elapsed * 0.13 + wisp.phase) % 1;
        wisp.mesh.position.x =
          Math.sin(elapsed * 0.42 + index) * 0.04 + wisp.baseX * 0.01;
        wisp.mesh.position.y = cycle * 0.32;
        wisp.mesh.material.opacity =
          Math.sin(Math.PI * cycle) * (isCompact ? 0.055 : 0.085);
      });

      renderer.render(scene, camera);
      frame = requestAnimationFrame(render);
    };
    frame = requestAnimationFrame(render);

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      renderer?.domElement.removeEventListener("pointerdown", onPointerDown);
      renderer?.domElement.removeEventListener("pointermove", onPointerMove);
      renderer?.domElement.removeEventListener("pointerup", endPointer);
      renderer?.domElement.removeEventListener("pointercancel", endPointer);
      scene.traverse((object) => {
        if (!(object instanceof THREE.Mesh)) return;
        object.geometry.dispose();
        const materials = Array.isArray(object.material)
          ? object.material
          : [object.material];
        materials.forEach((material) => material.dispose());
      });
      renderer?.dispose();
      renderer?.domElement.remove();
      apiRef.current = null;
    };
  }, []);

  return (
    <div
      ref={hostRef}
      className={`canvas-host is-${status}`}
      role="img"
      aria-label="Interactive 3D hot dog. Drag horizontally to rotate it."
    >
      <span className="model-status" aria-live="polite">
        {status === "loading"
          ? "Heating up the dog"
          : status === "failed"
            ? "3D preview unavailable — showing the poster"
            : "3D hot dog ready"}
      </span>
    </div>
  );
}
