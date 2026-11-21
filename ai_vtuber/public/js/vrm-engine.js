import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { VRMLoaderPlugin, VRMUtils } from '@pixiv/three-vrm';
import { createVRMAnimationClip, VRMAnimationLoaderPlugin, VRMLookAtQuaternionProxy } from '@pixiv/three-vrm-animation';

window.vrmInstance = null;

const canvas = document.getElementById('vrm-canvas');
const loadingEl = document.getElementById('live2d-loading');
const urlParams = new URLSearchParams(window.location.search);

const MODEL_FILES = {
    sasha: '/models/sasha.vrm',
    sasha_casual: '/models/sasha_casual.vrm',
    sasha_blonde: '/models/victoria.vrm',
    victoria: '/models/victoria.vrm',
    alicia: '/models/alicia.vrm',
    nita: '/models/sasha.vrm',
    nita_blonde: '/models/sasha.vrm'
};
const requestedModel = urlParams.get('model');
let currentModelKey = MODEL_FILES[requestedModel] ? requestedModel : 'sasha';
let currentVrm = null;
let mixer = null;
let idleAction = null;
let activeAction = null;
let glassesGroup = null;
let glassesVisible = urlParams.get('glasses') === '1';

// Cache animation clips (.vrma)
const animationClips = {};
const MOTION_FILES = {
    Idle: '/animations/idle_loop.vrma',
    Relax: '/animations/Relax.vrma',
    Clapping: '/animations/Clapping.vrma',
    Blush: '/animations/Blush.vrma',
    Goodbye: '/animations/Goodbye.vrma',
    Jump: '/animations/Jump.vrma',
    LookAround: '/animations/LookAround.vrma',
    Thinking: '/animations/Thinking.vrma',
    Surprised: '/animations/Surprised.vrma'
};

// 1. Setup Three.js WebGL Renderer (Soft Anime Studio Tone Mapping)
const width = 1080;
const height = 1920;

const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
    powerPreference: 'high-performance'
});
renderer.setSize(width, height, false);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.85;

// 2. Scene & Cute Bust-to-Waist Streamer Framing (Anti-Potong)
const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(28.0, width / height, 0.1, 20.0);
camera.position.set(0.0, 1.25, 2.35);
camera.lookAt(0.0, 1.18, 0.0);

// 3. Soft Pastel Anime Lighting (Anti-Silau / MToon-Friendly)
const keyLight = new THREE.DirectionalLight(0xfff7fa, 1.05);
keyLight.position.set(0.6, 1.6, 1.8).normalize();
scene.add(keyLight);

const fillLight = new THREE.DirectionalLight(0xeef2ff, 0.35);
fillLight.position.set(-1.0, 1.0, 1.2).normalize();
scene.add(fillLight);

// Soft pink rim light dari belakang agar rambut & siluet glowing manis
const rimLight = new THREE.DirectionalLight(0xf9a8d4, 0.45);
rimLight.position.set(0.0, 1.5, -1.6).normalize();
scene.add(rimLight);

const ambientLight = new THREE.AmbientLight(0xfff1f5, 0.35);
scene.add(ambientLight);

