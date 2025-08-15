"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Smartphone, MessageSquare, Settings, Zap } from "lucide-react"
import DevicesTab from "./DevicesTab"
import PlaygroundTab from "./PlaygroundTab"

export default function WhatsAppServices() {
  const [activeTab, setActiveTab] = useState("devices")

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          WhatsApp Services
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Kelola perangkat WhatsApp dan uji coba API langsung
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
          <TabsTrigger value="devices" className="flex items-center gap-2">
            <Smartphone className="h-4 w-4" />
            Perangkat
          </TabsTrigger>
          <TabsTrigger value="playground" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            WhatsApp Playground
          </TabsTrigger>
        </TabsList>

        <TabsContent value="devices" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Manajemen Perangkat
              </CardTitle>
              <CardDescription>
                Kelola session WhatsApp, buat perangkat baru, dan pantau status koneksi
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DevicesTab />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="playground" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                WhatsApp Playground
              </CardTitle>
              <CardDescription>
                Uji coba WhatsApp API langsung dengan session yang aktif
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PlaygroundTab />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
