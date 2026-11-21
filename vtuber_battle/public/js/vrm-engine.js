import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { VRMLoaderPlugin, VRMUtils } from '@pixiv/three-vrm';
import { createVRMAnimationClip, VRMAnimationLoaderPlugin, VRMLookAtQuaternionProxy } from '@pixiv/three-vrm-animation';

const canvas = document.getElementById('vrm-canvas');

// Resolusi tetap 1080x960 untuk setengah atas vertikal OBS
const WIDTH = 1080;
const HEIGHT = 960;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(28.0, WIDTH / HEIGHT, 0.1, 20.0);
camera.position.set(0.0, 1.25, 1.85);
camera.lookAt(0.0, 1.18, 0.0);

const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
    powerPreference: 'high-performance'
});
renderer.setSize(WIDTH, HEIGHT, false);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.88;

// Pencahayaan Lembut Studio Anime (Anti Silau)
const keyLight = new THREE.DirectionalLight(0xfff7fa, 1.1);
keyLight.position.set(0.6, 1.6, 1.8).normalize();
scene.add(keyLight);

const fillLight = new THREE.DirectionalLight(0xeef2ff, 0.4);
fillLight.position.set(-1.0, 1.0, 1.2).normalize();
scene.add(fillLight);

const rimLight = new THREE.DirectionalLight(0xf9a8d4, 0.45);
rimLight.position.set(0.0, 1.5, -1.6).normalize();
scene.add(rimLight);

const ambientLight = new THREE.AmbientLight(0xfff1f5, 0.4);
scene.add(ambientLight);

let currentVrm = null;
let currentMixer = null;
let idleAction = null;
let activeMotionAction = null;
const animationClips = new Map();

const loader = new GLTFLoader();
loader.crossOrigin = 'anonymous';
loader.register((parser) => new VRMLoaderPlugin(parser));
loader.register((parser) => new VRMAnimationLoaderPlugin(parser));

const ANIMATION_FILES = {
    idle_loop: '/animations/idle_loop.vrma',
    Clapping: '/animations/Clapping.vrma',
    Jump: '/animations/Jump.vrma',
    Blush: '/animations/Blush.vrma',
    Goodbye: '/animations/Goodbye.vrma',
    Thinking: '/animations/Thinking.vrma'
};

function centerAnimationClip(clip) {
    if (!clip || !clip.tracks) return clip;
    for (const track of clip.tracks) {
        if (!track.name.endsWith('.position')) continue;
        const vals = track.values;
        const count = Math.floor(vals.length / 3);
        if (count === 0) continue;

        let sumX = 0;
        let sumZ = 0;
        for (let i = 0; i < count; i++) {
            sumX += vals[i * 3];
            sumZ += vals[i * 3 + 2];
        }
        const meanX = sumX / count;
        const meanZ = sumZ / count;
        for (let i = 0; i < count; i++) {
            vals[i * 3] -= meanX;
            vals[i * 3 + 2] -= meanZ;
        }
    }
    return clip;
}

async function preloadAnimations(vrm) {
    for (const [name, url] of Object.entries(ANIMATION_FILES)) {
        try {
            const gltfAnim = await loader.loadAsync(url);
            const vrmAnimation = gltfAnim.userData.vrmAnimations?.[0];
            if (vrmAnimation) {
                const clip = createVRMAnimationClip(vrmAnimation, vrm);
                centerAnimationClip(clip);
                clip.name = name;
                animationClips.set(name, clip);
            }
        } catch (e) {
            console.warn(`[VRM] Animasi ${name} gagal dimuat:`, e.message);
        }
    }
}

function playIdleAnimation() {
    const idleClip = animationClips.get('idle_loop');
    if (idleClip && currentMixer) {
        idleAction = currentMixer.clipAction(idleClip);
        idleAction.setLoop(THREE.LoopRepeat, Infinity);
        idleAction.fadeIn(0.4).play();
    }
}

function frameCameraToAvatar(vrm) {
    if (!vrm?.humanoid) return;
    const headNode = vrm.humanoid.getNormalizedBoneNode('head');
    if (!headNode) return;

    const headPos = new THREE.Vector3();
    headNode.getWorldPosition(headPos);

    // Framing ideal untuk kotak 1080x960: fokus dada ke atas & kepala pas di tengah
    camera.position.set(0.0, headPos.y - 0.06, 1.8);
    camera.lookAt(0.0, headPos.y - 0.10, 0.0);
}