// 4. Sleek Thin Anime Glasses (Rose-Gold / Dark Plum Oval Frame)
function createAnimeGlasses() {
    const group = new THREE.Group();
    group.name = 'AnimeGlasses';

    // Bingkai tipis metalik rose-espresso yang halus (tidak kaku tebal hitam)
    const frameMat = new THREE.MeshStandardMaterial({
        color: 0x3b2338,
        roughness: 0.25,
        metalness: 0.8
    });

    // Kaca super jernih dengan tint biru langit lembut
    const lensMat = new THREE.MeshPhysicalMaterial({
        color: 0xe0f2fe,
        transparent: true,
        opacity: 0.14,
        roughness: 0.05,
        metalness: 0.0,
        side: THREE.DoubleSide
    });

    const eyeSpacing = 0.039;
    const rimRadius = 0.0285;
    const tubeRadius = 0.0014; // Bingkai tipis estetik

    // Lensa kiri (sedikit oval ke samping biar style anime modern)
    const leftRim = new THREE.Mesh(new THREE.TorusGeometry(rimRadius, tubeRadius, 12, 40), frameMat);
    leftRim.scale.set(1.12, 0.92, 1.0);
    leftRim.position.set(-eyeSpacing, 0, 0);
    group.add(leftRim);

    const leftLens = new THREE.Mesh(new THREE.CircleGeometry(rimRadius * 0.95, 32), lensMat);
    leftLens.scale.set(1.12, 0.92, 1.0);
    leftLens.position.set(-eyeSpacing, 0, 0.0008);
    group.add(leftLens);

    // Lensa kanan
    const rightRim = new THREE.Mesh(new THREE.TorusGeometry(rimRadius, tubeRadius, 12, 40), frameMat);
    rightRim.scale.set(1.12, 0.92, 1.0);
    rightRim.position.set(eyeSpacing, 0, 0);
    group.add(rightRim);

    const rightLens = new THREE.Mesh(new THREE.CircleGeometry(rimRadius * 0.95, 32), lensMat);
    rightLens.scale.set(1.12, 0.92, 1.0);
    rightLens.position.set(eyeSpacing, 0, 0.0008);
    group.add(rightLens);

    // Bridge tipis
    const bridge = new THREE.Mesh(new THREE.CylinderGeometry(0.0012, 0.0012, 0.016, 10), frameMat);
    bridge.rotation.z = Math.PI / 2;
    bridge.position.set(0, 0.003, 0);
    group.add(bridge);

    // Gagang kiri & kanan
    const templeLen = 0.105;
    const templeGeo = new THREE.CylinderGeometry(0.0011, 0.0011, templeLen, 10);
    const leftTemple = new THREE.Mesh(templeGeo, frameMat);
    leftTemple.rotation.x = Math.PI / 2;
    leftTemple.position.set(-eyeSpacing - (rimRadius * 1.1), 0.002, -templeLen / 2);
    group.add(leftTemple);

    const rightTemple = new THREE.Mesh(templeGeo, frameMat);
    rightTemple.rotation.x = Math.PI / 2;
    rightTemple.position.set(eyeSpacing + (rimRadius * 1.1), 0.002, -templeLen / 2);
    group.add(rightTemple);

    return group;
}

// 5. Loader setup (VRM + VRMA Official Animation Plugin)
const loader = new GLTFLoader();
loader.crossOrigin = 'anonymous';
loader.register((parser) => new VRMLoaderPlugin(parser));
loader.register((parser) => new VRMAnimationLoaderPlugin(parser));

// Pastikan .vrma mocap selalu terpusat di tengah layar (hapus offset X/Z pada track posisi hips)
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

function recolorHairTextureToBlonde(tex, cacheMap) {
    if (!tex || !tex.image) return tex;
    if (cacheMap.has(tex.uuid)) return cacheMap.get(tex.uuid);

    const img = tex.image;
    const w = img.width || img.naturalWidth || 0;
    const h = img.height || img.naturalHeight || 0;
    if (!w || !h) return tex;

    const canvasEl = document.createElement('canvas');
    canvasEl.width = w;
    canvasEl.height = h;
    const ctx = canvasEl.getContext('2d');
    if (!ctx) return tex;

    ctx.drawImage(img, 0, 0, w, h);
    const imgData = ctx.getImageData(0, 0, w, h);
    const data = imgData.data;

    for (let i = 0; i < data.length; i += 4) {
        const a = data[i + 3];
        if (a < 10) continue;

        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        // Pertahankan warna jepit rambut coral-orange dan highlight cyan
        if (r > b + 40 && r > 145) continue;
        if (g > r + 35 && b > r + 35 && b > 135) continue;

        const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        const t = Math.min(1.0, Math.pow(lum, 0.62) * 1.18);

        data[i] = Math.round(196 + (254 - 196) * t);
        data[i + 1] = Math.round(152 + (241 - 152) * t);
        data[i + 2] = Math.round(98 + (208 - 98) * t);
    }

    ctx.putImageData(imgData, 0, 0);

    const newTex = new THREE.CanvasTexture(canvasEl);
    newTex.flipY = tex.flipY;
    newTex.wrapS = tex.wrapS;
    newTex.wrapT = tex.wrapT;
    newTex.colorSpace = tex.colorSpace;
    newTex.minFilter = tex.minFilter;
    newTex.magFilter = tex.magFilter;
    newTex.needsUpdate = true;

    cacheMap.set(tex.uuid, newTex);
    return newTex;
}

