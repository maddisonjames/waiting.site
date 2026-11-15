import './assets/physics.js';

const style = document.createElement("style");

style.textContent = `
    body {
        height: 100vh;
        margin: 0;
        cursor: default;
        overflow: hidden;
    }

    * {
        box-sizing: border-box;
    }

    html, body {
        margin: 0;
        padding: 0;
        width: 100%;
        height: 100%;
    }

    #_screen_cover {
        width: 100vw;
        height: 100dvh;
        background-color: rgb(255, 255, 255);
        position: fixed;
        top: 0;
        left: 0;
        pointer-events: none;
        border-radius: 0px;
        z-index: 1000;
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
        transform: translate(-50%, -47.5%) rotate(-3deg);
    }

    .click-collapse {
        pointer-events: auto;
        cursor: pointer;
    }

    .number {
        position: absolute;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%) rotate(calc(var(--i) * 30deg)) translateY(-155px);
        font-family: monospace;
        font-size: 1.2rem;
        font-weight: bold;
        color: #020202;
        padding: 12px;
        box-sizing: border-box;
        cursor: pointer;
    }

    .number span {
        display: inline-block;
        pointer-events: none;
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

    #clock-break-text {
        position: fixed;
        top: 30px;
        left: 30px;
        font-family: monospace;
        font-size: 3.25rem;
        font-weight: bold;
        color: #020202;
        opacity: 0;
        z-index: 1005;
        pointer-events: none;
    }

    #_win_border {
        transform: translate(-50%, -50%) scale(0);
        opacity: 0;
        pointer-events: none;
        transition: transform 0.75s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.25s ease-in-out;
        z-index: 2;
        background: #c0c0c0;
        border-top: 2px solid #ffffff;
        border-left: 2px solid #ffffff;
        border-right: 2px solid #808080;
        border-bottom: 2px solid #808080;
    }

    #_win_border.maze_core {
        position: fixed;
        top: 50%;
        left: 50%;
        padding: 3px;
        width: 590px;
    }
    
    #_win_border.plateformer_core {
        position: fixed;
        top: 50%;
        left: 50%;
        padding: 3px;
        width: 520px;
    }

    #_win_border.plateformer_details {
        position: fixed;
        top: 40%;
        left: 27.5%;
        padding: 3px;
        width: 200px;
    }

    #_win_border._notice {
        position: fixed;
        bottom: 4%;
        left: 50%;
        padding: 3px;
        width: 350px;
        height: 100px;
    }

    #_win_border.maze_details {
        position: fixed;
        top: 40%;
        left: 27.5%;
        padding: 3px;
        width: 200px;
    }

    #_win_border.links {
        position: fixed;
        top: 6%;
        left: 50%;
        padding: 3px;
        width: 350px;
        height: 100px;
    }

    #_win_border._games {
        position: fixed;
        top: 50%;
        right: 0.5%;
        padding: 3px;
        width: 200px;
        height: 800px
    }

    #_youtube_link {
        font-family: sans-serif;
        font-size: 20px;
        font-weight: bold;
        text-decoration: underline;
        transition: color 0.2s ease;
        pointer-events: auto;
    }

    #_youtube_link:link {
        color: #192cd3;
    }
    #_youtube_link:visited {
        color: #d31941;
    }

    #_youtube_link:hover {
        text-transform: uppercase;
    }
    #_youtube_link:active {
        color: #19d395;
    }
    
    #_kofi_link {
        font-family: sans-serif;
        font-size: 20px;
        font-weight: bold;
        text-decoration: underline;
        transition: color 0.2s ease;
        pointer-events: auto;
    }

    #_kofi_link:link {
        color: #192cd3;
    }
    #_kofi_link:visited {
        color: #d31941;
    }

    #_kofi_link:hover {
        text-transform: uppercase;
    }
    #_kofi_link:active {
        color: #19d395;
    }

    #_win_button {
        position: fixed;
        bottom: 5px;
        right: 5px;
        width: 150px;
        height: 48.75px;
        background: #c0c0c0;
        
        border-top: 2px solid #ffffff;
        border-left: 2px solid #ffffff;
        border-right: 2px solid #808080;
        border-bottom: 2px solid #808080;
        box-shadow: inset 1px 1px #dfdfdf, inset -1px -1px #0a0a0a;

        opacity: 0;
        
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        box-sizing: border-box;
        
        transform: translate(-50%, -50%) scale(0.75);
        transition: transform 1s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.5s ease-in-out;
    }

    #_win_button:hover {
        border-top: 2px solid #808080;
        border-left: 2px solid #808080;
        border-right: 2px solid #ffffff;
        border-bottom: 2px solid #ffffff;
        box-shadow: inset 1px 1px #0a0a0a, inset -1px -1px #dfdfdf;
        padding-top: 2px;
        padding-left: 2px;
    }

    #_win_button:active {
        border-top: 2px solid #808080;
        border-left: 2px solid #808080;
        border-right: 2px solid #ffffff;
        border-bottom: 2px solid #ffffff;
        box-shadow: inset 1px 1px #0a0a0a, inset -1px -1px #dfdfdf;
        padding-top: 2px;
        padding-left: 2px;
    }

    #_refresh_txt {
        color: #020202;
        font-family: sans-serif;
        font-size: 38px;
        font-weight: bold;
        transition: color 0.2s ease;
    }

    #_win_button.open {
        transform: translate(-50%, -50%) scale(1);
        opacity: 1;
        pointer-events: auto;
    }

    #_win_border.open {
        transform: translate(-50%, -50%) scale(1);
        opacity: 1;
        pointer-events: auto;
    }

    #_version_title {
        position: fixed;
        bottom: 0px;
        left: 10px;
        width: 200px;
        height: 48.75px;
        color: #020202;

        font-family: sans-serif;
        font-size: 20px;
        font-weight: bold;

        opacity: 0.05;
        
        display: flex;
        align-items: center;
        justify-content: center;
        box-sizing: border-box;
    }

    #_screen_cover.fade-out {
        animation: flashAndFade 0.5s ease-in-out forwards;
    }

    #_screen_cover.fade-in {
        animation: fadeIn 0.5s ease-in-out forwards;
    }

    @keyframes fadeIn {
        0% {
            opacity: 0;
            filter: brightness(1);
        }
        100% {
            opacity: 1;
            filter: brightness(1);
        }
    }

    @keyframes screen-shake {
        0%, 100% { transform: translate(0, 0); }
        20% { transform: translate(-6px, 4px); }
        40% { transform: translate(6px, -4px); }
        60% { transform: translate(-4px, -6px); }
        80% { transform: translate(4px, 6px); }
    }

    @keyframes flashAndFade {
        0% { opacity: 1; filter: brightness(1); }
        25% { opacity: 1; filter: brightness(1.4); background-color: #ffffff; }
        100% { opacity: 0; filter: brightness(1); }
    }

    .screen-shake {
        animation: screen-shake 0.5s ease-in-out;
    }
`;

document.head.appendChild(style);