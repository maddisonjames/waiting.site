const style = document.createElement("style");

style.textContent = `
    body {
        height: 100vh;
        margin: 0;
        cursor: default;
        overflow: hidden;
    }

    #_loading_box {
        width: 2500px;
        height: 2500px;
        background-color: rgb(255, 255, 255);
        position: absolute;
        pointer-events: none;
        transform: translate(-50%, -50%);
        border-radius: 0px;
        z-index: 1000;
    }

    #_loading_box.fade-out {
        animation: flashAndFade 0.5s ease-in-out forwards;
    }

    @keyframes flashAndFade {
        0% { opacity: 1; filter: brightness(1); }
        25% { opacity: 1; filter: brightness(1.4); background-color: #ffffff; }
        100% { opacity: 0; filter: brightness(1); }
    }

    #_cursor_box {
        width: 15px;
        height: 15px;
        background-color: rgba(2, 1, 1, 0);
        border: 2px solid #00b45a00;
        position: absolute;
        pointer-events: none;
        transform: translate(-50%, -50%);
        border-radius: 0px;
        z-index: 1001;
    }

    #_clock_base {
        width: 350px;
        height: 350px;
        background-color: rgb(248, 248, 248);
        border: 6px solid #020202;
        position: absolute;
        pointer-events: none;
        transform: translate(-50%, -50%);
        border-radius: 50%;
        transition: transform 1.6s cubic-bezier(0.25, 1, 0.3, 1);
    }

    #_clock_base.lean {
        transform: translate(-50%, -40%) rotate(-8deg);
    }

    .number {
        position: absolute;
        width: 100%;
        height: 100%;
        text-align: center;
        transform: rotate(calc(var(--i) * 30deg));
        font-family: monospace;
        font-size: 1.2rem;
        font-weight: bold;
        color: #020202;
        padding: 12px;
        box-sizing: border-box;
    }

    .number span {
        display: inline-block;
        transform: rotate(calc(var(--i) * -30deg));
    }

    .hand {
        position: absolute;
        bottom: 50%;
        left: 50%;
        transform-origin: bottom center;
        background-color: #020202;
        border-radius: 4px;
    }

    #hour-hand {
        width: 8px;
        height: 85px;
        background-color: #020202;
    }

    #minute-hand {
        width: 6px;
        height: 120px;
        background-color: #020202;
    }

    #second-hand {
        width: 4px;
        height: 140px;
        background-color: #020202;
    }

    #center-pin {
        width: 12px;
        height: 12px;
        background-color: #020202;
        border-radius: 50%;
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        pointer-events: auto;
        cursor: pointer;
    }
`;

document.head.appendChild(style);

// Game-engine physics simulation observer anchored to the exact clock center origin
const physicsObserver = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        if (mutation.attributeName === "class" && mutation.target.classList.contains("fall")) {
            const el = mutation.target;
            
            if (el.dataset.physicsStarted) return;
            el.dataset.physicsStarted = "true";

            requestAnimationFrame(() => {
                // Find exact center coordinates of the clock base container
                const clockBase = document.getElementById("_clock_base");
                const clockRect = clockBase ? clockBase.getBoundingClientRect() : { left: window.innerWidth/2 - 175, top: window.innerHeight/2 - 175, width: 350, height: 350 };
                
                const centerX = clockRect.left + clockRect.width / 2;
                const centerY = clockRect.top + clockRect.height / 2;
                
                // Capture exact pre-fall rotation angle
                let currentRot = 0;
                const computedTransform = window.getComputedStyle(el).transform;
                if (computedTransform && computedTransform !== "none") {
                    const values = computedTransform.split('(')[1].split(')')[0].split(',');
                    const a = values[0];
                    const b = values[1];
                    currentRot = Math.round(Math.atan2(b, a) * (180 / Math.PI));
                }

                // Reparent to body to escape clock container bounds
                document.body.appendChild(el);

                const isPin = el.id === "center-pin";

                el.style.position = "fixed";
                el.style.left = `${centerX}px`;
                el.style.top = `${centerY}px`;
                el.style.bottom = "auto";
                el.style.right = "auto";
                el.style.transformOrigin = isPin ? "center center" : "bottom center";

                // Physics state tracking offsets from the origin point
                let posX = 0;
                let posY = 0;
                let rot = currentRot;

                let vx = 0; // Starts with zero horizontal spread for a seamless transition
                let vy = 0.15; // Gentle initial drop
                let gravity = isPin ? 0.35 : 0.20 + Math.random() * 0.05;
                let vRot = (Math.random() - 0.5) * 1.8; // Smooth, subtle initial tilt
                const drag = 0.988;

                function physicsLoop() {
                    vy += gravity;
                    vx += (Math.random() - 0.5) * 0.08; // Organic micro-drift over time rather than instant jumping
                    vx *= drag;
                    vy *= drag;
                    vRot *= drag;

                    posX += vx;
                    posY += vy;
                    rot += vRot;

                    // Apply translation relative to the center origin point
                    if (isPin) {
                        el.style.transform = `translate(calc(-50% + ${posX}px), calc(-50% + ${posY}px)) rotate(${rot}deg)`;
                    } else {
                        el.style.transform = `translate(-50%, 0px) translate(${posX}px, ${posY}px) rotate(${rot}deg)`;
                    }

                    if (posY < window.innerHeight + 200) {
                        requestAnimationFrame(physicsLoop);
                    } else {
                        el.remove();
                    }
                }

                requestAnimationFrame(physicsLoop);
            });
        }
    });
});

function initPhysicsObserver() {
    ["hour-hand", "minute-hand", "second-hand", "center-pin"].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            physicsObserver.observe(el, { attributes: true, attributeFilter: ["class"] });
        }
    });
}

if (document.readyState === "loading") {
    window.addEventListener("DOMContentLoaded", initPhysicsObserver);
} else {
    initPhysicsObserver();
}