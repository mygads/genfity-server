"use client"

import React from 'react'

interface SimpleBarChartProps {
  data: Array<{
    label: string
    value: number
    color: string
  }>
  maxValue?: number
  height?: number
}

export function SimpleBarChart({ data, maxValue, height = 120 }: SimpleBarChartProps) {
  const max = maxValue || Math.max(...data.map(d => d.value))

  return (
    <div className="space-y-3">
      {data.map((item, index) => (
        <div key={index} className="space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{item.label}</span>
            <span className="font-medium">{item.value}</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className="h-2 rounded-full transition-all duration-300"
              style={{
                width: `${(item.value / max) * 100}%`,
                backgroundColor: item.color
              }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

interface DonutChartProps {
  data: Array<{
    label: string
    value: number
    color: string
  }>
  size?: number
}

export function SimpleDonutChart({ data, size = 120 }: DonutChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0)
  let currentAngle = 0

  return (
    <div className="flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={(size - 20) / 2}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="text-muted"
        />
        {data.map((item, index) => {
          const percentage = (item.value / total) * 100
          const strokeDasharray = `${percentage} ${100 - percentage}`
          const strokeDashoffset = -currentAngle
          currentAngle += percentage
          
          return (
            <circle
              key={index}
              cx={size / 2}
              cy={size / 2}
              r={(size - 20) / 2}
              fill="none"
              stroke={item.color}
              strokeWidth="8"
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-300"
              style={{
                transformOrigin: `${size / 2}px ${size / 2}px`
              }}
            />
          )
        })}
      </svg>
    </div>
  )
}
