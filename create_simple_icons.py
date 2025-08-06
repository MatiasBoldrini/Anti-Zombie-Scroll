#!/usr/bin/env python3
"""
Script simple para crear iconos básicos sin dependencias externas
"""

def create_simple_png(size, filename):
    """Crear un PNG básico usando solo bibliotecas estándar"""
    import struct
    import zlib
    
    # Crear imagen simple de color sólido con patrón
    width, height = size, size
    
    # Datos RGBA simples - crear un ícono circular básico
    pixels = []
    center = size // 2
    radius = size // 3
    
    for y in range(height):
        row = []
        for x in range(width):
            # Distancia del centro
            dx = x - center
            dy = y - center
            distance = (dx*dx + dy*dy) ** 0.5
            
            # Crear un círculo con símbolo de prohibido
            if distance <= radius:
                # Dentro del círculo
                if abs(dx - dy) < 3 or abs(dx + dy) < 3:  # Líneas diagonales
                    row.extend([255, 255, 255, 255])  # Blanco
                elif distance > radius - 3:  # Borde
                    row.extend([255, 255, 255, 255])  # Blanco
                else:
                    row.extend([102, 126, 234, 255])  # Azul
            else:
                row.extend([0, 0, 0, 0])  # Transparente
        pixels.extend(row)
    
    # Convertir a bytes
    pixels_bytes = bytes(pixels)
    
    # Crear PNG usando formato básico
    def write_png(buf, width, height, pixels):
        def write_chunk(buf, chunk_type, data):
            buf.extend(struct.pack('>I', len(data)))
            buf.extend(chunk_type)
            buf.extend(data)
            crc = zlib.crc32(chunk_type + data) & 0xffffffff
            buf.extend(struct.pack('>I', crc))
        
        # PNG signature
        buf.extend([137, 80, 78, 71, 13, 10, 26, 10])
        
        # IHDR chunk
        ihdr = struct.pack('>IIBBBBB', width, height, 8, 6, 0, 0, 0)
        write_chunk(buf, b'IHDR', ihdr)
        
        # IDAT chunk
        compressor = zlib.compressobj()
        png_data = []
        for y in range(height):
            png_data.append(0)  # Filter type
            for x in range(width):
                idx = (y * width + x) * 4
                png_data.extend(pixels[idx:idx+4])
        
        idat = compressor.compress(bytes(png_data))
        idat += compressor.flush()
        write_chunk(buf, b'IDAT', idat)
        
        # IEND chunk
        write_chunk(buf, b'IEND', b'')
    
    # Crear el archivo PNG
    png_buf = bytearray()
    write_png(png_buf, width, height, pixels)
    
    with open(filename, 'wb') as f:
        f.write(png_buf)
    
    print(f"Icono creado: {filename} ({size}x{size})")

def main():
    """Crear iconos básicos"""
    sizes = [16, 48, 128]
    
    for size in sizes:
        filename = f"icons/icon{size}.png"
        try:
            create_simple_png(size, filename)
        except Exception as e:
            print(f"Error creando {filename}: {e}")
            # Crear un archivo PNG mínimo como fallback
            create_minimal_png(size, filename)
    
    print("✅ Iconos básicos creados!")

def create_minimal_png(size, filename):
    """Crear un PNG mínimo como fallback"""
    # PNG de 1x1 pixel transparente escalado
    minimal_png = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\rIDATx\x9cc\xf8\x0f\x00\x00\x01\x00\x01\x00\x18\xdd\x8d\xb4\x00\x00\x00\x00IEND\xaeB`\x82'
    
    with open(filename, 'wb') as f:
        f.write(minimal_png)
    
    print(f"Icono minimal creado: {filename}")

if __name__ == "__main__":
    main()