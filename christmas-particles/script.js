// 全局变量
let scene, camera, renderer;
let particles;
let particleGeometry;
let particleMaterial;
const particleCount = 15000;
let positions = [];
let targetPositions = [];
let dispersedPositions = []; // 均匀扩散的目标位置
let currentModel = 'tree';

// 交互状态
let interactionState = {
    hasHands: false,
    openness: 0.0, // 0.0 (握拳/聚拢) -> 1.0 (张开/扩散)
    scale: 1.0,
    dispersion: 0.0
};

// 形状生成器
const Shapes = {
    // 圣诞树：多层圆锥结构
    tree: () => {
        const points = [];
        const levels = 4; // 4层树冠
        for (let i = 0; i < particleCount; i++) {
            // 15% 粒子做树干
            if (i < particleCount * 0.15) {
                const h = Math.random() * 8; // 0 to 8
                const r = Math.random() * 2;
                const angle = Math.random() * Math.PI * 2;
                points.push(
                    Math.cos(angle) * r,
                    h - 14, // -14 to -6
                    Math.sin(angle) * r
                );
            } else {
                // 树冠
                const level = Math.floor(Math.random() * levels);
                // 每层的高度范围
                const levelHeight = 6;
                const yBase = -6 + level * 4; 
                const yRel = Math.random() * levelHeight;
                const y = yBase + yRel;
                
                // 半径随高度变小
                const maxR = 9 - level * 1.5; 
                const r = (1 - yRel / levelHeight) * maxR;
                
                const angle = Math.random() * Math.PI * 2;
                points.push(
                    Math.cos(angle) * r,
                    y,
                    Math.sin(angle) * r
                );
            }
        }
        return points;
    },

    // 雪花：使用分形算法生成六边形晶体结构
    snowflake: () => {
        const points = [];
        const lines = [];

        // 递归函数生成分形骨架
        // x, y: 起点
        // angle: 生长方向
        // length: 长度
        // depth: 递归深度
        function addBranch(x, y, angle, length, depth) {
            if (depth === 0) return;

            const ex = x + Math.cos(angle) * length;
            const ey = y + Math.sin(angle) * length;

            // 记录线段
            lines.push({x1: x, y1: y, x2: ex, y2: ey, depth: depth});

            const newLen = length * 0.4;
            
            // 在中间位置生成两个分叉 (典型的雪花结构)
            const mx = x + Math.cos(angle) * length * 0.5;
            const my = y + Math.sin(angle) * length * 0.5;
            
            addBranch(mx, my, angle + Math.PI / 3, newLen, depth - 1);
            addBranch(mx, my, angle - Math.PI / 3, newLen, depth - 1);
            
            // 顶端继续生长
            addBranch(ex, ey, angle, newLen, depth - 1);
        }

        // 初始6个主分支
        for (let i = 0; i < 6; i++) {
            addBranch(0, 0, i * Math.PI / 3, 10, 4);
        }

        // 计算所有线段的总长度，用于加权随机采样
        let totalLength = 0;
        lines.forEach(l => {
            l.len = Math.sqrt(Math.pow(l.x2 - l.x1, 2) + Math.pow(l.y2 - l.y1, 2));
            totalLength += l.len;
        });

        for (let i = 0; i < particleCount; i++) {
            // 随机选择一条线段 (按长度加权)
            let r = Math.random() * totalLength;
            let selectedLine = lines[0];
            for (let l of lines) {
                r -= l.len;
                if (r <= 0) {
                    selectedLine = l;
                    break;
                }
            }
            
            // 在线段上随机位置
            const t = Math.random();
            const px = selectedLine.x1 + (selectedLine.x2 - selectedLine.x1) * t;
            const py = selectedLine.y1 + (selectedLine.y2 - selectedLine.y1) * t;
            
            // Z轴厚度：主干厚一些，末梢薄一些
            const thickness = Math.max(0.5, selectedLine.depth * 0.8);
            const pz = (Math.random() - 0.5) * thickness * 4; 
            
            // 增加一点垂直于线段的随机偏移，让线条看起来毛茸茸的
            const perpAngle = Math.atan2(selectedLine.y2 - selectedLine.y1, selectedLine.x2 - selectedLine.x1) + Math.PI/2;
            const offset = (Math.random() - 0.5) * thickness * 0.5;

            points.push(
                px + Math.cos(perpAngle) * offset,
                py + Math.sin(perpAngle) * offset,
                pz
            );
        }
        return points;
    },

    // 圣诞老人：优化身体结构，更具象
    santa: () => {
        const points = [];
        for (let i = 0; i < particleCount; i++) {
            const r = Math.random();
            let x, y, z;

            if (r < 0.35) {
                // 身体 (大肚子，下宽上窄)
                const theta = Math.random() * Math.PI * 2;
                const phi = Math.acos(2 * Math.random() - 1);
                const rad = 6.0;
                x = rad * Math.sin(phi) * Math.cos(theta);
                y = rad * 0.8 * Math.sin(phi) * Math.sin(theta) - 5; // 略扁
                z = rad * Math.cos(phi);
                // 稍微拉长Y轴下半部
                if (y < -5) y *= 1.1; 
            } else if (r < 0.55) {
                // 头部 (圆球)
                const theta = Math.random() * Math.PI * 2;
                const phi = Math.acos(2 * Math.random() - 1);
                const rad = 3.0;
                x = rad * Math.sin(phi) * Math.cos(theta);
                y = rad * Math.sin(phi) * Math.sin(theta) + 3; // 头部中心在 y=3
                z = rad * Math.cos(phi);
            } else if (r < 0.7) {
                // 胡子 (倒锥形，浓密)
                // 在脸部前方生成
                const theta = (Math.random() - 0.5) * Math.PI; // -PI/2 to PI/2 (前方)
                const h = Math.random() * 4; // 胡子长度
                const w = (1 - h/4) * 3; // 宽度随长度减小
                x = Math.sin(theta) * w;
                y = 2 - h; // 从脸下部开始向下
                z = Math.cos(theta) * w + 1.5; // 向前突出
            } else if (r < 0.85) {
                // 帽子 (圆锥 + 绒球)
                const h = Math.random() * 6;
                const rad = (1 - h/6) * 3.2;
                const angle = Math.random() * Math.PI * 2;
                x = Math.cos(angle) * rad;
                y = h + 5.5; // 头部之上
                z = Math.sin(angle) * rad;
                
                // 帽子尖端向后弯曲
                z -= h * 0.5;
                if (h > 5.5) { // 绒球
                     x += (Math.random()-0.5);
                     y += (Math.random()-0.5);
                     z += (Math.random()-0.5);
                }
            } else {
                 // 四肢
                 if (Math.random() > 0.5) {
                     // 手臂 (张开)
                     const armLen = Math.random() * 5;
                     const side = Math.random() > 0.5 ? 1 : -1;
                     x = side * (5 + armLen);
                     y = 0 + (Math.random() - 0.5) * 2;
                     z = (Math.random() - 0.5) * 2;
                 } else {
                     // 腿 (靴子)
                     const side = Math.random() > 0.5 ? 1 : -1;
                     x = side * 2.5 + (Math.random()-0.5)*1.5;
                     y = -10 - Math.random() * 3;
                     z = (Math.random() - 0.5) * 2;
                 }
            }
            points.push(x, y, z);
        }
        return points;
    },

    // 铃铛：新模型
    bell: () => {
        const points = [];
        for (let i = 0; i < particleCount; i++) {
            const r = Math.random();
            let x, y, z;
            
            if (r < 0.8) {
                // 铃身 (钟形曲面)
                const angle = Math.random() * Math.PI * 2;
                const h = Math.random() * 10; // 0 to 10 (height)
                // 半径曲线：y=0时宽，y=10时窄
                // r = R_base * (1 - (y/H)^2) 或者是 cos 形状
                const yPos = h - 5; // -5 to 5
                // 归一化高度 0 to 1 (从顶到底)
                const normH = 1 - h/10; 
                // 钟形曲线
                const radius = 6 * (0.3 + 0.7 * Math.pow(normH, 1.5));
                
                x = Math.cos(angle) * radius;
                y = yPos;
                z = Math.sin(angle) * radius;
            } else if (r < 0.9) {
                // 铃舌 (中间的球)
                const theta = Math.random() * Math.PI * 2;
                const phi = Math.acos(2 * Math.random() - 1);
                const rad = 1.5;
                x = rad * Math.sin(phi) * Math.cos(theta);
                y = rad * Math.sin(phi) * Math.sin(theta) - 5; // 底部
                z = rad * Math.cos(phi);
            } else {
                // 顶部提手 (圆环的一半)
                const angle = Math.random() * Math.PI; // 0 to PI
                const ringR = 1.5;
                
                // 环在 X-Y 平面
                x = Math.cos(angle) * ringR; 
                y = Math.sin(angle) * ringR + 5; 
                z = (Math.random()-0.5) * 0.5;
            }
            points.push(x, y, z);
        }
        return points;
    },

    // 袜子：使用贝塞尔曲线路径生成
    sock: () => {
        const points = [];
        // 定义中心线路径点
        const pathPoints = [];
        const steps = 50;
        for(let i=0; i<=steps; i++) {
            const t = i / steps;
            // 简单的 J 形曲线
            // x: 0 -> 0 -> 4
            // y: 10 -> -4 -> -4
            let px, py;
            if (t < 0.6) {
                // 垂直段
                px = 0;
                py = 8 - (t/0.6) * 12; // 8 to -4
            } else {
                // 弯曲段
                const t2 = (t - 0.6) / 0.4; // 0 to 1
                const angle = t2 * Math.PI / 2; // 0 to 90
                px = Math.sin(angle) * 6;
                py = -4 - (1-Math.cos(angle)) * 2; 
            }
            pathPoints.push({x: px, y: py});
        }

        for (let i = 0; i < particleCount; i++) {
            // 随机选择路径上的一点
            const pathIndex = Math.floor(Math.random() * pathPoints.length);
            const center = pathPoints[pathIndex];
            
            // 在截面上随机分布 (圆管)
            const angle = Math.random() * Math.PI * 2;
            const r = Math.random() * 3.5; // 半径
            
            // 简单的管状偏移 (不严格垂直于路径，简化计算)
            points.push(
                center.x + Math.cos(angle) * r,
                center.y,
                center.x * 0.2 + Math.sin(angle) * r // z轴受x弯曲一点影响
            );
        }
        return points;
    }
};

