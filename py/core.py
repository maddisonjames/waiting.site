import asyncio
import random
from datetime import datetime
import time
from js import document, window, Audio
import pyodide.code
from pyodide.ffi import create_proxy

print(f"// python run! //\n")
print("## Created by Maddison James. An amalgomation of all the wacky ideas my brain can come up with. ##\n")

_GLOBAL_PROXIES = {}
_GLOBAL_ATTRIBUTES = []

click_count = 0

is_broken = False
refreshing = False

current_h_deg = 0
current_m_deg = 0
current_s_deg = 0

plateformer_sequence = "pico"
plateformer_index = 0

maze_sequence = "maze"
maze_index = 0

def change_website_icon(new_icon_path):
    icon_link = document.querySelector("link[rel*='icon']")
    
    if not icon_link:
        icon_link = document.createElement("link")
        icon_link.rel = "icon"
        document.head.appendChild(icon_link)
    
    icon_link.href = new_icon_path
    print(f"Website icon changed to: {new_icon_path}")

def event_occured():
    global _GLOBAL_ATTRIBUTES

    if "_event_occured" in _GLOBAL_ATTRIBUTES:
        return True
    else:
        return False

async def fade_in(element_id, target_opacity=0.85, duration=2.0):
    el = document.getElementById(element_id)
    if not el:
        return
    
    el.style.transition = f"opacity {duration}s ease-in-out"
    el.classList.add("fade-in")
    el.style.opacity = str(target_opacity)
    el.style.pointerEvents = "auto"
    
    steps = 40  
    sleep_time = duration / steps
    increment = target_opacity / steps
    
    current_opacity = 0.0
    while current_opacity < target_opacity:
        current_opacity += increment
        if current_opacity > target_opacity:
            current_opacity = target_opacity
        el.style.opacity = str(current_opacity)
        await asyncio.sleep(sleep_time)
        
    el.style.pointerEvents = "auto"

async def play_audio_with_fade_in(file_path, duration=2.0, steps=20, loop=True, volume=1):
    sound = Audio.new(file_path)
    sound.loop = loop
    sound.volume = 0.0
    sound.play()
    
    sleep_time = duration / steps
    volume_increment = volume / steps
    
    while sound.volume < volume:
        sound.volume = min(volume, sound.volume + volume_increment)
        await asyncio.sleep(sleep_time)

async def reload_page(event):
    global refreshing

    refresh_container = document.querySelector(".refresh")

    if not refresh_container or not refresh_container.classList.contains("open"):
        return
    if refreshing:
        return

    refreshing = True

    snd_fade = Audio.new("./assets/other/sfxs/Windows Recycle.wav")
    snd_fade.loop = False
    snd_fade.volume = 0.75
    snd_fade.play()

    await asyncio.create_task(reveal_screen_cover())
    await asyncio.sleep(0.5)

    window.location.reload()

def youtube_link(event):
    sound = Audio.new("./assets/other/sfxs/Windows Battery Low.wav")
    sound.volume = 0.5
    sound.play()
def kofi_link(event):
    sound = Audio.new("./assets/other/sfxs/Windows Battery Critical.wav")
    sound.volume = 0.5
    sound.play()

def follow_cursor(event):
    hitbox = document.getElementById("_cursor_box")
    if not hitbox:
        return

    x = event.clientX
    y = event.clientY
    
    hitbox.style.left = f"{x}px"
    hitbox.style.top = f"{y}px"

async def launch_plateformer():
    try:
        response = await window.fetch("./js/assets/plateform.js")
        
        if response.ok:
            js_code = await response.text()
            
            pyodide.code.run_js(js_code)
            
            print("// 'plateform.js' initiated! //")
        else:
            print(f"// Failed to initiate 'plateform.js'! HTTP Status: {response.status} //")
            
    except Exception as e:
        print(f"// Failed to initiate 'plateform.js'! Error: {e} //")

    plateformer_container = document.querySelector("#_win_container.plateformer_core")
    if plateformer_container:
        plateformer_container.style.display = "block"

    plateformer_core_container = document.querySelector(".plateformer_core")
    if plateformer_core_container:
        await asyncio.sleep(0.02)

        window.eval('document.querySelector(".plateformer_core").classList.add("open");')
        
    if hasattr(window, "initPlateformer"):
        window.initPlateformer()

    await asyncio.sleep(0.85)

    clock_base = document.getElementById("_clock_base")
    if clock_base:
        clock_base.style.display = "none"

    print("// plateformer initiated! //")

