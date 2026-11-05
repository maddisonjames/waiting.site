import asyncio
import random
from datetime import datetime
import time
from js import document, window, Audio
import pyodide.code
from pyodide.ffi import create_proxy

print(f"// python run! //\n")
print("## Created by Maddison James. An amalgomation of all the wacky ideas my brain can come up with. Code word is 'maze'. ##\n")
_GLOBAL_PROXIES = {}
click_count = 0
is_broken = False
current_h_deg = 0
current_m_deg = 0
current_s_deg = 0

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
    core_attribute = document.getElementById("_core_attribute")
    if core_attribute.classList.contains("_event_occured"):
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

def reload_page(event):
    window.location.reload()

def follow_cursor(event):
    hitbox = document.getElementById("_cursor_box")
    if not hitbox:
        return

    x = event.clientX
    y = event.clientY
    
    hitbox.style.left = f"{x}px"
    hitbox.style.top = f"{y}px"

async def launch_maze():
    try:
        response = await window.fetch("./js/assets/render.js")
        
        if response.ok:
            js_code = await response.text()
            
            pyodide.code.run_js(js_code)
            
            print("// Rendering initiated! //")
        else:
            print(f"// Failed to initiate rendering system! HTTP Status: {response.status} //")
            
    except Exception as e:
        print(f"// Failed to initiate rendering system! Error: {e} //")

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
    global maze_index, is_broken
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
            
            core_attribute = document.getElementById("_core_attribute")
            core_attribute.classList.add("_event_occured")
            
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
    global is_broken, click_count

    if event_occured(): 
        return
    if is_broken:
        return

    click_count += 1
    if click_count >= 5:
        is_broken = True

        core_attribute = document.getElementById("_core_attribute")
        core_attribute.classList.add("_event_occured")
        
        clock_base = document.getElementById("_clock_base")
        pin = document.getElementById("center-pin")
        hour_hand = document.getElementById("hour-hand")
        minute_hand = document.getElementById("minute-hand")
        second_hand = document.getElementById("second-hand")

        # Trigger screen shake on the body (or your main wrapper)
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

async def remove_loading_screen():
    loading_screen = document.getElementById("_loading_box")
    if loading_screen:
        loading_screen.classList.add("fade-out")
        await asyncio.sleep(0.5)
        loading_screen.remove()

def collapse(event):
    el = event.target.closest(".click-collapse")
    if el and (not hasattr(el.dataset, "physicsStarted") or not el.dataset.physicsStarted):
        el.classList.add("fall")

async def create_kitty(event):
    if event_occured(): 
        return

    bg_element = document.getElementById("_kitty_background")
    
    asyncio.create_task(play_audio_with_fade_in("./assets/other/sfxs/kitty_music.mp3", duration=2.0, loop=True, volume=0.5))
    
    if bg_element:
        if not bg_element.classList.contains("kat_clicked__"):
            core_attribute = document.getElementById("_core_attribute")
            core_attribute.classList.add("_event_occured")

            bg_element.classList.add("kat_clicked__")

            change_website_icon("./assets/other/kitties/cursor.png")
            
            asyncio.create_task(fade_in("_kitty_background", target_opacity=1, duration=2.0))

            await asyncio.sleep(3)
            refresh_container = document.querySelector(".refresh")
            if refresh_container:
                await asyncio.sleep(0.02)
                        
                window.eval('document.querySelector(".refresh").classList.add("open");')
            #asyncio.create_task(fade_in("refresh", target_opacity=1, duration=1.0))
            print("\\ kats \\")
        else:
            print("\\ too many kats \\")

def setup_listeners():
    #_GLOBAL_PROXIES["cursor"] = create_proxy(follow_cursor)
    _GLOBAL_PROXIES["reload"] = create_proxy(reload_page)
    _GLOBAL_PROXIES["clock"] = create_proxy(clock_system)
    _GLOBAL_PROXIES["break"] = create_proxy(break_clock)
    _GLOBAL_PROXIES["collapse"] = create_proxy(collapse)
    #_GLOBAL_PROXIES["kitty"] = create_proxy(create_kitty)
    _GLOBAL_PROXIES["maze_key"] = create_proxy(check_maze_trigger)
    
    #document.addEventListener("mousemove", _GLOBAL_PROXIES["cursor"])
    window.addEventListener("resize", _GLOBAL_PROXIES["clock"])
    document.addEventListener("keydown", _GLOBAL_PROXIES["maze_key"])
    
    pin = document.getElementById("center-pin")
    if pin:
        pin.addEventListener("click", _GLOBAL_PROXIES["break"])
        
    refresh_btn = document.getElementById("_refresh_txt")
    if refresh_btn:
        refresh_btn.addEventListener("click", _GLOBAL_PROXIES["reload"])
      
    document.body.addEventListener("click", _GLOBAL_PROXIES["collapse"])
    
    '''secret_kitty_btn = document.getElementById("_secret_kitty")
    if secret_kitty_btn:
        secret_kitty_btn.addEventListener("click", _GLOBAL_PROXIES["kitty"])'''
        
    print("// listeners activated //")

clock_system()
asyncio.create_task(clock_ticker())
asyncio.create_task(remove_loading_screen())

if document.readyState == "complete":
    print("// site pre-loaded //")
    setup_listeners()
else:
    _GLOBAL_PROXIES["loader"] = create_proxy(lambda e: setup_listeners())
    window.addEventListener("load", _GLOBAL_PROXIES["loader"])