function applyBlondeHairRecolor(vrm) {
    if (!vrm?.scene) return;
    const texCache = new Map();
    const seenMats = new Set();

    vrm.scene.traverse((obj) => {
        if (!obj.isMesh || !obj.material) return;
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
        for (const mat of mats) {
            if (!mat || seenMats.has(mat)) continue;
            seenMats.add(mat);

            if (!/Hair|HAIR|FaceBrow/i.test(mat.name || '')) continue;

            if (mat.map) {
                mat.map = recolorHairTextureToBlonde(mat.map, texCache);
            }
            if (mat.shadeMultiplyTexture) {
                mat.shadeMultiplyTexture = recolorHairTextureToBlonde(mat.shadeMultiplyTexture, texCache);
            }
            if (mat.uniforms?.map?.value) {
                mat.uniforms.map.value = recolorHairTextureToBlonde(mat.uniforms.map.value, texCache);
            }
            if (mat.uniforms?.shadeMultiplyTexture?.value) {
                mat.uniforms.shadeMultiplyTexture.value = recolorHairTextureToBlonde(
                    mat.uniforms.shadeMultiplyTexture.value,
                    texCache
                );
            }

            if (mat.color) mat.color.setHex(0xfffaf0);
            if (mat.shadeColorFactor) mat.shadeColorFactor.setHex(0xe8c396);
            if (mat.outlineColorFactor) mat.outlineColorFactor.setHex(0x6e4f35);
            if (mat.matcapFactor) mat.matcapFactor.setHex(0xffe8c2);
            mat.needsUpdate = true;
        }
    });
}

async function loadVrmModel(modelKey) {
    currentModelKey = MODEL_FILES[modelKey] ? modelKey : 'sasha';
    const modelPath = MODEL_FILES[currentModelKey];

    if (loadingEl) {
        loadingEl.style.display = 'flex';
        loadingEl.innerHTML = `<span class="live2d-spinner">🌸</span> <span>Memuat Model 3D ${currentModelKey.toUpperCase()}...</span>`;
    }

    // Bersihkan model sebelumnya jika switch model
    if (currentVrm) {
        scene.remove(currentVrm.scene);
        VRMUtils.deepDispose(currentVrm.scene);
        currentVrm = null;
        window.vrmInstance = null;
        mixer = null;
        idleAction = null;
        activeAction = null;
        glassesGroup = null;
    }

    try {
        const gltf = await loader.loadAsync(modelPath);
        const vrm = gltf.userData.vrm;
        VRMUtils.removeUnnecessaryVertices(gltf.scene);
        VRMUtils.removeUnnecessaryJoints(gltf.scene);

        // Putar VRM 0.x secara resmi agar menghadap kamera tanpa membalik sumbu
        if (vrm.meta?.metaVersion === '0') {
            VRMUtils.rotateVRM0(vrm);
        }

        currentVrm = vrm;
        window.vrmInstance = vrm;
        scene.add(vrm.scene);

        vrm.scene.position.set(0.0, 0.0, 0.0);
        vrm.scene.updateMatrixWorld(true);

        // Setup Tatapan Mata ke Kamera & Proxy LookAt untuk animasi VRMA
        if (vrm.lookAt) {
            const lookAtProxy = new VRMLookAtQuaternionProxy(vrm.lookAt);
            lookAtProxy.name = 'VRMLookAtQuaternionProxy';
            vrm.scene.add(lookAtProxy);
            vrm.lookAt.target = camera;
        }

        // Setup AnimationMixer & muat Idle + semua reaksi VRMA
        mixer = new THREE.AnimationMixer(vrm.scene);
        await preloadAnimations(vrm);
        mixer.update(0.016);
        vrm.update(0.016);
        vrm.scene.updateMatrixWorld(true);

        // Bingkai kamera proporsional sesuai tinggi kepala VRM
        frameCameraToAvatar(vrm);

        // Pasang Kacamata ke Head Bone dengan kalkulasi arah lokal
        attachGlasses(vrm);

        if (loadingEl) loadingEl.style.display = 'none';
        console.log(`[3D VRM] ✅ ${modelPath} + Official VRMA Animations aktif!`);
    } catch (err) {
        console.error('[3D VRM] ⚠️ Gagal memuat VRM:', err);
        if (loadingEl) {
            loadingEl.innerHTML = `<span style="color: #fb7185;">⚠️ Gagal memuat model 3D</span>`;
        }
    }
}

