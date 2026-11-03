# Referencias

- **../nerdose.html** — Prototipo HTML de nerdose y **base del diseño UI/UX**: identidad visual (estética terminal/dev oscura, JetBrains Mono, acento `#3DDC84`, acento por juego), layout y 7 pantallas (Home, Estadísticas, Devdle, Bug Hunt, Big O, Tech Timeline y Grep Grid), cada una como `<template id="tpl-<Pantalla>">` con su CSS (`css-<Pantalla>`) y JS (`js-<Pantalla>`). Es una referencia de estilo y estructura, no una especificación: no tiene que quedar igual, y donde difiere del PRD (datos, métricas, reglas) manda el PRD. Las diferencias ya conocidas están en NFR-U07 de `docs/prd/requirements.md` (por ejemplo, Grep Grid sin tiempo).
  Servicios: web, admin (el admin no tiene pantallas en el prototipo: extiende su lenguaje visual)
  Lectura: buscar por pantalla (`tpl-Main`, `tpl-Stats`, `tpl-Devdle`, `tpl-BugHunt`, `tpl-BigO`, `tpl-Timeline`, `tpl-GrepGrid`); es un archivo grande (~140 KB), no leer completo
