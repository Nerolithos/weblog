Visual Analytics of Global Shift in Energy Consumption Patterns


DESCRIPTION

This package is a browser-based D3.js visualization project for exploring global renewable energy patterns. The main page presents an interactive world view with globe, tile map, and flat map modes, year controls, and renewable-share coloring. Users can inspect how countries change over time and compare patterns across the world.

The package also includes a Country Profile page that expands a selected country into a more detailed view. This page combines yearly cluster membership, renewable-share trends, annual electricity-source composition, cluster summaries, and interactive map highlighting. All data is loaded from local CSV, JSON, and XLSX files included in this folder.

The project is distributed as a static web package. There is no separate backend service and no build step is required for normal use.


INSTALLATION

Option 1: Run the hosted version
Open the published site directly in a web browser:
https://blog.nero-lithos.com/DDA/

Option 2: Run from a downloaded GitHub repository (https://github.com/Nerolithos/weblog/tree/main/static/DDA)
1. Download or clone the repository "weblog/static/DDA/".
2. Keep the folder structure unchanged so that files such as index.html, country.html, CSV files, JSON files, and XLSX files remain in the same relative locations.
3. Start a local static web server from the parent static directory or from this DDA directory.

Example using Python:
python3 -m http.server 8000

Then open one of the following in your browser:
If the server is started inside the DDA folder:
http://localhost:8000/
If the server is started from the parent static folder:
http://localhost:8000/DDA/


EXECUTION

To run a demo, open the main entry page index.html through the hosted website or through your local static server. The recommended demo path is:
1. Open the main DDA page.
2. Use the year slider or playback control to animate the data.
3. Switch between Globe, Tile map, and Map views.
4. Click a country to open the Country Profile page.
5. On the Country Profile page, inspect the yearly bar chart, renewable-share trend, clustering view, and map interactions.

For the simplest demonstration, use the hosted deployment:
https://blog.nero-lithos.com/DDA/