function frameCameraToAvatar(vrm) {
    if (!vrm?.humanoid) return;
    const headNode = vrm.humanoid.getNormalizedBoneNode('head');
    if (!headNode) return;

    const headPos = new THREE.Vector3();
    headNode.getWorldPosition(headPos);

    const camZ = urlParams.get('camz') ? parseFloat(urlParams.get('camz')) : 2.35;
    const camYOffset = urlParams.get('camy') ? parseFloat(urlParams.get('camy')) : 0.0;

    camera.position.set(0.0, headPos.y - 0.10 + camYOffset, camZ);
    camera.lookAt(0.0, headPos.y - 0.14 + camYOffset, 0.0);
}

function attachGlasses(vrm) {
    if (!vrm.humanoid) return;
    const headNode = vrm.humanoid.getNormalizedBoneNode('head');
    if (!headNode) return;

    glassesGroup = createAnimeGlasses();
    glassesGroup.visible = glassesVisible;
    glassesGroup.rotation.y = 0;

    const leftEye = vrm.humanoid.getNormalizedBoneNode('leftEye');
    const rightEye = vrm.humanoid.getNormalizedBoneNode('rightEye');

    if (leftEye && rightEye) {
        vrm.scene.updateMatrixWorld(true);
        const leftPos = new THREE.Vector3();
        const rightPos = new THREE.Vector3();
        leftEye.getWorldPosition(leftPos);
        rightEye.getWorldPosition(rightPos);

        const eyeDist = leftPos.distanceTo(rightPos);
        const autoScale = Math.max(0.82, Math.min(1.28, eyeDist / 0.068));
        glassesGroup.scale.setScalar(autoScale);

        const midWorld = new THREE.Vector3().addVectors(leftPos, rightPos).multiplyScalar(0.5);
        midWorld.y -= 0.002;
        midWorld.z += 0.036;
        headNode.worldToLocal(midWorld);
        glassesGroup.position.copy(midWorld);
        glassesGroup.rotation.y = (vrm.meta?.metaVersion === '0') ? Math.PI : 0;
    } else {
        glassesGroup.position.set(0.0, 0.075, 0.11);
        glassesGroup.rotation.y = (vrm.meta?.metaVersion === '0') ? Math.PI : 0;
    }

    if (urlParams.get('gz')) glassesGroup.position.z += parseFloat(urlParams.get('gz'));
    if (urlParams.get('gy')) glassesGroup.position.y += parseFloat(urlParams.get('gy'));

    headNode.add(glassesGroup);
}

async function preloadAnimations(vrm) {
    Object.keys(animationClips).forEach(k => delete animationClips[k]);

    // Muat Idle dulu biar langsung hidup tanpa T-pose
    try {
        const idleGltf = await loader.loadAsync(MOTION_FILES.Idle);
        const rawClip = idleGltf.userData.vrmAnimations?.[0];
        if (rawClip) {
            const clip = centerAnimationClip(createVRMAnimationClip(rawClip, vrm));
            animationClips.Idle = clip;
            idleAction = mixer.clipAction(clip);
            idleAction.setLoop(THREE.LoopRepeat, Infinity);
            idleAction.play();
            activeAction = idleAction;
        }
    } catch (e) {
        console.warn('[VRMA] Gagal memuat idle_loop.vrma, pakai fallback pose:', e);
    }

    // Muat animasi reaksi lain di background
    for (const [name, url] of Object.entries(MOTION_FILES)) {
        if (name === 'Idle') continue;
        loader.loadAsync(url).then(gltf => {
            const raw = gltf.userData.vrmAnimations?.[0];
            if (raw && currentVrm === vrm) {
                animationClips[name] = centerAnimationClip(createVRMAnimationClip(raw, vrm));
            }
        }).catch(() => { });
    }
}

// 6. Smooth Animation Switcher (Crossfade ke VRMA lalu kembali mulus ke Idle)
let motionResetTimer = null;

