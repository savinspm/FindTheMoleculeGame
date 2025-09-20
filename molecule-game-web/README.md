# Encuentra la Molécula - Web Version

Esta es la versión web del juego "Encuentra la Molécula", diseñado para ayudar a los niños a aprender sobre moléculas de una manera divertida e interactiva.

## Características

- **Pantalla de Bienvenida**: Los jugadores pueden ingresar su nombre y comenzar a jugar.
- **Visualización 3D de Moléculas**: Utilizando 3Dmol.js para la visualización interactiva de moléculas.
- **Sistema de Puntuación**: Aciertos, intentos y cálculo de precisión.
- **Rankings**: Almacenamiento local de las mejores puntuaciones.
- **Límite de Tiempo**: 60 segundos para encontrar tantas moléculas como sea posible.

## Tecnologías Utilizadas

- HTML5, CSS3, JavaScript
- 3Dmol.js para visualización molecular 3D
- LocalStorage para almacenamiento de rankings
- Diseño responsivo que funciona en dispositivos móviles y de escritorio

## Cómo Jugar

1. Ingresa tu nombre y presiona "¡COMENZAR!"
2. Observa la molécula objetivo que aparece en la parte superior
3. Selecciona la opción correcta entre las tres moléculas mostradas abajo
4. Intenta acertar tantas moléculas como puedas antes de que se acabe el tiempo de 60 segundos

## Estructura del Proyecto

```
molecule-game-web/
├── css/
│   └── styles.css            # Estilos CSS para la aplicación
├── data/
│   └── DB/                   # Carpeta con archivos de moléculas mol2
├── img/                      # Carpeta para imágenes (si se necesitan)
├── js/
│   ├── game.js               # Lógica principal del juego
│   ├── main.js               # Script de inicialización
│   ├── molecule-parser.js    # Funciones para analizar archivos mol2
│   ├── molecule-viewer.js    # Visualización de moléculas con 3Dmol.js
│   └── ranking.js            # Manejo del sistema de rankings
└── index.html                # Página principal
```

## Instalación y Ejecución

1. Clona el repositorio
2. Coloca tus archivos de moléculas (.mol2) en la carpeta `data/DB/`
3. Abre `index.html` en un servidor web local o sube los archivos a un servidor web

Nota: Para una correcta visualización de las moléculas, se requiere un navegador moderno con soporte para WebGL.

## Diferencias con la Versión Original

Esta versión web mantiene todas las características principales del juego original en Python, adaptadas para funcionar en un navegador:

- Reemplaza PyGame con HTML/CSS/JavaScript
- Utiliza 3Dmol.js en lugar de PyOpenGL para visualización 3D
- Almacena rankings en LocalStorage en lugar de archivos JSON
- Interfaz adaptada para funcionar tanto en dispositivos móviles como de escritorio

## Contribuciones

Las contribuciones son bienvenidas. Siéntete libre de abrir un issue o enviar un pull request.