window.playVrmMotion = function (motionName, durationMs = 4000) {
    if (!currentMixer) return;
    const clip = animationClips.get(motionName);
    if (!clip) return;

    if (activeMotionAction) {
        activeMotionAction.fadeOut(0.2);
    }

    const action = currentMixer.clipAction(clip);
    action.reset();
    action.setLoop(THREE.LoopOnce, 1);
    action.clampWhenFinished = true;
    action.fadeIn(0.2).play();
    activeMotionAction = action;

    setTimeout(() => {
        if (action === activeMotionAction) {
            action.fadeOut(0.4);
            activeMotionAction = null;
        }
    }, durationMs);
};

window.setVrmMouthOpen = function (openRatio) {
    if (!currentVrm || !currentVrm.expressionManager) return;
    const val = Math.min(1.0, Math.max(0.0, openRatio));
    currentVrm.expressionManager.setValue('aa', val);
    currentVrm.expressionManager.setValue('ih', val * 0.4);
};

window.setVrmExpression = function (exprName) {
    if (!currentVrm || !currentVrm.expressionManager) return;
    try {
        currentVrm.expressionManager.setValue('happy', exprName === 'happy' ? 0.9 : 0);
        currentVrm.expressionManager.setValue('surprised', exprName === 'surprised' ? 0.8 : 0);
    } catch { }
};

async function loadMikaModel() {
    console.log('[VRM] Memuat Model 3D Mika...');
    const loadingEl = document.getElementById('vrm-loading');
    const loadingText = document.getElementById('vrm-loading-text');

    loader.load(
        '/models/sasha.vrm',
        async (gltf) => {
            try {
                const vrm = gltf.userData.vrm;
                VRMUtils.removeUnnecessaryVertices(gltf.scene);
                VRMUtils.removeUnnecessaryJoints(gltf.scene);

                if (vrm.meta && vrm.meta.metaVersion === '0') {
                    VRMUtils.rotateVRM0(vrm);
                }

                vrm.scene.position.set(0, 0, 0);
                scene.add(vrm.scene);
                currentVrm = vrm;
                window.vrmInstance = vrm;

                if (vrm.lookAt) {
                    const proxy = new VRMLookAtQuaternionProxy(vrm.lookAt);
                    proxy.name = 'VRMLookAtQuaternionProxy';
                    vrm.scene.add(proxy);
                    vrm.lookAt.target = camera;
                }

                currentMixer = new THREE.AnimationMixer(vrm.scene);
                try {
                    await preloadAnimations(vrm);
                } catch (animErr) {
                    console.warn('[VRM] Warning preload animations:', animErr);
                }

                currentMixer.update(0.016);
                vrm.update(0.016);
                vrm.scene.updateMatrixWorld(true);

                frameCameraToAvatar(vrm);
                playIdleAnimation();
                console.log('[VRM] Mika 3D siap!');

                if (loadingEl) {
                    loadingEl.style.opacity = '0';
                    setTimeout(() => loadingEl.remove(), 400);
                }
            } catch (setupErr) {
                console.error('[VRM] Error setting up Mika:', setupErr);
                if (loadingText) {
                    loadingText.textContent = 'Error setup 3D. Refresh (Ctrl+F5)';
                }
            }
        },
        (progress) => {
            if (progress.total && loadingText) {
                const pct = Math.round((progress.loaded / progress.total) * 100);
                loadingText.textContent = `Memuat Mika 3D... ${pct}%`;
            }
        },
        (err) => {
            console.error('[VRM] Gagal mengunduh Mika:', err);
            if (loadingText) {
                loadingText.textContent = 'Gagal unduh 3D. Refresh (Ctrl+F5)';
            }
        }
    );
}

loadMikaModel();

// Loop Render
const clock = new THREE.Clock();
function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();

    if (currentMixer) currentMixer.update(delta);
    if (currentVrm) currentVrm.update(delta);

    renderer.render(scene, camera);
}
animate();