window.playVrmMotion = function (motionName = 'Clapping', durationMs = 3800) {
    if (!mixer || !currentVrm) return;
    const clip = animationClips[motionName];
    if (!clip) return;

    clearTimeout(motionResetTimer);

    const nextAction = mixer.clipAction(clip);
    nextAction.reset();
    nextAction.setLoop(THREE.LoopOnce, 1);
    nextAction.clampWhenFinished = true;

    if (activeAction && activeAction !== nextAction) {
        activeAction.crossFadeTo(nextAction, 0.35, true);
    }
    nextAction.play();
    activeAction = nextAction;

    // Kembalikan mulus ke idle_loop setelah selesai
    const clipMs = Math.max(2200, Math.min(durationMs, (clip.duration || 3) * 1000));
    motionResetTimer = setTimeout(() => {
        if (idleAction && activeAction && activeAction !== idleAction) {
            idleAction.reset();
            idleAction.play();
            activeAction.crossFadeTo(idleAction, 0.45, true);
            activeAction = idleAction;
        }
    }, clipMs);
};

window.setGlassesVisible = function (visible) {
    glassesVisible = Boolean(visible);
    if (glassesGroup) {
        glassesGroup.visible = glassesVisible;
    }
};

window.switchVrmModel = function (modelKey) {
    loadVrmModel(modelKey);
};

// 7. Smooth Eye Blinking, Expression & Lip-Sync State
const clock = new THREE.Clock();
let blinkTimer = 0;
let nextBlinkInterval = 3.2;
let isBlinking = false;
let blinkPhase = 0; // 0 -> 1 -> 0
let currentMouth = 0;
let targetMouth = 0;
let currentExpression = null;
let expressionTimer = null;

window.setVrmMouthOpen = function (value) {
    targetMouth = Math.max(0, Math.min(1, value));
};

window.setVrmExpression = function (expressionName, durationMs = 3500) {
    if (!currentVrm?.expressionManager) return;
    if (currentExpression && currentExpression !== expressionName) {
        currentVrm.expressionManager.setValue(currentExpression, 0);
    }
    clearTimeout(expressionTimer);
    currentExpression = expressionName;
    currentVrm.expressionManager.setValue(expressionName, 0.85);

    expressionTimer = setTimeout(() => {
        if (currentVrm?.expressionManager && currentExpression === expressionName) {
            currentVrm.expressionManager.setValue(expressionName, 0);
            currentExpression = null;
        }
    }, durationMs);
};

function animate() {
    requestAnimationFrame(animate);

    const delta = Math.min(clock.getDelta(), 0.1);
    const elapsedTime = clock.getElapsedTime();

    if (mixer) {
        mixer.update(delta);
    }

    if (currentVrm) {
        const em = currentVrm.expressionManager;

        // A. Haluskan gerakan mulut lip-sync multi-viseme ('aa' + sedikit 'oh' & 'ih')
        currentMouth += (targetMouth - currentMouth) * Math.min(1, delta * 22);
        if (em) {
            em.setValue('aa', currentMouth);
            em.setValue('oh', currentMouth * 0.25 * (0.5 + 0.5 * Math.sin(elapsedTime * 11)));
            em.setValue('ih', currentMouth * 0.15);

            // B. Kedip mata halus (skip saat happy agar mata merem senyum tidak bertabrakan)
            if (currentExpression === 'happy') {
                em.setValue('blink', 0);
            } else {
                blinkTimer += delta;
                if (!isBlinking && blinkTimer >= nextBlinkInterval) {
                    isBlinking = true;
                    blinkPhase = 0;
                    blinkTimer = 0;
                    nextBlinkInterval = 2.6 + Math.random() * 2.8;
                }
                if (isBlinking) {
                    blinkPhase += delta * 9.5; // Tutup-buka mulus ~0.2s
                    const val = Math.sin(Math.min(1, blinkPhase) * Math.PI);
                    em.setValue('blink', val);
                    if (blinkPhase >= 1.0) {
                        isBlinking = false;
                        em.setValue('blink', 0);
                    }
                }
            }
        }

        currentVrm.update(delta);
    }

    renderer.render(scene, camera);
}

// Mulai load model awal & loop render
loadVrmModel(currentModelKey);
animate();
