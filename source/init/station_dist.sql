/*
|| 04-MAY-2013 - George Mari
|| Write a SQL query to get the weather station closest to my selected location.
|| sqlite doesn't do advanced math, but a modified version of the standard formula
|| for distance between 2 points can be used.  In the actual code, substitute
|| the hardcoded values for latitude and longitude with the latitude and longitude
|| of the selected city.
*/
SELECT state, intl_id, latitude, longitude, 
       ((latitude - 42.26129) * (latitude - 42.26129)) + ((longitude - (-87.97256)) * (longitude - (-87.97256))) distance
  FROM weatherStation
 WHERE ((latitude - 42.26129) * (latitude - 42.26129)) + ((longitude - (-87.97256)) * (longitude - (-87.97256))) =
       ( SELECT MIN(((latitude - 42.26129) * (latitude - 42.26129)) + ((longitude - (-87.97256)) * (longitude - (-87.97256))))
		     FROM weatherStation)