function init() {
    // 场景设置
    const container = document.getElementById('container');
    scene = new THREE.Scene();
    // 增加一点环境雾，营造雪天感觉
    scene.fog = new THREE.FogExp2(0x050a14, 0.02);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 30;

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    // 粒子系统初始化
    initParticles();

    // 事件监听
    window.addEventListener('resize', onWindowResize, false);
    
    document.querySelectorAll('.model-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            // UI 更新
            document.querySelectorAll('.model-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active'); // 注意：如果是点击了图标可能需要处理 e.currentTarget
            e.currentTarget.classList.add('active');
            
            // 模型切换
            const model = e.currentTarget.dataset.model;
            switchModel(model);
        });
    });

    document.getElementById('fullscreen-btn').addEventListener('click', () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    });

    // 启动动画循环
    animate();
    
    // 启动摄像头和 MediaPipe
    initMediaPipe();
}

function initParticles() {
    particleGeometry = new THREE.BufferGeometry();
    positions = new Float32Array(particleCount * 3);
    targetPositions = new Float32Array(particleCount * 3);
    dispersedPositions = new Float32Array(particleCount * 3);
    
    // 初始位置 & 均匀分布位置
    // dispersedPositions 应该均匀填充整个屏幕空间，避免条带状
    for (let i = 0; i < particleCount * 3; i += 3) {
        // 初始位置
        positions[i] = (Math.random() - 0.5) * 100;
        positions[i + 1] = (Math.random() - 0.5) * 100;
        positions[i + 2] = (Math.random() - 0.5) * 50;
        
        // 预计算均匀扩散位置 (在一个大球体内或大立方体内均匀分布)
        // 使用球体分布更自然
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const r = 40 + Math.random() * 60; // 40-100 的半径范围，避免中心太密
        
        dispersedPositions[i] = r * Math.sin(phi) * Math.cos(theta);
        dispersedPositions[i + 1] = r * Math.sin(phi) * Math.sin(theta);
        dispersedPositions[i + 2] = r * Math.cos(phi);
    }
    
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    // 材质：使用 Canvas 动态生成的六边形雪花纹理
    const sprite = createSnowflakeTexture();
    
    particleMaterial = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 1.2, // 稍微调大一点，因为 Canvas 纹理有透明边缘
        map: sprite,
        blending: THREE.AdditiveBlending,
        depthTest: false,
        transparent: true,
        opacity: 0.9
    });

    particles = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particles);

    // 生成初始目标形状 (Tree)
    switchModel('tree');
}