async def check_plateformer_trigger(event):
    global plateformer_index, is_broken, _GLOBAL_ATTRIBUTES

    if is_broken or event_occured():
        return
    
    char = event.key.lower()
    
    if char == plateformer_sequence[plateformer_index]:
        plateformer_index += 1
        #print(f"// maze progress: {plateformer_index}/4 //")
        
        snd_correct_sfx = False

        if plateformer_index == 1:
            snd_correct_sfx = Audio.new("./assets/other/sfxs/Windows Default.wav")
        elif plateformer_index == 2:
            snd_correct_sfx = Audio.new("./assets/other/sfxs/Windows Ding.wav")
        elif plateformer_index == 3:
            snd_correct_sfx = Audio.new("./assets/other/sfxs/Windows Error.wav")
        elif plateformer_index == 4:
            snd_correct_sfx = Audio.new("./assets/other/sfxs/Windows Exclamation.wav")

        snd_correct_sfx.loop = False
        snd_correct_sfx.volume = 0.25
        snd_correct_sfx.play()
        
        if plateformer_index == len(plateformer_sequence):
            is_broken = True

            _GLOBAL_ATTRIBUTES.append("_event_occured")
            
            document.title = "plateformer"
            change_website_icon("./assets/other/maze/smile.png")

            refresh_container = document.querySelector(".refresh")
            if refresh_container:
                await asyncio.sleep(0.02)
            
                window.eval('document.querySelector(".refresh").classList.add("open");')
            #asyncio.create_task(fade_in("refresh", target_opacity=1, duration=2.0))
            
            await launch_plateformer()
            
            plateformer_index = 0
    else:
        print(char)
        if char == plateformer_sequence[0]:
            plateformer_index = 1
        else:
            plateformer_index = 0

async def launch_maze():
    try:
        response = await window.fetch("./js/assets/labyrinth.js")
        
        if response.ok:
            js_code = await response.text()
            
            pyodide.code.run_js(js_code)
            
            print("// 'labyrinth.js' initiated! //")
        else:
            print(f"// Failed to initiate 'labyrinth.js'! HTTP Status: {response.status} //")
            
    except Exception as e:
        print(f"// Failed to initiate 'labyrinth.js'! Error: {e} //")

    maze_container = document.querySelector("#_win_container.maze_core")
    if maze_container:
        maze_container.style.display = "block"

    maze_border_container = document.querySelector(".maze_core")
    maze_score_container = document.querySelector(".maze_details")
    if maze_border_container and maze_score_container:
        await asyncio.sleep(0.02)

        window.eval('document.querySelector(".maze_core").classList.add("open");')
        window.eval('document.querySelector(".maze_details").classList.add("open");')
        
    if hasattr(window, "initMaze"):
        window.initMaze()

    await asyncio.sleep(0.85)

    clock_base = document.getElementById("_clock_base")
    if clock_base:
        clock_base.style.display = "none"

    print("// labyrinth initiated! //")

