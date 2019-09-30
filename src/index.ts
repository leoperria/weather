import fs from "fs"
import dotenv from "dotenv"
import got from "got"
import { OpenWeatherCurrent, OpenWeatherErrorBody } from "./model/open_weather"
import { HTTP_REQUEST_RETRIES, HTTP_REQUEST_TIMEOUT } from "./config/config"
import moment from "moment"

if (fs.existsSync(".env")) {
  console.log("Using .env file to supply config environment variables")
  dotenv.config({ path: ".env" })
} else {
  console.error("You need to configure environoment variables in .env file as per .env.example")
  process.exit(1)
}

const OPENWEATHER_API_ENDPOINT = "http://api.openweathermap.org/data/2.5"

async function getWeather(cityOrZipcode: string) {
  const res = await got.get(`${OPENWEATHER_API_ENDPOINT}/weather`, {
    json: true,
    timeout: HTTP_REQUEST_TIMEOUT,
    retry: HTTP_REQUEST_RETRIES,
    query: {
      q: cityOrZipcode,
      units: "metric",
      APPID: process.env.APPID
    }
  })

  return res.body as OpenWeatherCurrent
}

(async () => {
  try {

    const query = process.argv[2]

    try {

      const weather = await getWeather(query)

      console.log("Weather **********************************************:")
      console.log(JSON.stringify(weather, null, 4))
      const utcCurrentTime = moment.utc()

      console.log("Time **********************************************:")
      const cityCurrentTime = utcCurrentTime.clone().utcOffset(weather.timezone / 60)
      console.log("cityCurrentTime=" + cityCurrentTime.format())


    } catch (error) {

      if (error instanceof got.RequestError) {
        console.error(`RequestError, message="${error.message}"`)
      } else if (error instanceof got.HTTPError) {
        const errObj = error.body as OpenWeatherErrorBody
        if (error.statusCode === 404 && errObj.message.indexOf("city not found") > -1) {
          console.error(`Can't find city="${query}"`)
        } else {
          console.error("HTTPError:")
          console.error(`  message="${error.message}"`)
          console.error(`  code=${error.statusCode}`)
          console.error(`  statusMessage=${error.statusMessage}`)
          console.error(`  url=${error.url}`)
          console.error(`  body=${errObj}`)
        }
      } else if (error instanceof got.TimeoutError) {
        console.error("Request to weather API timed out")
      } else {
        console.error("ERROR: ", error)
      }
    }

  } catch (error) {
    console.error("Global exception: ", error)
    process.exit(1)
  }
})()