// 动态生成雪花纹理
function createSnowflakeTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    
    // 1. 绘制柔和光晕 (Base Glow)
    const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.01)');
    gradient.addColorStop(0.4, 'rgba(220, 235, 255, 0.01)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 64, 64);
    
    // 2. 绘制六边形晶体结构 (Hexagonal Crystal)
    ctx.save();
    ctx.translate(32, 32);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    
    // 绘制 3 条交叉主轴 (6个分支)
    for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(0, -14);
        ctx.lineTo(0, 14);
        ctx.stroke();
        
        // 增加晶体分叉细节
        const branchY = 8;
        const branchLen = 5;
        
        // 上部分叉
        ctx.beginPath();
        ctx.moveTo(0, -branchY);
        ctx.lineTo(-branchLen, -branchY - branchLen);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(0, -branchY);
        ctx.lineTo(branchLen, -branchY - branchLen);
        ctx.stroke();
        
        // 下部分叉
        ctx.beginPath();
        ctx.moveTo(0, branchY);
        ctx.lineTo(-branchLen, branchY + branchLen);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(0, branchY);
        ctx.lineTo(branchLen, branchY + branchLen);
        ctx.stroke();
        
        ctx.rotate(Math.PI / 3);
    }
    
    ctx.restore();
    
    const texture = new THREE.CanvasTexture(canvas);
    return texture;
}

