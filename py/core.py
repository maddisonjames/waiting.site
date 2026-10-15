import asyncio
import random
from datetime import datetime
from js import document, window
from pyodide.ffi import create_proxy

print(f"// core loaded //")

_GLOBAL_PROXIES = {}
click_count = 0
is_broken = False
current_h_deg = 0
current_m_deg = 0
current_s_deg = 0

def follow_cursor(event):
    hitbox = document.getElementById("_cursor_box")
    if not hitbox:
        return

    x = event.clientX
    y = event.clientY
    
    hitbox.style.left = f"{x}px"
    hitbox.style.top = f"{y}px"

def break_clock(event):
    global is_broken, click_count
    if is_broken:
        return

    click_count += 1
    if click_count >= 5:
        is_broken = True  # Stops the ticker from overwriting transform values
        
        clock_base = document.getElementById("_clock_base")
        pin = document.getElementById("center-pin")
        hour_hand = document.getElementById("hour-hand")
        minute_hand = document.getElementById("minute-hand")
        second_hand = document.getElementById("second-hand")
        
        if clock_base:
            clock_base.classList.add("lean")
            
        hands_data = [
            (hour_hand, current_h_deg),
            (minute_hand, current_m_deg),
            (second_hand, current_s_deg)
        ]
        
        # Apply physics triggers to each hand so JS physics takes over seamlessly
        for hand, start_rot in hands_data:
            if hand:
                hand.classList.add("fall")
            
        if pin:
            pin.classList.add("fall")
            
        print("// clock broken naturally //")

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
            break  # Exit ticker loop entirely once broken so it never touches the hands again
            
        if hour_hand and minute_hand and second_hand:
            now = datetime.now()
            h = now.hour % 12
            m = now.minute
            s = now.second
            
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

def setup_listeners():
    _GLOBAL_PROXIES["cursor"] = create_proxy(follow_cursor)
    _GLOBAL_PROXIES["clock"] = create_proxy(clock_system)
    _GLOBAL_PROXIES["break"] = create_proxy(break_clock)
    
    document.addEventListener("mousemove", _GLOBAL_PROXIES["cursor"])
    window.addEventListener("resize", _GLOBAL_PROXIES["clock"])
    
    pin = document.getElementById("center-pin")
    if pin:
        pin.addEventListener("click", _GLOBAL_PROXIES["break"])
        
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