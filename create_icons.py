#!/usr/bin/env python3
"""
Script para crear iconos PNG simples para la extensión Anti Zombie Scroll
"""

try:
    from PIL import Image, ImageDraw
except ImportError:
    print("Instalando Pillow...")
    import subprocess
    import sys
    subprocess.check_call([sys.executable, "-m", "pip", "install", "Pillow"])
    from PIL import Image, ImageDraw

def create_icon(size, filename):
    """Crear un icono con el símbolo de prohibido"""
    # Crear imagen con fondo transparente
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Colores
    bg_color = (102, 126, 234, 255)  # #667eea
    white_color = (255, 255, 255, 255)
    
    # Círculo de fondo con gradiente simulado
    center = size // 2
    radius = int(size * 0.45)
    
    # Dibujar círculo de fondo
    draw.ellipse([center - radius, center - radius, center + radius, center + radius], 
                 fill=bg_color, outline=white_color, width=max(1, size//32))
    
    # Círculo interior (símbolo prohibido)
    inner_radius = int(size * 0.25)
    line_width = max(2, size // 16)
    draw.ellipse([center - inner_radius, center - inner_radius, center + inner_radius, center + inner_radius], 
                 fill=None, outline=white_color, width=line_width)
    
    # Línea diagonal
    diagonal_offset = int(inner_radius * 0.7)
    diagonal_width = max(2, size // 12)
    draw.line([center - diagonal_offset, center - diagonal_offset, 
               center + diagonal_offset, center + diagonal_offset], 
              fill=white_color, width=diagonal_width)
    
    # Guardar imagen
    img.save(filename, 'PNG')
    print(f"Icono creado: {filename} ({size}x{size})")

def main():
    """Crear todos los iconos necesarios"""
    sizes = [16, 48, 128]
    
    for size in sizes:
        filename = f"icons/icon{size}.png"
        create_icon(size, filename)
    
    print("✅ Todos los iconos han sido creados exitosamente!")

if __name__ == "__main__":
    main()