function switchModel(modelName) {
    currentModel = modelName;
    const generatePoints = Shapes[modelName];
    if (generatePoints) {
        const newPoints = generatePoints();
        for (let i = 0; i < particleCount * 3; i++) {
            targetPositions[i] = newPoints[i] || 0;
        }
    }
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// MediaPipe 逻辑
function initMediaPipe() {
    const videoElement = document.getElementsByClassName('input_video')[0];
    const statusElement = document.getElementById('hand-status');

    function onResults(results) {
        if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
            interactionState.hasHands = true;
            statusElement.innerText = "🤚 单手控制中";
            statusElement.style.color = "#a8d8ff";
            
            // 单手模式：计算手掌开合度
            // 我们只需要检测第一只识别到的手
            const landmarks = results.multiHandLandmarks[0];
            
            // 关键点索引参考：
            // 0: 手腕 (Wrist)
            // 9: 中指根部 (Middle Finger MCP)
            // 指尖: 4(拇指), 8(食指), 12(中指), 16(无名指), 20(小指)
            
            const wrist = landmarks[0];
            const middleMCP = landmarks[9];
            
            // 1. 计算手掌参考尺度 (手腕到中指根部的距离)
            // 这个距离作为基准，可以适应不同距离/大小的手
            const scaleRef = Math.sqrt(
                Math.pow(wrist.x - middleMCP.x, 2) + 
                Math.pow(wrist.y - middleMCP.y, 2)
            );
            
            // 2. 计算所有指尖到手腕的平均距离
            const tipIndices = [4, 8, 12, 16, 20];
            let totalTipDist = 0;
            tipIndices.forEach(idx => {
                const tip = landmarks[idx];
                const d = Math.sqrt(
                    Math.pow(wrist.x - tip.x, 2) + 
                    Math.pow(wrist.y - tip.y, 2)
                );
                totalTipDist += d;
            });
            const avgTipDist = totalTipDist / 5;
            
            // 3. 计算开合比率 (Ratio)
            // 握拳时: 指尖卷曲，距离手腕较近，Ratio 较小
            // 张开时: 指指伸直，距离手腕最远，Ratio 较大
            const ratio = avgTipDist / scaleRef;
            
            // 4. 映射到 0.0 - 1.0 的 openness 值
            // 经验阈值：
            // 握拳状态 ratio 约为 0.8 - 1.2
            // 完全张开 ratio 约为 2.0 - 2.5
            const minRatio = 1.0; // 视为握拳的上限
            const maxRatio = 2.2; // 视为张开的下限
            
            let openVal = (ratio - minRatio) / (maxRatio - minRatio);
            // 限制在 0 - 1 之间
            interactionState.openness = Math.max(0, Math.min(1, openVal));
            
        } else {
            interactionState.hasHands = false;
            statusElement.innerText = "👀 请伸出一只手...";
            statusElement.style.color = "#aaa";
        }
    }

    const hands = new Hands({locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
    }});

    hands.setOptions({
        maxNumHands: 1, // 改为单手识别
        modelComplexity: 1,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
    });

    hands.onResults(onResults);

    const camera = new Camera(videoElement, {
        onFrame: async () => {
            await hands.send({image: videoElement});
        },
        width: 640,
        height: 480
    });

    camera.start().catch(err => {
        statusElement.innerText = "❌ 摄像头启动失败";
        console.error(err);
    });
}

