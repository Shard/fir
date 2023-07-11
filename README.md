# Foxhole Pyramid Report
Forked from [Foxhole Inventory Report](https://github.com/GICodeWarrior/fir), which mostly just wraps their excellent work with a different UI.

This tool analyses screenshots from [Foxhole](https://www.foxholegame.com/about-foxhole) containing tooltips of the base you are looking to supply using the Logi Pyramid as a basis.

1. Open the map and hover the the base you want to supply
2. Take a screenshot
3. Paste it into https://pyramid.82dk.net
4. Profit

## Status
Currently a bit of a hack around fir as a proof of concept but thanks to their solid image recognition, its fully functional and should even work with icon mods.

Feel free to open an issue if you notice anything not working or have a suggestion on how it can be improved.

## Development
Standalone website:
```
cd fir
python3 -m http.server
```

## License
All original source code and contributions available under MIT License.

Catalog details and icons processed from the game Foxhole (created by [Siege Camp](https://www.siegecamp.com/)) are made available only under Fair Use.