async def check_maze_trigger(event):
    global maze_index, is_broken, _GLOBAL_ATTRIBUTES

    if is_broken or event_occured():
        return
    
    char = event.key.lower()
    
    if char == maze_sequence[maze_index]:
        maze_index += 1
        #print(f"// maze progress: {maze_index}/4 //")
        
        snd_correct_sfx = False

        if maze_index == 1:
            snd_correct_sfx = Audio.new("./assets/other/sfxs/CS_EXCLA.WAV")
        elif maze_index == 2:
            snd_correct_sfx = Audio.new("./assets/other/sfxs/CS_EMPTY.WAV")
        elif maze_index == 3:
            snd_correct_sfx = Audio.new("./assets/other/sfxs/CS_ASTER.WAV")
        elif maze_index == 4:
            snd_correct_sfx = Audio.new("./assets/other/sfxs/CS_DEFAU.WAV")

        snd_correct_sfx.loop = False
        snd_correct_sfx.volume = 0.25
        snd_correct_sfx.play()
        
        if maze_index == len(maze_sequence):
            is_broken = True

            _GLOBAL_ATTRIBUTES.append("_event_occured")
            
            document.title = "labyrinth"
            change_website_icon("./assets/other/maze/smile.png")

            refresh_container = document.querySelector(".refresh")
            if refresh_container:
                await asyncio.sleep(0.02)
            
                window.eval('document.querySelector(".refresh").classList.add("open");')
            #asyncio.create_task(fade_in("refresh", target_opacity=1, duration=2.0))
            
            await launch_maze()
            
            maze_index = 0
    else:
        if char == maze_sequence[0]:
            maze_index = 1
        else:
            maze_index = 0

async def break_clock(event):
    global is_broken, click_count, _GLOBAL_ATTRIBUTES

    if event_occured(): 
        return
    if is_broken:
        return

    snd_tap = Audio.new("./assets/other/sfxs/Windows Navigation Start.wav")
    snd_tap.loop = False
    snd_tap.volume = 0.65
    snd_tap.play()

    if click_count >= 4:
        is_broken = True

        _GLOBAL_ATTRIBUTES.append("_event_occured")
        
        clock_base = document.getElementById("_clock_base")
        pin = document.getElementById("center-pin")
        hour_hand = document.getElementById("hour-hand")
        minute_hand = document.getElementById("minute-hand")
        second_hand = document.getElementById("second-hand")

        document.body.classList.add("screen-shake")

        snd_shatter = Audio.new("./assets/other/sfxs/glass_m1.ogg")
        snd_shatter.loop = False
        snd_shatter.volume = 0.25
        snd_shatter.play()
            
        for hand in [hour_hand, minute_hand, second_hand]:
            if hand:
                hand.classList.add("fall")
            
        if pin:
            pin.classList.add("fall")

        await asyncio.sleep(0.15)
        if clock_base:
            clock_base.classList.add("lean")

        document.title = "why did you do that for?"
        
        await asyncio.sleep(1.0)
        document.body.classList.remove("screen-shake")
            
        await asyncio.sleep(1.0)
        refresh_container = document.querySelector(".refresh")
        if refresh_container:
            await asyncio.sleep(0.02)
                    
            window.eval('document.querySelector(".refresh").classList.add("open");')
        #asyncio.create_task(fade_in("refresh", target_opacity=1, duration=2.0))
            
        print("// uh oh //")

    click_count += 1

def clock_system(event=None):
    if is_broken:
        return
        
    clock_base = document.getElementById("_clock_base")
    if not clock_base:
        return

    screen_width = window.innerWidth
    screen_height = window.innerHeight
    
    clock_width = clock_base.offsetWidth
    clock_height = clock_base.offsetHeight

    if clock_width <= 0 or clock_height <= 0: 
        return

    center_x = screen_width / 2
    center_y = screen_height / 2

    clock_base.style.position = "absolute"
    clock_base.style.left = f"{center_x}px"
    clock_base.style.top = f"{center_y}px"

async def clock_ticker():
    global current_h_deg, current_m_deg, current_s_deg
    hour_hand = document.getElementById("hour-hand")
    minute_hand = document.getElementById("minute-hand")
    second_hand = document.getElementById("second-hand")
    
    while True:
        if is_broken:
            break
            
        if hour_hand and minute_hand and second_hand:
            now = datetime.now()
            h = now.hour % 12
            m = now.minute
            s = now.second

            time_string = now.strftime("%H:%M:%S")
            document.title = time_string
            
            current_s_deg = s * 6
            current_m_deg = (m * 6) + (s * 0.1)
            current_h_deg = (h * 30) + (m * 0.5)
            
            hour_hand.style.transform = f"translate(-50%, 0) rotate({current_h_deg}deg)"
            minute_hand.style.transform = f"translate(-50%, 0) rotate({current_m_deg}deg)"
            second_hand.style.transform = f"translate(-50%, 0) rotate({current_s_deg}deg)"  
            
        await asyncio.sleep(1)