function animate() {
    requestAnimationFrame(animate);

    const positions = particles.geometry.attributes.position.array;
    
    // 交互参数平滑处理
    let targetScale = 1.0;
    let targetDispersion = 0.0;
    
    if (interactionState.hasHands) {
        // 单手交互逻辑
        // openness: 0.0 (握拳) -> 聚拢成模型
        // openness: 1.0 (张开) -> 粒子四处扩散
        
        const open = interactionState.openness;
        
        // 扩散力度计算
        // 使用平方曲线，让张开到最后阶段时扩散最明显
        // 0 to 1
        
        // 目标参数
        targetScale = 1.0 + open * 0.5; 
        // 这里 dispersion 改为混合系数 0 to 1
        // 完全张开时，dispersion = 1.0，表示完全使用 dispersedPositions
        // 握拳时，dispersion = 0.0，表示完全使用 targetPositions
        targetDispersion = open; 
    } else {
        // 无手势：默认状态，稍微有些飘动
        targetScale = 1.0;
        targetDispersion = 0.05; // 稍微有一点点离散
    }

    // 缓动更新 (增加一点平滑度)
    interactionState.scale += (targetScale - interactionState.scale) * 0.08;
    interactionState.dispersion += (targetDispersion - interactionState.dispersion) * 0.08;

    const time = Date.now() * 0.001;

    for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;
        
        // 1. 模型目标位置
        let modelX = targetPositions[i3] * interactionState.scale;
        let modelY = targetPositions[i3 + 1] * interactionState.scale;
        let modelZ = targetPositions[i3 + 2] * interactionState.scale;
        
        // 2. 均匀扩散目标位置
        let disperseX = dispersedPositions[i3];
        let disperseY = dispersedPositions[i3 + 1];
        let disperseZ = dispersedPositions[i3 + 2];

        // 3. 混合位置 (基于 dispersion 参数)
        // Lerp(model, disperse, dispersion)
        const d = interactionState.dispersion;
        
        // 使用更平滑的插值曲线 (Smoothstep-like)
        const t = d * d * (3 - 2 * d); 
        
        let tx = modelX + (disperseX - modelX) * t;
        let ty = modelY + (disperseY - modelY) * t;
        let tz = modelZ + (disperseZ - modelZ) * t;

        // 4. 微小躁动 (Micro-movement)
        // 即使是握拳状态 (d 接近 0)，也增加一点点随机抖动，让它看起来是活的
        // 随着扩散，这种抖动可以减弱或保持
        const microScale = 0.15 * (1 - d * 0.8); // 握拳时抖动更明显一点，张开时主要靠扩散
        const noiseX = Math.sin(time * 2 + i * 0.1) * microScale;
        const noiseY = Math.cos(time * 2 + i * 0.2) * microScale;
        const noiseZ = Math.sin(time * 2 + i * 0.3) * microScale;

        // 最终目标位置
        const destX = tx + noiseX;
        const destY = ty + noiseY;
        const destZ = tz + noiseZ;

        // 粒子移动 (Lerp)
        // 速度取决于距离：远的快，近的慢
        positions[i3] += (destX - positions[i3]) * 0.08;
        positions[i3 + 1] += (destY - positions[i3 + 1]) * 0.08;
        positions[i3 + 2] += (destZ - positions[i3 + 2]) * 0.08;
    }

    particles.geometry.attributes.position.needsUpdate = true;
    
    // 旋转整个场景一点点，增加3D感
    particles.rotation.y += 0.002;

    renderer.render(scene, camera);
}

// 启动
init();
