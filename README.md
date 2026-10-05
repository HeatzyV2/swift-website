# Swift Client — site

Site de présentation et de téléchargement de Swift Client. Statique (HTML, CSS, JS), sans build.

- Même identité que le launcher : blocs carrés à contour noir, police pixel, animations par paliers, mascotte **Zip**.
- **11 thèmes** au choix (les mêmes que le launcher), changés en direct et retenus dans le navigateur (`localStorage`, ou `?theme=nether` dans l'URL).
- Zip est dessiné sur un canvas depuis `mascot.js` (24×26 pixels) dans la couleur d'accent du thème ; clique dessus pour une astuce, il court de temps en temps.
- Navigation par touches 1 à 7 (comme la hotbar du jeu).
- Les boutons de téléchargement pointent sur la dernière release de
  [HeatzyV2/swift-client](https://github.com/HeatzyV2/swift-client/releases) (API GitHub, dans `app.js`) :
  rien à modifier à chaque nouvelle version.
- Aperçu local : `python -m http.server 5510` puis http://localhost:5510.
- Hébergement : n'importe quel hébergeur statique (GitHub Pages, Cloudflare Pages, Netlify).