async def hide_screen_cover():
    loading_screen = document.getElementById("_screen_cover")
    if loading_screen:
        snd_fade = Audio.new("./assets/other/sfxs/Windows Print complete.wav")
        snd_fade.loop = False
        snd_fade.volume = 0.25
        snd_fade.play()

        loading_screen.classList.add("fade-out")
        await asyncio.sleep(0.5)

async def reveal_screen_cover():
    loading_screen = document.getElementById("_screen_cover")
    if loading_screen:
        loading_screen.classList.remove("fade-out")
        loading_screen.classList.add("fade-in")
        await asyncio.sleep(0.5)

def collapse(event):
    el = event.target.closest(".click-collapse")
    if el and (not hasattr(el.dataset, "physicsStarted") or not el.dataset.physicsStarted):
        snd_tap = Audio.new("./assets/other/sfxs/Windows Startup.wav")
        snd_tap.loop = False
        snd_tap.volume = 0.65
        snd_tap.play()

        el.classList.add("fall")

def setup_listeners():
    #_GLOBAL_PROXIES["cursor"] = create_proxy(follow_cursor)
    _GLOBAL_PROXIES["reload"] = create_proxy(reload_page)

    _GLOBAL_PROXIES["clock"] = create_proxy(clock_system)
    _GLOBAL_PROXIES["break"] = create_proxy(break_clock)
    _GLOBAL_PROXIES["collapse"] = create_proxy(collapse)

    #_GLOBAL_PROXIES["kitty"] = create_proxy(create_kitty)

    _GLOBAL_PROXIES["maze_key"] = create_proxy(check_maze_trigger)
    _GLOBAL_PROXIES["platformer_key"] = create_proxy(check_plateformer_trigger)

    _GLOBAL_PROXIES["youtube_link"] = create_proxy(youtube_link)
    _GLOBAL_PROXIES["kofi_link"] = create_proxy(kofi_link)
    
    #document.addEventListener("mousemove", _GLOBAL_PROXIES["cursor"])
    window.addEventListener("resize", _GLOBAL_PROXIES["clock"])

    document.addEventListener("keydown", _GLOBAL_PROXIES["maze_key"])
    document.addEventListener("keydown", _GLOBAL_PROXIES["platformer_key"])
    
    pin = document.getElementById("center-pin")
    if pin:
        pin.addEventListener("click", _GLOBAL_PROXIES["break"])
        
    refresh_btn = document.getElementById("_refresh_txt")
    if refresh_btn:
        refresh_btn.addEventListener("click", _GLOBAL_PROXIES["reload"])

    youtube_btn = document.getElementById("_youtube_link")
    kofi_btn = document.getElementById("_kofi_link")
    if youtube_btn:
        youtube_btn.addEventListener("click", _GLOBAL_PROXIES["youtube_link"])
    if kofi_btn:
        kofi_btn.addEventListener("click", _GLOBAL_PROXIES["kofi_link"])
      
    document.body.addEventListener("click", _GLOBAL_PROXIES["collapse"])
    
    '''secret_kitty_btn = document.getElementById("_secret_kitty")
    if secret_kitty_btn:
        secret_kitty_btn.addEventListener("click", _GLOBAL_PROXIES["kitty"])'''
        
    print("// listeners activated //")

clock_system()
asyncio.create_task(clock_ticker())
asyncio.create_task(hide_screen_cover())

if document.readyState == "complete":
    print("// site pre-loaded //")
    setup_listeners()
else:
    _GLOBAL_PROXIES["loader"] = create_proxy(lambda e: setup_listeners())
    window.addEventListener("load", _GLOBAL_PROXIES["loader"])