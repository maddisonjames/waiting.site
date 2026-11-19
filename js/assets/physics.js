/* ==========================================================================
   PHYSICS
   Anything that gets the class "fall" drops off the screen: it's lifted out
   of its parent onto <body>, frozen where it was, then pulled down with a bit
   of wobble and spin until it's gone.
   Add "center-origin" as well to spin around its middle instead of its base.
   ========================================================================== */

const DRAG = 0.988;

// reads the rotation (in degrees) out of a computed transform like "matrix(a, b, c, d, e, f)"
function rotationOf(transform) {
    if (!transform || transform === 'none') return 0;
    const v = transform.slice(transform.indexOf('(') + 1, -1).split(',').map(Number);
    return Math.round(Math.atan2(v[1], v[0]) * (180 / Math.PI));
}

function drop(el) {
    if (el.dataset.physicsStarted) return;
    el.dataset.physicsStarted = 'true';

    requestAnimationFrame(() => {
        const rect = el.getBoundingClientRect();
        const cs = window.getComputedStyle(el);

        // Save everything the old parent was providing. Sizes matter for the clock hands:
        // they're sized from --r on the clock, which no longer applies once they're on <body>.
        const keep = {
            fontFamily: cs.fontFamily,
            fontSize: cs.fontSize,
            fontWeight: cs.fontWeight,
            color: cs.color,
            width: cs.width,
            height: cs.height,
        };
        const startRot = rotationOf(cs.transform);
        const isCentered = el.classList.contains('center-origin');

        document.body.appendChild(el);               // break out of the layout

        Object.assign(el.style, keep, {
            position: 'fixed',
            left: `${rect.left}px`,
            top: `${rect.top}px`,
            right: 'auto',
            bottom: 'auto',
            margin: '0',
            zIndex: 'var(--z-falling, 850)',          // in front of the windows, behind buttons and dialogs
            pointerEvents: 'none',                    // never blocks a click or a window drag on its way down
            transformOrigin: isCentered ? 'center center' : 'bottom center',
            transition: 'none',
            transform: `rotate(${startRot}deg)`,
        });

        let x = 0, y = 0, rot = startRot;
        let vx = 0, vy = 0.15;
        let vRot = (Math.random() - 0.5) * 1.8;
        const gravity = isCentered ? 0.35 : 0.20 + Math.random() * 0.025;

        function step() {
            vy += gravity;
            vx += (Math.random() - 0.5) * 0.08;
            vx *= DRAG; vy *= DRAG; vRot *= DRAG;
            x += vx; y += vy; rot += vRot;

            el.style.transform = `translate(${x}px, ${y}px) rotate(${rot}deg)`;

            if (rect.top + y < window.innerHeight + 200) requestAnimationFrame(step);
            else el.remove();
        }

        // wait two frames so the frozen starting position paints before it moves
        requestAnimationFrame(() => requestAnimationFrame(step));
    });
}

const physicsObserver = new MutationObserver((mutations) => {
    for (const m of mutations) {
        if (m.attributeName === 'class' && m.target.classList.contains('fall')) drop(m.target);
    }
});

function initPhysicsObserver() {
    physicsObserver.observe(document.body, { attributes: true, attributeFilter: ['class'], subtree: true });
}

if (document.body) initPhysicsObserver();
else window.addEventListener('DOMContentLoaded', initPhysicsObserver);