# weatherbulletinusa
A (soon-to-be) comprehensive weather app for webOS, written in Enyo 1.

Goals
-----
1. Provide weather data from open, non-propietary sources.
2. Provide a user interface with fast response times.
3. Hide network activity from the user by performing downloads in the background and caching the data locally.
4. Display weather information for multiple cities, configurable by the user.
5. Display notifications for weather alerts, even when the app is not running.
6. Show weather alerts, current conditions, forecast, radar and weather maps.

Features
--------
Today, WeatherBulletin USA only displays weather alerts - no current conditions, forecasts or maps.  It does support multiple cities, however.

Once setup, weather alerts will appear as webOS notifications, even when the app is not open.  Severe weather alerts will be accompanied by an audio tone you can select.

You can also set how often weather data will be downloaded in the background.

The plan is for future updates to add current weather conditions, forecasts and maps.  Even without this information, the background notifications for weather alerts is something no other webOS weather app offers.

Operation
---------
When launched the first time after being installed, the app will automatically initialize it's local database.

When initialization is complete, you'll be taken to the preferences view.  Here you can set the download interval, severe alert tone, and choose which cities you want to receive weather alerts for.

Data sources
------------
Weather alert data is taken from the U.S. National Weather Service - http://alerts.weather.gov

List of U.S. cities taken from the United States Board on Geographic Names - http://geonames.usgs.gov/domestic/download_data.htm

Tested devices
--------------
1. TouchPad
2. Veer
3. Pre3 (Emulator only)
4. Pre Plus (webOS 2.1)

Other notes
-----------
1. Weather data only available for locations in the U.S.A.

