// src/components/ui/WeatherWidget.tsx
import React, { useEffect, useState } from "react"
import axios from "axios"
import { CloudSun } from "lucide-react"
import { Card } from "./Card"

export const WeatherWidget = () => {
  const [weather, setWeather] = useState<{
    location: string
    temp: string
    condition: string
    icon: string
  } | null>(null)

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const res = await axios.get(
          `https://api.weatherapi.com/v1/current.json?key=d72b66dc13224cb4981104823251906&q=auto:ip&lang=es`
        )
        const data = res.data
        setWeather({
          location: data.location.name,
          temp: `${data.current.temp_c}°C`,
          condition: data.current.condition.text,
          icon: data.current.condition.icon,
        })
      } catch (err) {
        setWeather(null)
      }
    }

    fetchWeather()
  }, [])

  return (
    <Card className="p-4 bg-zinc-900 border border-zinc-800 text-sm text-zinc-100">
      <h2 className="text-base font-semibold text-cyan-400 mb-2 flex items-center gap-2">
        <CloudSun size={16} /> Clima Actual
      </h2>

      {!weather ? (
        <p className="text-zinc-500">No disponible</p>
      ) : (
        <div className="flex items-center gap-4">
          <img src={weather.icon} alt="weather icon" className="w-10 h-10" />
          <div>
            <p className="font-semibold">{weather.location}</p>
            <p className="text-zinc-300">{weather.condition} — {weather.temp}</p>
          </div>
        </div>
      )}
    </Card>
  )
}
