import math
from PIL import Image, ImageDraw, ImageFont
import os

def create_pwa_icon(size, is_maskable=False):
    # Create high-res canvas
    scale = 2
    actual_size = size * scale
    img = Image.new("RGBA", (actual_size, actual_size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Rounded background or full background for maskable
    # Gradient background: from deep indigo-slate (15, 23, 42) to midnight (2, 6, 23)
    bg_color_top = (15, 23, 42, 255)
    bg_color_bot = (2, 6, 23, 255)

    if is_maskable:
        # Maskable icons must fill the entire canvas without rounded corners
        corner_radius = 0
    else:
        # Standard app icon has modern rounded corners
        corner_radius = int(actual_size * 0.22)

    # Draw gradient background
    bg_mask = Image.new("L", (actual_size, actual_size), 0)
    bg_mask_draw = ImageDraw.Draw(bg_mask)
    if corner_radius > 0:
        bg_mask_draw.rounded_rectangle([(0, 0), (actual_size, actual_size)], radius=corner_radius, fill=255)
    else:
        bg_mask_draw.rectangle([(0, 0), (actual_size, actual_size)], fill=255)

    for y in range(actual_size):
        ratio = y / actual_size
        r = int(bg_color_top[0] * (1 - ratio) + bg_color_bot[0] * ratio)
        g = int(bg_color_top[1] * (1 - ratio) + bg_color_bot[1] * ratio)
        b = int(bg_color_top[2] * (1 - ratio) + bg_color_bot[2] * ratio)
        draw.line([(0, y), (actual_size, y)], fill=(r, g, b, 255))

    img.putalpha(bg_mask)
    draw = ImageDraw.Draw(img)

    # Safe zone factor: maskable icons must keep key content inside 70-80% safe area
    content_scale = 0.65 if is_maskable else 0.78
    center = actual_size / 2.0
    radius = (actual_size * content_scale) / 2.0

    # Draw subtle glowing outer rings
    for ring_offset, alpha in [(12, 35), (8, 60), (4, 100)]:
        r = radius + ring_offset * scale
        draw.ellipse(
            [center - r, center - r, center + r, center + r],
            outline=(249, 115, 22, alpha),
            width=int(1.5 * scale)
        )

    # Draw main outer golden-orange compass dial ring
    draw.ellipse(
        [center - radius, center - radius, center + radius, center + radius],
        outline=(245, 158, 11, 240),
        width=int(5 * scale)
    )

    # Draw 8-direction compass tick marks
    tick_outer = radius
    for i in range(16):
        angle = i * (math.pi / 8)
        is_cardinal = (i % 4 == 0)
        is_subcardinal = (i % 2 == 0)
        
        tick_len = (18 if is_cardinal else (12 if is_subcardinal else 6)) * scale
        tick_inner = tick_outer - tick_len
        tick_width = (4 if is_cardinal else (2.5 if is_subcardinal else 1.5)) * scale

        x1 = center + tick_inner * math.cos(angle)
        y1 = center + tick_inner * math.sin(angle)
        x2 = center + tick_outer * math.cos(angle)
        y2 = center + tick_outer * math.sin(angle)
        
        col = (251, 191, 36, 255) if is_cardinal else (249, 115, 22, 200)
        draw.line([(x1, y1), (x2, y2)], fill=col, width=int(tick_width))

    # Inner circular badge with radial saffron glow
    inner_rad = radius * 0.72
    draw.ellipse(
        [center - inner_rad, center - inner_rad, center + inner_rad, center + inner_rad],
        fill=(30, 41, 59, 230),
        outline=(251, 146, 60, 200),
        width=int(2.5 * scale)
    )

    # Compass 4-point star needle (Saffron & Amber)
    needle_r = inner_rad * 0.88
    needle_w = inner_rad * 0.22

    # North needle (Bright Orange to Golden Amber)
    n_poly = [
        (center, center - needle_r),
        (center + needle_w, center),
        (center, center),
    ]
    draw.polygon(n_poly, fill=(249, 115, 22, 255))
    n_poly_left = [
        (center, center - needle_r),
        (center - needle_w, center),
        (center, center),
    ]
    draw.polygon(n_poly_left, fill=(251, 146, 60, 255))

    # South needle
    s_poly = [
        (center, center + needle_r),
        (center + needle_w, center),
        (center, center),
    ]
    draw.polygon(s_poly, fill=(217, 119, 6, 240))
    s_poly_left = [
        (center, center + needle_r),
        (center - needle_w, center),
        (center, center),
    ]
    draw.polygon(s_poly_left, fill=(245, 158, 11, 240))

    # East needle
    e_poly = [
        (center + needle_r, center),
        (center, center - needle_w),
        (center, center),
    ]
    draw.polygon(e_poly, fill=(234, 88, 12, 240))
    e_poly_bot = [
        (center + needle_r, center),
        (center, center + needle_w),
        (center, center),
    ]
    draw.polygon(e_poly_bot, fill=(194, 65, 12, 240))

    # West needle
    w_poly = [
        (center - needle_r, center),
        (center, center - needle_w),
        (center, center),
    ]
    draw.polygon(w_poly, fill=(251, 146, 60, 240))
    w_poly_bot = [
        (center - needle_r, center),
        (center, center + needle_w),
        (center, center),
    ]
    draw.polygon(w_poly_bot, fill=(234, 88, 12, 240))

    # Center jewel
    core_rad = needle_w * 0.75
    draw.ellipse(
        [center - core_rad, center - core_rad, center + core_rad, center + core_rad],
        fill=(254, 240, 138, 255),
        outline=(180, 83, 9, 255),
        width=int(2 * scale)
    )

    # Resize with high-quality Lanczos resampling
    final_img = img.resize((size, size), Image.Resampling.LANCZOS)
    return final_img

os.makedirs("public", exist_ok=True)

# Generate standard PWA icons
icons = [
    ("public/pwa-64x64.png", 64, False),
    ("public/pwa-192x192.png", 192, False),
    ("public/pwa-512x512.png", 512, False),
    ("public/maskable-icon-512x512.png", 512, True),
    ("public/apple-touch-icon-180x180.png", 180, False),
    ("public/favicon-32x32.png", 32, False),
]

for path, size, maskable in icons:
    im = create_pwa_icon(size, is_maskable=maskable)
    im.save(path, "PNG")
    print(f"Generated {path} ({size}x{size}, maskable={maskable})")

# Also save favicon.ico
fav = create_pwa_icon(64, is_maskable=False)
fav.save("public/favicon.ico", format="ICO", sizes=[(16, 16), (32, 32), (48, 48), (64, 64)])
print("Generated public/favicon.ico")
