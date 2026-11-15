const physicsObserver = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        if (mutation.attributeName === "class" && mutation.target.classList.contains("fall")) {
            const el = mutation.target;
            
            if (el.dataset.physicsStarted) return;
            el.dataset.physicsStarted = "true";

            requestAnimationFrame(() => {
                const initialRect = el.getBoundingClientRect();
                const computedStyle = window.getComputedStyle(el);
                
                // Capture current style properties so they don't get lost on reparenting
                const fontFamily = computedStyle.fontFamily;
                const fontSize = computedStyle.fontSize;
                const fontWeight = computedStyle.fontWeight;
                const color = computedStyle.color;
                const computedTransform = computedStyle.transform;

                let currentRot = 0;
                if (computedTransform && computedTransform !== "none") {
                    const values = computedTransform.split('(')[1].split(')')[0].split(',');
                    currentRot = Math.round(Math.atan2(values[1], values[0]) * (180 / Math.PI));
                }

                // Move to body to break out of layout bounds
                document.body.appendChild(el);

                const isCentered = el.classList.contains("center-origin");

                // Apply fixed positioning and lock in font styles inline
                el.style.position = "fixed";
                el.style.left = `${initialRect.left}px`;
                el.style.top = `${initialRect.top}px`;
                el.style.bottom = "auto";
                el.style.right = "auto";
                el.style.fontFamily = fontFamily;
                el.style.fontSize = fontSize;
                el.style.fontWeight = fontWeight;
                el.style.color = color;
                el.style.transformOrigin = isCentered ? "center center" : "bottom center";
                el.style.transition = "none";
                el.style.margin = "0";
                el.style.transform = `rotate(${currentRot}deg)`;

                let posX = 0;
                let posY = 0;
                let rot = currentRot;

                let vx = 0;
                let vy = 0.15;
                let gravity = isCentered ? 0.35 : 0.20 + Math.random() * 0.025;
                let vRot = (Math.random() - 0.5) * 1.8;
                const drag = 0.988;

                function physicsLoop() {
                    vy += gravity;
                    vx += (Math.random() - 0.5) * 0.08;
                    vx *= drag;
                    vy *= drag;
                    vRot *= drag;

                    posX += vx;
                    posY += vy;
                    rot += vRot;

                    el.style.transform = `translate(${posX}px, ${posY}px) rotate(${rot}deg)`;

                    if (posY < window.innerHeight + 200) {
                        requestAnimationFrame(physicsLoop);
                    } else {
                        el.remove();
                    }
                }

                requestAnimationFrame(() => {
                    requestAnimationFrame(physicsLoop);
                });
            });
        }
    });
});

function initPhysicsObserver() {
    physicsObserver.observe(document.body, { 
        attributes: true, 
        attributeFilter: ["class"],
        subtree: true 
    });
}

initPhysicsObserver();

if (document.readyState === "loading") {
    window.addEventListener("DOMContentLoaded", initPhysicsObserver);
} else {
    initPhysicsObserver();
}